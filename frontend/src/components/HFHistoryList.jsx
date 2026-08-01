import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, Loader2, ArrowUpRight, Trash2 } from 'lucide-react';
import api from '../../api/axios';

export default function HFHistoryList({ patientId, onEditEventClick }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUserRole = (localStorage.getItem('userRole') || 'CLINICIAN').toUpperCase();
  const canDelete = ['ADMIN', 'CLINICIAN'].includes(currentUserRole);

  const fetchHistory = async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      const res = await api.get(`/hf/history/${patientId}`);
      if (res.data && res.data.success) {
        setHistory(res.data.data);
      } else {
        throw new Error(res.data?.message || 'Failed to retrieve history');
      }
    } catch (err) {
      console.error('Error fetching HF history list:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [patientId]);

  const handleDeleteRecord = async (hfId, registryNo) => {
    if (!window.confirm(`Are you sure you want to soft-delete HF Registry Record ${registryNo || '#' + hfId}? This record will become read-only and archived.`)) {
      return;
    }
    try {
      const res = await api.delete(`/hf-registry/${hfId}`);
      if (res.data && res.data.success) {
        alert('HF Registry record soft-deleted successfully.');
        fetchHistory();
      } else {
        alert(res.data?.message || 'Failed to soft-delete record.');
      }
    } catch (err) {
      console.error('Soft delete error:', err);
      alert(err.response?.data?.message || 'Failed to soft-delete HF Registry record.');
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500 mb-2" />
        <p className="text-xs text-slate-400">Loading HF assessment history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
        <p className="text-red-400 text-xs font-bold mb-2">History Load Error</p>
        <p className="text-[11px] text-slate-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
        <Calendar className="w-4 h-4 text-teal-600" /> HF Encounter History ({history.length})
      </h3>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {history.map((record, index) => {
          const encounterNum = history.length - index;
          const isDeletedRecord = record.is_deleted === 1 || record.is_deleted === true;
          return (
            <div
              key={record.hf_id}
              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-slate-200 hover:bg-slate-100/30 transition-all animate-fadeIn"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 text-xs font-bold border border-teal-100">
                  #{encounterNum}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">
                    {record.assessment_date ? new Date(record.assessment_date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'N/A'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">
                      {record.hf_registry_no}
                    </span>
                    {isDeletedRecord && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 text-[10px] font-extrabold rounded-md uppercase">
                        Deleted (Read-Only)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/hf-form/view/${record.hf_id}`)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                >
                  <span>View Form</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
                {onEditEventClick && !isDeletedRecord && (
                  <button
                    onClick={() => onEditEventClick(record.hf_id)}
                    className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Edit Form</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {canDelete && !isDeletedRecord && (
                  <button
                    onClick={() => handleDeleteRecord(record.hf_id, record.hf_registry_no)}
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Soft Delete HF Record"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {history.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-xs italic">
            No historical HF encounters found for this patient.
          </div>
        )}
      </div>
    </div>
  );
}
