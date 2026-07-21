/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { FileText, Bookmark } from 'lucide-react';

import HospitalizationForm from './forms/HospitalizationForm';
import hf from './forms/hf';
import STEMIForm from './forms/STEMIForm';
import NSTEMIForm from './forms/NSTEMIForm';
import CABGForm from './forms/CABGForm';
import FollowUpForm from './forms/FollowUpForm';
import LaboratoryForm from './forms/LaboratoryForm';
import InvestigationForm from './forms/InvestigationForm';

export default function ClinicalForm({ patientRecord, formType, editingRecord, onCancel, onSave }) {
  const formRef = useRef(null);
  const [isDraft, setIsDraft] = useState(editingRecord?.isDraft ?? false);
  const [completionPercent, setCompletionPercent] = useState(15);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formRef.current) return;

    if (formRef.current.validateForm && !formRef.current.validateForm(isDraft)) {
      return;
    }

    const submissionData = formRef.current.getSubmissionData();
    submissionData.isDraft = isDraft;

    onSave(submissionData, formType);
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
      {/* Form Title Banner */}
      <div className={`p-6 ${currentStyle.bg} text-white border-b ${currentStyle.border} flex justify-between items-center flex-wrap gap-4`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 ${currentStyle.iconBg} rounded-lg`}>
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">
              {editingRecord ? 'Modify Existing Entry' : 'Record New Entry'}: {currentStyle.title}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Patient Reference: {patientRecord.patient.name || patientRecord.patient.patient_name} ({patientRecord.patient.mrNo || patientRecord.patient.mr_no}) • {currentStyle.subtitle}
            </p>
          </div>
        </div>

        
      </div>

      {/* Primary Interactive Fields */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {renderActiveForm()}

        {/* Draft/Complete controls & save/cancel buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2">
            <input
              id="chk-draft"
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              checked={isDraft}
              onChange={(e) => setIsDraft(e.target.checked)}
            />
            <div className="text-left">
              <label htmlFor="chk-draft" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                <span>Save Registry Entry as Draft</span>
              </label>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Draft entries bypass immediate completeness rules.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="btn-cancel-form"
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold"
            >
              Cancel
            </button>
            <button
              id="btn-submit-form"
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              Verify & Submit Registry
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}