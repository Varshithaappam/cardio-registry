/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { FileText, Bookmark, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import HospitalizationForm from './forms/HospitalizationForm';
import hf from './forms/hf';
import STEMIForm from './forms/STEMIForm';
import NSTEMIForm from './forms/NSTEMIForm';
import CABGForm from './forms/CABGForm';
import FollowUpForm from './forms/FollowUpForm';
import LaboratoryForm from './forms/LaboratoryForm';
import InvestigationForm from './forms/InvestigationForm';

export default function ClinicalForm({ patientRecord, formType, editingRecord, onCancel, onSave, onBackPatients }) {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const isHfForm = String(formType || '').toUpperCase() === 'HF';
  const isNstemiForm = String(formType || '').toUpperCase() === 'NSTEMI';
  const isStemiForm = String(formType || '').toUpperCase() === 'STEMI';
  const [isDraft, setIsDraft] = useState(
    editingRecord?.isDraft ?? (editingRecord?.status === 'draft' || editingRecord?.status === 2)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionPercent, setCompletionPercent] = useState(15);
  const [viewMode, setViewMode] = useState('detailed');

  const handleSaveDraft = async (e) => {
    if (e) e.preventDefault();
    if (!formRef.current || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (formRef.current.validateForm) {
        const isValid = await formRef.current.validateForm(true);
        if (!isValid) {
          setIsSubmitting(false);
          return;
        }
      }

      const submissionData = formRef.current.getSubmissionData();
      submissionData.isDraft = true;

      await onSave(submissionData, formType);
    } catch (err) {
      console.error("Error saving draft:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formRef.current || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (formRef.current.validateForm) {
        const isValid = await formRef.current.validateForm(false);
        if (!isValid) {
          setIsSubmitting(false);
          return;
        }
      }

      const submissionData = formRef.current.getSubmissionData();
      submissionData.isDraft = false;

      await onSave(submissionData, formType);
    } catch (err) {
      console.error("Error submitting form:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formStyles = {
    HF: {
      bg: 'bg-teal-950',
      border: 'border-teal-900',
      text: 'text-teal-400',
      badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      iconBg: 'bg-teal-500/20 text-teal-400',
      barColor: 'bg-teal-500',
      title: 'Heart Failure (HF) Clinical Form',
      subtitle: 'CARE CHF Assessment & Cohort Tracking'
    },
    STEMI: {
      bg: 'bg-red-950',
      border: 'border-red-900',
      text: 'text-red-400',
      badge: 'bg-red-500/20 text-red-300 border-red-500/30',
      iconBg: 'bg-red-500/20 text-red-400',
      barColor: 'bg-red-600',
      title: 'STEMI Emergency Event Form',
      subtitle: 'Primary PCI (PAMI) & Door-to-Balloon Registry'
    },
    NSTEMI: {
      bg: 'bg-orange-950',
      border: 'border-orange-900',
      text: 'text-orange-400',
      badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      iconBg: 'bg-orange-500/20 text-orange-400',
      barColor: 'bg-orange-500',
      title: 'NSTEMI Clinical Event Form',
      subtitle: 'TIMI Risk Stratification & Therapy Registry'
    },
    CABG: {
      bg: 'bg-purple-950',
      border: 'border-purple-900',
      text: 'text-purple-400',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      iconBg: 'bg-purple-500/20 text-purple-400',
      barColor: 'bg-purple-500',
      title: 'CABG Adult Cardiac Surgery Form',
      subtitle: 'STS Quality Database Audit Standard'
    },
    Admission: {
      bg: 'bg-slate-900',
      border: 'border-slate-800',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      iconBg: 'bg-blue-500/20 text-blue-400',
      barColor: 'bg-blue-500',
      title: 'Admission / Encounter Form',
      subtitle: 'Hospitalization Log & Cost Parameters'
    },
    'Follow-up': {
      bg: 'bg-slate-900',
      border: 'border-slate-800',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      iconBg: 'bg-blue-500/20 text-blue-400',
      barColor: 'bg-blue-500',
      title: 'Follow-up Visit Registry',
      subtitle: 'Longitudinal Adherence & Compliance'
    },
    Lab: {
      bg: 'bg-slate-900',
      border: 'border-slate-800',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      iconBg: 'bg-blue-500/20 text-blue-400',
      barColor: 'bg-blue-500',
      title: 'Clinical Lab Result Log',
      subtitle: 'Cardiovascular Lab Biomarkers'
    },
    Investigation: {
      bg: 'bg-slate-900',
      border: 'border-slate-800',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      iconBg: 'bg-blue-500/20 text-blue-400',
      barColor: 'bg-blue-500',
      title: 'Clinical Diagnostic Report',
      subtitle: 'ECG, ECHO, & Radiology Investigation Logs'
    }
  };

  const currentStyle = formStyles[formType] || formStyles.Admission;

  const renderActiveForm = () => {
    switch (formType) {
      case 'Admission':
        return (
          <HospitalizationForm
            ref={formRef}
            patientRecord={patientRecord}
            editingRecord={editingRecord}
            onCompletionChange={setCompletionPercent}
          />
        );
      case 'HF':
        const HfComponent = hf;
        return (
          <HfComponent
            ref={formRef}
            patientRecord={patientRecord}
            editingRecord={editingRecord}
            onCompletionChange={setCompletionPercent}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        );
      case 'STEMI':
        return (
          <STEMIForm
            ref={formRef}
            patientRecord={patientRecord}
            editingRecord={editingRecord}
            onCompletionChange={setCompletionPercent}
          />
        );
      case 'NSTEMI':
        return (
          <NSTEMIForm
            ref={formRef}
            patientRecord={patientRecord}
            editingRecord={editingRecord}
            onCompletionChange={setCompletionPercent}
          />
        );
      case 'CABG':
        return (
          <CABGForm
            ref={formRef}
            patientRecord={patientRecord}
            editingRecord={editingRecord}
            onCompletionChange={setCompletionPercent}
          />
        );
      case 'Follow-up':
        return (
          <FollowUpForm
            ref={formRef}
            patientRecord={patientRecord}
            editingRecord={editingRecord}
            onCompletionChange={setCompletionPercent}
          />
        );
      case 'Lab':
        return (
          <LaboratoryForm
            ref={formRef}
            patientRecord={patientRecord}
            editingRecord={editingRecord}
            onCompletionChange={setCompletionPercent}
          />
        );
      case 'Investigation':
        return (
          <InvestigationForm
            ref={formRef}
            patientRecord={patientRecord}
            editingRecord={editingRecord}
            onCompletionChange={setCompletionPercent}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
      <div className={`p-6 ${currentStyle.bg} text-white border-b ${currentStyle.border} flex justify-between items-center flex-wrap gap-4`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                const pid = patientRecord?.patient?.id || patientRecord?.patient?.reg_patient_id;
                if (pid) {
                  navigate(`/patient/${pid}`);
                } else if (onBackPatients) {
                  onBackPatients();
                } else {
                  navigate('/patients');
                }
              }
            }}
            className="p-1.5 bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center mr-1"
            title="Go Back to Master Patient Portfolio"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className={`p-2 ${currentStyle.iconBg} rounded-lg`}>
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="!text-white text-lg font-bold tracking-tight">
              {editingRecord ? 'Modify Existing Entry' : 'Record New Entry'}: {currentStyle.title}
            </h3>
            <p className="text-xs text-slate-100 mt-1">
              Patient Reference: {patientRecord.patient.name || patientRecord.patient.patient_name} ({patientRecord.patient.mrNo || patientRecord.patient.mr_no}) • {currentStyle.subtitle}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {formType === 'HF' && (
            <div className="flex rounded-xl border border-teal-800 bg-slate-950/30 p-1 shadow-inner" role="group" aria-label="Heart Failure form view">
              <button
                type="button"
                onClick={() => setViewMode('detailed')}
                aria-pressed={viewMode === 'detailed'}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${viewMode === 'detailed'
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
              >
                Detailed Form
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tabular')}
                aria-pressed={viewMode === 'tabular'}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${viewMode === 'tabular'
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
              >
                Tabular View
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary Interactive Fields */}
      <form
        onSubmit={handleSubmit}
        data-registry={isHfForm ? 'hf' : isStemiForm ? 'stemi' : isNstemiForm ? 'nstemi' : undefined}
        className={`p-6 space-y-6 ${isHfForm ? 'theme-hf' : isStemiForm ? 'theme-stemi' : isNstemiForm ? 'theme-nstemi' : ''}`}
      >
        {renderActiveForm()}

        {/* Draft/Complete controls & save/cancel buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <div />

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="btn-draft-form"
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveDraft}
              className={`w-full sm:w-auto px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg flex items-center justify-center gap-1.5 shadow-xs ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-600" />
              <span>Save as Draft</span>
            </button>
            <button
              id="btn-cancel-form"
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className={`w-full sm:w-auto px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
            >
              Cancel
            </button>
            <button
              id="btn-submit-form"
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-75 cursor-wait' : 'cursor-pointer'
                }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Submitting Assessment...</span>
                </>
              ) : (
                editingRecord?.id && !String(editingRecord.id).startsWith("hfa-") ? "Update Registry Entry" : "Verify & Submit Registry"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
