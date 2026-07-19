import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, Loader2, ArrowUpRight } from 'lucide-react';
import api from '../../api/axios';

export default function HFHistoryList({ patientId }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        // Correct path without redundant '/api' prefix
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
    }

    if (patientId) {
      fetchHistory();
    }
  }, [patientId]);

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

      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
        {history.map((record, index) => {
          const encounterNum = history.length - index;
          return (
            <div
              key={record.hf_id}
              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-slate-200 hover:bg-slate-100/30 transition-all"
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
                  <span className="text-xs font-bold text-slate-800">
                    {record.hf_registry_no}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/hf-form/view/${record.hf_id}`)}
                className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View Form</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
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
