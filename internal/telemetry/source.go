package telemetry

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

const DeviceWG05 = "SaurEdge/WG-05"

// Source binds a gateway to a facility. Password is accepted only on writes.
type Source struct {
	ID                 string `json:"id,omitempty"`
	TenantID           string `json:"-"`
	FacilityID         string `json:"-"`
	Device             string `json:"device"`
	Host               string `json:"host"`
	Port               int    `json:"port"`
	TLS                bool   `json:"tls"`
	Username           string `json:"username"`
	Password           string `json:"password,omitempty"`
	PasswordConfigured bool   `json:"password_configured"`
	Topic              string `json:"topic"`
	GatewaySerial      string `json:"gateway_serial"`
	QoS                byte   `json:"qos"`
	Revision           int64  `json:"-"`
	EncryptedPassword  []byte `json:"-"`
}

func (s Source) Broker() string {
	scheme := "tcp"
	if s.TLS {
		scheme = "ssl"
	}
	return scheme + "://" + net.JoinHostPort(s.Host, strconv.Itoa(s.Port))
}

func (s Source) Validate() error {
	if s.Device != DeviceWG05 {
		return errors.New("unsupported telemetry device")
	}
	if s.Host == "" || strings.ContainsAny(s.Host, "/@?# \t\r\n") || s.Port < 1 || s.Port > 65535 {
		return errors.New("provide a broker host and port 1..65535")
	}
	if s.Topic == "" || !utf8.ValidString(s.Topic) || len(s.Topic) > 65535 || strings.ContainsAny(s.Topic, "+#\x00") {
		return errors.New("provide an exact MQTT topic without wildcards")
	}
	if strings.TrimSpace(s.GatewaySerial) == "" {
		return errors.New("gateway serial is required")
	}
	if s.QoS > 1 {
		return errors.New("supported subscription QoS values are 0 and 1")
	}
	return nil
}

type Message struct {
	ID            string          `json:"id"`
	SourceID      string          `json:"source_id"`
	TenantID      string          `json:"-"`
	FacilityID    string          `json:"facility_id"`
	ReceivedAt    time.Time       `json:"received_at"`
	GatewaySerial string          `json:"gateway_serial"`
	MeterID       string          `json:"meter_id"`
	Topic         string          `json:"topic"`
	QoS           byte            `json:"qos"`
	Retained      bool            `json:"retained"`
	Duplicate     bool            `json:"duplicate"`
	Payload       []byte          `json:"payload_base64"`
	Fields        json.RawMessage `json:"fields"`
	ParseError    string          `json:"parse_error,omitempty"`
}

// Decode preserves the frame even when it is invalid. Routing uses string IDs;
// numbers would irreversibly lose the leading zeroes in vendor identifiers.
func (m *Message) Decode(expectedSerial string) {
	if !utf8.Valid(m.Payload) {
		m.ParseError = "payload is not UTF-8 JSON"
		return
	}
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(m.Payload, &fields); err != nil || fields == nil {
		m.ParseError = "payload must be a JSON object"
		return
	}
	m.Fields = append(json.RawMessage(nil), m.Payload...)
	if err := json.Unmarshal(fields["SNO"], &m.GatewaySerial); err != nil || m.GatewaySerial == "" {
		m.ParseError = "SNO must be a nonempty string"
		return
	}
	if m.GatewaySerial != expectedSerial {
		m.ParseError = "SNO does not match the configured gateway"
		return
	}
	if err := json.Unmarshal(fields["DEVID"], &m.MeterID); err != nil || m.MeterID == "" {
		m.ParseError = "DEVID must be a nonempty string"
	}
}

func newCipher(key string) (cipher.AEAD, error) {
	b, err := base64.StdEncoding.DecodeString(key)
	if err != nil || len(b) != 32 {
		return nil, errors.New("TELEMETRY_ENCRYPTION_KEY must be base64 for 32 random bytes")
	}
	block, err := aes.NewCipher(b)
	if err != nil {
		return nil, err
	}
	return cipher.NewGCM(block)
}

func encrypt(a cipher.AEAD, value string, identity string) ([]byte, error) {
	nonce := make([]byte, a.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}
	return a.Seal(nonce, nonce, []byte(value), []byte(identity)), nil
}

func decrypt(a cipher.AEAD, value []byte, identity string) (string, error) {
	if len(value) < a.NonceSize() {
		return "", errors.New("invalid encrypted MQTT password")
	}
	b, err := a.Open(nil, value[:a.NonceSize()], value[a.NonceSize():], []byte(identity))
	if err != nil {
		return "", fmt.Errorf("decrypt MQTT password: %w", err)
	}
	return string(b), nil
}
