import React, { useState } from 'react';
import { 
  AlertTriangle, 
  UserCheck, 
  UserPlus, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  Eye, 
  Info,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Hash,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

/**
 * Patient Verification & Deduplication Interceptor Modal
 */
export default function PatientVerificationModal({
  isOpen,
  onClose,
  verificationData,
  incomingPatient,
  onSelectExisting,
  onForceCreate
}) {
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!isOpen || !verificationData) return null;

  const { decision, confidence, candidates: rawCandidates = [], verification_id } = verificationData;
  const isHighConfidence = decision === 'HIGH_CONFIDENCE_MATCH' || confidence >= 95.0;

  // 1. Filter out any candidate whose overall match score is less than 80%
  const filteredCandidates = rawCandidates.filter(
    c => (typeof c.confidence === 'number' ? c.confidence : c.confidence_score ?? 0) >= 80.0
  );
  const candidates = filteredCandidates.length > 0 ? filteredCandidates : rawCandidates;

  // Auto-select top candidate on initial load
  const activeCandidateId = selectedCandidateId || candidates[0]?.patient_id;
  const activeCandidate = candidates.find(c => c.patient_id === activeCandidateId) || candidates[0];

  const handleUseExisting = async () => {
    if (!activeCandidate) return;
    setLoading(true);
    try {
      await onSelectExisting(activeCandidate, verification_id);
    } finally {
      setLoading(false);
    }
  };

  const handleForceRegister = async () => {
    setLoading(true);
    try {
      await onForceCreate(verification_id, activeCandidate?.patient_id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className={`px-6 py-4.5 border-b flex items-center justify-between ${
          isHighConfidence 
            ? 'bg-rose-50 border-rose-200 text-rose-900' 
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isHighConfidence ? 'bg-rose-500 text-white shadow-sm' : 'bg-amber-500 text-white shadow-sm'
            }`}>
              {isHighConfidence ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">
                  {isHighConfidence ? 'Duplicate Patient Record Detected' : 'Potential Existing Patient Match Found'}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  isHighConfidence ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                }`}>
                  {isHighConfidence ? 'High Confidence (≥ 95%)' : 'Review Required (80–95%)'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isHighConfidence ? 'text-rose-700' : 'text-amber-700'}`}>
                {isHighConfidence 
                  ? 'Master Patient Index identified strong deterministic and demographic matches with an existing record.' 
                  : 'Fuzzy identity resolution found candidate records sharing similar identifiers. Please review before proceeding.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Top Banner with Match Score */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overall Match Confidence</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-3xl font-extrabold ${
                  isHighConfidence ? 'text-rose-600' : 'text-amber-600'
                }`}>
                  {confidence}%
                </span>
                <span className="text-xs text-slate-500 font-medium">similarity score</span>
              </div>
            </div>

            {/* Dynamic Confidence Bar */}
            <div className="flex-1 max-w-xs min-w-[200px]">
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isHighConfidence ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                <span>0%</span>
                <span>80% (Review)</span>
                <span>95% (High)</span>
                <span>100%</span>
              </div>
            </div>

            {/* Filtered Candidates Count */}
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium">Candidates Found</span>
              <p className="text-lg font-bold text-slate-800">{candidates.length} record{candidates.length === 1 ? '' : 's'}</p>
            </div>
          </div>

          {/* Comparison Container: Incoming Data on Top, Existing Candidate Bellow */}
          <div className="flex flex-col gap-4 w-full">
            
            {/* 1. Incoming Form Submission (Horizontal Layout) */}
            <div className="w-full bg-white rounded-xl p-4.5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Incoming Intake Record
                </span>
                <span className="text-[11px] font-medium text-slate-400">Being Registered</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Full Name</span>
                  <span className="text-sm font-semibold text-slate-800">{incomingPatient?.patient_name || incomingPatient?.name || '—'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Date of Birth & Gender</span>
                  <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {incomingPatient?.date_of_birth || incomingPatient?.dob || '—'} ({incomingPatient?.gender || '—'})
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Phone & Email</span>
                  <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {incomingPatient?.phone_no || incomingPatient?.phone || '—'}
                  </span>
                  <span className="text-slate-600 truncate block mt-0.5 text-[11px]">
                    {incomingPatient?.email || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">UHID / ABHA</span>
                  <div className="font-mono text-slate-700 mt-0.5 space-y-0.5">
                    <div><span className="text-slate-400 font-sans text-[10px]">UHID:</span> {incomingPatient?.uhid || '—'}</div>
                    <div><span className="text-slate-400 font-sans text-[10px]">ABHA:</span> {incomingPatient?.abha_number || incomingPatient?.abha || '—'}</div>
                  </div>
                </div>
              </div>

              <div className="text-xs pt-1 border-t border-slate-50">
                <span className="text-slate-400 block font-medium">Address</span>
                <span className="text-slate-600 block mt-0.5">
                  {incomingPatient?.address || '—'}
                </span>
              </div>
            </div>

            {/* 2. Existing Candidate Match Card (Horizontal Layout Below) */}
            {activeCandidate && (
              <div className="w-full bg-white rounded-xl p-4.5 border-2 border-blue-400 shadow-sm space-y-3 relative">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Existing Patient File (#{activeCandidate.patient_id})
                    </span>
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-xs">
                      MR: {activeCandidate.mr_no || '—'}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-full text-xs">
                    {activeCandidate.confidence}% Match
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Full Name</span>
                    <span className="text-sm font-bold text-slate-900">{activeCandidate.full_name}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Date of Birth & Gender</span>
                    <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {activeCandidate.date_of_birth || '—'} ({activeCandidate.gender || '—'})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Phone & Email (Masked)</span>
                    <span className="font-mono font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {activeCandidate.contact_phone_masked || '—'}
                    </span>
                    <span className="text-slate-600 truncate block mt-0.5 text-[11px]">
                      {activeCandidate.email_masked || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">UHID / ABHA</span>
                    <div className="font-mono text-slate-700 mt-0.5 space-y-0.5">
                      <div><span className="text-slate-400 font-sans text-[10px]">UHID:</span> {activeCandidate.uhid || '—'}</div>
                      <div><span className="text-slate-400 font-sans text-[10px]">ABHA:</span> {activeCandidate.abha_number || '—'}</div>
                    </div>
                  </div>
                </div>

                <div className="text-xs pt-1 border-t border-slate-50">
                  <span className="text-slate-400 block font-medium">Registered Address</span>
                  <span className="text-slate-600 block mt-0.5">
                    {activeCandidate.address || '—'}
                  </span>
                </div>

                {/* 3. Field Comparison Breakdown Toggle Button */}
                {(activeCandidate.field_scores || (activeCandidate.reasons && activeCandidate.reasons.length > 0)) && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowBreakdown(prev => !prev)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 py-1 transition-colors"
                    >
                      <span>{showBreakdown ? 'Hide Field Comparison Breakdown' : 'View Field Comparison Breakdown'}</span>
                      {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}

                {/* Collapsible Breakdown Section */}
                {showBreakdown && (
                  <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Field-by-field similarity chips */}
                    {activeCandidate.field_scores && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Field Scores:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(activeCandidate.field_scores).map(([field, score]) => {
                            if (score === null || score === undefined) return null;
                            const pct = Math.round(score * 100);
                            const isGood = pct >= 80;
                            return (
                              <span 
                                key={field} 
                                className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                                  isGood ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {field}: {pct}%
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Reasons / Match Explanations */}
                    {activeCandidate.reasons && activeCandidate.reasons.length > 0 && (
                      <div>
                        <div className="flex flex-wrap gap-1">
                          {activeCandidate.reasons.map((r, idx) => (
                            <span 
                              key={idx} 
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                r.includes('conflict') || r.includes('mismatch')
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Multiple Candidates Selector if > 1 (Only showing candidates >= 80%) */}
          {candidates.length > 1 && (
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Select Candidate to Inspect ({candidates.length} candidates)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {candidates.map((c) => (
                  <button
                    key={c.patient_id}
                    onClick={() => setSelectedCandidateId(c.patient_id)}
                    className={`text-left p-3 rounded-lg border text-xs transition-all ${
                      activeCandidateId === c.patient_id
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800 truncate">{c.full_name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 font-bold text-[10px]">
                        {c.confidence}%
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px] block">MR: {c.mr_no || 'N/A'}</span>
                    <span className="text-slate-400 text-[10px] block">DOB: {c.date_of_birth}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Safety Acknowledgment Box for All Potential Duplicates / Reviews */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-2">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="safetyCheck"
                checked={safetyConfirmed}
                onChange={(e) => setSafetyConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <label htmlFor="safetyCheck" className="font-medium cursor-pointer leading-relaxed">
                <strong>Clinical Safety Override:</strong> I have physically verified government identity documents (Aadhaar / Passport / Voter ID) and confirm that this individual is a distinct person from the existing record.
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-100/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel & Edit Form
          </button>

          <div className="flex items-center gap-3">
            {/* Primary Action: Use Existing File */}
            <button
              type="button"
              onClick={handleUseExisting}
              disabled={loading || !activeCandidate}
              className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all hover:shadow-lg disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              Use Existing Patient File ({activeCandidate?.mr_no || 'Candidate'})
            </button>

            {/* Secondary Action: Force / Confirm Registration (Requires Safety Override) */}
            {isHighConfidence ? (
              <button
                type="button"
                onClick={handleForceRegister}
                disabled={loading || !safetyConfirmed}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                title={!safetyConfirmed ? 'Please check the safety acknowledgment first' : 'Force register as new record'}
              >
                <UserPlus className="w-4 h-4" />
                Force Register as New Record
              </button>
            ) : (
              <button
                type="button"
                onClick={handleForceRegister}
                disabled={loading || !safetyConfirmed}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                title={!safetyConfirmed ? 'Please check the safety acknowledgment first' : 'Confirm different patient and register'}
              >
                <UserPlus className="w-4 h-4" />
                Confirm Different Patient & Register
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
