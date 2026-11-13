import React from 'react';

/**
 * Universal High-Contrast Chart Tooltip for Clinical Intelligence Dashboards
 * Ensures crisp white/amber typography on dark slate container so counts
 * and percentages are clearly readable across all charts.
 */
export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0];
  const data = item?.payload || {};

  // Resolve Title / Header
  const title = label || data.name || data.bracket || data.drug || (data.score ? `Score: ${data.score}` : null) || item.name || 'Clinical Metric';

  // Resolve Count / Number of Records
  let count = data.count ?? data.prescribedCount;
  if (count === undefined || count === null) {
    if (typeof item.value === 'number' && !String(item.value).includes('.')) {
      count = item.value;
    }
  }

  // Resolve Percentage
  let percent = data.percent ?? data.prescribedRate;
  if (percent === undefined || percent === null) {
    if (typeof item.value === 'number' && String(item.value).includes('.')) {
      percent = item.value;
    }
  }

  const dotColor = data.fill || item.color || '#3b82f6';

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/90 rounded-xl px-3.5 py-2.5 shadow-2xl text-white text-xs min-w-[155px] pointer-events-none z-50">
      <div className="font-bold text-slate-100 text-[11.5px] border-b border-slate-700/70 pb-1.5 mb-2 flex items-center justify-between gap-2.5">
        <span className="truncate">{title}</span>
        <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: dotColor }} />
      </div>

      {count !== null && count !== undefined && (
        <div className="flex items-center justify-between gap-4 text-slate-300 py-0.5">
          <span className="text-slate-400 text-[11px] font-medium">Patients:</span>
          <span className="font-bold text-white text-xs">{count} {count === 1 ? 'Record' : 'Records'}</span>
        </div>
      )}

      {percent !== null && percent !== undefined && (
        <div className="flex items-center justify-between gap-4 text-slate-300 py-0.5">
          <span className="text-slate-400 text-[11px] font-medium">Percentage:</span>
          <span className="font-black text-amber-400 text-xs">{percent}%</span>
        </div>
      )}

      {data.riskTier && (
        <div className="flex items-center justify-between gap-4 text-slate-300 py-0.5 border-t border-slate-800/80 mt-1 pt-1">
          <span className="text-slate-400 text-[10.5px]">Risk Stratum:</span>
          <span className="font-semibold text-slate-200 text-[11px]">{data.riskTier}</span>
        </div>
      )}

      {data.category && (
        <div className="flex items-center justify-between gap-4 text-slate-300 py-0.5 border-t border-slate-800/80 mt-1 pt-1">
          <span className="text-slate-400 text-[10.5px]">Class:</span>
          <span className="font-semibold text-slate-200 text-[11px]">{data.category}</span>
        </div>
      )}
    </div>
  );
}

