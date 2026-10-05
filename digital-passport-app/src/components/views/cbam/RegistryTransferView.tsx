import React from 'react';
import { Send, ShieldCheck, CheckCircle2, Lock, FileCode, ExternalLink } from 'lucide-react';
import type { CBAMProductData } from '../../../types/cbam';

interface RegistryTransferViewProps {
  product: CBAMProductData;
}

export const RegistryTransferView: React.FC<RegistryTransferViewProps> = ({ product }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">EU CBAM Registry Transfer Preview & Handover</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Simulated export payload and secure access link for accredited verifiers and authorised declarants.
            </p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-md tracking-wider">
            HANDOVER READY
          </span>
        </div>

        {/* Handover Payload Box */}
        <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
            <span className="font-bold text-[#00E599] flex items-center gap-2">
              <FileCode className="w-4 h-4" /> CBAM DECLARANT XML/JSON EXPORT PAYLOAD
            </span>
            <span className="text-slate-400 text-[10px]">SCHEMA VERSION: EU-CBAM-XML-v1.4</span>
          </div>

          <pre className="text-[11px] text-slate-300 overflow-x-auto p-3 bg-slate-950 rounded-xl border border-slate-800 leading-relaxed">
{`{
  "declarationHeader": {
    "reportingYear": 2026,
    "declarantEORI": "NL849201938000",
    "declarantName": "EuroMetals Import GmbH",
    "cbamAccountRef": "CBAM-ACC-EU-2026-940"
  },
  "goodsDeclaration": [
    {
      "cnCode": "${product.cnCode}",
      "commodityName": "${product.name}",
      "countryOfOrigin": "${product.countryOfOrigin}",
      "installationId": "${product.installationName}",
      "annualNetMassTonnes": ${product.annualVolumeTonnes},
      "directSpecificEmissions": ${product.directEmissionsIntensity},
      "indirectSpecificEmissions": ${product.indirectEmissionsIntensity},
      "precursorSpecificEmissions": ${product.precursorEmissionsIntensity},
      "totalSpecificEmissions": ${product.totalSpecificEmissions},
      "verificationReportId": "${product.verifierReportId || 'VR-2026-TEMA-8841'}",
      "manifestHash": "${product.freezeManifestHash || 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}"
    }
  ]
}`}
          </pre>
        </div>

        {/* Action Link Share Box */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SECURE VERIFIER HANDOVER LINK</span>
            <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
              https://saurient.io/verify/dossier/DOS-2026-TEMA-00819
            </div>
            <p className="text-slate-500 mt-0.5">Expiring token access for Accredited Verifier (VeriCarbon EU GmbH)</p>
          </div>

          <button className="px-4 py-2 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0">
            <Send className="w-4 h-4" />
            <span>Send Package to Declarant</span>
          </button>
        </div>
      </div>
    </div>
  );
};
