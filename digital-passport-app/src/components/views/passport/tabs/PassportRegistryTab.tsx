import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, Leaf, FileText, ChevronRight, Building2, Trash2, Filter } from 'lucide-react';
import { deletePassport } from '../../../../api/client';
import type { RichDigitalPassport } from '../../../../types';

interface PassportRegistryTabProps {
  passports: RichDigitalPassport[];
  tenantId: string;
  onRefresh?: () => void;
}

export const PassportRegistryTab: React.FC<PassportRegistryTabProps> = ({ passports, tenantId, onRefresh }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedOrg, setSelectedOrg] = useState('ALL');

  // Extract distinct organisation tenants present in the passports
  const organisations = ['ALL', ...Array.from(new Set(passports.map((p) => p.product_summary?.producer_organization).filter(Boolean))) as string[]];

  const filtered = passports.filter((p) => {
    const productName = p.product_summary?.product_name || '';
    const batchNumber = p.product_summary?.batch_number || '';
    const commodity = p.product_summary?.commodity || '';
    const passportId = p.passport_metadata?.passport_id || '';
    const status = p.passport_metadata?.status || 'Draft';
    const prodOrg = p.product_summary?.producer_organization || '';

    const matchesSearch =
      productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      passportId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prodOrg.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCommodity =
      selectedCommodity === 'ALL' ||
      commodity.toUpperCase().includes(selectedCommodity.toUpperCase());

    const matchesStatus =
      selectedStatus === 'ALL' ||
      status.toUpperCase() === selectedStatus.toUpperCase();

    const matchesOrg =
      selectedOrg === 'ALL' ||
      prodOrg.toUpperCase() === selectedOrg.toUpperCase();

    return matchesSearch && matchesCommodity && matchesStatus && matchesOrg;
  });

  const commodities = ['ALL', 'COCOA', 'STEEL', 'CASHEW', 'METALS', 'CEMENT', 'TEXTILES', 'HEAVY INDUSTRY'];
  const lifecycleFilters = ['ALL', 'Draft', 'Submitted', 'UnderVerification', 'CorrectionsRequired', 'Verified', 'Issued', 'SubmittedToAgency'];

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'UNDERVERIFICATION':
      case 'UNDER_VERIFICATION':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'CORRECTIONSREQUIRED':
      case 'CORRECTIONS_REQUIRED':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'VERIFIED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'ISSUED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'SUBMITTEDTOAGENCY':
      case 'SUBMITTED_TO_AGENCY':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Commodity Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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

        {/* Lifecycle Status Quick Filter */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Lifecycle:</span>
          {lifecycleFilters.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                selectedStatus === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        {/* Organisation Filter */}
        {organisations.length > 2 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              Organisation:
            </span>
            {organisations.map((org) => (
              <button
                key={org}
                onClick={() => setSelectedOrg(org)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  selectedOrg === org
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {org === 'ALL' ? `All Organisations (${passports.length})` : org}
              </button>
            ))}
          </div>
        )}
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
            const status = p.passport_metadata?.status || 'Draft';
            const statusColor = getStatusBadgeStyle(status);

            const passId = p.passport_metadata?.passport_id || `pas-st-2026-00${idx}`;
            const commodityName = p.product_summary?.commodity || 'Steel';
            const prodName = p.product_summary?.product_name || 'Hot-Rolled Steel Coil';
            const regCompStr = localStorage.getItem('saurient_registered_company');
            let regOrg = '';
            if (regCompStr) {
              try { regOrg = JSON.parse(regCompStr).legalName; } catch (e) {}
            }
            const producerOrg = p.product_summary?.producer_organization || regOrg || 'Saurient Carbon Passport';
            const batchNum = p.product_summary?.batch_number || 'ST-2026-00981';
            const countryOrigin = p.product_summary?.facility?.country_of_origin || 'India';
            const intensityVal = p.carbon_footprint?.intensity_per_unit?.value || (
              p.product_summary?.commodity?.toLowerCase().includes('steel') ? 1.633 :
              p.product_summary?.commodity?.toLowerCase().includes('cocoa') ? 0.359 :
              p.product_summary?.commodity?.toLowerCase().includes('cement') ? 7765 : 1.25
            );
            const intensityUnit = p.carbon_footprint?.intensity_per_unit?.unit || 'kg CO2e/kg';
            const totalEmissions = p.carbon_footprint?.total_batch_footprint_kg_co2e || (
              p.product_summary?.commodity?.toLowerCase().includes('steel') ? 16330 :
              p.product_summary?.commodity?.toLowerCase().includes('cocoa') ? 1117 :
              p.product_summary?.commodity?.toLowerCase().includes('cement') ? 7765 : 12500
            );

            return (
              <div
                key={passId || idx}
                onClick={() => navigate(`/passport/detail/${passId}`)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col justify-between group"
              >
                <div className="p-5 border-b border-slate-100 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      {commodityName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                        {status}
                      </span>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete carbon passport for batch ${batchNum} (${prodName})?`)) {
                            try {
                              await deletePassport(passId, p.product_summary?.producer_organization || tenantId);
                              if (onRefresh) onRefresh();
                            } catch (err: any) {
                              alert(err.message || 'Failed to delete passport');
                            }
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Batch Passport"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                      {prodName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{producerOrg}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs pt-1">
                    <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                      🏷️ {batchNum}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                      📍 {countryOrigin}
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
                          {intensityVal}
                        </span>
                        <span className="text-[10px] text-slate-600 ml-1">
                          {intensityUnit}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Batch Total</span>
                      <span className="text-xs font-bold text-slate-900">
                        {totalEmissions.toLocaleString()} kgCO2e
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>
                      {status === 'Draft' || status === 'CorrectionsRequired'
                        ? 'Open & Submit for Verification →'
                        : 'View Digital Passport Details'}
                    </span>
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
