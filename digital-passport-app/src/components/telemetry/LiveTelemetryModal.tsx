import React, { useState, useEffect } from 'react';
import { X, Activity, Zap, Gauge, Radio, RefreshCw, Copy, Check, Sliders, ShieldCheck, AlertCircle } from 'lucide-react';
import { type EM6400Reading, getLiveTelemetry, generateTelemetry, getTelemetrySample } from '../../api/client';

interface LiveTelemetryModalProps {
  meterId: string;
  facilityId: string;
  facilityName: string;
  onClose: () => void;
}

export const LiveTelemetryModal: React.FC<LiveTelemetryModalProps> = ({
  meterId,
  facilityId,
  facilityName,
  onClose,
}) => {
  const [reading, setReading] = useState<EM6400Reading | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(true);
  const [copied, setCopied] = useState(false);

  // Simulation input controls
  const [inputKw, setInputKw] = useState<number>(7.82);
  const [inputVoltage, setInputVoltage] = useState<number>(240);
  const [inputPf, setInputPf] = useState<number>(0.964);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch or generate reading
  const fetchReading = async (customKw?: number) => {
    try {
      const data = await getLiveTelemetry({
        meterId,
        facilityId,
        kw: customKw !== undefined ? customKw : inputKw,
        voltage: inputVoltage,
        pf: inputPf,
      });
      setReading(data);
    } catch (err) {
      console.warn('Live telemetry fetch failed, loading benchmark sample:', err);
      try {
        const sample = await getTelemetrySample();
        sample.meter_id = meterId;
        sample.facility_id = facilityId;
        setReading(sample);
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReading();
  }, [meterId]);

  // Periodic streaming
  useEffect(() => {
    if (!isStreaming) return;
    const timer = setInterval(() => {
      fetchReading();
    }, 1500);
    return () => clearInterval(timer);
  }, [isStreaming, meterId, facilityId, inputKw, inputVoltage, inputPf]);

  const handleApplyInputs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await generateTelemetry({
        meter_id: meterId,
        facility_id: facilityId,
        base_kw: inputKw,
        nominal_voltage: inputVoltage,
        power_factor: inputPf,
      });
      setReading(res);
    } catch (err) {
      console.warn('Generate telemetry failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadBenchmark = async () => {
    try {
      const sample = await getTelemetrySample();
      sample.meter_id = meterId;
      sample.facility_id = facilityId;
      setReading(sample);
      setInputKw(sample.KW);
      setInputVoltage(Math.round(sample.Vavg));
      setInputPf(sample.PF);
    } catch (err) {
      console.warn('Load benchmark sample failed:', err);
    }
  };

  const copyRawFrame = () => {
    if (!reading?.raw_frame) return;
    navigator.clipboard.writeText(reading.raw_frame);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                  LIVE TELEMETRY FEED
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>{meterId}</span>
                <span className="text-slate-400 text-xs font-mono font-normal">· Schneider/Sattric EM6400</span>
              </h3>
              <p className="text-xs text-slate-400">
                Connected Site: <span className="text-slate-200 font-semibold">{facilityName} ({facilityId})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                isStreaming
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isStreaming ? 'animate-pulse text-emerald-400' : ''}`} />
              <span>{isStreaming ? 'Live Stream Active' : 'Stream Paused'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs bg-slate-50">
          {/* Signal & Health Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Modem Status:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" /> GPRS ONLINE
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Meter Comm:</span>
                <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                  RS-485 OK
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">GSM Signal:</span>
                <span className="font-mono font-bold text-slate-700">{reading?.RSSI ?? -71} dBm</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
              <span>Last Ingest:</span>
              <span className="font-bold text-slate-700">
                {reading?.timestamp ? new Date(reading.timestamp).toLocaleTimeString() : 'Streaming'}
              </span>
            </div>
          </div>

          {/* 4 Main Electrical KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active Power */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono font-bold uppercase">Active Power</span>
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{reading?.KW?.toFixed(2) ?? '7.82'}</span>
                <span className="text-xs font-bold text-slate-500">kW</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-mono">
                <span>KVA: <strong>{reading?.KVA?.toFixed(2) ?? '8.11'}</strong></span>
                <span>PF: <strong>{reading?.PF?.toFixed(3) ?? '0.964'}</strong></span>
              </div>
            </div>

            {/* Average Voltage */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono font-bold uppercase">Average Voltage (LN)</span>
                <Gauge className="w-4 h-4 text-sky-600" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{reading?.Vavg?.toFixed(1) ?? '239.7'}</span>
                <span className="text-xs font-bold text-slate-500">V</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-mono">
                <span>V1n: {reading?.V1n?.toFixed(1) ?? '239.8'}</span>
                <span>V2n: {reading?.V2n?.toFixed(1) ?? '240.4'}</span>
                <span>V3n: {reading?.V3n?.toFixed(1) ?? '238.9'}</span>
              </div>
            </div>

            {/* Average Current */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono font-bold uppercase">Average Current</span>
                <Activity className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{reading?.Iavg?.toFixed(2) ?? '12.18'}</span>
                <span className="text-xs font-bold text-slate-500">A</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-mono">
                <span>I1: {reading?.I1?.toFixed(1) ?? '12.3'}</span>
                <span>I2: {reading?.I2?.toFixed(1) ?? '12.0'}</span>
                <span>In: {reading?.In?.toFixed(2) ?? '0.42'}</span>
              </div>
            </div>

            {/* Forward Energy */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono font-bold uppercase">Active Energy (Import)</span>
                <RefreshCw className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">
                  {reading?.KWH_FWD?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? '12,345.7'}
                </span>
                <span className="text-xs font-bold text-slate-500">kWh</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Freq: <strong>{reading?.FREQ?.toFixed(2) ?? '50.00'} Hz</strong></span>
                <span>Intr: <strong>{reading?.INTR ?? 5}</strong></span>
              </div>
            </div>
          </div>

          {/* Interactive Generator & Input Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-700" />
                <h4 className="font-bold text-slate-900 text-sm">Industrial Telemetry Generator Parameters</h4>
              </div>
              <button
                type="button"
                onClick={handleLoadBenchmark}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors"
                title="Reset to benchmark raw data frame from Santosh Samudrala"
              >
                Reset Benchmark Frame
              </button>
            </div>

            <form onSubmit={handleApplyInputs} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Target Load (Active Power kW)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="150"
                  value={inputKw}
                  onChange={(e) => setInputKw(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nominal Voltage (V LN)</label>
                <input
                  type="number"
                  step="1"
                  min="180"
                  max="300"
                  value={inputVoltage}
                  onChange={(e) => setInputVoltage(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Power Factor (PF)</label>
                <input
                  type="number"
                  step="0.005"
                  min="0.75"
                  max="1.0"
                  value={inputPf}
                  onChange={(e) => setInputPf(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Generate New Telemetry</span>
                </button>
              </div>
            </form>
          </div>

          {/* Raw Industrial Data Frame Card */}
          <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl shadow-inner space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <span className="font-bold text-emerald-400">RAW INDUSTRIAL DATA FRAME (EM6400)</span>
              <button
                onClick={copyRawFrame}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Frame'}</span>
              </button>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl text-[11px] leading-relaxed break-all border border-slate-800 text-emerald-300 select-all">
              {reading?.raw_frame || 'Loading raw frame...'}
            </div>
            <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>Format: $EM6400,V1n,V2n,V3n,V12,V23,V31,I1,I2,I3,Vavg,Iavg,KW,KVA,KVAR,PF,FREQ,THD,KWH_FWD,...,Z</span>
              <span>Modem Port: 8085 / SSE Stream</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Sattric IoT Telemetry · Connected to Facility Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
          >
            Close Telemetry View
          </button>
        </div>
      </div>
    </div>
  );
};
