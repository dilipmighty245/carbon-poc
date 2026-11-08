package telemetry

import (
	"context"
	"crypto/cipher"
	"database/sql"
	_ "embed"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

//go:embed schema.sql
var schema string

var ErrSourceConflict = errors.New("this gateway is already assigned to a facility")

type Store struct {
	DB     *sql.DB
	cipher cipher.AEAD
}

func OpenStore(ctx context.Context, dsn, key string) (*Store, error) {
	a, err := newCipher(key)
	if err != nil {
		return nil, err
	}
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(30 * time.Minute)
	s := &Store{DB: db, cipher: a}
	if err = db.PingContext(ctx); err == nil {
		var tx *sql.Tx
		tx, err = db.BeginTx(ctx, nil)
		if err == nil {
			defer tx.Rollback()
			_, err = tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock(739422100)`)
			if err == nil {
				_, err = tx.ExecContext(ctx, schema)
			}
			if err == nil {
				err = tx.Commit()
			}
		}
	}
	if err != nil {
		db.Close()
		return nil, fmt.Errorf("initialize telemetry TimescaleDB: %w", err)
	}
	return s, nil
}

const sourceColumns = `id, tenant_id, facility_id, device, host, port, tls, username, password, topic, gateway_serial, qos, revision`

func scanSource(row interface{ Scan(...any) error }) (Source, error) {
	var s Source
	err := row.Scan(&s.ID, &s.TenantID, &s.FacilityID, &s.Device, &s.Host, &s.Port, &s.TLS, &s.Username, &s.EncryptedPassword, &s.Topic, &s.GatewaySerial, &s.QoS, &s.Revision)
	s.PasswordConfigured = len(s.EncryptedPassword) > 0
	return s, err
}

func (s *Store) Source(ctx context.Context, tenant, facility string) (Source, error) {
	return scanSource(s.DB.QueryRowContext(ctx, `SELECT `+sourceColumns+` FROM telemetry_sources WHERE tenant_id=$1 AND facility_id=$2`, tenant, facility))
}

func (s *Store) Sources(ctx context.Context) ([]Source, error) {
	rows, err := s.DB.QueryContext(ctx, `SELECT `+sourceColumns+` FROM telemetry_sources`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []Source
	for rows.Next() {
		source, err := scanSource(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, source)
	}
	return result, rows.Err()
}

func (s *Store) SaveSource(ctx context.Context, source Source) (Source, error) {
	if err := source.Validate(); err != nil {
		return Source{}, err
	}
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return Source{}, err
	}
	defer tx.Rollback()
	// Serialize concurrent creates as well as updates, before choosing the ID
	// used as authenticated encryption context.
	if _, err = tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, source.TenantID+"/"+source.FacilityID); err != nil {
		return Source{}, err
	}
	old, err := scanSource(tx.QueryRowContext(ctx, `SELECT `+sourceColumns+` FROM telemetry_sources WHERE tenant_id=$1 AND facility_id=$2`, source.TenantID, source.FacilityID))
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return Source{}, err
	}
	source.ID = old.ID
	if source.ID == "" {
		source.ID = uuid.NewString()
	}
	if source.Password == "" && len(old.EncryptedPassword) > 0 {
		source.EncryptedPassword = old.EncryptedPassword
	} else {
		source.EncryptedPassword, err = encrypt(s.cipher, source.Password, source.ID)
		if err != nil {
			return Source{}, err
		}
	}
	_, err = tx.ExecContext(ctx, `INSERT INTO telemetry_sources (`+sourceColumns+`)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1)
	ON CONFLICT (tenant_id,facility_id) DO UPDATE SET
	device=EXCLUDED.device, host=EXCLUDED.host, port=EXCLUDED.port, tls=EXCLUDED.tls,
	username=EXCLUDED.username, password=EXCLUDED.password, topic=EXCLUDED.topic,
	gateway_serial=EXCLUDED.gateway_serial, qos=EXCLUDED.qos, revision=telemetry_sources.revision+1`,
		source.ID, source.TenantID, source.FacilityID, source.Device, source.Host, source.Port, source.TLS, source.Username, source.EncryptedPassword, source.Topic, source.GatewaySerial, source.QoS)
	var pgErr *pq.Error
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return Source{}, ErrSourceConflict
	}
	if err != nil {
		return Source{}, err
	}
	if err := tx.Commit(); err != nil {
		return Source{}, err
	}
	return s.Source(ctx, source.TenantID, source.FacilityID)
}

func (s *Store) DeleteSource(ctx context.Context, tenant, facility string) error {
	_, err := s.DB.ExecContext(ctx, `DELETE FROM telemetry_sources WHERE tenant_id=$1 AND facility_id=$2`, tenant, facility)
	return err
}

func (s *Store) Append(ctx context.Context, m Message) error {
	var fields any
	if len(m.Fields) > 0 {
		fields = string(m.Fields)
	}
	_, err := s.DB.ExecContext(ctx, `INSERT INTO telemetry_messages
	(id,source_id,tenant_id,facility_id,received_at,gateway_serial,meter_id,topic,qos,retained,duplicate,payload,fields,parse_error)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
	ON CONFLICT (received_at,id) DO NOTHING`, m.ID, m.SourceID, m.TenantID, m.FacilityID, m.ReceivedAt, m.GatewaySerial, m.MeterID, m.Topic, m.QoS, m.Retained, m.Duplicate, m.Payload, fields, m.ParseError)
	return err
}

func (s *Store) History(ctx context.Context, tenant, facility, meter string, from, to time.Time, limit int) ([]Message, error) {
	rows, err := s.DB.QueryContext(ctx, `SELECT id,source_id,facility_id,received_at,gateway_serial,meter_id,topic,qos,retained,duplicate,payload,fields,parse_error
	FROM telemetry_messages WHERE tenant_id=$1 AND facility_id=$2 AND ($3='' OR meter_id=$3)
	AND received_at >= $4 AND received_at <= $5 ORDER BY received_at DESC,id DESC LIMIT $6`, tenant, facility, meter, from, to, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]Message, 0)
	for rows.Next() {
		var m Message
		var fields []byte
		if err := rows.Scan(&m.ID, &m.SourceID, &m.FacilityID, &m.ReceivedAt, &m.GatewaySerial, &m.MeterID, &m.Topic, &m.QoS, &m.Retained, &m.Duplicate, &m.Payload, &fields, &m.ParseError); err != nil {
			return nil, err
		}
		m.Fields = fields
		m.TenantID = tenant
		result = append(result, m)
	}
	return result, rows.Err()
}
