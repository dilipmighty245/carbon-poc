import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../api/client';
import type { RichDigitalPassport } from '../../types';

/** Read-only view using the gateway's existing public passport lookup. */
export function PublicPassportView() {
  const { passportId } = useParams();
  const [passport, setPassport] = useState<RichDigitalPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setPassport(null);
    setError('');
    fetch(`${API_BASE_URL}/public/passport-records/${encodeURIComponent(passportId || '')}`, {
      headers: { 'X-Tenant-ID': 'public' }, signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error(response.status === 404 ? 'Passport not found or not yet released for public access.' : 'The passport service is unavailable. Please try again later.');
      const data = await response.json() as RichDigitalPassport;
      if (!data.passport_metadata?.passport_id) throw new Error('The service returned an invalid passport.');
      setPassport(data);
    }).catch(err => {
      if (!controller.signal.aborted) setError(err instanceof TypeError ? 'Unable to reach the passport service. Check your connection and try again.' : err.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [passportId]);

  const metadata = passport?.passport_metadata;
  const product = passport?.product_summary;
  const footprint = passport?.carbon_footprint;
  const audit = passport?.methodology_and_audit;
  const details = [
    ['Passport ID', metadata?.passport_id],
    ['Recorded status', metadata?.status],
    ['Product', product?.product_name],
    ['Producer', product?.producer_organization],
    ['Batch', product?.batch_number],
    ['Country of origin', product?.facility?.country_of_origin],
    ['Carbon intensity', footprint?.intensity_per_unit?.value == null ? undefined : `${footprint.intensity_per_unit.value} ${footprint.intensity_per_unit.unit}`],
    ['Total batch emissions', footprint?.total_batch_footprint_kg_co2e == null ? undefined : `${footprint.total_batch_footprint_kg_co2e} kgCO2e`],
    ['Verification body', audit?.verification_body],
    ['Verification reference', audit?.verification_id],
    ['Assurance level', audit?.assurance_level],
    ['Issued at', metadata?.issuance_date],
    ['Recorded hash', metadata?.cryptographic_hash],
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <article className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 space-y-5">
        <p className="text-sm font-bold text-emerald-700">Saurient</p>
        <h1 className="text-2xl font-bold text-slate-900">Digital Carbon Passport</h1>
        {loading && <p role="status">Loading passport…</p>}
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {passport && <>
          <p className="text-sm text-slate-600">Current passport record from the issuing platform. The QR links to this record; it does not independently validate its signature or grant customs clearance.</p>
          <dl className="divide-y divide-slate-100">
            {details.map(([label, value]) => <div key={label} className="py-3 space-y-1">
              <dt className="text-xs font-medium text-slate-500">{label}</dt>
              <dd className="text-sm font-semibold text-slate-900 break-words">{value || 'Not recorded'}</dd>
            </div>)}
          </dl>
        </>}
      </article>
    </main>
  );
}
