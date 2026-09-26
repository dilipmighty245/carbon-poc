import React from 'react';
import { Lightbulb } from 'lucide-react';

interface BulletPoint {
  step: number;
  text: string;
}

interface SimpleWordsCardProps {
  title?: string;
  points: BulletPoint[];
  extraCard?: React.ReactNode;
}

export const SimpleWordsCard: React.FC<SimpleWordsCardProps> = ({ title = 'In simple words', points, extraCard }) => {
  return (
    <div className="space-y-4">
      <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-emerald-900">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm">
            <Lightbulb className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold">{title}</h3>
        </div>
        <div className="space-y-4">
          {points.map((p) => (
            <div key={p.step} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {p.step}
              </span>
              <p className="text-slate-700 text-sm leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
      {extraCard}
    </div>
  );
};
