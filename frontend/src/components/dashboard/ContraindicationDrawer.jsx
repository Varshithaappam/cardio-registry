import React from 'react';
import { X, ShieldAlert, AlertTriangle, CheckCircle, Info, Heart, Droplets, Gauge } from 'lucide-react';
import { CONTRAINDICATION_THRESHOLDS } from '../../utils/gdmtEngine';

export default function ContraindicationDrawer({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end transition-opacity">
      <div 
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Clinical Contraindication Criteria</h3>
              <p className="text-xs text-slate-400">Class I Guideline Exclusion Rules & Physiological Safety Barriers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Quick Highlight Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wider mb-1">
                <Droplets className="w-4 h-4 text-red-500" />
                Renal Impairment
              </div>
              <p className="text-lg font-black text-slate-900">Creatinine &gt; 2.5</p>
              <p className="text-[11px] text-slate-600 mt-0.5">mg/dL or eGFR &lt; 30 mL/min</p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider mb-1">
                <Gauge className="w-4 h-4 text-amber-500" />
                Hyperkalemia
              </div>
              <p className="text-lg font-black text-slate-900">Potassium &gt; 5.0</p>
              <p className="text-[11px] text-slate-600 mt-0.5">mEq/L (Contraindicates MRA/RAAS)</p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider mb-1">
                <Heart className="w-4 h-4 text-blue-500" />
                Severe Hypotension
              </div>
              <p className="text-lg font-black text-slate-900">SBP &lt; 90</p>
              <p className="text-[11px] text-slate-600 mt-0.5">mmHg sitting/standing systolic</p>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider mb-1">
                <AlertTriangle className="w-4 h-4 text-purple-500" />
                Severe Bradycardia
              </div>
              <p className="text-lg font-black text-slate-900">HR &lt; 50</p>
              <p className="text-[11px] text-slate-600 mt-0.5">bpm resting heart rate</p>
            </div>
          </div>

          {/* Detailed Pillars Criteria */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-600" />
              Pillar-Specific Regulatory Rules
            </h4>

            {CONTRAINDICATION_THRESHOLDS.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h5 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>{item.pillar}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-semibold">
                    Tier 2 Engine Rule
                  </span>
                </h5>
                <ul className="mt-2.5 space-y-1.5 text-xs text-slate-700">
                  {item.rules.map((rule, rIdx) => (
                    <li key={rIdx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0"></span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* GDMT 3-Tier Rule Logic */}
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
            <h5 className="font-bold text-teal-900 text-xs uppercase tracking-wider mb-1.5">
              Deviation Scoring Standard
            </h5>
            <p className="text-xs text-teal-800 leading-relaxed">
              In guideline-directed therapy audit, <strong>Appropriate Care</strong> occurs when a drug is either prescribed to an eligible patient OR withheld with a verified contraindication. An <strong>Actionable Deviation</strong> is recorded when a drug is omitted without any barrier, or given when an active contraindication exists.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
