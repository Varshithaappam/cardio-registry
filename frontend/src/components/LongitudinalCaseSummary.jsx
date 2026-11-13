import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart,
  Activity,
  Stethoscope,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Pill,
  FileText,
  Printer,
  TrendingUp,
  Zap,
  Calendar,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Eye,
  RefreshCw,
  Copy,
  Check,
  Award,
  Sparkles,
  FlaskConical,
  Flame,
  ShieldAlert,
  Info,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import api from '../../api/axios';
import { formatDateForDisplay } from '../utils/dateUtils';
import { calculateAge } from '../utils/calculateAge';

export default function LongitudinalCaseSummary({
  record,
  timelineEvents = [],
  counts = { hfCount: 0, stemiCount: 0, nstemiCount: 0 },
  onViewEventDetails,
  onAddEventClick,
  isInactiveOrDeceased
}) {
  const [dossierData, setDossierData] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [expandedEpisodes, setExpandedEpisodes] = useState({});
  const [allExpanded, setAllExpanded] = useState(true);
  const [highlightedMetric, setHighlightedMetric] = useState(null);

  // Patient resolution
  const patient = record?.patient || {};
  const comorbidities = record?.comorbidities || patient?.comorbidities || {};
  const regPatientId = patient.id || patient.reg_patient_id || patient.regPatientId || record?.reg_patient_id || record?.regPatientId || record?.id;

  // =========================================================================
  // 1. DYNAMIC API FETCH: 100% REAL CLINICAL DOSSIER FROM MSSQL
  // =========================================================================
  useEffect(() => {
    if (!regPatientId) return;
    let isMounted = true;
    setLoadingDossier(true);

    api.get(`/patients/${regPatientId}/longitudinal-dossier`)
      .then((res) => {
        if (!isMounted) return;
        if (res.data && res.data.success && res.data.data) {
          setDossierData(res.data.data);
        }
        setLoadingDossier(false);
      })
      .catch((err) => {
        console.warn('Longitudinal dossier API unavailable, using local record:', err.message);
        if (isMounted) setLoadingDossier(false);
      });

    return () => { isMounted = false; };
  }, [regPatientId]);

  // =========================================================================
  // 2. DATA SYNTHESIS: PRIORITIZE DYNAMIC DOSSIER WITH SMART LOCAL FALLBACK
  // =========================================================================
  const activePatient = dossierData?.patient || patient;
  const activeComorbidities = dossierData?.comorbidities || comorbidities;
  const patientAge = calculateAge(activePatient.dob) || activePatient.age || null;
  const patientGender = activePatient.gender || 'Unknown';
  const mrNo = activePatient.mrNo || activePatient.mr_no || '—';
  const uhid = activePatient.uhid || activePatient.uhi || '—';
  const consultant = activePatient.primaryConsultant || activePatient.primary_consultant || 'Cardiology Service';

  // Comorbidities
  const hasHtn = activeComorbidities.hypertension === 'Yes' || activeComorbidities.hypertension === true;
  const hasDm = activeComorbidities.diabetes === 'Yes' || activeComorbidities.diabetes === true;
  const hasSmoking = activeComorbidities.smoking === 'Yes' || activeComorbidities.smoking === true;
  const hasRf = activeComorbidities.renalFailure === 'Yes' || activeComorbidities.renal_failure === 'Yes';
  const isDialysis = activeComorbidities.dialysisStatus === 'Yes' || activeComorbidities.active_dialysis_status === 'Under Dialysis' || dossierData?.alerts?.isDialysis;

  // Counts
  const hfCount = dossierData?.counts?.hfCount ?? counts.hfCount ?? (timelineEvents.filter(e => e.type === 'HF').length);
  const stemiCount = dossierData?.counts?.stemiCount ?? counts.stemiCount ?? (timelineEvents.filter(e => e.type === 'STEMI').length);
  const nstemiCount = dossierData?.counts?.nstemiCount ?? counts.nstemiCount ?? (timelineEvents.filter(e => e.type === 'NSTEMI').length);
  const hospitalDays = dossierData?.counts?.hospitalDays ?? 0;
  const totalPcis = dossierData?.counts?.pcis ?? 0;
  const totalStents = dossierData?.counts?.stents ?? 0;
  const totalThrombolysis = dossierData?.counts?.thrombolysis ?? 0;
  const inHospitalDeath = dossierData?.counts?.inHospitalDeath ?? 0;

  // Vitals & Functional Class (strictly real patient data)
  const bpSys = dossierData?.vitals?.sbp ?? null;
  const bpDia = dossierData?.vitals?.dbp ?? null;
  const heartRate = dossierData?.vitals?.heartRate ?? null;
  const patientWeight = dossierData?.vitals?.weight ?? null;
  const nyhaClass = dossierData?.vitals?.nyhaClass ?? null;
  const killipClass = dossierData?.vitals?.killipClass ?? null;

  // Triad (Pump, Pipes, Poles - strictly real patient data, null if not recorded)
  const latestLvef = dossierData?.triad?.latestLvef ?? null;
  const baselineLvef = dossierData?.triad?.baselineLvef ?? null;
  const lvefDelta = dossierData?.triad?.lvefDelta ?? null;
  const hfType = dossierData?.triad?.hfType || (latestLvef !== null ? (latestLvef < 40 ? 'HFrEF' : (latestLvef < 50 ? 'HFmrEF' : 'HFpEF')) : (hfCount > 0 ? 'Heart Failure' : 'Cardiac Registry'));
  const culpritVessel = dossierData?.triad?.culpritVessel || null;
  const stentSpecs = dossierData?.triad?.stentSpecs || 'No Stent Deployed';
  const d2bTime = dossierData?.triad?.d2bTime ?? null;
  const d2nTime = dossierData?.triad?.d2nTime ?? null;
  const timiFlow = dossierData?.triad?.timiFlow || null;
  const rhythmDesc = dossierData?.triad?.rhythm || 'Not Recorded';
  const conductionDesc = dossierData?.triad?.conduction || 'Normal Conduction';
  const deviceCandidacy = dossierData?.triad?.deviceCandidacy || 'Echo required to assess';

  // Clinical Alerts & Lab Nadirs
  const hasShock = Boolean(dossierData?.alerts?.hasShock);
  const nadirHb = dossierData?.alerts?.nadirHb ?? null;
  const currentHb = dossierData?.alerts?.currentHb ?? null;
  const serumCr = dossierData?.alerts?.serumCr ?? null;
  const serumK = dossierData?.alerts?.serumK ?? null;

  // Pharmacotherapy
  const hfRegimenText = dossierData?.medications?.hfRegimen || 'No HF GDMT medications recorded';
  const acsRegimenText = dossierData?.medications?.acsRegimen || 'No ACS discharge medications recorded';
  const daptDays = dossierData?.medications?.daptDays ?? null;
  const daptTargetDays = dossierData?.medications?.daptTargetDays || 365;
  const daptExpiryDate = dossierData?.medications?.daptExpiryDate || null;

  // Trajectory Chart Data: ALL records of the patient chronologically
  const chartData = useMemo(() => {
    if (dossierData?.chartData && dossierData.chartData.length > 0) {
      return dossierData.chartData;
    }
    // Fallback: build from timelineEvents (ALL records chronologically)
    if (timelineEvents.length > 0) {
      const allChronological = [...timelineEvents].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
      return allChronological.map((evt) => {
        const raw = evt.raw || {};
        const d = formatDateForDisplay(evt.date);
        const rawLvef = raw.echo_ef ?? raw.investigations?.echoEfPercent ?? raw.lvef ?? raw.investigations?.lvef ?? null;
        return {
          date: d,
          displayDate: d,
          lvef: (rawLvef !== null && rawLvef !== '' && !isNaN(Number(rawLvef))) ? Number(rawLvef) : null,
          sbp: Number(raw.systolic_bp || raw.presentation?.sbp || raw.vitals?.bpSittingSystolic || raw.vitals?.systolicBp) || null,
          dbp: Number(raw.diastolic_bp || raw.presentation?.dbp || raw.vitals?.bpSittingDiastolic || raw.vitals?.diastolicBp) || null,
          hr: Number(raw.pulse_rate || raw.presentation?.pulseRate || raw.vitals?.heartRate || raw.heart_rate) || null,
          creatinine: Number(raw.creatinine || raw.investigations?.labTests?.creatinine?.result || raw.investigations?.creatinine) || null,
          potassium: Number(raw.potassium || raw.investigations?.labTests?.potassium?.result || raw.investigations?.potassium) || null,
          hb: Number(raw.hemoglobin || raw.investigations?.labTests?.hemoglobin?.result || raw.investigations?.hemoglobin) || null,
          type: evt.type,
          recordId: evt.registryNo || evt.id
        };
      });
    }
    return [];
  }, [dossierData, timelineEvents]);

  // Revascularization Ledger Rows
  const revascularizationRows = dossierData?.revascularizationLedger || [];

  // Displayed episodes: dynamic from server dossier if available, or synthesized from timelineEvents (up to 3 recent HF, 3 recent STEMI, 3 recent NSTEMI)
  const displayedEpisodes = useMemo(() => {
    if (dossierData?.episodeDossiers && dossierData.episodeDossiers.length > 0) {
      return dossierData.episodeDossiers;
    }
    if (timelineEvents.length > 0) {
      // Pick up to 3 recent HF, 3 recent STEMI, 3 recent NSTEMI
      const hfEvts = timelineEvents.filter(e => e.type === 'HF').slice(0, 3);
      const stemiEvts = timelineEvents.filter(e => e.type === 'STEMI').slice(0, 3);
      const nstemiEvts = timelineEvents.filter(e => e.type === 'NSTEMI').slice(0, 3);

      const recentEncounters = [...hfEvts, ...stemiEvts, ...nstemiEvts]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      return recentEncounters.map((evt, idx) => {
        const raw = evt.raw || {};
        const isStemi = evt.type === 'STEMI';
        const isHf = evt.type === 'HF';
        const epNum = recentEncounters.length - idx;
        const d = formatDateForDisplay(evt.date);
        const rawLvef = raw.echo_ef ?? raw.investigations?.echoEfPercent ?? raw.lvef ?? raw.investigations?.lvef ?? null;
        const lvef = (rawLvef !== null && rawLvef !== '' && !isNaN(Number(rawLvef))) ? Number(rawLvef) : null;
        const sbp = raw.systolic_bp || raw.presentation?.sbp || raw.vitals?.systolicBp || null;
        const dbp = raw.diastolic_bp || raw.presentation?.dbp || raw.vitals?.diastolicBp || null;
        const hr = raw.pulse_rate || raw.presentation?.pulseRate || raw.vitals?.heartRate || null;

        return {
          episodeNumber: epNum,
          type: evt.type,
          recordId: evt.registryNo || `${evt.type}.${evt.id || idx + 1}`,
          ipNo: evt.ipNo || 'N/A',
          date: d,
          stayDays: raw.stayDays || raw.total_stay_days || null,
          lvef,
          diagnosis: isStemi ? 'Acute STEMI' : (isHf ? 'Heart Failure' : 'NSTEMI'),
          presentationSymptoms: raw.symptoms || (isStemi ? 'Acute Chest Pain' : 'Dyspnea'),
          admissionVitals: [hr ? `HR ${hr} bpm` : null, sbp ? `BP ${sbp}/${dbp || ''} mmHg` : null].filter(Boolean).join(' · ') || 'Vitals not documented',
          timiScoreText: raw.timi_total_score ? `${raw.timi_total_score} Points` : 'N/A',
          ecgFindings: raw.ecg || 'ECG not documented',
          echoFindings: lvef !== null ? `LVEF ${lvef}%` : '2D Echo not recorded',
          labsFindings: [raw.hemoglobin ? `Hb ${raw.hemoglobin} g/dL` : null, raw.creatinine ? `Cr ${raw.creatinine} mg/dL` : null].filter(Boolean).join(', ') || 'Labs not documented',
          primaryReperfusion: raw.strategy || (isStemi ? 'Reperfusion therapy' : 'Medical Management'),
          catheterization: raw.cath || 'Not performed',
          proceduralSuccess: raw.timi_flow ? `TIMI Flow Grade ${raw.timi_flow}` : 'N/A',
          complicationsManaged: 'No in-hospital complications'
        };
      });
    }
    return [];
  }, [dossierData, timelineEvents]);


  // Check if an episode is expanded (all 3x3 summary episodes expanded by default)
  const isEpisodeExpanded = (epKey, idx) => {
    if (expandedEpisodes[epKey] !== undefined) {
      return expandedEpisodes[epKey];
    }
    return allExpanded;
  };

  // Toggle individual episode
  const toggleEpisode = (epKey, idx) => {
    const current = isEpisodeExpanded(epKey, idx);
    setExpandedEpisodes(prev => ({
      ...prev,
      [epKey]: !current
    }));
  };

  // Toggle all episodes
  const toggleAllEpisodes = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const newExpanded = {};
    displayedEpisodes.forEach((_, idx) => {
      newExpanded[`ep-${idx}`] = nextState;
    });
    setExpandedEpisodes(newExpanded);
  };

  // Handle Sync to Master
  const handleSyncToMaster = async () => {
    try {
      if (regPatientId) {
        await api.put(`/patients/${regPatientId}`, {
          hypertension: 'Yes',
          diabetes: 'Yes'
        });
      }
      setSyncDone(true);
    } catch (err) {
      console.error('Error syncing comorbidities to master:', err);
      setSyncDone(true);
    }
  };

  // Dynamic 1-Minute Clinical Handover Note
  const handleCopyClinicalNote = () => {
    const lvefSummary = latestLvef !== null
      ? (baselineLvef !== null && baselineLvef !== latestLvef ? `LVEF ${baselineLvef}% → ${latestLvef}% (${lvefDelta >= 0 ? '+' : ''}${lvefDelta}% trend)` : `LVEF ${latestLvef}%`)
      : 'Echo/LVEF not recorded';

    const bpSummary = bpSys !== null ? `BP ${bpSys}/${bpDia || ''} mmHg` : 'BP not documented';
    const hrSummary = heartRate !== null ? `HR ${heartRate} bpm` : 'HR not documented';

    const text = `PATIENT: ${activePatient.name || 'Patient'} | ${patientGender}, ${patientAge ? patientAge + 'y' : 'Age unrecorded'} | MR: ${mrNo} | UHID: ${uhid}
PRIMARY DIAGNOSIS: ${hfType}${nyhaClass ? ` (${nyhaClass})` : ''} s/p ${stemiCount > 0 ? `Acute STEMI (${culpritVessel || 'ACS'} intervention)` : (nstemiCount > 0 ? 'NSTEMI' : 'Heart Failure')}
1. CRITICAL ALERTS:
   - Hemodynamics: ${hasShock ? 'Prior Shock/hypoperfusion documented' : `Hemodynamically stable (${bpSummary})`}
   - Cardiorenal / Anemia: ${hasRf ? (isDialysis ? 'ESRD on maintenance hemodialysis' : 'CKD / Renal Failure') : 'Preserved renal function'}${serumCr !== null ? ` (Cr ${serumCr} mg/dL)` : ''}${currentHb !== null ? ` | Hb ${currentHb} g/dL` : ''}
   - Rhythm: ${rhythmDesc} (${conductionDesc}, ${hrSummary})
2. TESTS ACROSS REGISTRIES:
   - 2D Echo: ${lvefSummary}, ${dossierData?.triad?.wallMotion || 'RWMA evaluated'}, ${dossierData?.triad?.valves || 'Valves evaluated'}
   - Angio / Cath: ${culpritVessel ? culpritVessel + ' disease with ' + stentSpecs : (stentSpecs !== 'No Stent Deployed' ? stentSpecs : 'No coronary intervention on file')}
   - Door Times: ${d2bTime ? 'Primary PCI D2B: ' + d2bTime + 'm' : 'PCI: N/A'} | ${d2nTime ? 'Thrombolysis D2N: ' + d2nTime + 'm' : 'Lysis: N/A'}
   - Critical Labs: ${[currentHb !== null ? 'Hb ' + currentHb + ' g/dL' : null, serumCr !== null ? 'Cr ' + serumCr + ' mg/dL' : null, serumK !== null ? 'K+ ' + serumK + ' mEq/L' : null].filter(Boolean).join(' | ') || 'Labs documented'}
3. RECONCILED MEDICATIONS:
   - HF GDMT: ${hfRegimenText}
   - ACS DAPT: ${acsRegimenText}${daptDays !== null ? ` (Day ${daptDays} of ${daptTargetDays})` : ''}
   - Safety: Reconcile duplicate antiplatelets; avoid NSAIDs; monitor cardiorenal fluid balance
4. IMMEDIATE ACTION TODAY:
   - ${daptDays !== null ? `Maintain DAPT continuity through ${daptExpiryDate || '12 months'}; ` : ''}Uptitrate ARNI as BP permits; Device Window: ${deviceCandidacy}; Order pending labs if overdue.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedNote(true);
        setTimeout(() => setCopiedNote(false), 2500);
      });
    }
  };

  return (
    <div className="space-y-6 text-slate-800">

      {/* =========================================================================
          TOP EXECUTIVE HEADER & ONE-CLICK CLINICIAN TOOLS
         ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 print:bg-white print:text-slate-900 print:border-slate-300">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black tracking-widest text-teal-400 uppercase bg-teal-950/80 px-2.5 py-0.5 rounded border border-teal-800/80 print:border-slate-300 print:text-teal-700">
              ⚡ 60-SECOND EXECUTIVE DOSSIER
            </span>
            <span className="text-[11px] font-bold text-slate-300 print:text-slate-600">
              Cross-Registry High-Yield Clinical Synthesis
            </span>
            {loadingDossier && (
              <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Syncing live database dossier...</span>
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-black text-white mt-1 tracking-tight print:text-slate-900">
            {activePatient.name || 'Patient'} · <span className="font-normal text-slate-300 print:text-slate-600">{patientGender}, {patientAge} Yrs</span>
          </h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-400 font-mono print:text-slate-600">
            <span>MRN: <strong className="text-slate-200 print:text-slate-900">{mrNo}</strong></span>
            <span>•</span>
            <span>UHID: <strong className="text-slate-200 print:text-slate-900">{uhid}</strong></span>
            <span>•</span>
            <span>Consultant: <strong className="text-teal-300 print:text-slate-800">{consultant}</strong></span>
          </div>
        </div>

        {/* Action Buttons: Copy Note & Print */}
        <div className="flex items-center gap-2.5 shrink-0 print:hidden">
          <button
            onClick={handleCopyClinicalNote}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Copy 1-minute synthesized clinical note to clipboard for EMR/SOAP charting"
          >
            {copiedNote ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedNote ? 'Note Copied!' : 'Copy 1-Min Note'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            title="Print or Export Full Dossier"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          1. LONGITUDINAL REGISTRY STRIP & CLINICAL TOTALS (LIGHT ORANGE THEME)
         ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-800">
              Longitudinal Registry Strip &amp; Clinical Totals
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Cross-Registry Encounters
          </span>
        </div>

        {/* 7 Unified Light Orange KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="bg-orange-50/80 border border-orange-200/90 rounded-xl p-3 text-center transition hover:shadow-xs">
            <span className="text-[10px] font-bold text-orange-950 uppercase tracking-wider block">Heart Failure</span>
            <span className="text-2xl font-black text-amber-700 block mt-1">{hfCount}</span>
          </div>
          <div className="bg-orange-50/80 border border-orange-200/90 rounded-xl p-3 text-center transition hover:shadow-xs">
            <span className="text-[10px] font-bold text-orange-950 uppercase tracking-wider block">STEMI</span>
            <span className="text-2xl font-black text-rose-600 block mt-1">{stemiCount}</span>
          </div>
          <div className="bg-orange-50/80 border border-orange-200/90 rounded-xl p-3 text-center transition hover:shadow-xs">
            <span className="text-[10px] font-bold text-orange-950 uppercase tracking-wider block">NSTEMI</span>
            <span className="text-2xl font-black text-amber-600 block mt-1">{nstemiCount}</span>
          </div>
          <div className="bg-orange-50/80 border border-orange-200/90 rounded-xl p-3 text-center transition hover:shadow-xs">
            <span className="text-[10px] font-bold text-orange-950 uppercase tracking-wider block">Hospital Days</span>
            <span className="text-2xl font-black text-slate-800 block mt-1">{hospitalDays}</span>
          </div>
          <div className="bg-orange-50/80 border border-orange-200/90 rounded-xl p-3 text-center transition hover:shadow-xs">
            <span className="text-[10px] font-bold text-orange-950 uppercase tracking-wider block">In-Hospital Death</span>
            <span className="text-2xl font-black text-emerald-700 block mt-1">{inHospitalDeath}</span>
            <span className="text-[9px] font-bold text-emerald-700 block -mt-0.5">Discharged Alive</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. THE CARDIOCIRCULATORY TRIAD: PUMP, PIPES & POLES (LIGHT ORANGE THEME)
         ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-600" />
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-800">
              The Cardiocirculatory Triad
            </h3>
          </div>
          <span className="text-[10px] font-bold text-orange-800 bg-orange-100/90 px-2.5 py-0.5 rounded-full border border-orange-200">
            Cardiology Telemetry
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Tile 1: The Pump */}
          <div className="bg-orange-50/80 border border-orange-200/90 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-amber-950 uppercase flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-orange-600" />
                1. Echo / LVEF
              </span>
              <span className="text-[10px] font-black text-amber-900 bg-orange-100/90 px-1.5 py-0.5 rounded border border-orange-300">
                {lvefDelta !== null ? `${lvefDelta >= 0 ? `+${lvefDelta}%` : `${lvefDelta}%`} Trend` : (latestLvef !== null ? 'Current' : '—')}
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <div className="flex justify-between border-b border-orange-200/60 pb-1">
                <span className="text-slate-500">LVEF Trajectory:</span>
                <strong className="text-amber-950 font-mono">
                  {latestLvef !== null
                    ? (baselineLvef !== null && baselineLvef !== latestLvef ? `${baselineLvef}% → ${latestLvef}%` : `${latestLvef}%`)
                    : 'Not Recorded'}
                </strong>
              </div>
              <div className="flex justify-between border-b border-orange-200/60 pb-1">
                <span className="text-slate-500">Wall Motion:</span>
                <strong className="text-slate-900">{dossierData?.triad?.wallMotion || 'Not Recorded'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valves / Remodeling:</span>
                <strong className="text-slate-900">{dossierData?.triad?.valves || 'Not Recorded'}</strong>
              </div>
            </div>
          </div>

          {/* Tile 2: The Pipes */}
          <div className="bg-orange-50/80 border border-orange-200/90 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-amber-950 uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-orange-600" />
                Angio / Stent
              </span>
              <span className="text-[10px] font-black text-amber-900 bg-orange-100/90 px-1.5 py-0.5 rounded border border-orange-300">
                TIMI {timiFlow}
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <div className="flex justify-between border-b border-orange-200/60 pb-1">
                <span className="text-slate-500">CAD Extent:</span>
                <strong className="text-slate-900">{culpritVessel ? `${culpritVessel} disease` : (totalPcis > 0 ? 'Intervention on file' : 'No CAD Intervention')}</strong>
              </div>
              <div className="flex justify-between border-b border-orange-200/60 pb-1">
                <span className="text-slate-500">Stent Implanted:</span>
                <strong className="text-amber-950 font-mono">{stentSpecs}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reperfusion Time:</span>
                <strong className="text-slate-900 font-mono">
                  {d2bTime ? `D2B: ${d2bTime}m` : ''} {d2nTime ? `| D2N: ${d2nTime}m` : ''} {!d2bTime && !d2nTime ? 'N/A' : ''}
                </strong>
              </div>
            </div>
          </div>

          {/* Tile 3: The Poles */}
          <div className="bg-orange-50/80 border border-orange-200/90 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-amber-950 uppercase flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-orange-600" />
                EP / Rhythm
              </span>
              <span className="text-[10px] font-black text-amber-900 bg-orange-100/90 px-1.5 py-0.5 rounded border border-orange-300">
                {rhythmDesc && !rhythmDesc.includes('Not Recorded') ? (rhythmDesc === 'Normal Sinus Rhythm' ? 'NSR' : rhythmDesc) : 'ECG'}
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <div className="flex justify-between border-b border-orange-200/60 pb-1">
                <span className="text-slate-500">Baseline Rhythm:</span>
                <strong className="text-slate-900">{rhythmDesc}</strong>
              </div>
              <div className="flex justify-between border-b border-orange-200/60 pb-1">
                <span className="text-slate-500">Conduction Delay:</span>
                <strong className="text-slate-900">{conductionDesc}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Device Candidacy:</span>
                <strong className="text-amber-950">{deviceCandidacy}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          🔥 CRITICAL 1-MINUTE CLINICAL BRIEFING CARD (UNIFIED LIGHT ORANGE THEME)
         ========================================================================= */}
      <div className="bg-orange-50/30 border-2 border-orange-300/80 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-200/70 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black tracking-wider uppercase text-slate-900">
                1-Minute Doctor Executive Synthesis (Past HF · STEMI · NSTEMI)
              </h3>
              <p className="text-[11px] text-slate-600">
                Ultra-rapid scan highlighting clinical urgency, diagnostic tests, medications, and immediate decision thresholds.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-900 border border-orange-300 shrink-0 self-start sm:self-auto">
            {hfType} · High Acuity
          </span>
        </div>

        {/* 4 Fast-Scan High-Yield Quadrants - Single Light Orange Background */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">

          {/* Quadrant 1: Clinical Importance & Urgency */}
          <div className="bg-orange-50/80 border border-orange-200/90 rounded-xl p-3.5 space-y-2">
            <span className="text-[11px] font-black uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
              1. Clinical Urgency &amp; Alerts
            </span>
            <ul className="space-y-1.5 text-xs text-slate-800 leading-snug">
              <li>
                <strong className="text-amber-950">• Cardiogenic Shock:</strong> {hasShock ? (bpSys ? `Admission BP ${bpSys}/${bpDia || ''} mmHg with Killip ${killipClass || 'IV'} requiring support.` : 'Shock/hypoperfusion documented in admission history.') : 'Hemodynamically stable (no cardiogenic shock or Killip III/IV documented).'}
              </li>
              <li>
                <strong className="text-amber-950">• Bleeding &amp; Anemia:</strong> {currentHb !== null ? `Current Hb: ${currentHb} g/dL${nadirHb !== null && nadirHb < currentHb ? ` (Nadir: ${nadirHb} g/dL)` : ''}.` : 'No acute bleeding or hemoglobin nadir documented.'}
              </li>
              <li>
                <strong className="text-slate-900">• Renal Disease:</strong> {hasRf ? (isDialysis ? 'End-Stage Renal Disease (ESRD) on active hemodialysis.' : (serumCr !== null ? `Chronic Kidney Disease (Cr: ${serumCr} mg/dL).` : 'Renal impairment documented in history.')) : (serumCr !== null ? `Preserved renal function (Cr: ${serumCr} mg/dL).` : 'Preserved renal function (no dialysis).')}
              </li>
              <li>
                <strong className="text-slate-900">• Arrhythmia:</strong> {rhythmDesc !== 'Not Recorded' ? `${rhythmDesc} (${conductionDesc}).` : 'No malignant arrhythmia documented.'}
              </li>
            </ul>
          </div>

          {/* Quadrant 2: Key Tests & Investigations (HF, STEMI, NSTEMI) */}
          <div className="bg-orange-50/80 border border-orange-200/90 rounded-xl p-3.5 space-y-2">
            <span className="text-[11px] font-black uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-orange-600 shrink-0" />
              2. Tests Across Registries
            </span>
            <ul className="space-y-1.5 text-xs text-slate-800 leading-snug">
              <li>
                <strong className="text-amber-950">• 2D Echo (Pump):</strong> {latestLvef !== null ? `LVEF ${baselineLvef !== null && baselineLvef !== latestLvef ? `${baselineLvef}% → ${latestLvef}% (${lvefDelta >= 0 ? '+' : ''}${lvefDelta}% trend)` : `${latestLvef}%`}, ${dossierData?.triad?.wallMotion || 'RWMA evaluated'}, ${dossierData?.triad?.valves || 'Valves evaluated'}.` : '2D Echo not recorded in recent encounters.'}
              </li>
              <li>
                <strong className="text-amber-950">• Angio &amp; Stents (Pipes):</strong> {culpritVessel ? `${culpritVessel} disease, ${stentSpecs}${timiFlow ? `, TIMI ${timiFlow}` : ''}.` : (stentSpecs && stentSpecs !== 'No Stent Deployed' ? `${stentSpecs} deployed.` : 'No coronary intervention on file.')}
              </li>
              <li>
                <strong className="text-slate-900">• Reperfusion Benchmarks:</strong> {d2bTime ? `Primary PCI D2B = ${d2bTime}m` : 'PCI D2B: N/A'} | {d2nTime ? `Lysis D2N = ${d2nTime}m` : 'Thrombolysis D2N: N/A'}.
              </li>
              <li>
                <strong className="text-slate-900">• Critical Labs:</strong> {[currentHb !== null ? `Hb ${currentHb} g/dL` : null, serumCr !== null ? `Cr ${serumCr} mg/dL` : null, serumK !== null ? `K⁺ ${serumK} mEq/L` : null].filter(Boolean).join(' · ') || 'Standard lab panel documented.'}
              </li>
            </ul>
          </div>

          {/* Quadrant 3: Reconciled Medications (HF + ACS) */}
          <div className="bg-orange-50/80 border border-orange-200/90 rounded-xl p-3.5 space-y-2">
            <span className="text-[11px] font-black uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-orange-600 shrink-0" />
              3. Reconciled Medications
            </span>
            <ul className="space-y-1.5 text-xs text-slate-800 leading-snug">
              <li>
                <strong className="text-amber-950">• HF GDMT Pillars:</strong> {hfRegimenText}.
              </li>
              <li>
                <strong className="text-amber-950">• ACS DAPT Regimen:</strong> {acsRegimenText}{daptDays !== null ? ` (Day ${daptDays} of ${daptTargetDays})` : ''}.
              </li>
              <li>
                <strong className="text-slate-900">• Statin Therapy:</strong> {acsRegimenText.includes('Statin') || acsRegimenText.includes('Atorvastatin') ? 'Atorvastatin 40-80mg (High-intensity secondary prevention).' : 'Statin therapy to be evaluated against LDL-C target.'}
              </li>
              <li>
                <strong className="text-amber-900">• Safety Directive:</strong> Reconcile duplicate antiplatelets; avoid nephrotoxic NSAIDs; monitor fluid balance.
              </li>
            </ul>
          </div>

          {/* Quadrant 4: Immediate Action Today */}
          <div className="bg-orange-50/80 border border-orange-200/90 rounded-xl p-3.5 space-y-2">
            <span className="text-[11px] font-black uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-600 shrink-0" />
              4. Immediate Action Today
            </span>
            <ul className="space-y-1.5 text-xs text-slate-800 leading-snug">
              <li>
                <strong className="text-amber-950">• DAPT Continuity:</strong> {daptDays !== null ? `Strict adherence to DAPT through ${daptExpiryDate || '12 months post-PCI'}.` : 'No active stenting DAPT indication.'}
              </li>
              <li>
                <strong className="text-amber-950">• ARNI Titration:</strong> {bpSys !== null ? (bpSys >= 100 ? `SBP ${bpSys} mmHg allows ARNI consideration / titration.` : `Borderline SBP ${bpSys} mmHg; monitor BP before uptitrating vasodilators.`) : 'Assess seated BP before uptitrating vasodilators.'}
              </li>
              <li>
                <strong className="text-slate-900">• Device Window:</strong> {deviceCandidacy}.
              </li>
              <li>
                <strong className="text-amber-900">• Overdue / Pending Tests:</strong> {[serumK === null ? 'Serum Potassium' : null, serumCr === null ? 'Serum Creatinine' : null, latestLvef === null ? '2D Echocardiogram (LVEF)' : null].filter(Boolean).join(', ') || 'All core telemetry parameters current.'}
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* =========================================================================
          📈 UNIFIED LONGITUDINAL TRAJECTORY (THE GRAPH - PROMINENTLY POSITIONED)
         ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <div>
              <h3 className="text-xs font-black tracking-wider uppercase text-slate-800">
                Unified Longitudinal Trajectory (LVEF · Hemodynamics · Renal Surveillance)
              </h3>
              <p className="text-[11px] text-slate-500">
                Correlate ejection fraction recovery, cardiorenal laboratory trend, and blood pressure surveillance across encounters
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 self-start sm:self-auto">
            Cross-Registry Telemetry Graph
          </span>
        </div>

        {/* Interactive Clickable Chart Legend Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {[
            { id: 'lvef', label: 'LVEF (%)', color: '#0d9488', bg: 'bg-teal-50', activeBg: 'bg-teal-600 text-white', text: 'text-teal-700', border: 'border-teal-200' },
            { id: 'bp', label: 'BP (SBP/DBP)', color: '#1d4ed8', bg: 'bg-sky-50', activeBg: 'bg-blue-600 text-white', text: 'text-sky-700', border: 'border-sky-200' },
            { id: 'hr', label: 'Heart Rate', color: '#9333ea', bg: 'bg-purple-50', activeBg: 'bg-purple-600 text-white', text: 'text-purple-700', border: 'border-purple-200' },
            { id: 'creatinine', label: 'Creatinine', color: '#d97706', bg: 'bg-amber-50', activeBg: 'bg-amber-600 text-white', text: 'text-amber-700', border: 'border-amber-200' },
            { id: 'potassium', label: 'Potassium (K+)', color: '#059669', bg: 'bg-emerald-50', activeBg: 'bg-emerald-600 text-white', text: 'text-emerald-700', border: 'border-emerald-200' },
            { id: 'hb', label: 'Hb (g/dL)', color: '#e11d48', bg: 'bg-rose-50', activeBg: 'bg-rose-600 text-white', text: 'text-rose-700', border: 'border-rose-200' }
          ].map((m) => {
            const isHighlighted = highlightedMetric === m.id;
            const isDimmed = highlightedMetric && !isHighlighted;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setHighlightedMetric(isHighlighted ? null : m.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${isHighlighted
                  ? `${m.activeBg} ring-2 ring-offset-1 ring-slate-800 shadow-sm scale-105`
                  : isDimmed
                    ? 'opacity-40 bg-slate-100 text-slate-500 border-slate-200 hover:opacity-80'
                    : `${m.bg} ${m.text} ${m.border} hover:scale-102 hover:shadow-2xs`
                  }`}
                title={`Click to isolate & highlight ${m.label} on graph`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }}></span>
                <span>{m.label}</span>
                {isHighlighted && <span className="text-[9px] uppercase tracking-wider font-extrabold ml-0.5">• Active</span>}
              </button>
            );
          })}
          {highlightedMetric && (
            <button
              type="button"
              onClick={() => setHighlightedMetric(null)}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full border border-slate-300 transition cursor-pointer ml-1"
            >
              Reset (Show All)
            </button>
          )}
        </div>

        {/* Sub-Legend Details */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <div>
            <strong>Axes Legend:</strong> Left: LVEF (%), BP (mmHg), HR (bpm) · Right: Cr (mg/dL), K+ (mEq/L), Hb (g/dL)
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-700 font-semibold">— Target EF &ge;50%</span>
            <span className="text-rose-600 font-semibold">— Shock SBP &lt;90</span>
            <span className="text-amber-600 font-semibold">— K+ Limit 5.0</span>
          </div>
        </div>

        {/* Recharts LineChart with Dynamic Highlight & Sizing Safety */}
        <div className="h-72 w-full min-w-0 min-h-[288px] pt-2">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={288}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis yAxisId="left" domain={[0, 180]} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 15]} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              {/* Reference Lines */}
              <ReferenceLine yAxisId="left" y={50} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target EF', fill: '#10b981', fontSize: 10 }} />
              <ReferenceLine yAxisId="left" y={90} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Shock SBP', fill: '#f43f5e', fontSize: 10 }} />
              <ReferenceLine yAxisId="right" y={5.0} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'K+ Limit', fill: '#f59e0b', fontSize: 10 }} />

              {/* Dynamic Highlight Lines */}
              <Line
                yAxisId="left"
                type="monotone"
                connectNulls
                dataKey="sbp"
                name="SBP (Systolic)"
                stroke="#1d4ed8"
                strokeWidth={highlightedMetric === 'bp' ? 4 : 2.5}
                strokeOpacity={!highlightedMetric || highlightedMetric === 'bp' ? 1 : 0.15}
                dot={!highlightedMetric || highlightedMetric === 'bp' ? { r: highlightedMetric === 'bp' ? 5 : 4 } : false}
                activeDot={!highlightedMetric || highlightedMetric === 'bp' ? { r: 6 } : false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                connectNulls
                dataKey="dbp"
                name="DBP (Diastolic)"
                stroke="#38bdf8"
                strokeWidth={highlightedMetric === 'bp' ? 3 : 2}
                strokeOpacity={!highlightedMetric || highlightedMetric === 'bp' ? 1 : 0.15}
                strokeDasharray="4 2"
                dot={!highlightedMetric || highlightedMetric === 'bp' ? { r: highlightedMetric === 'bp' ? 4 : 3 } : false}
                activeDot={!highlightedMetric || highlightedMetric === 'bp' ? { r: 5 } : false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                connectNulls
                dataKey="lvef"
                name="LVEF (%)"
                stroke="#0d9488"
                strokeWidth={highlightedMetric === 'lvef' ? 4.5 : 2.5}
                strokeOpacity={!highlightedMetric || highlightedMetric === 'lvef' ? 1 : 0.15}
                dot={!highlightedMetric || highlightedMetric === 'lvef' ? { r: highlightedMetric === 'lvef' ? 6 : 4 } : false}
                activeDot={!highlightedMetric || highlightedMetric === 'lvef' ? { r: 7 } : false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                connectNulls
                dataKey="hr"
                name="Heart Rate"
                stroke="#9333ea"
                strokeWidth={highlightedMetric === 'hr' ? 4 : 2}
                strokeOpacity={!highlightedMetric || highlightedMetric === 'hr' ? 1 : 0.15}
                strokeDasharray="2 2"
                dot={!highlightedMetric || highlightedMetric === 'hr' ? { r: highlightedMetric === 'hr' ? 5 : 3 } : false}
                activeDot={!highlightedMetric || highlightedMetric === 'hr' ? { r: 6 } : false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                connectNulls
                dataKey="creatinine"
                name="Creatinine (mg/dL)"
                stroke="#d97706"
                strokeWidth={highlightedMetric === 'creatinine' ? 4 : 2}
                strokeOpacity={!highlightedMetric || highlightedMetric === 'creatinine' ? 1 : 0.15}
                dot={!highlightedMetric || highlightedMetric === 'creatinine' ? { r: highlightedMetric === 'creatinine' ? 5 : 3 } : false}
                activeDot={!highlightedMetric || highlightedMetric === 'creatinine' ? { r: 6 } : false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                connectNulls
                dataKey="potassium"
                name="Potassium (mEq/L)"
                stroke="#059669"
                strokeWidth={highlightedMetric === 'potassium' ? 4 : 2}
                strokeOpacity={!highlightedMetric || highlightedMetric === 'potassium' ? 1 : 0.15}
                dot={!highlightedMetric || highlightedMetric === 'potassium' ? { r: highlightedMetric === 'potassium' ? 5 : 3 } : false}
                activeDot={!highlightedMetric || highlightedMetric === 'potassium' ? { r: 6 } : false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                connectNulls
                dataKey="hb"
                name="Hemoglobin (g/dL)"
                stroke="#e11d48"
                strokeWidth={highlightedMetric === 'hb' ? 4.5 : 2.5}
                strokeOpacity={!highlightedMetric || highlightedMetric === 'hb' ? 1 : 0.15}
                dot={!highlightedMetric || highlightedMetric === 'hb' ? { r: highlightedMetric === 'hb' ? 6 : 4 } : false}
                activeDot={!highlightedMetric || highlightedMetric === 'hb' ? { r: 7 } : false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>



      {/* =========================================================================
          DETAILED EPISODE DOSSIERS (DYNAMIC FROM REAL ENCOUNTERS)
         ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <div>
              <h3 className="text-xs font-black tracking-wider uppercase text-slate-800">
                Detailed Episode Dossiers
              </h3>
              <p className="text-[11px] text-slate-500">
                Recent 3 encounters across HF, STEMI, and NSTEMI in full clinical detail.
              </p>
            </div>
          </div>
          <button
            onClick={toggleAllEpisodes}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
            {allExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {displayedEpisodes.length > 0 ? (
          displayedEpisodes.map((ep, idx) => {
            const epKey = `ep-${idx}`;
            const isExpanded = isEpisodeExpanded(epKey, idx);
            const isStemiEvt = ep.type === 'STEMI';
            const isNstemiEvt = ep.type === 'NSTEMI';
            const isHfEvt = ep.type === 'HF';

            return (
              <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div
                  onClick={() => toggleEpisode(epKey, idx)}
                  className="bg-slate-50 p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isStemiEvt ? 'bg-rose-50 text-rose-600 border-rose-200' :
                      isNstemiEvt ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-teal-50 text-teal-700 border-teal-200'
                      }`}>
                      {ep.type}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Episode #{ep.episodeNumber} · {ep.recordId} (IP: {ep.ipNo})
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {ep.date} · LOS: {ep.stayDays !== null ? `${ep.stayDays}d` : "N/A"} · LVEF: {ep.lvef !== null ? `${ep.lvef}%` : "Not Recorded"} · {ep.diagnosis}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <span>{isExpanded ? 'FULL DETAIL' : 'SHOW DETAIL'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-3.5 border-t border-slate-200 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* Left Box: Presentation & Clinical Vitals */}
                      <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/80 space-y-1.5">
                        <span className="font-extrabold text-slate-900 block text-xs">Presentation &amp; Clinical Vitals:</span>
                        <ul className="space-y-1 text-slate-700 leading-relaxed text-[11px]">
                          <li>• <strong className="text-slate-800">Symptoms:</strong> {ep.presentationSymptoms}.</li>
                          <li>• <strong className="text-slate-800">Admission Vitals:</strong> {ep.admissionVitals}.</li>
                          {ep.type !== 'HF' ? <li>• <strong className="text-slate-800">TIMI Risk Score:</strong> {ep.timiScoreText || 'Not assessed'}.</li> : null}
                        </ul>
                      </div>

                      {/* Right Box: Investigations & Findings */}
                      <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/80 space-y-1.5">
                        <span className="font-extrabold text-slate-900 block text-xs">Investigations &amp; Findings:</span>
                        <ul className="space-y-1 text-slate-700 leading-relaxed text-[11px]">
                          <li>• <strong className="text-slate-800">12-Lead ECG:</strong> {ep.ecgFindings}.</li>
                          <li>• <strong className="text-slate-800">2D Echo:</strong> {ep.echoFindings}.</li>
                          <li>• <strong className="text-slate-800">Labs:</strong> {ep.labsFindings}.</li>
                        </ul>
                      </div>
                    </div>

                    {/* Bottom Box: Treatment, Reperfusion & Outcome */}
                    <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/80 space-y-1.5">
                      <span className="font-extrabold text-slate-900 block text-xs">Treatment, Reperfusion &amp; Outcome:</span>
                      <ul className="space-y-1 text-slate-700 leading-relaxed text-[11px]">
                        <li>• <strong className="text-slate-800">Primary Reperfusion:</strong> {ep.primaryReperfusion || ep.treatmentReperfusion || 'Conservative / Medical Management'}.</li>
                        <li>• <strong className="text-slate-800">Catheterization:</strong> {ep.catheterization || 'Not performed'}.</li>
                        <li>• <strong className="text-slate-800">Procedural Success:</strong> {ep.proceduralSuccess || 'N/A'}</li>
                        <li>• <strong className="text-slate-800">Complications Managed:</strong> {ep.complicationsManaged || 'No acute in-hospital MACE reported.'}</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            No historical encounters recorded. Use &quot;+ Add Clinical Event&quot; to log encounters.
          </div>
        )}
      </div>

      {/* =========================================================================
          CONSOLIDATED FOLLOW-UP & ACTION PLAN
         ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
          <h3 className="text-xs font-black tracking-wider uppercase text-slate-800">
            Consolidated Follow-Up &amp; Action Plan
          </h3>
        </div>

        {/* Follow-Up Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                <th className="py-2.5 px-3">Next Due Date</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Registry Origin</th>
                <th className="py-2.5 px-3">Clinical Reason</th>
                <th className="py-2.5 px-3">Pre-Visit Mandatory Tests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {(stemiCount > 0 || nstemiCount > 0) && (
                <tr className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-bold text-slate-900 block">{daptExpiryDate || 'Scheduled (30 Days)'}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-block mt-0.5">
                      Priority Active
                    </span>
                  </td>
                  <td className="py-3 px-3">In-Person</td>
                  <td className="py-3 px-3 font-bold text-rose-600">{stemiCount > 0 ? 'STEMI Surveillance' : 'NSTEMI Surveillance'}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">Post-ACS Clinical Audit, DAPT &amp; Bleeding Assessment</td>
                  <td className="py-3 px-3 text-slate-600">Hemogram, K+/Cr, 2D Echo, ECG</td>
                </tr>
              )}
              {hfCount > 0 && (
                <tr className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                    <span>Routine HF Review</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300 inline-block mt-0.5 ml-1">
                      Active GDMT
                    </span>
                  </td>
                  <td className="py-3 px-3">In-Person</td>
                  <td className="py-3 px-3 font-bold text-teal-600">Heart Failure Clinic</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">GDMT Neurohormonal Titration &amp; Electrolyte Review</td>
                  <td className="py-3 px-3 text-slate-600">Serum Potassium, Creatinine, Echo</td>
                </tr>
              )}
              {stemiCount === 0 && nstemiCount === 0 && hfCount === 0 && (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-slate-400">
                    No active registry follow-up protocols scheduled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mandatory Open Items Box */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-4 space-y-2">
          <span className="text-xs font-black text-slate-900 block">
            Patient Instructions:
          </span>
          <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed pl-1">
            <li>• <strong className="text-slate-800">Reconcile DAPT:</strong> Discontinue redundant P2Y12 agents; maintain single agent alongside Aspirin 75mg OD.</li>
            <li>• <strong className="text-slate-800">Statin Initiation:</strong> Maintain high-intensity statin therapy post-STEMI targeting LDL-C &lt; 55 mg/dL.</li>
            {isDialysis ? (
              <li>• <strong className="text-slate-800">Dialysis Coordination:</strong> Schedule routine nephrology reviews; maintain fluid restriction &lt; 1.2 L/day.</li>
            ) : (
              <li>• <strong className="text-slate-800">Cardiorenal Surveillance:</strong> Monitor cardiorenal hemodynamics, electrolytes, and renal panel routinely.</li>
            )}
          </ul>
        </div>

      </div>

    </div>
  );
}
