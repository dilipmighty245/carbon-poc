package main

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/eclipse/paho.mqtt.golang/packets"
)

func TestReadConfig(t *testing.T) {
	env := map[string]string{
		"MQTT_BROKER_URL": "tcp://127.0.0.1:1883",
		"MQTT_TOPIC":      "fixture/+/EMS",
		"MQTT_USERNAME":   "fixture-user",
		"MQTT_PASSWORD":   "fixture-password",
	}
	getenv := func(key string) string { return env[key] }
	c, err := readConfig(nil, getenv)
	if err != nil {
		t.Fatal(err)
	}
	other, err := readConfig(nil, getenv)
	if err != nil {
		t.Fatal(err)
	}
	if c.username != env["MQTT_USERNAME"] || c.password != env["MQTT_PASSWORD"] || c.clientID == other.clientID || len(c.clientID) > 23 {
		t.Fatal("credentials or unique MQTT-compatible client ID were not configured")
	}
	c, err = readConfig([]string{"-broker", "ssl://localhost:8883", "-topic", "fixture/#", "-client-id", "explicit", "-qos", "2"}, getenv)
	if err != nil || c.broker != "ssl://localhost:8883" || c.topic != "fixture/#" || c.clientID != "explicit" || c.qos != 2 {
		t.Fatalf("flag overrides: %v", err)
	}
	for _, args := range [][]string{
		{"-broker", "http://localhost:1883"},
		{"-broker", "tcp://localhost"},
		{"-broker", "tcp://localhost:65536"},
		{"-broker", "tcp://user:secret@localhost:1883"},
		{"-broker", "tcp://localhost:1883/path"},
		{"-broker", "tcp://localhost:1883?password=secret"},
		{"-topic", ""}, {"-topic", "x\x00y"}, {"-topic", "\xff"},
		{"-topic", "fixture/#/EMS"}, {"-topic", "fixture/meter+"},
		{"-topic", strings.Repeat("x", 65536)},
		{"-qos", "3"}, {"-duration", "0s"}, {"-connect-timeout", "0s"},
		{"-max-messages", "-1"}, {"-cert-file", "client.pem"},
		{"-ca-file", "ca.pem"}, {"extra"},
	} {
		if _, err := readConfig(args, getenv); err == nil {
			t.Fatalf("accepted invalid arguments beginning with %q", args[0])
		}
	}
}

func TestTLSConfig(t *testing.T) {
	c := config{broker: "ssl://localhost:8883"}
	cfg, err := c.tlsConfig()
	if err != nil || cfg.MinVersion != tls.VersionTLS12 || cfg.InsecureSkipVerify {
		t.Fatalf("TLS verification defaults: %v", err)
	}
	c.caFile = filepath.Join(t.TempDir(), "ca.pem")
	if err := os.WriteFile(c.caFile, []byte("invalid certificate"), 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := c.tlsConfig(); err == nil {
		t.Fatal("accepted invalid broker CA")
	}
}

// The fixture speaks MQTT on loopback and never contacts the provider. Each
// script must consume the client's DISCONNECT; any client PUBLISH is an error.
func fixture(t *testing.T, serve func(net.Listener) error) string {
	t.Helper()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	done := make(chan error, 1)
	go func() { done <- serve(listener) }()
	t.Cleanup(func() {
		listener.Close()
		select {
		case err := <-done:
			if err != nil {
				t.Errorf("MQTT fixture: %v", err)
			}
		case <-time.After(6 * time.Second):
			t.Error("MQTT fixture did not finish")
		}
	})
	return "tcp://" + listener.Addr().String()
}

func fixtureConfig(broker string) config {
	return config{
		broker: broker, topic: "fixture/EMS", clientID: "fixture-subscriber",
		username: "fixture-user", password: "fixture-password",
		connectTimeout: time.Second, duration: 100 * time.Millisecond, maxMessages: 1,
	}
}

func acceptConnect(listener net.Listener, returnCode byte) (net.Conn, error) {
	conn, err := listener.Accept()
	if err != nil {
		return nil, err
	}
	conn.SetDeadline(time.Now().Add(5 * time.Second))
	packet, err := packets.ReadPacket(conn)
	if err != nil {
		conn.Close()
		return nil, err
	}
	connect, ok := packet.(*packets.ConnectPacket)
	if !ok || connect.ProtocolVersion != 4 || !connect.CleanSession || connect.WillFlag || connect.ClientIdentifier != "fixture-subscriber" || connect.Username != "fixture-user" || string(connect.Password) != "fixture-password" {
		conn.Close()
		return nil, errors.New("unexpected CONNECT settings")
	}
	ack := packets.NewControlPacket(packets.Connack).(*packets.ConnackPacket)
	ack.ReturnCode = returnCode
	if err := ack.Write(conn); err != nil {
		conn.Close()
		return nil, err
	}
	return conn, nil
}

func subscribe(conn net.Conn, qos byte, codes []byte) error {
	packet, err := packets.ReadPacket(conn)
	if err != nil {
		return err
	}
	sub, ok := packet.(*packets.SubscribePacket)
	if !ok || len(sub.Topics) != 1 || sub.Topics[0] != "fixture/EMS" || len(sub.Qoss) != 1 || sub.Qoss[0] != qos {
		return errors.New("unexpected SUBSCRIBE settings")
	}
	ack := packets.NewControlPacket(packets.Suback).(*packets.SubackPacket)
	ack.MessageID, ack.ReturnCodes = sub.MessageID, codes
	return ack.Write(conn)
}

func publish(conn net.Conn, payload []byte, qos byte, retained, duplicate bool) error {
	packet := packets.NewControlPacket(packets.Publish).(*packets.PublishPacket)
	packet.TopicName, packet.Payload, packet.Qos = "fixture/EMS", payload, qos
	packet.MessageID, packet.Retain, packet.Dup = 7, retained, duplicate
	return packet.Write(conn)
}

func finish(conn net.Conn) error {
	for {
		packet, err := packets.ReadPacket(conn)
		if err != nil {
			return err
		}
		switch packet.(type) {
		case *packets.DisconnectPacket:
			return nil
		case *packets.PubackPacket:
		case *packets.PingreqPacket:
			if err := packets.NewControlPacket(packets.Pingresp).Write(conn); err != nil {
				return err
			}
		default:
			return fmt.Errorf("unexpected client packet: %T", packet)
		}
	}
}

func TestRunCapturesOriginalBytesAndMetadata(t *testing.T) {
	payloads := [][]byte{[]byte(`{"meter":"fixture","kWh":123.45}`), {0xff, 0x00, 0x80}, {}}
	broker := fixture(t, func(listener net.Listener) error {
		conn, err := acceptConnect(listener, 0)
		if err != nil {
			return err
		}
		defer conn.Close()
		if err := subscribe(conn, 1, []byte{1}); err != nil {
			return err
		}
		for _, payload := range payloads {
			if err := publish(conn, payload, 1, true, true); err != nil {
				return err
			}
		}
		return finish(conn)
	})
	c := fixtureConfig(broker)
	c.qos, c.maxMessages, c.duration = 1, len(payloads), time.Second
	var output, logs bytes.Buffer
	before := time.Now().UTC()
	if err := run(context.Background(), c, &output, log.New(&logs, "", 0)); err != nil {
		t.Fatal(err)
	}
	decoder := json.NewDecoder(&output)
	for i, payload := range payloads {
		var record capturedMessage
		if err := decoder.Decode(&record); err != nil {
			t.Fatal(err)
		}
		if !bytes.Equal(record.PayloadBase64, payload) || record.PayloadBytes != len(payload) || record.Topic != c.topic || record.QoS != 1 || !record.Retained || !record.Duplicate || record.ReceivedAt.Before(before) || record.ReceivedAt.After(time.Now()) {
			t.Fatalf("capture %d did not preserve payload and metadata", i)
		}
		if i == 1 {
			if record.PayloadText != nil {
				t.Fatal("binary payload has a UTF-8 text representation")
			}
		} else if record.PayloadText == nil || *record.PayloadText != string(payload) {
			t.Fatalf("capture %d has incorrect text", i)
		}
	}
	if _, err := decoder.Token(); !errors.Is(err, io.EOF) {
		t.Fatal("capture exceeded the configured message limit")
	}
	if strings.Contains(logs.String(), c.password) || strings.Contains(logs.String(), "123.45") {
		t.Fatal("logs expose credentials or message payload")
	}
}

func TestRunBrokerOutcomes(t *testing.T) {
	for _, tc := range []struct {
		name       string
		connack    byte
		codes      []byte
		omitSuback bool
		want       string
	}{
		{name: "no messages", codes: []byte{0}, want: errNoMessages.Error()},
		{name: "authentication denied", connack: 5, want: "connect/authenticate failed"},
		{name: "subscription denied", codes: []byte{0x80}, want: "rejected the subscription"},
		{name: "missing grant", codes: nil, want: "rejected the subscription"},
		{name: "invalid grant", codes: []byte{1}, want: "invalid granted QoS"},
		{name: "subscription timeout", omitSuback: true, want: "timeout"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			broker := fixture(t, func(listener net.Listener) error {
				conn, err := acceptConnect(listener, tc.connack)
				if err != nil {
					return err
				}
				defer conn.Close()
				if tc.connack != 0 {
					return nil
				}
				if tc.omitSuback {
					if _, err := packets.ReadPacket(conn); err != nil {
						return err
					}
				} else if err := subscribe(conn, 0, tc.codes); err != nil {
					return err
				}
				return finish(conn)
			})
			c := fixtureConfig(broker)
			c.connectTimeout = 100 * time.Millisecond
			var output, logs bytes.Buffer
			err := run(context.Background(), c, &output, log.New(&logs, "", 0))
			// The operation timer and initial-subscription timer share a deadline;
			// either timeout wording is valid when their select cases race.
			matches := err != nil && strings.Contains(err.Error(), tc.want)
			if tc.omitSuback && err != nil {
				matches = matches || strings.Contains(err.Error(), "timed out")
			}
			if !matches {
				t.Fatalf("want %q, got %v", tc.want, err)
			}
			if tc.name == "no messages" && !errors.Is(err, errNoMessages) {
				t.Fatal("no-message outcome lost its distinct exit-code classification")
			}
			if output.Len() != 0 {
				t.Fatal("wrote captures without receiving a message")
			}
			if tc.name != "no messages" && strings.Contains(logs.String(), "subscription accepted") {
				t.Fatal("reported an unconfirmed subscription as accepted")
			}
		})
	}
}

type failingWriter struct{}

func (failingWriter) Write([]byte) (int, error) { return 0, errors.New("fixture disk full") }

func TestRunCaptureFailure(t *testing.T) {
	broker := fixture(t, func(listener net.Listener) error {
		conn, err := acceptConnect(listener, 0)
		if err != nil {
			return err
		}
		defer conn.Close()
		if err := subscribe(conn, 0, []byte{0}); err != nil {
			return err
		}
		if err := publish(conn, []byte("fixture"), 0, false, false); err != nil {
			return err
		}
		return finish(conn)
	})
	err := run(context.Background(), fixtureConfig(broker), failingWriter{}, log.New(io.Discard, "", 0))
	if err == nil || !strings.Contains(err.Error(), "write capture: fixture disk full") {
		t.Fatalf("capture error: %v", err)
	}
}

func TestRunCancellationDuringSubscribe(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	broker := fixture(t, func(listener net.Listener) error {
		conn, err := acceptConnect(listener, 0)
		if err != nil {
			return err
		}
		defer conn.Close()
		if _, err := packets.ReadPacket(conn); err != nil {
			return err
		}
		cancel()
		return finish(conn)
	})
	c := fixtureConfig(broker)
	c.connectTimeout = 4 * time.Second
	start := time.Now()
	err := run(ctx, c, io.Discard, log.New(io.Discard, "", 0))
	if !errors.Is(err, context.Canceled) || time.Since(start) > time.Second {
		t.Fatalf("cancellation waited for a network timeout: %v", err)
	}
}

func TestRunReconnectsAndResubscribes(t *testing.T) {
	broker := fixture(t, func(listener net.Listener) error {
		for i := 0; i < 2; i++ {
			conn, err := acceptConnect(listener, 0)
			if err != nil {
				return err
			}
			if err := subscribe(conn, 1, []byte{1}); err != nil {
				conn.Close()
				return err
			}
			if err := publish(conn, []byte(fmt.Sprintf("reading-%d", i)), 1, false, false); err != nil {
				conn.Close()
				return err
			}
			if i == 0 {
				packet, err := packets.ReadPacket(conn)
				conn.Close() // Simulate transport loss after the first delivered reading.
				if err != nil {
					return err
				}
				if _, ok := packet.(*packets.PubackPacket); !ok {
					return fmt.Errorf("expected PUBACK before reconnect, got %T", packet)
				}
			} else {
				err := finish(conn)
				conn.Close()
				return err
			}
		}
		return nil
	})
	c := fixtureConfig(broker)
	c.qos, c.maxMessages, c.duration = 1, 2, 4*time.Second
	var output, logs bytes.Buffer
	if err := run(context.Background(), c, &output, log.New(&logs, "", 0)); err != nil {
		t.Fatal(err)
	}
	if strings.Count(output.String(), "\n") != 2 || strings.Count(logs.String(), "subscription accepted") != 2 {
		t.Fatal("did not capture both readings across a renewed subscription")
	}
}
