import React, { useState, useEffect } from 'react';
import { Shield, Clock, User, FileText, X, RefreshCw, AlertCircle, Mail } from 'lucide-react';
import api from '../../api/axiosInstance';

export default function AuditLogViewer({ hfId, patientId, isOpen = true, onClose, isInline = false }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAuditLogs = async () => {
    const targetId = patientId || hfId;
    if (!targetId) return;
    setLoading(true);
    setError('');
    try {
      const endpoint = patientId ? `/hf-registry/patient/${patientId}/audit` : `/hf-registry/${hfId}/audit`;
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

  useEffect(() => {
    if ((isOpen || isInline) && (patientId || hfId)) {
      fetchAuditLogs();
    }
  }, [isOpen, isInline, hfId, patientId]);

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
                    {log.action_type}
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
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="mt-2 space-y-2">
                {log.action_type === 'DELETE' && (
                  <div className="p-2.5 bg-red-100 border border-red-300 text-red-900 rounded-lg text-xs font-semibold flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>
                      Soft-Deleted HF Record #{log.hf_id} on {new Date(log.timestamp).toLocaleString()} by {log.username} ({log.email || 'N/A'})
                    </span>
                  </div>
                )}
                {log.previous_values && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <FileText className="w-3 h-3 text-red-500" />
                      Previous Values
                    </div>
                    {renderDataBlock(log.previous_values)}
                  </div>
                )}

                {log.new_values && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <FileText className="w-3 h-3 text-emerald-500" />
                      New Values
                    </div>
                    {renderDataBlock(log.new_values)}
                  </div>
                )}

                {!log.previous_values && !log.new_values && log.changed_fields && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <FileText className="w-3 h-3" />
                      Changed Fields / Payload
                    </div>
                    {renderDataBlock(log.changed_fields)}
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
