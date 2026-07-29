import React, { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import api from '../api/axios';

export default function EditHfModal({ isOpen, fileData, onClose, onSaveSuccess }) {
  const [facilityCode, setFacilityCode] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (fileData) {
      setFacilityCode(fileData.facility_code || '');
      setFacilityName(fileData.facility_name || '');
      setError(null);
    }
  }, [fileData]);

  if (!isOpen || !fileData) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!facilityCode.trim()) {
      setError('Facility Code is required.');
      return;
    }
    if (!facilityName.trim()) {
      setError('Facility Name is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/hf-files/${fileData.id}`, {
        facility_code: facilityCode.trim(),
        facility_name: facilityName.trim()
      });

      if (response.data && response.data.success) {
        if (onSaveSuccess) {
          onSaveSuccess();
        }
        onClose();
      } else {
        setError(response.data?.message || 'Failed to update Health Facility details.');
      }
    } catch (err) {
      console.error('Error updating HF File:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider">Edit Health Facility</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={loading}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="facility_code" className="text-xs font-semibold text-slate-700 block mb-1">
                Facility Code <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <input
                id="facility_code"
                type="text"
                value={facilityCode}
                onChange={(e) => setFacilityCode(e.target.value)}
                disabled={loading}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-800 placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
                placeholder="E.g. HF-001"
              />
            </div>

            <div>
              <label htmlFor="facility_name" className="text-xs font-semibold text-slate-700 block mb-1">
                Facility Name <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <input
                id="facility_name"
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                disabled={loading}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-800 placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
                placeholder="E.g. City General Cardiology Center"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
