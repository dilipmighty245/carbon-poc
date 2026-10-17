/** Use a reachable deployment origin; localhost on a phone refers to the phone itself. */
export function getPassportVerificationUrl(passportId: string): string {
  const base = new URL(import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin);
  if (!['http:', 'https:'].includes(base.protocol)) {
    throw new Error('VITE_PUBLIC_APP_URL must be an HTTP or HTTPS URL');
  }
  return new URL(`/verify/${encodeURIComponent(passportId)}`, base).href;
}
