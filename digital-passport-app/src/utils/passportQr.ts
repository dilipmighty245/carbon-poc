/** Use a reachable deployment origin; localhost on a phone refers to the phone itself. */
export function getPassportVerificationUrl(passportId: string): string {
  const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL;
  const base = new URL(configuredUrl || window.location.origin);
  const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
  const isDevAlias = base.hostname === 'carbon-passport-dev';
  const devOrigin = import.meta.env.DEV
    ? document.querySelector<HTMLMetaElement>('meta[name="passport-dev-origin"]')?.content
    : undefined;
  if (!configuredUrl && isDevAlias && devOrigin) {
    // The local proxy uses port 80; phones must connect directly to Vite's LAN port.
    return new URL(`/verify/${encodeURIComponent(passportId)}`, devOrigin).href;
  }
  if (!configuredUrl && import.meta.env.DEV && isLoopback && import.meta.env.VITE_DEV_LAN_HOST) {
    // Preserve the actual browser port, including Vite's automatic port fallback.
    base.hostname = import.meta.env.VITE_DEV_LAN_HOST;
  }
  if (!['http:', 'https:'].includes(base.protocol)) {
    throw new Error('VITE_PUBLIC_APP_URL must be an HTTP or HTTPS URL');
  }
  return new URL(`/verify/${encodeURIComponent(passportId)}`, base).href;
}

/** Public release requires verification, issuance, and agency submission in order. */
export function isPassportPublic(status?: string): boolean {
  return status?.replace(/[_\s-]/g, '').toLowerCase() === 'submittedtoagency';
}
