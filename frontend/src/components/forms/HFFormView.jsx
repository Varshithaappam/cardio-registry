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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-teal-400 mb-4" />
        <p className="text-slate-400 text-sm">Retrieving registry records across 13 tables...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700/60 p-6 rounded-2xl shadow-xl text-center">
          <p className="text-red-400 font-bold mb-4">Error Loading Assessment</p>
          <p className="text-slate-300 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 print:bg-white print:text-black">
      {/* Print-specific style block */}
      <style dangerouslySetInnerHTML={{ __html: `
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
            border-color: #cbd5e1 !important;
          }
          .border-slate-800, .border-teal-900 {
            border-color: #cbd5e1 !important;
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
      <div className="no-print bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 px-4 py-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700/60 transition-colors text-slate-300 cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-white uppercase tracking-wider">
                Heart Failure Registry Assessment View
              </h1>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Registry ID: {assessmentData?.id || recordId} • Patient: {patientRecord?.patient?.name}
              </p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white border border-teal-500 rounded-xl transition-all flex items-center gap-2 text-xs font-bold cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Export to PDF
          </button>
        </div>
      </div>

      {/* Main Form Content Container */}
      <div className="print-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
