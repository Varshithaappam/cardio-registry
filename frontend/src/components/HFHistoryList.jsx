import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, Loader2, ArrowUpRight, Trash2, Play, RotateCcw } from 'lucide-react';
import api from '../../api/axios';

import { formatDateForDisplay, formatDateTimeForDisplay } from '../utils/dateUtils';

import { useAlert } from '../context/AlertContext';

export default function HFHistoryList({ regPatientId, patientName, onEditEventClick, isReadOnly = false }) {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUserRole = (sessionStorage.getItem('userRole') || 'CLINICIAN').toUpperCase();
  const canDelete = ['ADMIN', 'CLINICIAN'].includes(currentUserRole) && !isReadOnly;

  const fetchHistory = async () => {
    if (!regPatientId) return;
    try {
      setLoading(true);
      const res = await api.get(`/hf/history/${regPatientId}`);
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
  }, [regPatientId]);

  const handleDeleteRecord = async (hfId, registryNo) => {
    const isConfirmed = await showConfirm({
      type: 'delete',
      title: 'Delete HF Record?',
      message: `Are you sure you want to soft-delete HF Registry Record ${registryNo || '#' + hfId}? This record will become read-only and archived.`,
      confirmText: 'Delete Record',
      cancelText: 'Cancel'
    });

    if (!isConfirmed) return;

    try {
      const res = await api.delete(`/hf-registry/${hfId}`);
      if (res.data && res.data.success) {
        await showAlert({
          type: 'success',
          title: 'Record Deleted',
          message: 'HF Registry record soft-deleted successfully.'
        });
        fetchHistory();
      } else {
        showAlert({
          type: 'danger',
          title: 'Delete Failed',
          message: res.data?.message || 'Failed to soft-delete record.'
        });
      }
    } catch (err) {
      console.error('Soft delete error:', err);
      showAlert({
        type: 'danger',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to soft-delete HF Registry record.'
      });
    }
  };

  const handleUndeleteRecord = async (hfId, registryNo) => {
    const isConfirmed = await showConfirm({
      type: 'info',
      title: 'Restore HF Record?',
      message: `Are you sure you want to restore HF Registry Record ${registryNo || '#' + hfId}? It will be reactivated for editing.`,
      confirmText: 'Restore Record',
      cancelText: 'Cancel'
    });

    if (!isConfirmed) return;

    try {
      const res = await api.patch(`/hf-registry/${hfId}/undelete`);
      if (res.data && res.data.success) {
        await showAlert({
          type: 'success',
          title: 'Record Restored',
          message: 'HF Registry record restored successfully.'
        });
        fetchHistory();
      } else {
        showAlert({
          type: 'danger',
          title: 'Restore Failed',
          message: res.data?.message || 'Failed to restore record.'
        });
      }
    } catch (err) {
      console.error('Undelete error:', err);
      showAlert({
        type: 'danger',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to restore HF Registry record.'
      });
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
          const isDraftRecord = (record.status === 'draft' || record.status === 'DRAFT' || record.is_draft === true) && record.status !== 'final' && record.status !== 'COMPLETED';
          return (
            <div
              key={record.hf_id}
              className={`flex items-center justify-between p-3 ${isDraftRecord ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-100'} border rounded-lg hover:border-slate-300 transition-all animate-fadeIn`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${isDraftRecord ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-teal-50 text-teal-700 border-teal-100'} flex items-center justify-center text-xs font-bold border`}>
                  #{encounterNum}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">
                    {record.assessment_date ? formatDateForDisplay(record.assessment_date) : 'N/A'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {record.hf_registry_no}
                    </span>
                    {(record.patient_name || patientName) && (
                      <span className="text-xs font-semibold text-slate-600">
                        • {record.patient_name || patientName}
                      </span>
                    )}
                    {isDraftRecord && !isDeletedRecord && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold rounded-md uppercase flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                        <span>Draft</span>
                      </span>
                    )}
                    {isDeletedRecord && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 text-[10px] font-extrabold rounded-md uppercase">
                        Deleted
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/hf-form/view/${record.hf_id}`)}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200 shadow-xs"
                >
                  <span>View Form</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {isDeletedRecord ? (
                  <>
                    <button
                      disabled
                      className="px-2.5 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-not-allowed opacity-60"
                      title="Cannot edit a deleted record. Restore it first."
                    >
                      <span>Edit Form</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleUndeleteRecord(record.hf_id, record.hf_registry_no)}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                        title="Restore / Undelete HF Record"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Undelete</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {isDraftRecord && (
                      <button
                        disabled={isReadOnly}
                        onClick={isReadOnly ? undefined : () => onEditEventClick ? onEditEventClick(record.hf_id) : navigate(`/patient/${regPatientId}/edit?formType=HF&hf_id=${record.hf_id}`)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all ${
                          isReadOnly
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                            : 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer border border-amber-600'
                        }`}
                        title={isReadOnly ? 'Editing is disabled for Inactive/Deceased patients.' : 'Resume Form Filling'}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume Form Filling</span>
                      </button>
                    )}

                    {!isDraftRecord && onEditEventClick && (
                      <button
                        disabled={isReadOnly}
                        onClick={isReadOnly ? undefined : () => onEditEventClick(record.hf_id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                          isReadOnly
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                            : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
                        }`}
                        title={isReadOnly ? 'Editing is disabled for Inactive/Deceased patients.' : 'Edit Form'}
                      >
                        <span>Edit Form</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteRecord(record.hf_id, record.hf_registry_no)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Soft Delete HF Record"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Delete</span>
                      </button>
                    )}
                  </>
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
