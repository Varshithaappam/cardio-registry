import React from 'react';
import { RotateCw, RotateCcw, Trash2, Shield, Clock, UserCheck } from 'lucide-react';

/**
 * AuditTimeline Component
 * Renders an immutable timeline of system_audit_log records matching the CARE HEALTH SYSTEM portal design.
 *
 * @param {Array} logs - Array of audit log objects fetched from backend system_audit_log table
 * @param {string} patientMr - Patient MR number (e.g., 'MR6243')
 * @param {string} patientName - Patient full name (e.g., 'John Doe')
 */
export default function AuditTimeline({ logs = [], patientMr = 'MR6243', patientName = '' }) {

  // Helper to format ISO/database timestamp in Indian Standard Time (Asia/Kolkata)
  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    try {
      const str = String(ts).trim();
      
      // Parse ISO or DB date string "YYYY-MM-DDTHH:mm:ss" or "YYYY-MM-DD HH:mm:ss"
      const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
      if (match) {
        const [, y, m, d, hh, mm] = match;
        let hours = parseInt(hh, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const formattedHour = String(hours).padStart(2, '0');
        return `${d}-${m}-${y}, ${formattedHour}:${mm} ${ampm}`;
      }

      // Fallback for Date objects or timestamps
      const dObj = new Date(ts);
      if (isNaN(dObj.getTime())) return str;

      const day = String(dObj.getDate()).padStart(2, '0');
      const month = String(dObj.getMonth() + 1).padStart(2, '0');
      const year = dObj.getFullYear();
      let hours = dObj.getHours();
      const minutes = String(dObj.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;

      return `${day}-${month}-${year}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    } catch {
      return String(ts);
    }
  };

  // Helper to safely parse changed_fields or compare previous/new value objects
  const parseChangedFields = (log) => {
    if (!log) return [];
    const changedFields = log.changed_fields;
    let list = [];

    if (Array.isArray(changedFields)) {
      list = changedFields;
    } else if (changedFields) {
      try {
        const parsed = typeof changedFields === 'string' ? JSON.parse(changedFields) : changedFields;
        if (Array.isArray(parsed)) {
          list = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (parsed.previous !== undefined || parsed.new !== undefined) {
            list = [{ field: 'Record Details', previous: parsed.previous, new: parsed.new }];
          }
        }
      } catch {}
    }

    // Fallback: If list is empty but previous_values and new_values exist, compute diff dynamically
    if (list.length === 0 && (log.previous_values || log.new_values)) {
      try {
        const prevObj = typeof log.previous_values === 'string' ? JSON.parse(log.previous_values) : (log.previous_values || {});
        const newObj = typeof log.new_values === 'string' ? JSON.parse(log.new_values) : (log.new_values || {});

        if (prevObj && newObj && typeof prevObj === 'object' && typeof newObj === 'object') {
          const allKeys = new Set([...Object.keys(prevObj), ...Object.keys(newObj)]);
          const excluded = new Set([
            'id', 'created_at', 'updated_at', 'stemi_id', 'nstemi_id', 'hf_id',
            'patient_id', 'reg_patient_id', 'status', 'is_deleted', 'created_by', 'updated_by'
          ]);

          for (const k of allKeys) {
            if (excluded.has(k.toLowerCase()) || k.startsWith('appr_')) continue;
            const p = prevObj[k];
            const n = newObj[k];
            if (typeof p === 'object' || typeof n === 'object') continue;

            const pStr = p === null || p === undefined ? '' : String(p).trim();
            const nStr = n === null || n === undefined ? '' : String(n).trim();

            if (pStr !== nStr && (pStr !== '' || nStr !== '')) {
              list.push({
                field: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                previous: p !== null && p !== undefined ? String(p) : '—',
                new: n !== null && n !== undefined ? String(n) : '—'
              });
            }
          }
        }
      } catch {}
    }

    return list;
  };

  // Action badge renderer
  const renderActionBadge = (actionType) => {
    const action = String(actionType).toUpperCase();
    if (action === 'UPDATE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs rounded-full shadow-2xs">
          <RotateCw className="w-3.5 h-3.5 text-amber-700" />
          <span>Update</span>
        </span>
      );
    }
    if (action === 'DELETE' || action === 'DELETION') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 border border-rose-300 text-rose-800 font-bold text-xs rounded-full shadow-2xs">
          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          <span>Deletion</span>
        </span>
      );
    }
    if (action === 'RESTORE' || action === 'RESTORED' || action === 'UNDELETE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 border border-teal-300 text-teal-800 font-bold text-xs rounded-full shadow-2xs">
          <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
          <span>Restored</span>
        </span>
      );
    }
    // Default to CREATE / Creation
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-full shadow-2xs">
        <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
        <span>Creation</span>
      </span>
    );
  };

  // Format record description text based on registry_type and action_type
  const renderDescriptionText = (log) => {
    const regType = String(log.registry_type || 'Registry').toUpperCase();
    const action = String(log.action_type || '').toUpperCase();
    const recId = log.record_identifier || log.record_id || '—';
    const user = log.username || log.user_id || 'User';

    if (action === 'CREATE') {
      if (regType === 'HF') {
        return <span className="font-bold text-slate-800">Heart Failure (HF) Record ID: {recId} Created</span>;
      }
      return <span className="font-bold text-slate-800">{regType} Record created with IP No: {recId}</span>;
    }

    if (action === 'DELETE' || action === 'DELETION') {
      return <span className="font-bold text-rose-700">{regType} Record (IP No: {recId}) has been Deleted</span>;
    }

    if (action === 'RESTORE' || action === 'RESTORED' || action === 'UNDELETE') {
      return <span className="font-bold text-teal-700">{user} restored the {regType} Record ({recId})</span>;
    }

    if (action === 'UPDATE') {
      if (regType === 'HF') {
        return <span className="font-bold text-slate-800">Heart Failure (HF) Record ID: {recId} Updated</span>;
      }
      return <span className="font-bold text-slate-800">{regType} Record (IP No: {recId}) Updated</span>;
    }

    return <span className="font-bold text-slate-800">{user} performed {action} on {regType} Record ({recId})</span>;
  };

  return (
    <div className="w-full bg-white text-slate-800 p-5 sm:p-6 rounded-2xl border border-purple-200/80 shadow-sm space-y-5 font-sans">
      
      {/* Timeline Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-4">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-purple-950 flex flex-wrap items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600 inline-block" />
            <span>CHRONOLOGICAL EVENT TIMELINE</span>
            <span className="text-purple-700/80 font-normal normal-case">
              ({patientName ? `Patient: ${patientName} • ` : ''}MR No: {patientMr})
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable record of modifications, creations, and deletions.
          </p>
        </div>
      </div>

      {/* Cards List Container */}
      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-purple-200 rounded-xl bg-purple-50/30">
            <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No Audit Trail Records Found</p>
            <p className="text-[11px] text-slate-500 mt-1">Actions performed on patient registries will be logged here automatically.</p>
          </div>
        ) : (
          logs.map((log, index) => {
            const parsedChanges = parseChangedFields(log);
            const username = log.username || log.user_id || 'User';
            const isUpdate = String(log.action_type).toUpperCase() === 'UPDATE';

            return (
              <div
                key={log.audit_id || index}
                className="bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-xl p-4 transition-all duration-150 shadow-2xs space-y-3"
              >
                {/* Header Row: Timestamp, Action Badge, Description, User */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    
                    {/* Timestamp in IST */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-900 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>

                    {/* Action Badge */}
                    <div className="shrink-0">
                      {renderActionBadge(log.action_type)}
                    </div>

                    {/* Description Title */}
                    <div className="text-xs text-slate-800 font-semibold">
                      {renderDescriptionText(log)}
                    </div>
                  </div>

                  {/* Right Side: User Label */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold shrink-0 self-end md:self-center bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>User: {username}</span>
                  </div>
                </div>

                {/* UPDATE Action: Clean Styled Table for Modified Fields */}
                {isUpdate && parsedChanges.length > 0 && (
                  <div className="overflow-hidden rounded-lg border border-purple-200/80 bg-white shadow-2xs mt-2">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-purple-50/90 border-b border-purple-100 text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                          <th className="py-2.5 px-3.5">Field Modified</th>
                          <th className="py-2.5 px-3.5">Previous Value</th>
                          <th className="py-2.5 px-3.5">New Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-50/60 text-slate-800">
                        {parsedChanges.map((change, cIdx) => (
                          <tr key={cIdx} className="hover:bg-purple-50/30 transition-colors">
                            <td className="py-2 px-3.5 font-semibold text-slate-800">
                              {change.field}
                            </td>
                            <td className="py-2 px-3.5">
                              <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 font-mono text-[11px]">
                                {change.previous !== null && change.previous !== undefined ? String(change.previous) : '—'}
                              </span>
                            </td>
                            <td className="py-2 px-3.5">
                              <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono text-[11px] font-bold">
                                {change.new !== null && change.new !== undefined ? String(change.new) : '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="pt-2 text-center border-t border-purple-100">
        <p className="text-[11px] text-slate-500 font-medium">
          CARE Clinical Registry Portal • Fully verified according to standard guidelines & medical data quality practices.
        </p>
      </div>
    </div>
  );
}


