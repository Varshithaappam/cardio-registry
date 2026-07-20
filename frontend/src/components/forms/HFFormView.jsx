import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import api from '../../../api/axios';
import { mapPatientRecord } from '../../utils/patientMapper';
import HFForm from './hf';

export default function HFFormView() {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [patientRecord, setPatientRecord] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 1. Fetch HF Assessment details (without '/api' prefix)
        const resAssessment = await api.get(`/hf-assessment/${recordId}`);
        if (!resAssessment.data || !resAssessment.data.success) {
          throw new Error(resAssessment.data?.message || 'Failed to load assessment data.');
        }
        const assessment = resAssessment.data.data;
        setAssessmentData(assessment);

        // 2. Fetch Patient details (without '/api' prefix)
        const resPatient = await api.get(`/patients/${assessment.patientId}`);
        if (!resPatient.data || !resPatient.data.success) {
          throw new Error(resPatient.data?.message || 'Failed to load patient data.');
        }
        const normalized = mapPatientRecord(resPatient.data.data);
        setPatientRecord(normalized);
      } catch (err) {
        console.error('Error fetching HF Form View data:', err);
        setError(err.message || 'An error occurred while loading the record.');
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      fetchData();
    }
  }, [recordId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <Loader2 className="w-10 h-10 animate-spin text-teal-400 mb-4" />
        <p className="text-white/80 text-sm">Retrieving registry records across 13 tables...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
        <div className="max-w-md w-full bg-black border border-white/20 p-6 rounded-2xl shadow-xl text-center">
          <p className="text-red-400 font-bold mb-4">Error Loading Assessment</p>
          <p className="text-white/80 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-black hover:bg-gray-900 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer border border-white/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white print:bg-white print:text-black">
      {/* Print-specific style block */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* General High Contrast styles for disabled fields */
        input:disabled, select:disabled, textarea:disabled,
        input[disabled], select[disabled], textarea[disabled] {
          color: #0f172a !important; /* text-slate-900 */
          -webkit-text-fill-color: #0f172a !important;
          opacity: 1 !important;
          background-color: #f8fafc !important; /* bg-slate-50 */
        }
        input[type="radio"], input[type="checkbox"] {
          accent-color: #000000 !important;
        }
        input[type="radio"]:disabled, input[type="checkbox"]:disabled {
          opacity: 1 !important;
          accent-color: #000000 !important;
        }
        input[type="radio"]:disabled:checked {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2.5' fill='%23fff'/%3e%3c/svg%3e") !important;
          background-color: #000000 !important;
          border-color: #000000 !important;
          opacity: 1 !important;
        }
        input[type="checkbox"]:disabled:checked {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m6 10 3 3 6-6'/%3e%3c/svg%3e") !important;
          background-color: #000000 !important;
          border-color: #000000 !important;
          opacity: 1 !important;
        }
        .text-slate-400 {
          color: #000000 !important;
        }
        
        @media print {
          header, footer, aside, .no-print, button {
            display: none !important;
          }
          body, .print-container {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
          }
          .bg-slate-800, .bg-slate-950, .bg-teal-950 {
            background-color: transparent !important;
            color: black !important;
            border-color: #000000 !important;
          }
          .border-slate-800, .border-teal-900 {
            border-color: #000000 !important;
          }
          fieldset {
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            size: A4;
            margin: 1.5cm;
          }
        }
      `}} />

      {/* Top bar (Hidden when printing) */}
      <div className="no-print bg-black/95 backdrop-blur-md border-b border-black sticky top-0 z-50 px-4 py-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-black hover:bg-gray-900 rounded-xl border border-white/20 transition-colors text-white cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-white uppercase tracking-wider">
                Heart Failure Registry Assessment View
              </h1>
              <p className="text-[10px] text-white/70 mt-0.5">
                Registry ID: {assessmentData?.id || recordId} • Patient: {patientRecord?.patient?.name}
              </p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-black hover:bg-gray-900 active:scale-95 text-white border border-white/20 rounded-xl transition-all flex items-center gap-2 text-xs font-bold cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Export to PDF
          </button>
        </div>
      </div>

      {/* Main Form Content Container */}
      <div className="print-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-black">
        {patientRecord && assessmentData && (
          <HFForm
            patientRecord={patientRecord}
            editingRecord={assessmentData}
            onCompletionChange={() => {}}
            readOnly={true}
          />
        )}
      </div>
    </div>
  );
}
