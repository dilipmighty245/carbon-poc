package telemetry

import (
	"context"
	"crypto/sha256"
	"crypto/tls"
	"database/sql"
	"fmt"
	"log"
	"sync"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/google/uuid"
)

type Status struct {
	State        string     `json:"state"`
	LastReceived *time.Time `json:"last_received,omitempty"`
}

type Manager struct {
	store  *Store
	mu     sync.RWMutex
	states map[string]Status
	// Exists checks Nexus ownership before a stored subscription can start.
	Exists func(context.Context, string, string) (bool, error)
}

func NewManager(store *Store) *Manager {
	return &Manager{store: store, states: make(map[string]Status)}
}

func (m *Manager) Status(id string) Status {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if s, ok := m.states[id]; ok {
		return s
	}
	return Status{State: "pending"}
}

func (m *Manager) state(id, state string, received *time.Time) {
	m.mu.Lock()
	defer m.mu.Unlock()
	s := m.states[id]
	s.State = state
	if received != nil {
		t := *received
		s.LastReceived = &t
	}
	m.states[id] = s
}

func pause(ctx context.Context, d time.Duration) bool {
	t := time.NewTimer(d)
	defer t.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-t.C:
		return true
	}
}

// Run holds a session advisory lock for the controller's lifetime. Losing the
// database session cancels every worker before attempting leadership again.
func (m *Manager) Run(ctx context.Context) {
	for ctx.Err() == nil {
		func() {
			acquire, cancel := context.WithTimeout(ctx, 10*time.Second)
			defer cancel()
			conn, err := m.store.DB.Conn(acquire)
			if err != nil {
				return
			}
			defer conn.Close()
			var leader bool
			if err = conn.QueryRowContext(acquire, `SELECT pg_try_advisory_lock(739422101)`).Scan(&leader); err != nil || !leader {
				return
			}
			defer func() {
				release, done := context.WithTimeout(context.Background(), 3*time.Second)
				defer done()
				_, _ = conn.ExecContext(release, `SELECT pg_advisory_unlock(739422101)`)
			}()
			m.reconcile(ctx, conn)
		}()
		if !pause(ctx, 2*time.Second) {
			return
		}
	}
}

type runningWorker struct {
	revision int64
	cancel   context.CancelFunc
	done     chan struct{}
}

func stopWorker(w runningWorker) { w.cancel(); <-w.done }

func (m *Manager) reconcile(ctx context.Context, conn *sql.Conn) {
	workers := make(map[string]runningWorker)
	defer func() {
		for _, w := range workers {
			w.cancel()
		}
		for _, w := range workers {
			<-w.done
		}
	}()
	for ctx.Err() == nil {
		check, cancel := context.WithTimeout(ctx, 10*time.Second)
		err := conn.PingContext(check)
		var sources []Source
		if err == nil {
			sources, err = m.store.Sources(check)
		}
		cancel()
		if err != nil {
			return
		}
		active := make(map[string]bool)
		for _, s := range sources {
			active[s.ID] = true
			if m.Exists != nil {
				check, cancel := context.WithTimeout(ctx, 5*time.Second)
				exists, err := m.Exists(check, s.TenantID, s.FacilityID)
				cancel()
				if err != nil || !exists {
					if w, ok := workers[s.ID]; ok {
						stopWorker(w)
						delete(workers, s.ID)
					}
					m.state(s.ID, "facility_unavailable", nil)
					continue
				}
			}
			if w, ok := workers[s.ID]; ok {
				if w.revision == s.Revision {
					continue
				}
				stopWorker(w)
				delete(workers, s.ID)
			}
			workerCtx, cancel := context.WithCancel(ctx)
			w := runningWorker{revision: s.Revision, cancel: cancel, done: make(chan struct{})}
			workers[s.ID] = w
			go func(s Source) { defer close(w.done); m.runSource(workerCtx, s) }(s)
		}
		for id, w := range workers {
			if !active[id] {
				stopWorker(w)
				delete(workers, id)
				m.mu.Lock()
				delete(m.states, id)
				m.mu.Unlock()
			}
		}
		if !pause(ctx, 2*time.Second) {
			return
		}
	}
}

func (m *Manager) runSource(ctx context.Context, s Source) {
	password, err := decrypt(m.store.cipher, s.EncryptedPassword, s.ID)
	if err != nil {
		m.state(s.ID, "credential_error", nil)
		return
	}
	defer m.state(s.ID, "stopped", nil)
	for ctx.Err() == nil {
		m.state(s.ID, "connecting", nil)
		if err := m.subscribe(ctx, s, password); err != nil && ctx.Err() == nil {
			// Never log connection credentials or payloads.
			log.Printf("telemetry source %s subscription interrupted", s.ID)
			m.state(s.ID, "disconnected", nil)
		}
		if !pause(ctx, 5*time.Second) {
			return
		}
	}
}

type delivery struct {
	record  Message
	message mqtt.Message
}

func (m *Manager) subscribe(ctx context.Context, s Source, password string) error {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	queue := make(chan delivery, 256)
	failures := make(chan error, 1)
	hash := sha256.Sum256([]byte(s.ID))
	opts := mqtt.NewClientOptions().AddBroker(s.Broker()).SetClientID(fmt.Sprintf("cp-%x", hash[:10])).
		SetUsername(s.Username).SetPassword(password).SetProtocolVersion(4).
		SetCleanSession(true).SetAutoAckDisabled(true).SetOrderMatters(true).
		SetConnectTimeout(10 * time.Second).SetWriteTimeout(10 * time.Second).
		SetKeepAlive(30 * time.Second).SetPingTimeout(10 * time.Second).
		SetAutoReconnect(true).SetConnectRetry(false)
	if s.TLS {
		opts.SetTLSConfig(&tls.Config{MinVersion: tls.VersionTLS12})
	}
	opts.SetConnectionLostHandler(func(_ mqtt.Client, _ error) { m.state(s.ID, "disconnected", nil) })
	opts.SetDefaultPublishHandler(func(_ mqtt.Client, msg mqtt.Message) {
		record := Message{ID: uuid.NewString(), SourceID: s.ID, TenantID: s.TenantID, FacilityID: s.FacilityID,
			ReceivedAt: time.Now().UTC(), Topic: msg.Topic(), QoS: msg.Qos(), Retained: msg.Retained(), Duplicate: msg.Duplicate(), Payload: append([]byte{}, msg.Payload()...)}
		record.Decode(s.GatewaySerial)
		select {
		case queue <- delivery{record, msg}:
		case <-ctx.Done():
		}
	})
	opts.SetOnConnectHandler(func(client mqtt.Client) {
		t := client.Subscribe(s.Topic, s.QoS, nil)
		err := awaitToken(ctx, t)
		if err == nil {
			grants, ok := t.(*mqtt.SubscribeToken)
			if !ok {
				err = fmt.Errorf("missing subscription grant")
			} else if grant, ok := grants.Result()[s.Topic]; !ok || grant > s.QoS {
				err = fmt.Errorf("subscription rejected")
			}
		}
		if err != nil {
			select {
			case failures <- err:
			default:
			}
			return
		}
		m.state(s.ID, "subscribed", nil)
	})
	client := mqtt.NewClient(opts)
	defer func() { cancel(); client.Disconnect(250) }()
	if err := awaitToken(ctx, client.Connect()); err != nil {
		return err
	}
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case err := <-failures:
			return err
		case d := <-queue:
			for {
				write, done := context.WithTimeout(ctx, 5*time.Second)
				err := m.store.Append(write, d.record)
				done()
				if err == nil {
					break
				}
				m.state(s.ID, "storage_error", nil)
				if !pause(ctx, time.Second) {
					return ctx.Err()
				}
			}
			d.message.Ack()
			m.state(s.ID, "receiving", &d.record.ReceivedAt)
		}
	}
}

func awaitToken(ctx context.Context, t mqtt.Token) error {
	timeout := time.NewTimer(12 * time.Second)
	defer timeout.Stop()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timeout.C:
		return fmt.Errorf("MQTT operation timed out")
	case <-t.Done():
		return t.Error()
	}
}
