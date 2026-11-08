# Running facility MQTT telemetry

Read [the architecture and complete field dictionary](telemetry_architecture.md)
before interpreting readings. The vendor definitions are unconfirmed: this
integration stores raw values and does not calculate energy use or emissions.

## Development in kind

Run `make dev-setup-nomock` (or `make kind-setup` to prepare only the backend).
Setup creates a dedicated TimescaleDB deployment and persistent volume in the
existing development cluster. It generates `telemetry-secrets` once, containing a
random database password, connection URL and 32-byte encryption key, and reuses
the Secret on subsequent runs. `make clean` does not delete the cluster or volume.
Deleting the cluster deletes development data; back up the database and Secret
before doing so. Setup does not overwrite existing broker configuration.

Sign in as the organisation owner, admin or facility manager. Under Organisation
→ Facilities → Add Facility, select **SaurEdge/WG-05**. The form supplies the
broker host `15.207.187.242`, port `1883`, username `test`, topic
`INSTRUTEL/MBIOT_ETH/09001/EMS`, gateway serial `09001`, and QoS 0. Enter the
password supplied separately. Save the facility and open Telemetry to inspect
readings. No subscription is started just by opening the form.

This gateway/topic carries multiple meters. `DEVID` is preserved as a string and
appears in the viewer's meter filter. One gateway is assigned to one facility;
assigning it again returns a conflict. Unconfigured existing facilities continue
without an automatic meter or synthetic reading. Previously saved simulated
Sattric nodes are retained as historical inventory and are not used by ingestion.

The viewer refreshes saved deliveries every three seconds. Select a meter and
15 minutes, one hour or 24 hours to view power, voltage, current, power factor,
frequency and energy-register trends. Charts use raw values and server receipt
time; the axes span the chosen window, and empty periods remain empty. Each
query returns at most 1,000 deliveries. The available receipt range is shown, so
a newly started feed can have identical readings in several windows.
The viewer displays waiting,
stale receipt, invalid payload, retained delivery or unavailable states. Pausing
the viewer does not pause backend ingestion. A recent receipt is not proof of a
recent physical measurement. Broker connectivity can be inspected with the
authenticated `/api/v1/telemetry/status?facility_id=...` endpoint.

## Running the API outside kind

Provision TimescaleDB, then set these server environment variables:

```sh
export TELEMETRY_DATABASE_URL='postgres://USER:PASSWORD@HOST:5432/telemetry?sslmode=require'
export TELEMETRY_ENCRYPTION_KEY='<base64 encoding of 32 random bytes>'
export TELEMETRY_STALE_AFTER='2m' # receipt-age threshold; configurable
go run ./cmd/api
```

Generate a key once using `openssl rand -base64 32` and keep it in your secret
manager. Keep the same key on every replica and across restarts. Losing it makes
saved broker passwords unreadable. The initial database role must be able to
install the Timescale extension and create tables/indexes. Startup migrations
are serialized with an advisory lock. The source controller also uses a database
session advisory lock so only one API replica subscribes at a time.

If `TELEMETRY_DATABASE_URL` is absent, the rest of the API still starts and
telemetry endpoints return 503. There is no simulated fallback. The older
`make dev-setup` targets that start a host API require these environment variables
to be set explicitly. The old separate telemetry service on port 8085 is removed.

For Kubernetes environments outside the development script, create an Opaque
Secret named `telemetry-secrets` in `saurient-system` with `POSTGRES_PASSWORD`,
`TELEMETRY_DATABASE_URL` and `TELEMETRY_ENCRYPTION_KEY`, then apply
`deploy/telemetry-db.yaml` and `deploy/nexus-app.yaml`. Use an appropriate storage
class, backups and database TLS for your environment. The supplied manifest is a
single-node development database, not a highly available production database.

## API

All telemetry queries require `Authorization: Bearer <token>`. If supplied,
`X-Tenant-ID` must match the signed tenant. Facility configuration writes require
an organisation owner, admin or facility manager. The facility request accepts a
`telemetry` object with `device`, `host`, `port`, `tls`, `username`, `password`,
`topic`, `gateway_serial` and `qos`. An omitted password on an existing source
keeps its encrypted password. Returned configuration never contains a password.

- `GET /api/v1/telemetry/latest?facility_id=...&meter_id=...` returns up to one delivery.
- `GET /api/v1/telemetry/history?facility_id=...&meter_id=...&from=...&to=...&limit=100`
  returns newest first; meter is optional, time bounds use RFC3339, default window
  is 24 hours, and limit is 1–1000.
- `GET /api/v1/telemetry/status?facility_id=...` returns sanitized source settings
  and the current process's subscription state. A standby replica may report
  pending; persisted latest/history queries work on every replica.

Readings contain `received_at`, source/facility/gateway/meter identities, topic,
QoS, retained/duplicate flags, exact `payload_base64`, parsed `fields`, and any
`parse_error`. Query bounds always refer to receipt time. Identical payloads are
kept as separate deliveries because the provider supplies no event ID. Source
deletion stops ingestion but retains historical rows for audit; the public
latest/status endpoints require an active source; history remains readable by
the owning tenant after deletion. A retention policy is intentionally
not enabled without an agreed audit period.

Subscriptions use clean MQTT sessions and automatically resubscribe after a
connection loss. QoS 0 is best effort, as in the PoC. QoS 1 is configurable but
requires provider support; acknowledgment follows a successful database write.
Clean sessions and the in-memory queue do not provide recovery of messages
published during process downtime. Durable broker sessions or a separate durable
ingestion queue are needed if lossless capture becomes a requirement.

## Verification

```sh
go test -race ./internal/telemetry ./internal/api ./cmd/mqtt-subscriber
cd digital-passport-app && npm run build
```

The TimescaleDB integration tests are opt-in and require a dedicated disposable
database. They create the schema, use unique test tenants, and remove their rows:

```sh
TELEMETRY_TEST_DATABASE_URL='postgres://USER:PASSWORD@127.0.0.1:PORT/telemetry?sslmode=disable' \
  go test -race ./internal/telemetry ./internal/api -count=1
```

Tests use a local MQTT fixture, not the provider. They cover original bytes,
malformed messages, null/unknown fields, multi-meter routing, credential
encryption, source ownership conflicts, configuration replacement, cancellation,
controller restart recovery, post-storage acknowledgments and authenticated
tenant isolation. Browser workflow coverage is in
`digital-passport-app/e2e/specs/facility_telemetry.spec.ts` and uses mocked HTTP
responses; database/MQTT coverage is provided separately by the Go integration tests.
