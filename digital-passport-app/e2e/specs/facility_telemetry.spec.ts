import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // The HTTP development hostname does not expose this secure-only API.
    Object.defineProperty(crypto, 'randomUUID', { value: undefined });
    localStorage.setItem('saurient_auth_token', 'telemetry-test-session');
    localStorage.setItem('saurient_user_email', 'owner@example.test');
    localStorage.setItem('saurient_user_role', 'Organisation Owner');
    localStorage.setItem('saurient_tenant_id', 'telemetry-test-org');
  });
});

test('WG-05 onboarding works over HTTP and charts keep meter data separate', async ({ page }) => {
  let saved: any;
  let lastHistoryURL: URL;
  await page.route('**/api/v1/organisation/facilities', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: [] });
    saved = route.request().postDataJSON();
    expect(route.request().headers().authorization).toBe('Bearer telemetry-test-session');
    expect(saved.telemetry).toMatchObject({ device: 'SaurEdge/WG-05', host: '15.207.187.242', port: 1883,
      topic: 'INSTRUTEL/MBIOT_ETH/09001/EMS', gateway_serial: '09001', password: 'fixture-password', qos: 0 });
    const { password, ...source } = saved.telemetry;
    return route.fulfill({ json: { ...saved, telemetry: { ...source, password_configured: true } } });
  });
  await page.route('**/api/v1/telemetry/history?**', route => {
    lastHistoryURL = new URL(route.request().url());
    const readings = ['0003', '0004'].flatMap((meter, meterIndex) => [0, 1, 2].map(index => ({
      id: `message-${meter}-${index}`, source_id: 'source-1', facility_id: saved.id,
      received_at: new Date(Date.now() - index * 20000).toISOString(), gateway_serial: '09001', meter_id: meter,
      topic: saved.telemetry.topic, qos: 0, retained: false, duplicate: false, payload_base64: 'e30=',
      fields: { SNO: '09001', DEVID: meter, TWt: (meterIndex ? 42.18 : 979.02) + index,
        RWt: 300 + index, YWt: 320 + index, BWt: 359 + index,
        RV: 227 + index, YV: 228 + index, BV: 229 + index, RA: 92 + index, YA: 93 + index, BA: 94 + index,
        PF: 0.98, RPF: 0.97, YPF: 0.96, BPF: 0.95, Freq: 49.9, kWh: 53187.78 - index, future: 'preserved' },
    })));
    const meter = lastHistoryURL.searchParams.get('meter_id');
    return route.fulfill({ json: { status: 'received', timestamp_basis: 'server_received_at', stale_after_seconds: 120,
      readings: readings.filter(reading => !meter || reading.meter_id === meter) } });
  });
  await page.goto('/organisation?tab=facilities');
  await page.getByRole('button', { name: 'Add First Facility' }).click();
  await page.getByPlaceholder('e.g. Takoradi Grain Silos').fill('WG05 test facility');
  await page.getByLabel('Devices', { exact: true }).selectOption('SaurEdge/WG-05');
  await page.getByLabel('MQTT password').fill('fixture-password');
  await page.getByRole('button', { name: 'Save Facility', exact: true }).click();
  await expect(page.getByText('WG05 test facility', { exact: true })).toBeVisible();
  await page.getByTitle('Inspect live MQTT telemetry').click();
  const dialog = page.getByRole('dialog', { name: 'Facility MQTT telemetry' });
  await expect(dialog.getByRole('cell', { name: 'TWt', exact: true })).toBeVisible();
  await expect(dialog.getByRole('cell', { name: '979.02', exact: true })).toBeVisible();
  await expect(dialog.getByText('Unknown vendor field · preserved unchanged')).toBeVisible();
  await expect(dialog.getByText(/Energy and emissions calculations are disabled/)).toBeVisible();
  await expect(dialog.getByRole('button', { name: /benchmark|generate|apply inputs/i })).toHaveCount(0);
  await expect(dialog.getByRole('figure')).toHaveCount(6);
  const power = dialog.getByRole('figure', { name: 'Power trend for meter 0003' });
  await expect(power.locator('.recharts-line-curve')).toHaveCount(4);
  await expect(power.getByText('979.02', { exact: true })).toBeVisible();
  await dialog.getByLabel('Meter', { exact: true }).selectOption('0004');
  const otherPower = dialog.getByRole('figure', { name: 'Power trend for meter 0004' });
  await expect(otherPower.getByText('42.18', { exact: true })).toBeVisible();
  await expect(otherPower.getByText('979.02', { exact: true })).toHaveCount(0);
  await dialog.getByLabel('Time window', { exact: true }).selectOption('15');
  await expect.poll(() => lastHistoryURL.searchParams.get('meter_id')).toBe('0004');
  await expect.poll(() => Math.round((Date.now() - Date.parse(lastHistoryURL.searchParams.get('from')!)) / 60000)).toBe(15);
  expect(lastHistoryURL.searchParams.get('limit')).toBe('1000');
});

test('failed facility saves remain visible and never create a local success', async ({ page }) => {
  await page.route('**/api/v1/organisation/facilities', route => route.request().method() === 'GET'
    ? route.fulfill({ json: [] })
    : route.fulfill({ status: 503, json: { error: 'Telemetry database is unavailable' } }));
  await page.goto('/organisation?tab=facilities');
  await page.getByRole('button', { name: 'Add First Facility' }).click();
  await page.getByPlaceholder('e.g. Takoradi Grain Silos').fill('Unsaved facility');
  await page.getByRole('button', { name: 'Save Facility', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Telemetry database is unavailable');
  await expect(page.getByRole('button', { name: 'Save Facility', exact: true })).toBeVisible();
  await expect(page.getByText('Unsaved facility', { exact: true })).toHaveCount(0);
});

test('time windows replace chart data and exclude older receipts', async ({ page }) => {
  await page.route('**/api/v1/organisation/facilities', route => route.fulfill({ json: [{
    id: 'facility-window-test', name: 'Window verification', telemetry: { device: 'SaurEdge/WG-05' },
  }] }));
  const anchor = Date.now();
  await page.route('**/api/v1/telemetry/history?**', route => {
    const from = Date.parse(new URL(route.request().url()).searchParams.get('from')!);
    return route.fulfill({ json: { status: 'received', timestamp_basis: 'server_received_at', stale_after_seconds: 120,
      readings: [5, 30, 120, 1500].map(minutes => ({ id: `age-${minutes}`, source_id: 'source-1', facility_id: 'facility-window-test',
        received_at: new Date(anchor - minutes * 60000).toISOString(), gateway_serial: '09001', meter_id: '0003',
        topic: 'fixture/EMS', qos: 0, retained: false, duplicate: false, payload_base64: 'e30=',
        fields: { SNO: '09001', DEVID: '0003', TWt: minutes } })).filter(row => Date.parse(row.received_at) >= from) } });
  });
  await page.goto('/organisation?tab=facilities');
  await page.getByTitle('Inspect live MQTT telemetry').click();
  const count = page.getByTestId('telemetry-point-count');
  await expect(count).toHaveText('2 deliveries · server receipt time');
  await page.getByLabel('Time window', { exact: true }).selectOption('15');
  await expect(count).toHaveText('1 deliveries · server receipt time');
  await expect(page.getByRole('figure', { name: 'Power trend for meter 0003' }).getByText('5', { exact: true }).first()).toBeVisible();
  await page.getByLabel('Time window', { exact: true }).selectOption('1440');
  await expect(count).toHaveText('3 deliveries · server receipt time');
  await expect(page.getByText(/Available receipts:/)).toBeVisible();
});
