import React, { useState, useEffect } from 'react';
import { Shield, Clock, User, FileText, X, RefreshCw, AlertCircle, Mail, CheckCircle } from 'lucide-react';
import api from '../../api/axiosInstance';
import { formatDateTimeForDisplay } from '../../utils/dateUtils';

export default function AuditLogViewer({ hfId, regPatientId, isOpen = true, onClose, isInline = false }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const FRIENDLY_LABELS = {
    'care_mr_no': 'MR Number',
    'encounterId': 'MR Number',
    'visit_id': 'Visit ID',
    'visitId': 'Visit ID',
    'visit_type': 'Visit Type',
    'visitType': 'Visit Type',
    'assessment_date': 'Assessment Date',
    'assessmentDate': 'Assessment Date',
    'treating_cardiologist': 'Treating Cardiologist',
    'treatingCardiologist': 'Treating Cardiologist',
    'referring_doctor': 'Referring Doctor',
    'referringDoctor': 'Referring Doctor',
    'referred_from': 'Referred From',
    'referredFrom': 'Referred From',
    'present_diagnosis': 'Present Diagnosis',
    'presentDiagnosis': 'Present Diagnosis',
    'discharge_date': 'Discharge Date',
    'dischargeDate': 'Discharge Date',
    'hospitalization_days': 'Days Hospitalized',
    'daysHospitalized': 'Days Hospitalized',
    'address': 'Address',
    'patient.address': 'Address',
    'education_level': 'Highest Education',
    'highestEducation': 'Highest Education',
    'monthly_income': 'Monthly Income',
    'monthlyIncome': 'Monthly Income',
    'occupation': 'Occupation',
    'caregiver_name': 'Caregiver Name',
    'caregiverName': 'Caregiver Name',
    'caregiver_relationship': 'Relationship to Patient',
    'caregiverRelationship': 'Relationship to Patient',
    'caregiver_phone': 'Caregiver Phone No.',
    'caregiverPhone': 'Caregiver Phone No.',
    'insurance_mode': 'Insurance Mode',
    'insuranceMode': 'Insurance Mode',
    'previous_diagnosis': 'Previous HF Diagnosis',
    'previousDiagnosis': 'Previous HF Diagnosis',
    'history_cabg': 'History of CABG',
    'history_ptca': 'History of PTCA',
    'history_stroke': 'History of Stroke',
    'history_major_bleed': 'History of Major Bleed',
    'history_thrombolysis': 'History of Thrombolysis',
    'history_past_mi': 'History of Past MI',
    'past_mi_years_ago': 'Years Since Past MI',
    'past_mi_location': 'Location of Past MI',
    'history_other': 'Other Medical History',
    'previous_hf_hospitalization': 'Previous HF Hospitalizations',
    'recent_hospitalization_dates': 'Recent Hospitalization Dates',
    'recent_hospitalization_reasons': 'Recent Hospitalization Reasons',
    'documented_vt_vf': 'Documented VT/VF',
    'complaints_syncope': 'Complaints of Syncope',
    'syncope_frequency': 'Syncope Frequency',
    'documented_pvcs': 'Documented PVCs',
    'pvc_count': 'PVC Count',
    'pvc_frequency': 'PVC Frequency',
    'documented_nsvt': 'Documented NSVT',
    'nsvt_frequency': 'NSVT Frequency',
    'weight': 'Weight (kg)',
    'unable_to_weigh': 'Unable to Weigh',
    'unable_to_weigh_reason': 'Reason for Not Weighing',
    'height': 'Height (cm)',
    'bmi': 'BMI',
    'heart_rate': 'Heart Rate (Bpm)',
    'heart_rate_regular': 'Regular Heart Rate',
    'heart_rate_irregular': 'Irregular Heart Rate',
    'respiratory_rate': 'Respiratory Rate',
    'oxygen_saturation': 'Oxygen Saturation (%)',
    'systolic_bp_sitting': 'Sitting BP (Systolic)',
    'diastolic_bp_sitting': 'Sitting BP (Diastolic)',
    'systolic_bp_standing': 'Standing BP (Systolic)',
    'diastolic_bp_standing': 'Standing BP (Diastolic)',
    'mental_status_alert_oriented': 'Alert & Oriented',
    'mental_status_confused': 'Confused Mental Status',
    'mental_status_drowsy': 'Drowsy Mental Status',
    'dyspnea_at_rest': 'Dyspnea at Rest',
    'dyspnea_with_exertion': 'Dyspnea with Exertion',
    'fatigue': 'Fatigue',
    'orthopnea': 'Orthopnea',
    'loss_of_appetite_bloating': 'Loss of Appetite / Bloating',
    'decreased_exercise_tolerance': 'Decreased Exercise Tolerance',
    'weight_gain': 'Weight Gain',
    'weight_loss': 'Weight Loss',
    'syncope': 'Syncope',
    'pnd': 'Paroxysmal Nocturnal Dyspnea',
    'muscle_cramps': 'Muscle Cramps',
    'wheeze': 'Wheeze',
    'giddiness': 'Giddiness',
    'symptom_other': 'Other Symptoms Present',
    'symptom_other_details': 'Other Symptoms Details',
    'peripheral_edema': 'Peripheral Edema',
    'ascites': 'Ascites',
    'rales': 'Rales',
    'jugular_venous_pressure': 'Elevated JVP',
    'hepatomegaly': 'Hepatomegaly',
    'clinical_sign_other': 'Other Signs Present',
    'clinical_sign_other_details': 'Other Signs Details',
    'nyhaClass': 'NYHA Functional Class',
    'nyha_class': 'NYHA Functional Class',
    'initial_nyha_class': 'NYHA Functional Class',
    'lvef': 'LVEF (%)'
  };

  const getFriendlyLabel = (key) => {
    if (FRIENDLY_LABELS[key]) return FRIENDLY_LABELS[key];
    const cleanKey = key.split('.').pop();
    const words = cleanKey.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim().split(/\s+/);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const FOLLOWUP_TABLE_REGEX = /^(stemi_followup|nstemi_followup|followup|followups|patient_followup_tasks)$/i;
  const FOLLOWUP_KEY_REGEX = /^(stemi_followup|nstemi_followup|followup|followups|patient_followup_tasks)(\[|\.|$)/i;
  const FOLLOWUP_SUFFIX_REGEX = /_(1m|3m|6m|12m|1month|3month|6month|12month)$/i;

  const flattenObject = (obj, prefix = '') => {
    const result = {};
    if (!obj || typeof obj !== 'object') return result;
    
    Object.keys(obj).forEach((key) => {
      if (FOLLOWUP_TABLE_REGEX.test(key) || FOLLOWUP_SUFFIX_REGEX.test(key)) {
        return;
      }
      const val = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      // Ignore internal system fields
      if ([
        'updated_at', 'created_at', 'id', 'hf_id', 'hfId', 'regPatientId', 'reg_patient_id', 
        'encounterId', 'created_by', 'updated_by', 'tempHfId', 'createdAt', 'updatedAt',
        'status', 'hfRegistryNo', 'hf_registry_no'
      ].includes(key)) {
        return;
      }
      
      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        Object.assign(result, flattenObject(val, newKey));
      } else {
        result[newKey] = val;
      }
    });
    
    return result;
  };

  const getFieldDiffClient = (oldData = {}, newData = {}) => {
    const diff = {};
    const prev = flattenObject(oldData || {});
    const curr = flattenObject(newData || {});
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(curr)]);

    const normalize = (val) => {
      if (val === null || val === undefined || val === '') return null;
      if (Array.isArray(val) && val.length === 0) return null;
      return val;
    };

    allKeys.forEach((key) => {
      if (FOLLOWUP_KEY_REGEX.test(key) || FOLLOWUP_SUFFIX_REGEX.test(key)) {
        return;
      }
      const oldValue = normalize(prev[key]);
      const newValue = normalize(curr[key]);

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        diff[key] = {
          from: oldValue,
          to: newValue
        };
      }
    });

    return diff;
  };

  const renderPreCalculatedDiff = (diffObj) => {
    const entries = Object.entries(diffObj);
    if (entries.length === 0) {
      return <div className="text-slate-400 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">No fields were modified.</div>;
    }

    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <th className="px-4 py-2">Field / Metric</th>
              <th className="px-4 py-2 text-rose-700">Previous Value</th>
              <th className="px-4 py-2 text-emerald-700">New Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {entries.map(([fieldName, change]) => {
              const fromValue = change?.from !== undefined && change?.from !== null ? String(change.from) : 'None';
              const toValue = change?.to !== undefined && change?.to !== null ? String(change.to) : 'None';
              const label = getFriendlyLabel(fieldName);

              return (
                <tr key={fieldName} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{label}</td>
                  <td className="px-4 py-2.5 text-rose-700 bg-rose-50/5 font-mono text-[11px]">{fromValue}</td>
                  <td className="px-4 py-2.5 text-emerald-700 bg-emerald-50/5 font-mono text-[11px]">{toValue}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAuditDiff = (log) => {
    let oldData = {};
    let newData = {};

    // 1. Try extracting from log.previous_values and log.new_values
    if (log.previous_values) {
      try {
        oldData = typeof log.previous_values === 'string' ? JSON.parse(log.previous_values) : log.previous_values;
      } catch (e) {
        oldData = log.previous_values || {};
      }
    }
    if (log.new_values) {
      try {
        newData = typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values;
      } catch (e) {
        newData = log.new_values || {};
      }
    }

    // 2. Fallback to parse changed_fields payload if oldData/newData are empty
    if (Object.keys(oldData).length === 0 && Object.keys(newData).length === 0 && log.changed_fields) {
      try {
        const parsed = typeof log.changed_fields === 'string' ? JSON.parse(log.changed_fields) : log.changed_fields;
        
        if (parsed) {
          if (parsed.previous !== undefined || parsed.new !== undefined) {
            oldData = parsed.previous || {};
            newData = parsed.new || {};
          } else if (parsed.previous_values !== undefined || parsed.new_values !== undefined) {
            oldData = parsed.previous_values || {};
            newData = parsed.new_values || {};
          } else if (parsed.old_data !== undefined || parsed.new_data !== undefined) {
            oldData = parsed.old_data || {};
            newData = parsed.new_data || {};
          } else {
            // Check if it's a pre-calculated diff like { field: { from: X, to: Y } }
            const firstKey = Object.keys(parsed)[0];
            if (firstKey && (parsed[firstKey]?.from !== undefined || parsed[firstKey]?.to !== undefined)) {
              return renderPreCalculatedDiff(parsed);
            }
            newData = parsed;
          }
        }
      } catch (e) {
        return <span className="text-slate-700 font-mono text-xs">{String(log.changed_fields)}</span>;
      }
    }

    // If both oldData and newData are empty, return placeholder
    if (Object.keys(oldData).length === 0 && Object.keys(newData).length === 0) {
      return <span className="text-slate-500 italic text-xs">No details available</span>;
    }

    const diff = getFieldDiffClient(oldData, newData);
    return renderPreCalculatedDiff(diff);
  };

  const fetchAuditLogs = async () => {
    const targetId = regPatientId || hfId;
    if (!targetId) return;
    setLoading(true);
    setError('');
    try {
      const endpoint = regPatientId ? `/hf-registry/patient/${regPatientId}/audit` : `/hf-registry/${hfId}/audit`;
      const response = await api.get(endpoint);
      if (response.data && response.data.success) {
        setAuditLogs(response.data.data || []);
      } else {
        setError(response.data?.message || 'Failed to fetch audit logs.');
      }
    } catch (err) {
      console.error('Error fetching audit log:', err);
      setError(err.response?.data?.message || 'Failed to load audit history.');
    } finally {
      setLoading(false);
    }
  };

  const currentUser = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  })();
  const isAuthorizedForAudit = currentUser?.role_id === 1 || String(currentUser?.role || currentUser?.role_name || '').toUpperCase() === 'ADMIN';

  useEffect(() => {
    if ((isOpen || isInline) && (regPatientId || hfId) && isAuthorizedForAudit) {
      fetchAuditLogs();
    }
  }, [isOpen, isInline, hfId, regPatientId, isAuthorizedForAudit]);

  if (!isAuthorizedForAudit) return null;
  if (!isOpen && !isInline) return null;

  const renderDataBlock = (data) => {
    if (!data) return <span className="text-slate-400 italic">None</span>;
    if (typeof data === 'object') {
      return (
        <pre className="text-[11px] font-mono bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto max-h-40">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    }
    try {
      const parsed = JSON.parse(data);
      return (
        <pre className="text-[11px] font-mono bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto max-h-40">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return <span className="text-xs text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded inline-block">{String(data)}</span>;
    }
  };

  const getBadgeColor = (actionType) => {
    switch (actionType) {
      case 'CREATE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'UPDATE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getActionLabel = (actionType) => {
    switch (actionType) {
      case 'CREATE':
        return 'Form Submitted';
      case 'UPDATE':
        return 'Form Updated';
      case 'DELETE':
        return 'Form Deleted';
      default:
        return actionType;
    }
  };

  const content = (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>Fetching audit entries...</span>
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
          No audit entries recorded for this record yet.
        </div>
      ) : (
        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div
              key={log.audit_id}
              className="bg-slate-50 rounded-xl border border-slate-200 p-4 transition-all hover:border-slate-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${getBadgeColor(log.action_type)}`}>
                    {getActionLabel(log.action_type)}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    {log.username}
                  </span>
                  {log.email && (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {log.email}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formatDateTimeForDisplay(log.timestamp)}
                </div>
              </div>

              <div className="mt-2 space-y-2">
                {log.action_type === 'DELETE' && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs flex flex-col gap-1.5 mb-2 shadow-xs">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Form Deleted</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Heart Failure registry entry #{log.hf_id} was removed from the database by {log.username} ({log.email || 'N/A'}).
                    </p>
                  </div>
                )}
                {log.action_type === 'CREATE' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex flex-col gap-1.5 mb-2 shadow-xs">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Form Submitted</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Initial clinical Heart Failure assessment form for patient {log.patient_name || 'N/A'} (MRN: {log.mr_no || 'N/A'}) was submitted by {log.username} ({log.email || 'N/A'}).
                    </p>
                  </div>
                )}
                {log.action_type === 'UPDATE' && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                      <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      Modified Fields Difference Log
                    </div>
                    {renderAuditDiff(log)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (isInline) {
    return (
      <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50/50 p-4 rounded-xl border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Audit Revision Log (HF #{hfId})</span>
          </div>
          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 rounded-lg border border-blue-500/30">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Immutable Audit Log</h3>
              <p className="text-xs text-slate-400">HF Registry ID: #{hfId} Revision Timeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAuditLogs}
              disabled={loading}
              title="Refresh Audit Log"
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {content}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
}
