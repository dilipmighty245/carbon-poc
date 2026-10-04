import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Check, Info, ShieldCheck, ArrowRight } from 'lucide-react';
import type { CBAMProductData } from '../../../types/cbam';

interface CNClassificationViewProps {
  product: CBAMProductData;
}

export const CNClassificationView: React.FC<CNClassificationViewProps> = ({ product }) => {
  const [, setSearchParams] = useSearchParams();

  const cnCatalogue = [
    { code: 'CN 7208 39', name: 'Flat-rolled products of iron or non-alloy steel (Hot-Rolled Coil)', sector: 'Iron & Steel', status: 'COVERED', type: 'Complex Good', unit: 'Tonne' },
    { code: 'CN 7209 16', name: 'Cold-rolled flat steel sheet in coils', sector: 'Iron & Steel', status: 'COVERED', type: 'Complex Good', unit: 'Tonne' },
    { code: 'CN 7308 90', name: 'Structures and parts of structures of iron or steel', sector: 'Iron & Steel', status: 'COVERED', type: 'Complex Good', unit: 'Tonne' },
    { code: 'CN 7616 99', name: 'Other articles of aluminium', sector: 'Aluminium', status: 'COVERED', type: 'Simple / Complex', unit: 'Tonne' },
    { code: 'CN 2523 29', name: 'Portland cement (other than white)', sector: 'Cement', status: 'COVERED', type: 'Complex Good', unit: 'Tonne' },
    { code: 'CN 3105 20', name: 'Fertilisers containing nitrogen, phosphorus & potassium', sector: 'Fertilisers', status: 'COVERED', type: 'Complex Good', unit: 'kg Nitrogen' },
    { code: 'CN 2804 10', name: 'Hydrogen (pure or gas mixture)', sector: 'Hydrogen', status: 'COVERED', type: 'Simple Good', unit: 'Tonne H₂' },
    { code: 'CN 2716 00', name: 'Electrical energy', sector: 'Electricity', status: 'COVERED', type: 'Simple Good', unit: 'MWh' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">CN Classification & Annex I Catalogue</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Official Combined Nomenclature 8-digit classification mapping and functional unit determination.
            </p>
          </div>
          <span className="bg-sky-100 text-sky-800 text-[10px] font-mono font-bold px-3 py-1 rounded-md tracking-wider">
            REGULATION (EU) 2023/956 ANNEX I
          </span>
        </div>

        {/* Selected Product Classification Highlight */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CURRENT CLASSIFICATION</span>
            <div className="font-bold text-slate-900 text-base mt-0.5">{product.name}</div>
            <p className="text-slate-500 font-mono">CN Code {product.cnCode} · {product.sector}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block">GOOD TYPE</span>
              <span className="font-bold text-slate-900">{product.isSimpleGood ? 'Simple Good' : 'Complex Good (Precursors Required)'}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block">FUNCTIONAL UNIT</span>
              <span className="font-bold text-slate-900">{product.functionalUnit}</span>
            </div>
          </div>
        </div>

        {/* CN Catalogue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pr-4">CN CODE</th>
                <th className="pb-3 px-4">COMMODITY DESCRIPTION</th>
                <th className="pb-3 px-4">SECTOR</th>
                <th className="pb-3 px-4">GOOD TYPE</th>
                <th className="pb-3 px-4">FUNCTIONAL UNIT</th>
                <th className="pb-3 pl-4">ANNEX I STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cnCatalogue.map((item, i) => (
                <tr key={i} className={item.code.includes(product.cnCode) ? 'bg-emerald-50/50 font-bold' : ''}>
                  <td className="py-3.5 pr-4 font-mono font-bold text-slate-900">{item.code}</td>
                  <td className="py-3.5 px-4 text-slate-700">{item.name}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{item.sector}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{item.type}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{item.unit}</td>
                  <td className="py-3.5 pl-4">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'COVERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={() => setSearchParams({ tab: 'cost' })}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>Open Cost Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
