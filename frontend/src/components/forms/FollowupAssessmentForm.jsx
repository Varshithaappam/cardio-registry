import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import SectionCard from './common/SectionCard';
import RadioGroup from './common/RadioGroup';
import Select from './common/Select';
import DateInput from './common/DateInput';
import TextInput from './common/TextInput';
import TextArea from './common/TextArea';
import FormField from './common/FormField';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const FollowupAssessmentForm = forwardRef(function FollowupAssessmentForm(
  { initialData, onChange, onSubmit, readOnly = false, title = "11. Follow-up Assessment" },
  ref
) {
  // Primary Toggle: 'Yes' | 'No' | ''
  const [isFollowupRequired, setIsFollowupRequired] = useState(
    initialData?.is_followup_required === 1 || initialData?.is_followup_required === true || initialData?.isFollowupRequired === 'Yes'
      ? 'Yes'
      : initialData?.is_followup_required === 0 || initialData?.is_followup_required === false || initialData?.isFollowupRequired === 'No'
      ? 'No'
      : ''
  );

  // Date formatting helper for HTML5 <input type="date"> (YYYY-MM-DD)
  const formatToIsoDate = (val) => {
    if (!val) return '';
    const str = String(val).trim();
    if (!str) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (str.includes('T')) return str.split('T')[0];
    if (str.includes(' ')) return str.split(' ')[0];
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const [d, m, y] = str.split('/');
      return `${y}-${m}-${d}`;
    }
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {}
    return str;
  };

  // --- Branch 1: If "Yes" is selected ---
  const [followupInterval, setFollowupInterval] = useState(
    initialData?.followup_interval || initialData?.followupInterval || '1-Month'
  );
  const [scheduledFollowupDate, setScheduledFollowupDate] = useState(
    formatToIsoDate(initialData?.scheduled_followup_date || initialData?.scheduledFollowupDate || '')
  );
  const [visitMode, setVisitMode] = useState(
    initialData?.visit_mode || initialData?.visitMode || 'In-Person HF Clinic'
  );
  const [primaryFollowupReason, setPrimaryFollowupReason] = useState(
    initialData?.primary_followup_reason || initialData?.primaryFollowupReason || ''
  );

  // Recommended Pre-Visit Investigations (Checkboxes)
  const [investigationSerumLytes, setInvestigationSerumLytes] = useState(
    initialData?.investigation_serum_lytes ?? initialData?.investigations?.serumLytes ?? true
  );
  const [investigationEcg, setInvestigationEcg] = useState(
    initialData?.investigation_ecg ?? initialData?.investigations?.ecg ?? true
  );
  const [investigationEcho, setInvestigationEcho] = useState(
    initialData?.investigation_echo ?? initialData?.investigations?.echo ?? false
  );
  const [investigationBnpNtprobnp, setInvestigationBnpNtprobnp] = useState(
    initialData?.investigation_bnp_ntprobnp ?? initialData?.investigations?.bnp ?? false
  );
  const [investigation6mwTest, setInvestigation6mwTest] = useState(
    initialData?.investigation_6mw_test ?? initialData?.investigations?.sixMwt ?? false
  );

  const [specialInstructions, setSpecialInstructions] = useState(
    initialData?.special_instructions || initialData?.specialInstructions || ''
  );

  // --- Branch 2: If "No" is selected ---
  const [primaryNoFollowupReason, setPrimaryNoFollowupReason] = useState(
    initialData?.primary_no_followup_reason || initialData?.primaryNoFollowupReason || ''
  );
  const [pcpTransitionSummary, setPcpTransitionSummary] = useState(
    initialData?.pcp_transition_summary || initialData?.pcpTransitionSummary || ''
  );
  const [selfCareInstructions, setSelfCareInstructions] = useState(
    initialData?.self_care_instructions || initialData?.selfCareInstructions || ''
  );

  // Synchronize state when initialData loads or updates
  useEffect(() => {
    if (!initialData) return;

    let req = '';
    const reqVal = initialData.is_followup_required ?? initialData.isFollowupRequired ?? initialData.is_required ?? initialData.isRequired;
    if (reqVal === 1 || reqVal === true || reqVal === 'Yes' || reqVal === '1') {
      req = 'Yes';
    } else if (reqVal === 0 || reqVal === false || reqVal === 'No' || reqVal === '0') {
      req = 'No';
    } else if (initialData.followup_interval || initialData.scheduled_followup_date || initialData.primary_followup_reason || initialData.followupInterval) {
      req = 'Yes';
    } else if (initialData.primary_no_followup_reason || initialData.pcp_transition_summary || initialData.primaryNoFollowupReason) {
      req = 'No';
    }

    if (req) {
      setIsFollowupRequired(req);
    }

    if (initialData.followup_interval || initialData.followupInterval) {
      setFollowupInterval(initialData.followup_interval || initialData.followupInterval);
    }
    const rawDate = initialData.scheduled_followup_date || initialData.scheduledFollowupDate;
    if (rawDate) {
      setScheduledFollowupDate(formatToIsoDate(rawDate));
    }
    if (initialData.visit_mode || initialData.visitMode) {
      setVisitMode(initialData.visit_mode || initialData.visitMode);
    }
    if (initialData.primary_followup_reason || initialData.primaryFollowupReason) {
      setPrimaryFollowupReason(initialData.primary_followup_reason || initialData.primaryFollowupReason);
    }

    if (initialData.investigation_serum_lytes !== undefined) setInvestigationSerumLytes(initialData.investigation_serum_lytes === 1 || initialData.investigation_serum_lytes === true);
    else if (initialData.investigations?.serumLytes !== undefined) setInvestigationSerumLytes(initialData.investigations.serumLytes);

    if (initialData.investigation_ecg !== undefined) setInvestigationEcg(initialData.investigation_ecg === 1 || initialData.investigation_ecg === true);
    else if (initialData.investigations?.ecg !== undefined) setInvestigationEcg(initialData.investigations.ecg);

    if (initialData.investigation_echo !== undefined) setInvestigationEcho(initialData.investigation_echo === 1 || initialData.investigation_echo === true);
    else if (initialData.investigations?.echo !== undefined) setInvestigationEcho(initialData.investigations.echo);

    if (initialData.investigation_bnp_ntprobnp !== undefined) setInvestigationBnpNtprobnp(initialData.investigation_bnp_ntprobnp === 1 || initialData.investigation_bnp_ntprobnp === true);
    else if (initialData.investigations?.bnp !== undefined) setInvestigationBnpNtprobnp(initialData.investigations.bnp);

    if (initialData.investigation_6mw_test !== undefined) setInvestigation6mwTest(initialData.investigation_6mw_test === 1 || initialData.investigation_6mw_test === true);
    else if (initialData.investigations?.sixMwt !== undefined) setInvestigation6mwTest(initialData.investigations.sixMwt);

    if (initialData.special_instructions || initialData.specialInstructions) {
      setSpecialInstructions(initialData.special_instructions || initialData.specialInstructions);
    }

    if (initialData.primary_no_followup_reason || initialData.primaryNoFollowupReason) {
      setPrimaryNoFollowupReason(initialData.primary_no_followup_reason || initialData.primaryNoFollowupReason);
    }
    if (initialData.pcp_transition_summary || initialData.pcpTransitionSummary) {
      setPcpTransitionSummary(initialData.pcp_transition_summary || initialData.pcpTransitionSummary);
    }
    if (initialData.self_care_instructions || initialData.selfCareInstructions) {
      setSelfCareInstructions(initialData.self_care_instructions || initialData.selfCareInstructions);
    }
  }, [initialData]);

  // Handles switching primary toggle and resetting the hidden section state
  const handleToggleChange = (val) => {
    if (readOnly) return;
    setIsFollowupRequired(val);

    if (val === 'Yes') {
      // Clear Branch 2 states
      setPrimaryNoFollowupReason('');
      setPcpTransitionSummary('');
      setSelfCareInstructions('');
    } else if (val === 'No') {
      // Clear Branch 1 states
      setFollowupInterval('1-Month');
      setScheduledFollowupDate('');
      setVisitMode('In-Person HF Clinic');
      setPrimaryFollowupReason('');
      setInvestigationSerumLytes(false);
      setInvestigationEcg(false);
      setInvestigationEcho(false);
      setInvestigationBnpNtprobnp(false);
      setInvestigation6mwTest(false);
      setSpecialInstructions('');
    }
  };

  // Check form completeness for current branch
  const isBranchValid = () => {
    if (isFollowupRequired === 'Yes') {
      return (
        followupInterval.trim() !== '' &&
        scheduledFollowupDate.trim() !== '' &&
        visitMode.trim() !== '' &&
        primaryFollowupReason.trim() !== ''
      );
    }
    if (isFollowupRequired === 'No') {
      return (
        primaryNoFollowupReason.trim() !== '' &&
        pcpTransitionSummary.trim() !== ''
      );
    }
    return false;
  };

  // Sanitization helper ensuring strict MS SQL CHECK constraint compatibility
  const formatFollowupPayload = (rawState) => {
    const isRequired = rawState.is_followup_required === true || rawState.is_followup_required === 1 || rawState.isFollowupRequired === 'Yes';
    
    // Helper to sanitize text strings (empty string "" -> null)
    const sanitizeString = (val) => (val && String(val).trim() !== '' ? String(val).trim() : null);

    if (isRequired) {
      return {
        is_followup_required: 1,

        // Branch 1 ("Yes") Active Fields
        followup_interval: sanitizeString(rawState.followup_interval || rawState.followupInterval),
        scheduled_followup_date: sanitizeString(rawState.scheduled_followup_date || rawState.scheduledFollowupDate),
        visit_mode: sanitizeString(rawState.visit_mode || rawState.visitMode),
        primary_followup_reason: sanitizeString(rawState.primary_followup_reason || rawState.primaryFollowupReason),

        // Checkbox BIT conversions: 1 = True, 0 = False
        investigation_serum_lytes: rawState.investigation_serum_lytes ? 1 : 0,
        investigation_ecg: rawState.investigation_ecg ? 1 : 0,
        investigation_echo: rawState.investigation_echo ? 1 : 0,
        investigation_bnp_ntprobnp: rawState.investigation_bnp_ntprobnp ? 1 : 0,
        investigation_6mw_test: rawState.investigation_6mw_test ? 1 : 0,

        special_instructions: sanitizeString(rawState.special_instructions || rawState.specialInstructions),

        // Branch 2 ("No") Forced Strictly to NULL for MS SQL CHECK Constraint
        primary_no_followup_reason: null,
        pcp_transition_summary: null,
        self_care_instructions: null
      };
    } else {
      return {
        is_followup_required: 0,

        // Branch 1 ("Yes") Forced Strictly to NULL for MS SQL CHECK Constraint
        followup_interval: null,
        scheduled_followup_date: null,
        visit_mode: null,
        primary_followup_reason: null,
        investigation_serum_lytes: null,
        investigation_ecg: null,
        investigation_echo: null,
        investigation_bnp_ntprobnp: null,
        investigation_6mw_test: null,
        special_instructions: null,

        // Branch 2 ("No") Active Fields (Empty strings converted to null)
        primary_no_followup_reason: sanitizeString(rawState.primary_no_followup_reason || rawState.primaryNoFollowupReason),
        pcp_transition_summary: sanitizeString(rawState.pcp_transition_summary || rawState.pcpTransitionSummary),
        self_care_instructions: sanitizeString(rawState.self_care_instructions || rawState.selfCareInstructions)
      };
    }
  };

  // Data payload constructor matching SQL Schema and UI
  const getAssessmentPayload = () => {
    return formatFollowupPayload({
      is_followup_required: isFollowupRequired === 'Yes',
      followup_interval: followupInterval,
      scheduled_followup_date: scheduledFollowupDate,
      visit_mode: visitMode,
      primary_followup_reason: primaryFollowupReason,
      investigation_serum_lytes: investigationSerumLytes,
      investigation_ecg: investigationEcg,
      investigation_echo: investigationEcho,
      investigation_bnp_ntprobnp: investigationBnpNtprobnp,
      investigation_6mw_test: investigation6mwTest,
      special_instructions: specialInstructions,
      primary_no_followup_reason: primaryNoFollowupReason,
      pcp_transition_summary: pcpTransitionSummary,
      self_care_instructions: selfCareInstructions
    });
  };

  // Expose methods via ref for parent form wizards
  useImperativeHandle(ref, () => ({
    getAssessmentPayload,
    isValid: isBranchValid()
  }));

  // Notify parent of state updates
  useEffect(() => {
    onChange?.(getAssessmentPayload());
  }, [
    isFollowupRequired,
    followupInterval,
    scheduledFollowupDate,
    visitMode,
    primaryFollowupReason,
    investigationSerumLytes,
    investigationEcg,
    investigationEcho,
    investigationBnpNtprobnp,
    investigation6mwTest,
    specialInstructions,
    primaryNoFollowupReason,
    pcpTransitionSummary,
    selfCareInstructions
  ]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!isBranchValid() || readOnly) return;
    onSubmit?.(getAssessmentPayload());
  };

  return (
    <SectionCard
      title={title}
      subtitle="Determine post-discharge follow-up necessity, schedule, and pre-visit diagnostic requirements."
    >
      <div className="space-y-4">
        {/* Core Logic: Mandatory Primary Toggle */}
        <RadioGroup
          label="Is Follow-up Required for this Patient?"
          name="isFollowupRequiredToggle"
          required
          options={[
            { label: 'Yes', value: 'Yes' },
            { label: 'No', value: 'No' }
          ]}
          value={isFollowupRequired}
          onChange={handleToggleChange}
          readOnly={readOnly}
        />

        {/* Branch 1: If "Yes" is Selected */}
        {isFollowupRequired === 'Yes' && (
          <div className="border border-slate-200 bg-slate-50/50 rounded-lg p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
              Follow-up Scheduling & Parameters
            </h4>

            {/* Row 1: Follow-up Interval & Scheduled Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Follow-up Interval"
                required
                value={followupInterval}
                onChange={setFollowupInterval}
                readOnly={readOnly}
                options={[
                  { label: '1-Week', value: '1-Week' },
                  { label: '2-Weeks', value: '2-Weeks' },
                  { label: '1-Month', value: '1-Month' },
                  { label: '3-Months', value: '3-Months' },
                  { label: '6-Months', value: '6-Months' },
                  { label: '1-Year', value: '1-Year' }
                ]}
              />

              <DateInput
                label="Scheduled Follow-up Date"
                required
                value={formatToIsoDate(scheduledFollowupDate)}
                onChange={setScheduledFollowupDate}
                readOnly={readOnly}
              />
            </div>

            {/* Row 2: Visit Mode & Primary Clinical Reason */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RadioGroup
                label="Visit Mode"
                name="visitModeGroup"
                required
                columns={3}
                options={[
                  'In-Person',
                  'Tele-consultation',
                  'Phone Check-in'
                ]}
                value={visitMode}
                onChange={setVisitMode}
                readOnly={readOnly}
              />

              <TextInput
                label="Primary Clinical Reason for Follow-up"
                required
                value={primaryFollowupReason}
                onChange={setPrimaryFollowupReason}
                placeholder="Specify reason..."
                readOnly={readOnly}
              />
            </div>

            {/* Row 3: Recommended Pre-Visit Investigations */}
            <FormField label="Recommended Pre-Visit Investigations/Tests">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 bg-white p-3 rounded-lg border border-slate-200">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={investigationSerumLytes}
                    onChange={(e) => setInvestigationSerumLytes(e.target.checked)}
                    disabled={readOnly}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Serum Electrolytes & Creatinine</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={investigationEcg}
                    onChange={(e) => setInvestigationEcg(e.target.checked)}
                    disabled={readOnly}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>ECG</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={investigationEcho}
                    onChange={(e) => setInvestigationEcho(e.target.checked)}
                    disabled={readOnly}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Echocardiogram</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={investigationBnpNtprobnp}
                    onChange={(e) => setInvestigationBnpNtprobnp(e.target.checked)}
                    disabled={readOnly}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>BNP / NT-proBNP</span>
                </label>

                
              </div>
            </FormField>

            {/* Row 4: Special Instructions */}
            <TextArea
              label="Special Clinical Instructions for Patient/Caregiver"
              rows={2}
              value={specialInstructions}
              onChange={setSpecialInstructions}
              placeholder="Specify instructions..."
              readOnly={readOnly}
            />
          </div>
        )}

        {/* Branch 2: If "No" is Selected */}
        {isFollowupRequired === 'No' && (
          <div className="border border-slate-200 bg-slate-50/50 rounded-lg p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
              Justification for No Follow-up
            </h4>

            {/* Side-by-Side: Reason Radio Buttons (Left) & PCP Summary (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <RadioGroup
                label="Primary Clinical Reason for No Follow-up Required:"
                name="primaryNoFollowupReasonGroup"
                required
                columns={1}
                options={[
                  'Fully stabilized and optimized',
                  'Transitioning to Palliative Care',
                  'Transferred to Primary Care Provider',
                  'Patient Preference / Declined'
                ]}
                value={primaryNoFollowupReason}
                onChange={setPrimaryNoFollowupReason}
                readOnly={readOnly}
              />

              <TextArea
                label="PCP Summary for External Care:"
                required
                rows={4}
                value={pcpTransitionSummary}
                onChange={setPcpTransitionSummary}
                placeholder="Specify transition details..."
                readOnly={readOnly}
              />
            </div>

            {/* Self-Care & Non-follow-up Instructions */}
            <TextArea
              label="Self-Care & Non-follow-up Instructions for Patient:"
              rows={3}
              value={selfCareInstructions}
              onChange={setSelfCareInstructions}
              placeholder="Specify instructions..."
              readOnly={readOnly}
            />
          </div>
        )}

        {/* Form Action & Validation Footer */}
        {onSubmit && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <div className="text-xs">
              {!isFollowupRequired ? (
                <span className="text-amber-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Please select whether follow-up is required.
                </span>
              ) : !isBranchValid() ? (
                <span className="text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Fill all mandatory fields (*) for {isFollowupRequired === 'Yes' ? 'Follow-up' : 'No Follow-up'} assessment.
                </span>
              ) : (
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> All mandatory fields completed. Ready to submit.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isBranchValid() || readOnly}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            >
              Submit / Verify Assessment
            </button>
          </div>
        )}
      </div>
    </SectionCard>
  );
});

export default FollowupAssessmentForm;
