import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Inspect kubectl JSON exports offline. Never print user credential fields or modify records.
export function auditRegistrations(tenants, users) {
  const findings = [];
  const identities = new Map();
  const emails = new Map();
  for (const user of users.items || []) {
    const email = user.spec?.email?.trim().toLowerCase();
    if (!email) continue;
    const tenant = user.spec.tenantID;
    if (emails.has(email)) findings.push({ issue: 'duplicate_email', tenant_ids: [emails.get(email), tenant] });
    else emails.set(email, tenant);
  }
  for (const node of tenants.items || []) {
    const tenantID = node.spec?.tenantID;
    if (!tenantID) continue;
    const issues = [];
    let profile;
    if (!node.spec.profileRaw) issues.push('legacy_profile_incomplete');
    else {
      try { profile = JSON.parse(node.spec.profileRaw); }
      catch { issues.push('invalid_stored_profile'); }
    }
    if (profile) {
      if (profile.status === 'Registration Pending') issues.push('interrupted_registration');
      if (!profile.registrationNumber || !profile.countryOfIncorporation) issues.push('missing_legal_identity');
      if (profile.tenant_id !== tenantID) issues.push('profile_tenant_mismatch');
      if (profile.registrationNumber && profile.countryOfIncorporation) {
        const key = `${profile.countryOfIncorporation.trim().toLowerCase()}|${profile.registrationNumber.trim().toLowerCase()}`;
        if (identities.has(key)) issues.push(`duplicate_legal_identity:${identities.get(key)}`);
        else identities.set(key, tenantID);
      }
    }
    // Independent agencies are not company registrations.
    const independent = tenantID === 'all' || tenantID === 'public' || tenantID.startsWith('tenant-verifier') || tenantID === 'tenant-issuance-authority';
    const owners = (users.items || []).filter(user => user.spec?.tenantID === tenantID &&
      user.spec?.role?.toLowerCase().replace(/[\s_]/g, '') === 'organisationowner' && user.spec.status === 'Active');
    if (!independent && owners.length === 0) issues.push('missing_active_owner');
    if (!independent && issues.length > 0) findings.push({ tenant_id: tenantID, issues });
  }
  return { tenants_checked: (tenants.items || []).length, users_checked: (users.items || []).length, findings };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [tenantsPath, usersPath] = process.argv.slice(2);
  if (!tenantsPath || !usersPath) {
    console.error('Usage: node scripts/audit_registrations.mjs tenants.json users.json');
    process.exitCode = 1;
  } else {
    const tenants = JSON.parse(await readFile(tenantsPath, 'utf8'));
    const users = JSON.parse(await readFile(usersPath, 'utf8'));
    const report = auditRegistrations(tenants, users);
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.findings.length > 0 ? 2 : 0;
  }
}
