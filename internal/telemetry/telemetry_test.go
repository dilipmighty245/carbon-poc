package telemetry

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net"
	"os"
	"strconv"
	"testing"
	"time"

	"github.com/eclipse/paho.mqtt.golang/packets"
	"github.com/google/uuid"
)

func testSource() Source {
	return Source{Device: DeviceWG05, Host: "127.0.0.1", Port: 1883, Topic: "test/EMS", GatewaySerial: "09001", QoS: 1}
}

func TestRawPayloadAndIdentifiers(t *testing.T) {
	for _, tc := range []struct {
		raw     []byte
		invalid bool
	}{
		{[]byte(`{"SNO":"09001","DEVID":"0001","COMM":"1","kWh":53357.77,"future":{"v":null}}`), false},
		{[]byte(`{"SNO":"09001","DEVID":"0003","future":"\u0000","huge":1e99999}`), false},
		{[]byte(`{"SNO":9001,"DEVID":"0001"}`), true},
		{[]byte(`{"SNO":"another","DEVID":"0001"}`), true},
		{[]byte(`{"SNO":"09001","DEVID":1}`), true},
		{[]byte(`null`), true}, {[]byte(`[]`), true}, {[]byte{0xff, 0xfe}, true}, {nil, true},
	} {
		m := Message{Payload: bytes.Clone(tc.raw)}
		m.Decode("09001")
		if (m.ParseError != "") != tc.invalid {
			t.Fatalf("payload %q: error=%q", tc.raw, m.ParseError)
		}
		if !bytes.Equal(m.Payload, tc.raw) {
			t.Fatal("raw bytes changed")
		}
		if !tc.invalid && (m.GatewaySerial != "09001" || (m.MeterID != "0001" && m.MeterID != "0003")) {
			t.Fatal("identifiers changed")
		}
	}
}

func TestCredentialsAreEncryptedAndBoundToSource(t *testing.T) {
	a, err := newCipher(base64.StdEncoding.EncodeToString(bytes.Repeat([]byte{7}, 32)))
	if err != nil {
		t.Fatal(err)
	}
	encoded, err := encrypt(a, "test-password", "source-a")
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Contains(encoded, []byte("test-password")) {
		t.Fatal("plaintext in ciphertext")
	}
	password, err := decrypt(a, encoded, "source-a")
	if err != nil || password != "test-password" {
		t.Fatal("round trip failed", err)
	}
	if _, err := decrypt(a, encoded, "source-b"); err == nil {
		t.Fatal("credential moved between sources")
	}
	encoded[len(encoded)-1] ^= 1
	if _, err := decrypt(a, encoded, "source-a"); err == nil {
		t.Fatal("tampered ciphertext accepted")
	}
	for _, key := range []string{"", "invalid", base64.StdEncoding.EncodeToString(make([]byte, 16))} {
		if _, err := newCipher(key); err == nil {
			t.Fatal("invalid key accepted")
		}
	}
}

func TestSourceValidation(t *testing.T) {
	s := testSource()
	if err := s.Validate(); err != nil {
		t.Fatal(err)
	}
	for _, change := range []func(*Source){func(s *Source) { s.Device = "EM6400" }, func(s *Source) { s.Port = 0 }, func(s *Source) { s.Host = "tcp://host" }, func(s *Source) { s.Topic = "test/#" }, func(s *Source) { s.GatewaySerial = "" }, func(s *Source) { s.QoS = 2 }} {
		s := testSource()
		change(&s)
		if s.Validate() == nil {
			t.Fatalf("accepted invalid source %+v", s)
		}
	}
}

// This opt-in test uses a real TimescaleDB and a local MQTT protocol fixture.
// It never contacts the provider or changes an existing development database.
func TestTimescaleMQTTPipeline(t *testing.T) {
	dsn := os.Getenv("TELEMETRY_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set TELEMETRY_TEST_DATABASE_URL to an isolated TimescaleDB")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 35*time.Second)
	defer cancel()
	store, err := OpenStore(ctx, dsn, base64.StdEncoding.EncodeToString(bytes.Repeat([]byte{9}, 32)))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = store.DB.Close() })
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	topicEvents := make(chan string, 10)
	acks := make(chan struct{}, 20)
	disconnected := make(chan struct{}, 10)
	brokerErrors := make(chan error, 10)
	payloads := [][]byte{[]byte(`{"SNO":"09001","DEVID":"0001","TWt":850.22,"future":"\u0000"}`), []byte(`{"SNO":"09001","DEVID":"0003","TWt":979.02}`), {0xff, 0xfe}}
	go func() {
		for {
			conn, err := listener.Accept()
			if err != nil {
				return
			}
			go func() {
				defer conn.Close()
				defer func() { disconnected <- struct{}{} }()
				for {
					packet, err := packets.ReadPacket(conn)
					if err != nil {
						return
					}
					switch p := packet.(type) {
					case *packets.ConnectPacket:
						if p.Username != "test" || string(p.Password) != "test-password" || !p.CleanSession {
							brokerErrors <- errors.New("incorrect credentials or session mode")
							return
						}
						ack := packets.NewControlPacket(packets.Connack).(*packets.ConnackPacket)
						if err := ack.Write(conn); err != nil {
							return
						}
					case *packets.SubscribePacket:
						ack := packets.NewControlPacket(packets.Suback).(*packets.SubackPacket)
						ack.MessageID = p.MessageID
						ack.ReturnCodes = []byte{1}
						if err := ack.Write(conn); err != nil {
							return
						}
						topicEvents <- p.Topics[0]
						for i, payload := range payloads {
							msg := packets.NewControlPacket(packets.Publish).(*packets.PublishPacket)
							msg.TopicName = p.Topics[0]
							msg.Payload = payload
							msg.Qos = 1
							msg.MessageID = uint16(i + 1)
							msg.Retain = i == 0
							if err := msg.Write(conn); err != nil {
								return
							}
						}
					case *packets.PubackPacket:
						acks <- struct{}{}
					case *packets.PingreqPacket:
						_ = packets.NewControlPacket(packets.Pingresp).Write(conn)
					case *packets.DisconnectPacket:
						return
					}
				}
			}()
		}
	}()
	source := testSource()
	source.Port = listener.Addr().(*net.TCPAddr).Port
	source.Username = "test"
	source.Password = "test-password"
	source.TenantID = "test-" + uuid.NewString()
	source.FacilityID = "facility-1"
	t.Cleanup(func() {
		cleanup, done := context.WithTimeout(context.Background(), 5*time.Second)
		defer done()
		_, _ = store.DB.ExecContext(cleanup, `DELETE FROM telemetry_sources WHERE tenant_id=$1`, source.TenantID)
		_, _ = store.DB.ExecContext(cleanup, `DELETE FROM telemetry_messages WHERE tenant_id=$1`, source.TenantID)
	})
	source, err = store.SaveSource(ctx, source)
	if err != nil {
		t.Fatal(err)
	}
	encoded, _ := json.Marshal(source)
	if bytes.Contains(encoded, []byte("test-password")) || bytes.Contains(encoded, []byte(`"password":`)) {
		t.Fatal("source exposes password")
	}
	conflict := source
	conflict.TenantID = "other-tenant"
	conflict.FacilityID = "other-facility"
	if _, err := store.SaveSource(ctx, conflict); !errors.Is(err, ErrSourceConflict) {
		t.Fatal("gateway assigned twice", err)
	}
	manager := NewManager(store)
	sourceTenantID, sourceFacilityID := source.TenantID, source.FacilityID
	manager.Exists = func(_ context.Context, tenant, facility string) (bool, error) {
		return tenant == sourceTenantID && facility == sourceFacilityID, nil
	}
	workerCtx, stop := context.WithCancel(ctx)
	done := make(chan struct{})
	go func() { defer close(done); manager.Run(workerCtx) }()
	defer func() { stop(); <-done }()
	await := func(ch <-chan string, want string) {
		t.Helper()
		select {
		case value := <-ch:
			if value != want {
				t.Fatalf("topic=%q want=%q", value, want)
			}
		case err := <-brokerErrors:
			t.Fatal(err)
		case <-ctx.Done():
			t.Fatal("timed out waiting for subscription")
		}
	}
	await(topicEvents, source.Topic)
	for range payloads {
		select {
		case <-acks:
		case <-ctx.Done():
			t.Fatal("missing post-storage MQTT acknowledgment")
		}
	}
	readings, err := store.History(ctx, source.TenantID, source.FacilityID, "", time.Time{}, time.Now().Add(time.Minute), 100)
	if err != nil || len(readings) != 3 {
		t.Fatalf("history=%d err=%v", len(readings), err)
	}
	for i, m := range readings {
		if !bytes.Equal(m.Payload, payloads[2-i]) {
			t.Fatal("raw delivery changed")
		}
		if !m.Retained && i == 2 {
			t.Fatal("retained flag lost")
		}
	}
	meters, err := store.History(ctx, source.TenantID, source.FacilityID, "0003", time.Time{}, time.Now().Add(time.Minute), 100)
	if err != nil || len(meters) != 1 {
		t.Fatal("meter routing failed", err)
	}
	other, err := store.History(ctx, "another-tenant", source.FacilityID, "", time.Time{}, time.Now().Add(time.Minute), 100)
	if err != nil || len(other) != 0 {
		t.Fatal("cross-tenant disclosure", err)
	}
	// Retrying an ambiguous SQL insert is idempotent; separate deliveries remain separate.
	if err := store.Append(ctx, readings[0]); err != nil {
		t.Fatal(err)
	}
	source.Topic = "test/changed/" + strconv.Itoa(source.Port)
	source.Password = ""
	source, err = store.SaveSource(ctx, source)
	if err != nil {
		t.Fatal(err)
	}
	await(topicEvents, source.Topic)
	select {
	case <-disconnected:
	case <-ctx.Done():
		t.Fatal("previous configuration did not stop")
	}
	for range payloads {
		select {
		case <-acks:
		case <-ctx.Done():
			t.Fatal("updated subscription did not persist deliveries")
		}
	}
	stop()
	<-done
	select {
	case <-disconnected:
	case <-ctx.Done():
		t.Fatal("controller shutdown did not disconnect")
	}
	// A new controller reconstructs the saved subscription and password without
	// any browser action or plaintext credentials supplied by the caller.
	restarted := NewManager(store)
	restarted.Exists = manager.Exists
	restartCtx, stopRestart := context.WithCancel(ctx)
	restartDone := make(chan struct{})
	go func() { defer close(restartDone); restarted.Run(restartCtx) }()
	defer func() { stopRestart(); <-restartDone }()
	await(topicEvents, source.Topic)
	for range payloads {
		select {
		case <-acks:
		case <-ctx.Done():
			t.Fatal("restarted subscription did not persist deliveries")
		}
	}
	// Source deletion stops the subscription and leaves historical evidence.
	if err := store.DeleteSource(ctx, source.TenantID, source.FacilityID); err != nil {
		t.Fatal(err)
	}
	select {
	case <-disconnected:
	case <-ctx.Done():
		t.Fatal("worker did not stop")
	}
	archived, err := store.History(ctx, source.TenantID, source.FacilityID, "", time.Time{}, time.Now().Add(time.Minute), 100)
	if err != nil || len(archived) != 9 {
		t.Fatalf("expected 9 preserved deliveries across controller restart, got %d: %v", len(archived), err)
	}
}
