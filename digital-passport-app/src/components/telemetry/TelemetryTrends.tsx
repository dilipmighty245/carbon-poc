import React from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TelemetryMessage } from '../../api/client';

const groups = [
  { title: 'Power', fields: ['TWt', 'RWt', 'YWt', 'BWt'] },
  { title: 'Voltage', fields: ['RV', 'YV', 'BV'] },
  { title: 'Current', fields: ['RA', 'YA', 'BA'] },
  { title: 'Power factor', fields: ['PF', 'RPF', 'YPF', 'BPF'] },
  { title: 'Frequency', fields: ['Freq'] },
  { title: 'Energy register', fields: ['kWh'] },
];
const phaseColors: Record<string, string> = { R: '#e11d48', Y: '#ca8a04', B: '#2563eb' };
const clockLabel = (value: number) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const TelemetryTrends: React.FC<{ readings: TelemetryMessage[]; meterId: string; windowMinutes: number }> = ({ readings, meterId, windowMinutes }) => {
  const rangeEnd = Date.now();
  const rangeStart = rangeEnd - windowMinutes * 60_000;
  const points = readings
    .filter(reading => reading.meter_id === meterId && !reading.parse_error && Date.parse(reading.received_at) >= rangeStart && Date.parse(reading.received_at) <= rangeEnd)
    .map(reading => {
      const values: Record<string, number | null> = { received_at: Date.parse(reading.received_at) };
      for (const group of groups) for (const field of group.fields) {
        const value = reading.fields?.[field];
        values[field] = typeof value === 'number' && Number.isFinite(value) ? value : null;
      }
      return values;
    })
    .sort((a, b) => Number(a.received_at) - Number(b.received_at));

  return (
    <section aria-label="Meter trend charts" className="space-y-3">
      <div className="flex justify-between gap-3 flex-wrap items-end">
        <div><h4 className="font-bold text-slate-900">Meter trends{meterId ? ` · ${meterId}` : ''}</h4><p className="text-xs text-slate-500 mt-1">Raw vendor values · units and scaling unconfirmed</p></div>
        <span className="text-xs text-slate-500" data-testid="telemetry-point-count">{points.length} deliveries · server receipt time</span>
      </div>
      {points.length > 0 && <p className="text-xs text-slate-500">Available receipts: {new Date(Number(points[0].received_at)).toLocaleString()} – {new Date(Number(points.at(-1)!.received_at)).toLocaleString()}. Empty parts of the selected window have no received data.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(group => {
          const hasValues = points.some(point => group.fields.some(field => point[field] !== null));
          const latest = points.at(-1)?.[group.fields[0]];
          return (
            <figure key={group.title} aria-label={`${group.title} trend for meter ${meterId || 'pending'}`} className="min-w-0 border border-slate-200 rounded-xl p-4 bg-white">
              <figcaption className="flex justify-between items-start gap-3 mb-3">
                <div><h5 className="font-bold text-slate-800">{group.title}</h5><p className="text-[10px] text-slate-500 mt-0.5">{group.fields.join(' · ')}</p></div>
                {latest != null && <div className="text-right"><strong className="font-mono text-lg text-emerald-800">{latest}</strong><p className="text-[10px] text-slate-500">Latest {group.fields[0]} · raw</p></div>}
              </figcaption>
              <div className="h-48" data-testid={`telemetry-chart-${group.fields[0]}`}>
                {hasValues ? <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={points} accessibilityLayer margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="received_at" type="number" scale="time" domain={[rangeStart, rangeEnd]} allowDataOverflow tickFormatter={clockLabel} minTickGap={40} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis width={56} domain={['auto', 'auto']} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip labelFormatter={value => new Date(Number(value)).toLocaleString()} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Legend iconType="plainline" wrapperStyle={{ fontSize: 10 }} />
                    {group.fields.map(field => <Line key={field} type="linear" dataKey={field} stroke={phaseColors[field[0]] || '#047857'} strokeWidth={2} dot={points.length < 30 ? { r: 2.5 } : false} activeDot={{ r: 4 }} connectNulls={false} isAnimationActive={false} />)}
                  </LineChart>
                </ResponsiveContainer> : <div className="h-full flex items-center justify-center text-slate-400 text-xs text-center">Waiting for numeric {group.title.toLowerCase()} samples from this meter</div>}
              </div>
            </figure>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">Each chart uses one meter. Points mark delivery receipt times, including retained and duplicate deliveries. The energy register is plotted unchanged; consumption is not calculated.</p>
    </section>
  );
};
