import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditRegistrations } from './audit_registrations.mjs';

test('audit detects legacy and interrupted registrations without exposing credentials', () => {
  const profile = { tenant_id: 'org-pending', status: 'Registration Pending', registrationNumber: 'REG-1', countryOfIncorporation: 'India' };
  const tenants = { items: [
    { spec: { tenantID: 'org-legacy' } },
    { spec: { tenantID: 'org-pending', profileRaw: JSON.stringify(profile) } },
    { spec: { tenantID: 'org-valid', profileRaw: JSON.stringify({ ...profile, tenant_id: 'org-valid', status: 'Pending Verification', registrationNumber: 'REG-2' }) } },
  ] };
  const users = { items: [{ spec: { tenantID: 'org-valid', email: 'owner@example.test', role: 'Organisation Owner', status: 'Active', passwordHash: 'private-value' } }] };
  const report = auditRegistrations(tenants, users);
  assert.deepEqual(report.findings, [
    { tenant_id: 'org-legacy', issues: ['legacy_profile_incomplete', 'missing_active_owner'] },
    { tenant_id: 'org-pending', issues: ['interrupted_registration', 'missing_active_owner'] },
  ]);
  assert.equal(JSON.stringify(report).includes('private-value'), false);
});
