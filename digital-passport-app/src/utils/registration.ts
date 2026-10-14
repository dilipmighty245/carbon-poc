export function withoutRegistrationPasswords<T extends Record<string, unknown>>(value: T) {
  const { ownerPassword: _password, confirmPassword: _confirmation, ...safe } = value;
  return safe;
}

// Remove credentials left by older versions without discarding the company or draft.
export function clearLegacyRegistrationPasswords() {
  for (const key of ['saurient_registered_company', 'saurient_registration_draft']) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const safe = withoutRegistrationPasswords(parsed);
        if (safe.formData && typeof safe.formData === 'object') {
          safe.formData = withoutRegistrationPasswords(safe.formData as Record<string, unknown>);
        }
        localStorage.setItem(key, JSON.stringify(safe));
      }
    } catch { localStorage.removeItem(key); }
  }
}
