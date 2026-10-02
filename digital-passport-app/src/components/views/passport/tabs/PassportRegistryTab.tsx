import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, Leaf, FileText, ChevronRight } from 'lucide-react';
import type { RichDigitalPassport } from '../../../../types';

interface PassportRegistryTabProps {
  passports: RichDigitalPassport[];
  tenantId: string;
}

export const PassportRegistryTab: React.FC<PassportRegistryTabProps> = ({ passports, tenantId }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('ALL');

  const filtered = passports.filter((p) => {
    const matchesSearch =
      p.product_summary.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.product_summary.batch_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.product_summary.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.passport_metadata.passport_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCommodity =
      selectedCommodity === 'ALL' ||
      p.product_summary.commodity.toUpperCase().includes(selectedCommodity.toUpperCase());

    return matchesSearch && matchesCommodity;
  });

  const commodities = ['ALL', 'COCOA', 'ALUMINIUM', 'CEMENT'];

  return (
    <div className="space-y-6">
      {/* Search & Commodity Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product, batch ID, or commodity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {commodities.map((comm) => (
            <button
              key={comm}
              onClick={() => setSelectedCommodity(comm)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCommodity === comm
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {comm}
            </button>
          ))}
        </div>
      </div>

      {/* Passport Tiles Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-xl mx-auto my-6">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Passports Found</h3>
          <p className="text-xs text-slate-500">
            No carbon passports match your query for tenant "{tenantId}".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p, idx) => {
            const status = p.passport_metadata.status;
            const statusColor =
              status.toUpperCase() === 'VERIFIED'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-sky-100 text-sky-800 border-sky-200';

            return (
              <div
                key={p.passport_metadata.passport_id || idx}
                onClick={() => navigate(`/passport/detail/${p.passport_metadata.passport_id}`)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col justify-between group"
              >
                <div className="p-5 border-b border-slate-100 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      {p.product_summary.commodity}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                      {status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                      {p.product_summary.product_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{p.product_summary.producer_organization}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs pt-1">
                    <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                      🏷️ {p.product_summary.batch_number}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                      📍 {p.product_summary.facility.country_of_origin}
                    </span>
                  </div>
                </div>

                <div className="p-5 bg-slate-50/50 space-y-4">
                  <div className="bg-emerald-50/80 border border-emerald-100 p-3.5 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Leaf className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 block">Carbon Intensity</span>
                        <span className="text-lg font-black text-slate-900">
                          {p.carbon_footprint.intensity_per_unit.value}
                        </span>
                        <span className="text-[10px] text-slate-600 ml-1">
                          {p.carbon_footprint.intensity_per_unit.unit}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Batch Total</span>
                      <span className="text-xs font-bold text-slate-900">
                        {p.carbon_footprint.total_batch_footprint_kg_co2e.toLocaleString()} kgCO2e
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>View Digital Passport Details</span>
                    <ChevronRight className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
