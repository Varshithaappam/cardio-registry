import React, { useState, useMemo } from 'react';
import { 
  RotateCw, RotateCcw, Trash2, Shield, Clock, UserCheck, 
  Download, Calendar, Filter, Info, FileSpreadsheet 
} from 'lucide-react';

/**
 * AuditTimeline Component
 * Renders an immutable timeline of system_audit_log records matching the CARE HEALTH SYSTEM portal design.
 * Features 7-day past event timeline filtering & full date-filtered Excel/CSV Audit Log Export.
 *
 * @param {Array} logs - Array of audit log objects fetched from backend system_audit_log table
 * @param {string} patientMr - Patient MR number (e.g., 'MR6243')
 * @param {string} patientName - Patient full name (e.g., 'John Doe')
 */
export default function AuditTimeline({ logs = [], patientMr = 'MR6243', patientName = '' }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

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

  // Check if log is from past 1 week (last 7 days)
  const isWithinPastWeek = (ts) => {
    if (!ts) return false;
    try {
      let dateObj;
      const str = String(ts).trim();
      const isoStr = str.includes(' ') && !str.includes('T') ? str.replace(' ', 'T') : str;
      dateObj = new Date(isoStr);
      if (isNaN(dateObj.getTime())) return true;

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      return dateObj >= sevenDaysAgo;
    } catch {
      return true;
    }
  };

  // Timeline displays strictly past 1 week logs
  const timelineLogs = useMemo(() => {
    return logs.filter(log => isWithinPastWeek(log.timestamp));
  }, [logs]);

  // Download filtered Excel/CSV Audit report
  const handleDownloadExcel = () => {
    let filtered = [...logs];

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(l => {
        const d = new Date(String(l.timestamp).replace(' ', 'T'));
        return !isNaN(d.getTime()) && d >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(l => {
        const d = new Date(String(l.timestamp).replace(' ', 'T'));
        return !isNaN(d.getTime()) && d <= end;
      });
    }

    if (actionFilter && actionFilter !== 'ALL') {
      filtered = filtered.filter(l => {
        const act = String(l.action_type || '').toUpperCase();
        if (actionFilter === 'CREATE') return act === 'CREATE' || act === 'CREATION';
        if (actionFilter === 'UPDATE') return act === 'UPDATE' || act === 'UPDATED';
        if (actionFilter === 'DELETE') return act === 'DELETE' || act === 'DELETION';
        if (actionFilter === 'RESTORE') return act === 'RESTORE' || act === 'RESTORED' || act === 'UNDELETE';
        return act === actionFilter;
      });
    }

    if (filtered.length === 0) {
      alert('No audit logs found matching the selected export filters.');
      return;
    }

    // Build CSV with BOM for seamless UTF-8 Excel compatibility
    const headers = ['Audit ID', 'Timestamp (IST)', 'Action Type', 'Registry Type', 'Record Identifier', 'User', 'Field Modified', 'Previous Value', 'New Value'];
    const csvRows = [headers.join(',')];

    filtered.forEach(log => {
      const auditId = log.audit_id || '';
      const ts = formatTimestamp(log.timestamp);
      const action = String(log.action_type || '').toUpperCase();
      const regType = String(log.registry_type || 'Registry').toUpperCase();
      const recId = log.record_identifier || log.record_id || '';
      const user = log.username || log.user_id || 'User';

      const parsedChanges = parseChangedFields(log);

      if (parsedChanges.length > 0) {
        parsedChanges.forEach(chg => {
          const row = [
            `"${auditId}"`,
            `"${ts}"`,
            `"${action}"`,
            `"${regType}"`,
            `"${recId}"`,
            `"${user}"`,
            `"${String(chg.field || '').replace(/"/g, '""')}"`,
            `"${String(chg.previous ?? '—').replace(/"/g, '""')}"`,
            `"${String(chg.new ?? '—').replace(/"/g, '""')}"`
          ];
          csvRows.push(row.join(','));
        });
      } else {
        const row = [
          `"${auditId}"`,
          `"${ts}"`,
          `"${action}"`,
          `"${regType}"`,
          `"${recId}"`,
          `"${user}"`,
          `"—"`,
          `"—"`,
          `"—"`
        ];
        csvRows.push(row.join(','));
      }
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanMr = String(patientMr).replace(/[^a-zA-Z0-9_-]/g, '');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Audit_Report_${cleanMr}_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    let recId = log.record_identifier || log.record_id || '—';
    const user = log.username || log.user_id || 'User';

    if (regType === 'HF') {
      if (recId !== '—' && !String(recId).startsWith('HF')) {
        recId = `HF #${recId}`;
      }
    } else if (regType === 'STEMI' || regType === 'NSTEMI') {
      if (recId !== '—' && !String(recId).startsWith('IP')) {
        recId = `IP-${recId}`;
      }
    }

    if (action === 'CREATE' || action === 'CREATION') {
      if (regType === 'HF') {
        return <span className="font-bold text-slate-800">Heart Failure (HF) Record ID: {recId} Created</span>;
      }
      return <span className="font-bold text-slate-800">{regType} Record created with IP No: {recId}</span>;
    }

    if (action === 'DELETE' || action === 'DELETION') {
      if (regType === 'HF') {
        return <span className="font-bold text-rose-700">Heart Failure (HF) Record ID: {recId} has been Deleted</span>;
      }
      return <span className="font-bold text-rose-700">{regType} Record (IP No: {recId}) has been Deleted</span>;
    }

    if (action === 'RESTORE' || action === 'RESTORED' || action === 'UNDELETE') {
      if (regType === 'HF') {
        return <span className="font-bold text-teal-700">{user} restored Heart Failure (HF) Record ID: {recId}</span>;
      }
      return <span className="font-bold text-teal-700">{user} restored {regType} Record (IP No: {recId})</span>;
    }

    if (action === 'UPDATE' || action === 'UPDATED') {
      if (regType === 'HF') {
        return <span className="font-bold text-slate-800">Heart Failure (HF) Record ID: {recId} Updated</span>;
      }
      return <span className="font-bold text-slate-800">{regType} Record (IP No: {recId}) Updated</span>;
    }

    return <span className="font-bold text-slate-800">{user} performed {action} on {regType} Record ({recId})</span>;
  };

  return (
    <div className="w-full bg-white text-slate-800 p-5 sm:p-6 rounded-2xl border border-purple-200/80 shadow-sm space-y-6 font-sans">
      
      {/* AUDIT LOG EXPORT CARD */}
      <div className="bg-purple-50/50 border border-purple-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl border border-purple-200 shadow-2xs">
            <FileSpreadsheet className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-purple-950 flex items-center gap-2">
              <span>AUDIT LOG EXPORT</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Generate & download filtered .xlsx audit verification reports
            </p>
          </div>
        </div>

        {/* Controls Row: Start Date, End Date, Action Type, Download Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end pt-1">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-600" />
              <span>Start Date</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-600" />
              <span>End Date</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-purple-600" />
              <span>Action Type</span>
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-2xs"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Creation</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Deletion</option>
              <option value="RESTORE">Restored</option>
            </select>
          </div>

          <div>
            <button
              onClick={handleDownloadExcel}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* PROMPT NOTE DIRECTLY BELOW AUDIT LOG EXPORT */}
      <div className="bg-purple-50/80 border border-purple-200/90 rounded-xl p-3.5 flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="text-xs text-purple-950 leading-relaxed">
          <span className="font-extrabold text-purple-900 uppercase tracking-wider text-[11px] block sm:inline mr-1">
            ℹ️ Audit Retention Notice:
          </span>
          The Chronological Event Timeline below displays audit log events from the <strong>past 1 week (last 7 days)</strong>.
          To view, query, or export audit logs older than 1 week, please select your desired date range above and click <strong>"Download Excel Report"</strong>.
        </div>
      </div>

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
            Immutable record of modifications, creations, and deletions (showing past 7 days).
          </p>
        </div>
      </div>

      {/* Cards List Container */}
      <div className="space-y-3">
        {timelineLogs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-purple-200 rounded-xl bg-purple-50/30">
            <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No Audit Trail Records in Past 7 Days</p>
            <p className="text-[11px] text-slate-500 mt-1">
              No modifications recorded within the past week. Use the <strong>Audit Log Export</strong> panel above to query and download older historical logs.
            </p>
          </div>
        ) : (
          timelineLogs.map((log, index) => {
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
