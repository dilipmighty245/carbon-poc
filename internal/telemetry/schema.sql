CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE TABLE IF NOT EXISTS telemetry_sources (
  id text NOT NULL UNIQUE,
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  device text NOT NULL,
  host text NOT NULL,
  port integer NOT NULL,
  tls boolean NOT NULL,
  username text NOT NULL,
  password bytea NOT NULL,
  topic text NOT NULL,
  gateway_serial text NOT NULL,
  qos smallint NOT NULL,
  revision bigint NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, facility_id),
  UNIQUE (host, port, topic, gateway_serial)
);
CREATE TABLE IF NOT EXISTS telemetry_messages (
  id text NOT NULL,
  source_id text NOT NULL,
  tenant_id text NOT NULL,
  facility_id text NOT NULL,
  received_at timestamptz NOT NULL,
  gateway_serial text NOT NULL,
  meter_id text NOT NULL,
  topic text NOT NULL,
  qos smallint NOT NULL,
  retained boolean NOT NULL,
  duplicate boolean NOT NULL,
  payload bytea NOT NULL,
  fields json,
  parse_error text NOT NULL,
  PRIMARY KEY (received_at, id)
);
SELECT create_hypertable('telemetry_messages', 'received_at', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS telemetry_facility_time ON telemetry_messages
  (tenant_id, facility_id, received_at DESC);
CREATE INDEX IF NOT EXISTS telemetry_meter_time ON telemetry_messages
  (tenant_id, facility_id, meter_id, received_at DESC);
