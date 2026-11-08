import React, { useEffect, useState } from 'react';
import { X, Activity, RefreshCw } from 'lucide-react';
import { getFacilityTelemetry, type TelemetryResponse } from '../../api/client';
import { TelemetryTrends } from './TelemetryTrends';

interface Props { facilityId: string; facilityName: string; onClose: () => void }

const descriptions: Record<string, string> = {
  LOC: 'Location label', SNO: 'Gateway identifier', DEVID: 'Meter identifier',
  COMM: 'Communication code · semantics unconfirmed', INST: 'Instrument label · model unconfirmed',
  RV: 'R phase voltage · units/scaling unconfirmed', YV: 'Y phase voltage · units/scaling unconfirmed', BV: 'B phase voltage · units/scaling unconfirmed',
  RWt: 'R phase power · W/kW unconfirmed', YWt: 'Y phase power · W/kW unconfirmed', BWt: 'B phase power · W/kW unconfirmed', TWt: 'Total power · W/kW unconfirmed',
  RA: 'R phase current · units/scaling unconfirmed', YA: 'Y phase current · units/scaling unconfirmed', BA: 'B phase current · units/scaling unconfirmed',
  RPF: 'R phase power factor · sign unconfirmed', YPF: 'Y phase power factor · sign unconfirmed', BPF: 'B phase power factor · sign unconfirmed',
  PF: 'Aggregate power factor · semantics unconfirmed', Freq: 'Frequency · units unconfirmed',
  kWh: 'Energy value · cumulative/interval unconfirmed',
};

export const LiveTelemetryModal: React.FC<Props> = ({ facilityId, facilityName, onClose }) => {
  const [data, setData] = useState<TelemetryResponse | null>(null);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(true);
  const [meter, setMeter] = useState('');
  const [meters, setMeters] = useState<string[]>([]);
  const [windowMinutes, setWindowMinutes] = useState(60);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      try {
        const result = await getFacilityTelemetry(facilityId, controller.signal, { meterId: meter, windowMinutes });
        if (!controller.signal.aborted) {
          setData(result); setError('');
          const discovered = result.readings.map(r => r.meter_id).filter(Boolean);
          setMeters(previous => [...new Set([...previous, ...discovered])].sort());
          if (!meter && discovered.length > 0) setMeter([...new Set(discovered)].sort()[0]);
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Unable to load telemetry');
      } finally {
        if (polling && !controller.signal.aborted) timer = setTimeout(refresh, 3000);
      }
    };
    refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [facilityId, polling, meter, windowMinutes]);

  const readings = (data?.readings || []).filter(r => !meter || r.meter_id === meter);
  const reading = readings.find(r => r.id === selectedId) || readings[0];
  const stale = reading && Date.now() - Date.parse(reading.received_at) > (data?.stale_after_seconds || 120) * 1000;
  const state = error ? 'Unavailable' : !data ? 'Loading' : !reading ? 'Waiting for MQTT data' : reading.parse_error ? 'Invalid payload' : stale ? 'Stale receipt' : reading.retained ? 'Retained delivery' : 'Received';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Facility MQTT telemetry">
      <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between gap-4">
          <div><div className="flex items-center gap-2 font-bold"><Activity className="w-5 h-5" /> SaurEdge/WG-05 telemetry</div><p className="text-sm text-slate-300 mt-1">{facilityName} · {facilityId}</p></div>
          <button onClick={onClose} aria-label="Close telemetry"><X /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className={`font-bold px-3 py-1 rounded-lg ${error || stale ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-800'}`}>{state}</span>
            <button onClick={() => setPolling(v => !v)} className="flex items-center gap-2 border rounded-lg px-3 py-2"><RefreshCw className="w-4 h-4" />{polling ? 'Pause refresh' : 'Resume refresh'}</button>
          </div>
          {error && <p role="alert" className="text-red-700">{error}</p>}
          {data?.subscription && <p className="text-slate-600">MQTT subscription: <strong>{data.subscription.state.replaceAll('_', ' ')}</strong></p>}
          <p className="text-slate-600">Original MQTT values. Units and scaling await vendor confirmation. Receipt time records arrival at the server; the payload contains no measurement timestamp. Energy and emissions calculations are disabled.</p>
          <div className="flex gap-4 items-center flex-wrap">
          <label className="block font-medium">Meter
            <select aria-label="Meter" className="ml-3 border rounded-lg px-3 py-2" value={meter} onChange={e => { setMeter(e.target.value); setSelectedId(''); setData(null); }}>
              {!meter && <option value="">Waiting for meters</option>}{meters.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
          </label>
          <label className="block font-medium">Time window
            <select aria-label="Time window" className="ml-3 border rounded-lg px-3 py-2" value={windowMinutes} onChange={e => { setWindowMinutes(Number(e.target.value)); setSelectedId(''); setData(null); }}>
              <option value={15}>Last 15 minutes</option><option value={60}>Last hour</option><option value={1440}>Last 24 hours</option>
            </select>
          </label>
          <span className="text-xs text-slate-500">Up to 1,000 deliveries per window</span>
          </div>
          <TelemetryTrends readings={data?.readings || []} meterId={meter} windowMinutes={windowMinutes} />
          {reading && <>
            <dl className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
              <div><dt className="text-slate-500">Received at</dt><dd>{new Date(reading.received_at).toLocaleString()}<br /><span className="font-mono text-xs">{reading.received_at}</span></dd></div>
              <div><dt className="text-slate-500">Gateway / Meter</dt><dd>{reading.gateway_serial || 'Unknown'} / {reading.meter_id || 'Unknown'}</dd></div>
              <div className="col-span-2 break-all"><dt className="text-slate-500">Topic</dt><dd className="font-mono">{reading.topic}</dd></div>
              <div className="col-span-2">QoS {reading.qos} · retained: {String(reading.retained)} · duplicate: {String(reading.duplicate)}</div>
            </dl>
            {reading.parse_error && <p role="alert" className="text-amber-800">{reading.parse_error}</p>}
            <details open><summary className="font-bold cursor-pointer mb-2">Raw fields and interpretation</summary>
            <table className="w-full text-left"><thead><tr className="border-b"><th className="py-2">Field</th><th>Raw value</th><th>Interpretation (unconfirmed)</th></tr></thead>
              <tbody>{Object.entries(reading.fields || {}).map(([key, value]) => <tr key={key} className="border-b border-slate-100"><td className="py-2 font-mono font-bold">{key}</td><td className="font-mono break-all">{JSON.stringify(value)}</td><td className="text-slate-500">{descriptions[key] || 'Unknown vendor field · preserved unchanged'}</td></tr>)}</tbody>
            </table>
            </details>
            <details><summary className="cursor-pointer font-medium">Exact payload (base64)</summary><pre className="whitespace-pre-wrap break-all bg-slate-50 p-3 text-xs mt-2">{reading.payload_base64}</pre></details>
          </>}
          {readings.length > 0 && <div><h4 className="font-bold mb-2">Recent deliveries (latest 100 of {readings.length})</h4><div className="max-h-44 overflow-y-auto border rounded-xl">
            {readings.slice(0, 100).map(r => <button key={r.id} onClick={() => setSelectedId(r.id)} className={`block text-left w-full px-3 py-2 border-b text-xs ${r.id === reading?.id ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>{r.received_at} · meter {r.meter_id || 'unknown'}{r.retained ? ' · retained' : ''}{r.parse_error ? ' · invalid' : ''}</button>)}
          </div></div>}
        </div>
      </div>
    </div>
  );
};
