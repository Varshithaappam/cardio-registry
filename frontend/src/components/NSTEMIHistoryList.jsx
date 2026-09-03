import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Loader2, ArrowUpRight, Trash2, Play, RotateCcw } from 'lucide-react';
import api from '../../api/axios';
import { formatDateForDisplay, formatDateTimeForDisplay } from '../utils/dateUtils';

export default function NSTEMIHistoryList({ regPatientId, patientName, onEditEventClick, isReadOnly = false }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUserRole = (sessionStorage.getItem('userRole') || 'CLINICIAN').toUpperCase();
  const canDelete = ['ADMIN', 'CLINICIAN'].includes(currentUserRole) && !isReadOnly;

  const fetchHistory = async () => {
    if (!regPatientId) return;
    try {
      setLoading(true);
      const res = await api.get(`/nstemi/history/${regPatientId}`);
      if (res.data && res.data.success) {
        setHistory(res.data.data);
      } else {
        throw new Error(res.data?.message || 'Failed to retrieve NSTEMI history');
      }
    } catch (err) {
      console.error('Error fetching NSTEMI history list:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [regPatientId]);

  const handleDeleteRecord = async (nstemiId, registryNo) => {
    if (!window.confirm(`Are you sure you want to soft-delete NSTEMI Registry Record ${registryNo || '#' + nstemiId}? This record will become read-only and archived.`)) {
      return;
    }
    try {
      const res = await api.delete(`/nstemi/${nstemiId}`);
      if (res.data && res.data.success) {
        alert('NSTEMI Registry record soft-deleted successfully.');
        fetchHistory();
      } else {
        alert(res.data?.message || 'Failed to soft-delete record.');
      }
    } catch (err) {
      console.error('Soft delete error:', err);
      alert(err.response?.data?.message || 'Failed to soft-delete NSTEMI Registry record.');
    }
  };

  const handleUndeleteRecord = async (nstemiId, registryNo) => {
    if (!window.confirm(`Are you sure you want to restore NSTEMI Registry Record ${registryNo || '#' + nstemiId}? It will be reactivated for editing.`)) {
      return;
    }
    try {
      const res = await api.patch(`/nstemi/${nstemiId}/undelete`);
      if (res.data && res.data.success) {
        alert('NSTEMI Registry record restored successfully.');
        fetchHistory();
      } else {
        alert(res.data?.message || 'Failed to restore record.');
      }
    } catch (err) {
      console.error('Undelete error:', err);
      alert(err.response?.data?.message || 'Failed to restore NSTEMI Registry record.');
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500 mb-2" />
        <p className="text-xs text-slate-400">Loading NSTEMI assessment history...</p>
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
        <Calendar className="w-4 h-4 text-orange-600" /> NSTEMI Encounter History ({history.length})
      </h3>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {history.map((record, index) => {
          const encounterNum = history.length - index;
          const isDeletedRecord = record.status === 1 || record.status === 'deleted' || record.is_deleted === 1 || record.is_deleted === true;
          const isDraftRecord = (record.status === 2 || record.status === 'draft') && !isDeletedRecord;
          
          return (
            <div
              key={record.nstemi_id}
              className={`flex items-center justify-between p-3 ${isDraftRecord ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-100'} border rounded-lg hover:border-slate-300 transition-all animate-fadeIn`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${isDraftRecord ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-orange-50 text-orange-700 border-orange-100'} flex items-center justify-center text-xs font-bold border`}>
                  #{encounterNum}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">
                    {record.admission_date ? formatDateForDisplay(record.admission_date) : 'N/A'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {record.acs_no || record.ip_no || `ID: ${record.nstemi_id}`}
                    </span>
                    {(record.patient_name || patientName) && (
                      <span className="text-xs font-semibold text-slate-600">
                        • {record.patient_name || patientName}
                      </span>
                    )}
                    {isDraftRecord && !isDeletedRecord && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold rounded-md uppercase flex items-center gap-1 shadow-xs animate-pulse">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
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
                  onClick={() => navigate(`/patient/${regPatientId}/view/${record.nstemi_id}?formType=NSTEMI`, { state: { from: `/patient/${regPatientId}` } })}
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
                        onClick={() => handleUndeleteRecord(record.nstemi_id, record.acs_no || record.ip_no)}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                        title="Restore / Undelete NSTEMI Record"
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
                        onClick={isReadOnly ? undefined : () => navigate(`/patient/${regPatientId}/edit/${record.nstemi_id}?formType=NSTEMI`)}
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
     
                    {!isDraftRecord && (
                      <button
                        disabled={isReadOnly}
                        onClick={isReadOnly ? undefined : () => navigate(`/patient/${regPatientId}/edit/${record.nstemi_id}?formType=NSTEMI`)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                          isReadOnly
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                            : 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer'
                        }`}
                        title={isReadOnly ? 'Editing is disabled for Inactive/Deceased patients.' : 'Edit Form'}
                      >
                        <span>Edit Form</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
     
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteRecord(record.nstemi_id, record.acs_no)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Delete NSTEMI Record"
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
            No historical NSTEMI encounters found for this patient.
          </div>
        )}
      </div>
    </div>
  );
}
