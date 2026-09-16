import React from 'react';
import { evaluateClinicalMetric } from '../../../config/clinicalMetricsConfig';

/**
 * Renders a visual alert badge for clinical inputs based on WHO/ACC/AHA reference thresholds.
 * @param {string} metricId - Field key or alias (e.g. 'pulse_rate', 'systolic_bp', 'door_to_balloon_time')
 * @param {number|string} value - User input value
 */
export function ClinicalMetricBadge({ metricId, value }) {
  if (value === '' || value === undefined || value === null) return null;
  const evaluation = evaluateClinicalMetric(metricId, value);
  if (!evaluation || evaluation.status === 'UNKNOWN') return null;

  return (
    <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border font-bold shadow-2xs transition-all ${evaluation.badgeClass}`}>
      <span>{evaluation.label}</span>
    </div>
  );
}

export default ClinicalMetricBadge;
