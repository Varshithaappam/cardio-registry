import React from 'react';
import { evaluateClinicalMetric } from '../../../config/clinicalMetricsConfig';

/**
 * Renders a visual alert badge or out-of-range error message for clinical numerical inputs
 * based on WHO/ACC/AHA reference thresholds and strict absolute boundaries.
 * 
 * @param {string} metricId - Field key or alias (e.g. 'pulse_rate', 'systolic_bp', 'door_to_balloon_time')
 * @param {number|string} value - User input value
 */
export function ClinicalMetricBadge({ metricId, value }) {
  if (value === '' || value === undefined || value === null) return null;
  
  const evaluation = evaluateClinicalMetric(metricId, value);
  if (!evaluation) return null;

  // 1. Absolute Boundary Error State (Out of Range Error)
  if (evaluation.isError || evaluation.status === 'OUT_OF_RANGE') {
    return (
      <div className="mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>
        <span>{evaluation.errorMessage || evaluation.label}</span>
      </div>
    );
  }

  // 2. Standard Explicit Categories & Dynamic Abnormal Badges (Normal, Medium, High, Abnormal (Low), Abnormal (High))
  return (
    <div className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] border font-bold shadow-2xs transition-all ${evaluation.badgeClass}`}>
      <span>{evaluation.label}</span>
    </div>
  );
}

export default ClinicalMetricBadge;
