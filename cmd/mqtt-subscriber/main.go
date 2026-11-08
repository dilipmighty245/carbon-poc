// mqtt-subscriber is a bounded, read-only MQTT connectivity and payload capture PoC.
package main

import (
	"context"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"net/url"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"
	"unicode/utf8"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

var errNoMessages = errors.New("subscription accepted, but no messages received during the observation window")

type config struct {
	broker, topic, clientID, username, password string
	caFile, certFile, keyFile, output           string
	qos                                         uint
	duration, connectTimeout                    time.Duration
	maxMessages                                 int
}

func readConfig(args []string, getenv func(string) string) (config, error) {
	var c config
	f := flag.NewFlagSet("mqtt-subscriber", flag.ContinueOnError)
	f.StringVar(&c.broker, "broker", getenv("MQTT_BROKER_URL"), "Broker URL: tcp://host:port or ssl://host:port (MQTT_BROKER_URL)")
	f.StringVar(&c.topic, "topic", getenv("MQTT_TOPIC"), "Topic to subscribe to (MQTT_TOPIC)")
	f.StringVar(&c.clientID, "client-id", getenv("MQTT_CLIENT_ID"), "Client ID; generated when omitted (MQTT_CLIENT_ID)")
	f.StringVar(&c.caFile, "ca-file", getenv("MQTT_CA_FILE"), "Optional broker CA certificate PEM file")
	f.StringVar(&c.certFile, "cert-file", getenv("MQTT_CERT_FILE"), "Optional client certificate PEM file")
	f.StringVar(&c.keyFile, "key-file", getenv("MQTT_KEY_FILE"), "Optional client private key PEM file")
	f.StringVar(&c.output, "output", "", "Append JSONL captures to this file instead of stdout; parent directory must exist")
	f.UintVar(&c.qos, "qos", 0, "Requested subscription QoS: 0, 1 or 2; confirm with provider")
	f.DurationVar(&c.duration, "duration", 60*time.Second, "Observation window after the initial subscription is accepted")
	f.DurationVar(&c.connectTimeout, "connect-timeout", 10*time.Second, "Timeout for connecting and subscribing")
	f.IntVar(&c.maxMessages, "max-messages", 3, "Stop after this many messages; 0 observes for the full duration")
	if err := f.Parse(args); err != nil {
		return c, err
	}
	if f.NArg() != 0 {
		return c, errors.New("unexpected positional arguments; use -help")
	}
	c.username, c.password = getenv("MQTT_USERNAME"), getenv("MQTT_PASSWORD")
	u, err := url.Parse(c.broker)
	if err != nil || u == nil || (u.Scheme != "tcp" && u.Scheme != "ssl") || u.Hostname() == "" || u.Port() == "" {
		return c, errors.New("broker must be tcp://host:port or ssl://host:port")
	}
	if u.User != nil || u.RawQuery != "" || u.Fragment != "" || u.Path != "" {
		return c, errors.New("broker URL must contain only scheme, host and port; use MQTT_USERNAME and MQTT_PASSWORD for credentials")
	}
	port, err := strconv.Atoi(u.Port())
	if err != nil || port < 1 || port > 65535 {
		return c, errors.New("broker port must be between 1 and 65535")
	}
	if strings.TrimSpace(c.topic) == "" || !utf8.ValidString(c.topic) || len(c.topic) > 65535 || strings.ContainsRune(c.topic, '\x00') {
		return c, errors.New("topic must be nonempty UTF-8, at most 65535 bytes, and cannot contain a null character")
	}
	levels := strings.Split(c.topic, "/")
	for i, level := range levels {
		if (strings.Contains(level, "+") && level != "+") || (strings.Contains(level, "#") && (level != "#" || i != len(levels)-1)) {
			return c, errors.New("topic wildcards must occupy a complete level, and # must be the final level")
		}
	}
	if c.qos > 2 || c.duration <= 0 || c.connectTimeout <= 0 || c.maxMessages < 0 {
		return c, errors.New("QoS must be 0..2, durations must be positive, and max-messages cannot be negative")
	}
	if (c.certFile == "") != (c.keyFile == "") {
		return c, errors.New("client certificate and key must be provided together")
	}
	if u.Scheme != "ssl" && (c.caFile != "" || c.certFile != "") {
		return c, errors.New("certificate options require an ssl:// broker URL")
	}
	if c.clientID == "" {
		var suffix [6]byte
		if _, err := rand.Read(suffix[:]); err != nil {
			return c, fmt.Errorf("generate client ID: %w", err)
		}
		c.clientID = "cp-poc-" + hex.EncodeToString(suffix[:])
	}
	return c, nil
}

func (c config) tlsConfig() (*tls.Config, error) {
	if !strings.HasPrefix(c.broker, "ssl://") {
		return nil, nil
	}
	t := &tls.Config{MinVersion: tls.VersionTLS12}
	if c.caFile != "" {
		pem, err := os.ReadFile(c.caFile)
		if err != nil {
			return nil, fmt.Errorf("read broker CA: %w", err)
		}
		t.RootCAs, err = x509.SystemCertPool()
		if err != nil {
			t.RootCAs = x509.NewCertPool()
		}
		if !t.RootCAs.AppendCertsFromPEM(pem) {
			return nil, errors.New("CA file contains no usable certificates")
		}
	}
	if c.certFile != "" {
		cert, err := tls.LoadX509KeyPair(c.certFile, c.keyFile)
		if err != nil {
			return nil, fmt.Errorf("load client certificate: %w", err)
		}
		t.Certificates = []tls.Certificate{cert}
	}
	return t, nil
}

// PayloadBase64 preserves the exact bytes, including non-UTF-8 payloads. PayloadText
// makes UTF-8 messages readable without assuming JSON or any meter-specific schema.
type capturedMessage struct {
	ReceivedAt    time.Time `json:"received_at"`
	Topic         string    `json:"topic"`
	QoS           byte      `json:"qos"`
	Retained      bool      `json:"retained"`
	Duplicate     bool      `json:"duplicate"`
	PayloadBytes  int       `json:"payload_bytes"`
	PayloadBase64 []byte    `json:"payload_base64"`
	PayloadText   *string   `json:"payload_text,omitempty"`
}

func capture(m mqtt.Message) capturedMessage {
	payload := append([]byte{}, m.Payload()...)
	r := capturedMessage{
		ReceivedAt: time.Now().UTC(), Topic: m.Topic(), QoS: m.Qos(),
		Retained: m.Retained(), Duplicate: m.Duplicate(),
		PayloadBytes: len(payload), PayloadBase64: payload,
	}
	if utf8.Valid(payload) {
		text := string(payload)
		r.PayloadText = &text
	}
	return r
}

func waitToken(ctx context.Context, t mqtt.Token, timeout time.Duration, operation string) error {
	timer := time.NewTimer(timeout)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return fmt.Errorf("%s timed out after %s", operation, timeout)
	case <-t.Done():
	}
	if err := t.Error(); err != nil {
		return fmt.Errorf("%s failed: %w", operation, err)
	}
	return nil
}

func run(ctx context.Context, c config, output io.Writer, logger *log.Logger) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	tlsConfig, err := c.tlsConfig()
	if err != nil {
		return err
	}
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	messages := make(chan capturedMessage, 32)
	subscribed := make(chan struct{}, 1)
	failures := make(chan error, 1)
	options := mqtt.NewClientOptions().AddBroker(c.broker).
		SetClientID(c.clientID).SetUsername(c.username).SetPassword(c.password).
		SetProtocolVersion(4).SetCleanSession(true).SetTLSConfig(tlsConfig).
		SetConnectTimeout(c.connectTimeout).SetWriteTimeout(c.connectTimeout).
		SetKeepAlive(20 * time.Second).SetPingTimeout(10 * time.Second).
		SetConnectRetry(false).SetAutoReconnect(true)
	options.SetConnectionLostHandler(func(_ mqtt.Client, err error) {
		logger.Printf("connection lost; reconnecting: %v", err)
	})
	options.SetOnConnectHandler(func(client mqtt.Client) {
		token := client.Subscribe(c.topic, byte(c.qos), func(_ mqtt.Client, m mqtt.Message) {
			select {
			case messages <- capture(m):
			case <-ctx.Done():
			}
		})
		err := waitToken(ctx, token, c.connectTimeout, "subscribe")
		if err == nil {
			result, ok := token.(*mqtt.SubscribeToken)
			if !ok {
				err = errors.New("broker did not confirm the subscription")
			} else {
				granted, found := result.Result()[c.topic]
				if !found || granted > byte(c.qos) {
					err = errors.New("broker rejected the subscription or returned an invalid granted QoS")
				} else {
					logger.Printf("subscription accepted: topic=%s granted_qos=%d", c.topic, granted)
				}
			}
		}
		if err != nil {
			select {
			case failures <- err:
			case <-ctx.Done():
			}
			return
		}
		select {
		case subscribed <- struct{}{}:
		default:
		}
	})
	client := mqtt.NewClient(options)
	defer func() {
		cancel() // Release callbacks before waiting for the client to disconnect.
		client.Disconnect(250)
	}()
	logger.Printf("connecting: broker=%s client_id=%s", c.broker, c.clientID)
	if err := waitToken(ctx, client.Connect(), c.connectTimeout, "connect/authenticate"); err != nil {
		return err
	}
	logger.Print("MQTT connection accepted")
	select {
	case <-subscribed:
	case err := <-failures:
		return err
	case <-time.After(c.connectTimeout):
		return errors.New("initial subscription was not confirmed before timeout")
	case <-ctx.Done():
		return ctx.Err()
	}
	deadline := time.NewTimer(c.duration)
	defer deadline.Stop()
	encoder := json.NewEncoder(output)
	received := 0
	defer func() { logger.Printf("observation finished: received=%d", received) }()
	for {
		select {
		case m := <-messages:
			if err := encoder.Encode(m); err != nil {
				return fmt.Errorf("write capture: %w", err)
			}
			received++
			logger.Printf("message received: count=%d topic=%s bytes=%d qos=%d retained=%t", received, m.Topic, m.PayloadBytes, m.QoS, m.Retained)
			if c.maxMessages > 0 && received >= c.maxMessages {
				return nil
			}
		case err := <-failures:
			return err
		case <-deadline.C:
			if received == 0 {
				return errNoMessages
			}
			return nil
		case <-ctx.Done():
			return ctx.Err()
		}
	}
}

func main() {
	logger := log.New(os.Stderr, "mqtt-poc: ", log.LstdFlags|log.LUTC)
	c, err := readConfig(os.Args[1:], os.Getenv)
	if errors.Is(err, flag.ErrHelp) {
		return
	}
	if err != nil {
		logger.Print(err)
		os.Exit(1)
	}
	var output io.Writer = os.Stdout
	if c.output != "" {
		file, err := os.OpenFile(c.output, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0600)
		if err != nil {
			logger.Printf("open capture: %v", err)
			os.Exit(1)
		}
		defer file.Close()
		output = file
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := run(ctx, c, output, logger); err != nil {
		if errors.Is(err, context.Canceled) {
			return
		}
		logger.Print(err)
		if errors.Is(err, errNoMessages) {
			os.Exit(2)
		}
		os.Exit(1)
	}
}
