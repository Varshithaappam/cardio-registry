/**
 * CARE Cardiovascular Registry - Admin Executive Dashboard
 * Unified multi-registry executive command center (Heart Failure · STEMI · NSTEMI)
 * Implemented in CARE Health System theme with complete interactive graphs powered by real database calculations.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Heart,
  Flame,
  Stethoscope,
  Activity,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle,
  FileSpreadsheet,
  Users,
  Calendar,
  Layers,
  ChevronRight,
  Download,
  Filter,
  DollarSign,
  Bed,
  RefreshCw,
  Loader2,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  LabelList
} from 'recharts';

import { fetchGdmtCohort } from '../../api/gdmtApi';
import { fetchStemiCohort, fetchNstemiCohort } from '../../api/acsApi';
import { fetchExecutiveDashboardMetrics } from '../../api/executiveDashboardApi';
import { computeAnalytics } from '../../utils/gdmtEngine';
import { computeAcsAnalytics } from '../../utils/acsEngine';
import { exportExecutiveDashboardExcel } from '../../utils/executiveExcelGenerator';

// Currency Formatter
const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '₹ —';
  return `₹ ${Number(val).toLocaleString('en-IN')}`;
};

const formatLakhOrCr = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '₹ —';
  const num = Number(val);
  if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(2)} L`;
  return `₹ ${num.toLocaleString('en-IN')}`;
};

// Basis Pill Badge (C = Current / Unique Patients, H = History Also / All Encounters, HC = Hybrid)
const BasisBadge = ({ type = 'H', compact = false }) => {
  if (type === 'C') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-extrabold tracking-wide uppercase bg-sky-50 text-sky-700 border border-sky-200 shrink-0"
        title="CURRENT: Based on unique patients / most recent clinical status"
      >
        <span>{compact ? 'C' : 'C · Current'}</span>
      </span>
    );
  }
  if (type === 'HC') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-extrabold tracking-wide uppercase bg-purple-50 text-purple-700 border border-purple-200 shrink-0"
        title="HYBRID: Chronic comorbidities Current, acute markers History Also, alive/deceased denominator Current"
      >
        <span>{compact ? 'H/C' : 'H/C · Hybrid'}</span>
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-extrabold tracking-wide uppercase bg-amber-50 text-amber-700 border border-amber-200 shrink-0"
      title="HISTORY ALSO: Based on all admissions / clinical encounters"
    >
      <span>{compact ? 'H' : 'H · History Also'}</span>
    </span>
  );
};

export default function AdminExecutiveDashboard({ onSwitchTab, initialHfCohort = [] }) {
  // Raw Cohort States
  const [hfCohort, setHfCohort] = useState(initialHfCohort || []);
  const [stemiCohort, setStemiCohort] = useState([]);
  const [nstemiCohort, setNstemiCohort] = useState([]);
  const [backendMetrics, setBackendMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(!initialHfCohort || initialHfCohort.length === 0);
  const [error, setError] = useState(null);
  const [riskRegistry, setRiskRegistry] = useState('NSTEMI');
  const [activeExecTab, setActiveExecTab] = useState('overview'); // 'overview' | 'financial'
  const [executiveViewMode, setExecutiveViewMode] = useState('summary'); // 'summary' (60-sec scan) | 'audit' (full audit)
  const [isClinicalAuditOpen, setIsClinicalAuditOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Sync initialHfCohort if it loads later or updates in Dashboard.jsx
  useEffect(() => {
    if (initialHfCohort && initialHfCohort.length > 0 && hfCohort.length === 0) {
      setHfCohort(initialHfCohort);
      setIsLoading(false);
    }
  }, [initialHfCohort, hfCohort.length]);

  // Load datasets concurrently across all clinical registries and executive metrics endpoint
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!initialHfCohort || initialHfCohort.length === 0) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const promises = [
          initialHfCohort && initialHfCohort.length > 0
            ? Promise.resolve({ data: initialHfCohort })
            : fetchGdmtCohort(),
          fetchStemiCohort(false),
          fetchNstemiCohort(),
          fetchExecutiveDashboardMetrics()
        ];

        const results = await Promise.allSettled(promises);
        if (!isMounted) return;

        const [hfRes, stemiRes, nstemiRes, execRes] = results;

        if (hfRes.status === 'fulfilled' && hfRes.value?.data && hfRes.value.data.length > 0) {
          setHfCohort(hfRes.value.data);
        } else if (initialHfCohort && initialHfCohort.length > 0) {
          setHfCohort(initialHfCohort);
        }

        if (stemiRes.status === 'fulfilled' && stemiRes.value?.data && stemiRes.value.data.length > 0) {
          setStemiCohort(stemiRes.value.data);
        }

        if (nstemiRes.status === 'fulfilled' && nstemiRes.value?.data && nstemiRes.value.data.length > 0) {
          setNstemiCohort(nstemiRes.value.data);
        }

        if (execRes.status === 'fulfilled' && execRes.value?.kpis) {
          setBackendMetrics(execRes.value);
        }
      } catch (err) {
        console.error('Error loading executive registry data:', err);
        if (isMounted) {
          setError(err.message || 'Error loading executive data');
          if (initialHfCohort && initialHfCohort.length > 0) {
            setHfCohort(initialHfCohort);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Global Filter States
  const [filters, setFilters] = useState({
    datePreset: 'All Time',
    startDate: '',
    endDate: '',
    agePreset: 'All',
    minAge: '',
    maxAge: '',
    gender: 'All',
    vitalStatus: 'All Records', // 'All Records' | 'Exclude Death Records' | 'Deceased Only'
    paymentMode: 'All',
    consultant: 'All'
  });

  const [activePopover, setActivePopover] = useState(null); // 'date' | 'age' | 'status' | 'gender' | 'payment' | 'consultant' | null

  // Date Preset Handler
  const handleDatePreset = (preset) => {
    const now = new Date();
    if (preset === 'All Time') {
      setFilters(f => ({ ...f, datePreset: 'All Time', startDate: '', endDate: '' }));
    } else if (preset === 'Last 30 Days') {
      const past = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      setFilters(f => ({
        ...f,
        datePreset: 'Last 30 Days',
        startDate: past.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      }));
    } else if (preset === 'Last 3 Months') {
      const past = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
      setFilters(f => ({
        ...f,
        datePreset: 'Last 3 Months',
        startDate: past.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      }));
    } else if (preset === 'Last 6 Months') {
      const past = new Date(now.getTime() - 180 * 24 * 3600 * 1000);
      setFilters(f => ({
        ...f,
        datePreset: 'Last 6 Months',
        startDate: past.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      }));
    } else if (preset === 'YTD') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      setFilters(f => ({
        ...f,
        datePreset: 'YTD',
        startDate: startOfYear.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      }));
    }
  };

  // Age Preset Handler
  const handleAgePreset = (preset) => {
    if (preset === 'All') {
      setFilters(f => ({ ...f, agePreset: 'All', minAge: '', maxAge: '' }));
    } else if (preset === '<50') {
      setFilters(f => ({ ...f, agePreset: '<50', minAge: '', maxAge: '49' }));
    } else if (preset === '50-60') {
      setFilters(f => ({ ...f, agePreset: '50-60', minAge: '50', maxAge: '60' }));
    } else if (preset === '61-70') {
      setFilters(f => ({ ...f, agePreset: '61-70', minAge: '61', maxAge: '70' }));
    } else if (preset === '>70') {
      setFilters(f => ({ ...f, agePreset: '>70', minAge: '71', maxAge: '' }));
    }
  };

  // Available Consultants List derived dynamically
  const availableConsultants = useMemo(() => {
    const set = new Set();
    [...hfCohort, ...stemiCohort, ...nstemiCohort].forEach(p => {
      const c = p.primaryConsultant || p.primary_consultant || p.consultant_name || p.treating_cardiologist;
      if (c && typeof c === 'string' && c.trim() && !c.includes('Unknown') && !c.includes('Cardiology Service')) {
        set.add(c.trim());
      }
    });
    return Array.from(set).sort();
  }, [hfCohort, stemiCohort, nstemiCohort]);

  // Record Filter Predicate Function (Strictly based on admission_date, age brackets, vital status, etc.)
  const filterRecord = (r, registry) => {
    // 1. Vital Status Filter (All Records vs Living Only vs Deceased Only)
    let isDead = false;
    if (registry === 'HF') {
      isDead = Boolean(
        r.is_death === 1 || r.is_death === '1' || r.is_death === true ||
        r.death === 1 || r.death === '1' || r.death === 'Yes' || r.death === 'yes' ||
        r.death_hospital === 1 || r.death_hospital === 'yes' || r.death_hospital === '1' ||
        r.in_hospital_death === 1 || r.in_hospital_death === '1'
      );
    } else {
      isDead = Boolean(r.death === 'Yes' || r.death === 'yes' || r.death === '1' || r.death === 1 || r.death === true);
    }

    if (filters.vitalStatus === 'Exclude Death Records' && isDead) return false;
    if (filters.vitalStatus === 'Deceased Only' && !isDead) return false;

    // 2. Gender Filter
    if (filters.gender !== 'All') {
      const g = (r.gender || '').trim().toLowerCase();
      if (g !== filters.gender.toLowerCase()) return false;
    }

    // 3. Admission Date Filter (Strictly admission date / visit date across all naming styles)
    const rawDate = r.admissionDate || r.admission_date || r.date_of_admission || r.visitDate || r.visit_date || r.presentationDate || r.presentation_date || r.created_at || r.createdAt || r.assessmentDate || r.assessment_date;
    if (rawDate) {
      let dateStr = '';
      if (typeof rawDate === 'string') {
        dateStr = rawDate.slice(0, 10);
      } else if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
        dateStr = rawDate.toISOString().slice(0, 10);
      } else {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) dateStr = d.toISOString().slice(0, 10);
      }

      if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        if (filters.startDate && dateStr < filters.startDate) return false;
        if (filters.endDate && dateStr > filters.endDate) return false;
      }
    } else if (filters.startDate || filters.endDate) {
      return false;
    }

    // 4. Age Filter
    let age = r.age !== undefined && r.age !== null && r.age !== '' && !isNaN(Number(r.age)) ? Number(r.age) : null;
    if (age === null && r.date_of_birth) {
      const dob = new Date(r.date_of_birth);
      if (!isNaN(dob.getTime())) {
        const refDate = rawDate ? new Date(rawDate) : new Date();
        age = Math.floor((refDate - dob) / (365.25 * 24 * 3600 * 1000));
      }
    }

    if (age !== null) {
      if (filters.minAge !== '' && !isNaN(Number(filters.minAge)) && age < Number(filters.minAge)) return false;
      if (filters.maxAge !== '' && !isNaN(Number(filters.maxAge)) && age > Number(filters.maxAge)) return false;
    } else if (filters.minAge !== '' || filters.maxAge !== '') {
      return false;
    }

    // 5. Consultant Filter
    if (filters.consultant !== 'All') {
      const c = (r.primaryConsultant || r.primary_consultant || r.consultant_name || r.treating_cardiologist || '').trim().toLowerCase();
      if (!c.includes(filters.consultant.toLowerCase())) return false;
    }

    // 6. Payment Mode Filter
    if (filters.paymentMode !== 'All') {
      const pMode = (r.insurance_mode || r.insuranceMode || r.payment_mode || r.paymentMode || '').trim().toLowerCase();
      const target = filters.paymentMode.toLowerCase();
      if (target.includes('insurance') && !(pMode.includes('insurance') || pMode.includes('tpa'))) return false;
      if (target.includes('arogya') && !pMode.includes('arogya')) return false;
      if (target.includes('gov') && !(pMode.includes('gov') || pMode.includes('cghs') || pMode.includes('echs'))) return false;
      if (target.includes('self') && !(pMode.includes('self') || pMode.includes('cash'))) return false;
    }

    return true;
  };

  // Filtered Cohorts based on active filters
  const filteredHfCohort = useMemo(() => hfCohort.filter(r => filterRecord(r, 'HF')), [hfCohort, filters]);
  const filteredStemiCohort = useMemo(() => stemiCohort.filter(r => filterRecord(r, 'STEMI')), [stemiCohort, filters]);
  const filteredNstemiCohort = useMemo(() => nstemiCohort.filter(r => filterRecord(r, 'NSTEMI')), [nstemiCohort, filters]);

  const isFilterActive = useMemo(() => {
    return (
      filters.datePreset !== 'All Time' ||
      Boolean(filters.startDate) ||
      Boolean(filters.endDate) ||
      filters.agePreset !== 'All' ||
      Boolean(filters.minAge) ||
      Boolean(filters.maxAge) ||
      filters.vitalStatus !== 'All Records' ||
      filters.gender !== 'All' ||
      filters.paymentMode !== 'All' ||
      filters.consultant !== 'All'
    );
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      datePreset: 'All Time',
      startDate: '',
      endDate: '',
      agePreset: 'All',
      minAge: '',
      maxAge: '',
      vitalStatus: 'All Records',
      gender: 'All',
      paymentMode: 'All',
      consultant: 'All'
    });
    setActivePopover(null);
  };

  // Compute live analytics using native engines over filtered records
  const hfAnalytics = useMemo(() => computeAnalytics(filteredHfCohort), [filteredHfCohort]);
  const stemiAnalytics = useMemo(() => computeAcsAnalytics(filteredStemiCohort, 'STEMI'), [filteredStemiCohort]);
  const nstemiAnalytics = useMemo(() => computeAcsAnalytics(filteredNstemiCohort, 'NSTEMI'), [filteredNstemiCohort]);

  // Derived Overall Metrics
  const totalHfRecords = filteredHfCohort.length;
  const totalStemiRecords = filteredStemiCohort.length;
  const totalNstemiRecords = filteredNstemiCohort.length;
  const totalRecords = totalHfRecords + totalStemiRecords + totalNstemiRecords;
  const totalRawRecords = hfCohort.length + stemiCohort.length + nstemiCohort.length;

  // Helper to extract a unique patient identifier across datasets
  const getPatientKey = (p) => {
    return p?.regPatientId || p?.reg_patient_id || p?.patient_id || p?.patientId || p?.uhid || p?.mr_no || p?.id || p?.hf_id || p?.stemi_id || p?.nstemi_id || null;
  };

  // Unique Patient Counts across cohorts (Honors active filters strictly)
  const hfUniqueCount = useMemo(() => {
    if (filteredHfCohort.length === 0) return 0;
    if (!isFilterActive && backendMetrics?.kpis?.hfUniquePatients) return backendMetrics.kpis.hfUniquePatients;
    const set = new Set();
    filteredHfCohort.forEach(p => {
      const id = getPatientKey(p);
      if (id) set.add(id);
    });
    return set.size || filteredHfCohort.length;
  }, [filteredHfCohort, isFilterActive, backendMetrics]);

  const stemiUniqueCount = useMemo(() => {
    if (filteredStemiCohort.length === 0) return 0;
    if (!isFilterActive && backendMetrics?.kpis?.stemiUniquePatients) return backendMetrics.kpis.stemiUniquePatients;
    const set = new Set();
    filteredStemiCohort.forEach(p => {
      const id = getPatientKey(p);
      if (id) set.add(id);
    });
    return set.size || filteredStemiCohort.length;
  }, [filteredStemiCohort, isFilterActive, backendMetrics]);

  const nstemiUniqueCount = useMemo(() => {
    if (filteredNstemiCohort.length === 0) return 0;
    if (!isFilterActive && backendMetrics?.kpis?.nstemiUniquePatients) return backendMetrics.kpis.nstemiUniquePatients;
    const set = new Set();
    filteredNstemiCohort.forEach(p => {
      const id = getPatientKey(p);
      if (id) set.add(id);
    });
    return set.size || filteredNstemiCohort.length;
  }, [filteredNstemiCohort, isFilterActive, backendMetrics]);

  const overallUniquePatients = useMemo(() => {
    if (filteredHfCohort.length === 0 && filteredStemiCohort.length === 0 && filteredNstemiCohort.length === 0) return 0;
    if (!isFilterActive && backendMetrics?.kpis?.overallUniquePatients) return backendMetrics.kpis.overallUniquePatients;
    const set = new Set();
    [...filteredHfCohort, ...filteredStemiCohort, ...filteredNstemiCohort].forEach(p => {
      const id = getPatientKey(p);
      if (id) set.add(id);
    });
    return set.size || (totalRecords > 0 ? totalRecords : 0);
  }, [filteredHfCohort, filteredStemiCohort, filteredNstemiCohort, totalRecords, isFilterActive, backendMetrics]);

  const acsUniqueCount = useMemo(() => {
    if (filteredStemiCohort.length === 0 && filteredNstemiCohort.length === 0) return 0;
    if (!isFilterActive && backendMetrics?.kpis?.acsUniquePatients) return backendMetrics.kpis.acsUniquePatients;
    const set = new Set();
    [...filteredStemiCohort, ...filteredNstemiCohort].forEach(p => {
      const id = getPatientKey(p);
      if (id) set.add(id);
    });
    return set.size || (totalStemiRecords + totalNstemiRecords > 0 ? totalStemiRecords + totalNstemiRecords : 0);
  }, [filteredStemiCohort, filteredNstemiCohort, totalStemiRecords, totalNstemiRecords, isFilterActive, backendMetrics]);

  // 1. Total All-Cause Deaths (Hospital + Home)
  const hfTotalDeaths = hfAnalytics.kpi?.deathsRecorded ?? hfAnalytics.mortalityAnalytics?.totalDeaths ?? (filteredHfCohort.filter(p => Boolean(p.is_death || p.death || p.in_hospital_death || p.death_hospital || p.death_home)).length);
  const stemiTotalDeaths = stemiAnalytics.kpi?.totalDeaths || 0;
  const nstemiTotalDeaths = nstemiAnalytics.kpi?.totalDeaths || 0;
  const totalDeaths = hfTotalDeaths + stemiTotalDeaths + nstemiTotalDeaths;
  const overallMortalityRate = totalRecords > 0 ? ((totalDeaths / totalRecords) * 100).toFixed(1) : '0.0';

  const hfMortalityRate = totalHfRecords > 0 ? ((hfTotalDeaths / totalHfRecords) * 100).toFixed(1) : '0.0';
  const stemiMortalityRate = totalStemiRecords > 0 ? ((stemiTotalDeaths / totalStemiRecords) * 100).toFixed(1) : '0.0';
  const nstemiMortalityRate = totalNstemiRecords > 0 ? ((nstemiTotalDeaths / totalNstemiRecords) * 100).toFixed(1) : '0.0';

  // 2. Strict In-Hospital Deaths
  const hfInHospDeaths = filteredHfCohort.filter(p => {
    return p.death_hospital === true || p.death_hospital === 1 || String(p.death_hospital).toLowerCase() === 'yes' ||
      p.deathLocation === 'Hospital' || p.in_hospital_death === 1 || p.in_hospital_death === '1';
  }).length;
  const stemiInHospDeaths = stemiAnalytics.kpi?.totalDeaths || 0;
  const nstemiInHospDeaths = nstemiAnalytics.kpi?.totalDeaths || 0;
  const totalInHospDeaths = hfInHospDeaths + stemiInHospDeaths + nstemiInHospDeaths;
  const overallInHospitalMortalityRate = totalRecords > 0 ? ((totalInHospDeaths / totalRecords) * 100).toFixed(1) : '0.0';

  const hfInHospMortalityRate = totalHfRecords > 0 ? ((hfInHospDeaths / totalHfRecords) * 100).toFixed(1) : '0.0';
  const stemiInHospMortalityRate = totalStemiRecords > 0 ? ((stemiInHospDeaths / totalStemiRecords) * 100).toFixed(1) : '0.0';
  const nstemiInHospMortalityRate = totalNstemiRecords > 0 ? ((nstemiInHospDeaths / totalNstemiRecords) * 100).toFixed(1) : '0.0';

  // 3. Reperfusion Timeliness (Combined STEMI D2B + NSTEMI Cath)
  const d2bStemiRate = stemiAnalytics.kpi?.d2bComplianceRate !== undefined ? Number(stemiAnalytics.kpi.d2bComplianceRate) : 0;
  const d2bMetRate = d2bStemiRate.toFixed(1);
  const cathNstemiRate = nstemiAnalytics.kpi?.cathComplianceRate !== undefined ? Number(nstemiAnalytics.kpi.cathComplianceRate) : 0;
  const stemiD2bCount = stemiAnalytics.kpi?.d2bCount || 0;
  const nstemiCathCount = nstemiAnalytics.kpi?.cathCount || 0;
  const totalTimelinessCount = stemiD2bCount + nstemiCathCount;
  const overallTimelinessRate = totalTimelinessCount > 0
    ? Number(((d2bStemiRate * stemiD2bCount + cathNstemiRate * nstemiCathCount) / totalTimelinessCount).toFixed(1))
    : 0;
  const meanD2B = stemiAnalytics.kpi?.meanDoorToBalloon !== undefined ? Math.round(stemiAnalytics.kpi.meanDoorToBalloon) : 0;
  const meanCath = nstemiAnalytics.kpi?.meanTimeToCath !== undefined ? Number(nstemiAnalytics.kpi.meanTimeToCath).toFixed(1) : '0.0';

  // Door-to-Needle (STEMI)
  const d2nMetRate = stemiAnalytics.kpi?.d2nComplianceRate !== undefined ? Number(stemiAnalytics.kpi.d2nComplianceRate).toFixed(1) : '0.0';
  const meanD2N = stemiAnalytics.kpi?.meanDoorToNeedle !== undefined ? Number(stemiAnalytics.kpi.meanDoorToNeedle).toFixed(1) : '0.0';

  // HF GDMT Adherence
  const hfGdmtAdherence = hfAnalytics.kpi?.meanAdherencePercent !== undefined ? Number(hfAnalytics.kpi.meanAdherencePercent).toFixed(1) : (hfAnalytics.kpi?.adherenceRate !== undefined ? Number(hfAnalytics.kpi.adherenceRate).toFixed(1) : '0.0');
  const hfZeroDrugsPercent = hfAnalytics.kpi?.zeroDrugsPercent !== undefined ? Number(hfAnalytics.kpi.zeroDrugsPercent).toFixed(1) : '0.0';

  // 4. Dynamic Total Revenue / Cost of Care (Combined STEMI + NSTEMI with individual breakdown)
  const costStats = useMemo(() => {
    const sumCohortCost = (cohort) => {
      let sum = 0;
      cohort.forEach(p => {
        const directCost = p.totalCost ?? p.total_cost ?? p.totalHospitalCost ?? p.cost;
        if (directCost !== null && directCost !== undefined && !isNaN(Number(directCost)) && Number(directCost) > 0) {
          sum += Number(directCost);
        } else {
          const comp = (
            Number(p.bed_charges || 0) +
            Number(p.drugs_disposables_cost || 0) +
            Number(p.package_cost || 0) +
            Number(p.laboratory_cost || 0) +
            Number(p.non_invasive_lab_cost || 0) +
            Number(p.consultation_cost || 0) +
            Number(p.radiology_cost || 0) +
            Number(p.miscellaneous_cost || 0)
          );
          if (comp > 0) sum += comp;
        }
      });
      return sum;
    };

    const stemiCost = sumCohortCost(filteredStemiCohort);
    const nstemiCost = sumCohortCost(filteredNstemiCohort);
    const combinedCost = stemiCost + nstemiCost;

    const formatCr = (val) => {
      if (!val || val === 0) return '₹ 0.00 Cr';
      return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    };

    return {
      combinedDisplay: formatCr(combinedCost),
      stemiDisplay: formatCr(stemiCost),
      nstemiDisplay: formatCr(nstemiCost),
      combinedRaw: combinedCost,
      stemiRaw: stemiCost,
      nstemiRaw: nstemiCost
    };
  }, [filteredStemiCohort, filteredNstemiCohort]);

  // 5. Dynamic Average Length of Stay (Combined STEMI + NSTEMI with individual breakdown)
  const stayStats = useMemo(() => {
    const calcCohortStay = (cohort) => {
      const validStays = cohort.map(p => {
        const direct = p.totalStayDays ?? p.total_hospital_stay_days;
        if (direct !== null && direct !== undefined && !isNaN(Number(direct)) && Number(direct) > 0) {
          return Number(direct);
        }
        const iccu = Number(p.iccuHours ?? p.iccu_hours ?? 0);
        const stepdown = Number(p.stepdownIcuHours ?? p.stepdown_icu_hours ?? 0);
        const floor = Number(p.floorDays ?? p.floor_days ?? 0);
        if (iccu > 0 || stepdown > 0 || floor > 0) {
          return (iccu / 24.0) + (stepdown / 24.0) + floor;
        }
        return null;
      }).filter(v => v !== null && !isNaN(v) && v > 0);

      if (validStays.length === 0) {
        return { count: 0, sum: 0, avg: '0.0' };
      }
      const sum = validStays.reduce((a, b) => a + b, 0);
      const avg = Number((sum / validStays.length).toFixed(1));
      return { count: validStays.length, sum, avg: avg.toFixed(1) };
    };

    const stemiStay = calcCohortStay(filteredStemiCohort);
    const nstemiStay = calcCohortStay(filteredNstemiCohort);

    const totalCount = stemiStay.count + nstemiStay.count;
    const totalSum = stemiStay.sum + nstemiStay.sum;
    const combinedAvg = totalCount > 0 ? (totalSum / totalCount).toFixed(1) : '0.0';

    return {
      combinedAvg: `${combinedAvg} days`,
      stemiAvg: `${stemiStay.avg} d`,
      nstemiAvg: `${nstemiStay.avg} d`,
      combinedCount: totalCount,
      stemiCount: stemiStay.count,
      nstemiCount: nstemiStay.count
    };
  }, [filteredStemiCohort, filteredNstemiCohort]);

  // Dynamic detailed stay stats for Panel 3 breakdown
  const detailedStayStats = useMemo(() => {
    const allAcs = [...filteredStemiCohort, ...filteredNstemiCohort];
    const iccuList = allAcs.map(p => Number(p.iccuHours ?? p.iccu_hours)).filter(v => !isNaN(v) && v > 0);
    const stepdownList = allAcs.map(p => Number(p.stepdownIcuHours ?? p.stepdown_icu_hours)).filter(v => !isNaN(v) && v > 0);
    const floorList = allAcs.map(p => Number(p.floorDays ?? p.floor_days)).filter(v => !isNaN(v) && v > 0);

    const avgIccu = iccuList.length > 0 ? Math.round(iccuList.reduce((a, b) => a + b, 0) / iccuList.length) : null;
    const avgStepdown = stepdownList.length > 0 ? Math.round(stepdownList.reduce((a, b) => a + b, 0) / stepdownList.length) : null;
    const avgFloor = floorList.length > 0 ? (floorList.reduce((a, b) => a + b, 0) / floorList.length).toFixed(1) : null;

    return {
      iccuHours: avgIccu !== null ? `${avgIccu} hours` : '0 hours',
      stepdownHours: avgStepdown !== null ? `${avgStepdown} hours` : '0 hours',
      floorDays: avgFloor !== null ? `${avgFloor} days` : '0.0 days',
      totalStayDays: stayStats.combinedAvg
    };
  }, [filteredStemiCohort, filteredNstemiCohort, stayStats.combinedAvg]);

  // 6. Dynamic 30-Day Readmission Statistics (Recalculated on active filtered cohorts)
  const readmissionStats = useMemo(() => {
    const calcReadmissions = (cohort, dateField, dischargeField) => {
      const byPatient = {};
      cohort.forEach(p => {
        const pid = p.regPatientId || p.reg_patient_id || p.uhid || p.mrNo;
        if (!pid) return;
        if (!byPatient[pid]) byPatient[pid] = [];
        byPatient[pid].push(p);
      });

      let readmCount = 0;
      Object.values(byPatient).forEach(adms => {
        adms.sort((a, b) => new Date(a[dateField] || a.admissionDate || a.admission_date || a.visit_date || 0) - new Date(b[dateField] || b.admissionDate || b.admission_date || b.visit_date || 0));
        for (let i = 1; i < adms.length; i++) {
          const prev = adms[i - 1];
          const curr = adms[i];
          const prevDisch = prev[dischargeField] || prev.dischargeDate || prev.discharge_date || prev[dateField] || prev.admissionDate || prev.visit_date;
          const currAdm = curr[dateField] || curr.admissionDate || curr.admission_date || curr.visit_date;
          if (prevDisch && currAdm) {
            const diffDays = (new Date(currAdm) - new Date(prevDisch)) / (1000 * 3600 * 24);
            if (diffDays >= 0 && diffDays <= 30) {
              readmCount++;
            }
          }
        }
      });

      const totalCohort = cohort.length;
      return {
        count: readmCount,
        rate: totalCohort > 0 ? ((readmCount / totalCohort) * 100).toFixed(1) : '0.0'
      };
    };

    const hf = calcReadmissions(filteredHfCohort, 'visit_date', 'discharge_date');
    const stemi = calcReadmissions(filteredStemiCohort, 'admissionDate', 'dischargeDate');
    const nstemi = calcReadmissions(filteredNstemiCohort, 'admissionDate', 'dischargeDate');

    const totalCount = hf.count + stemi.count + nstemi.count;
    const totalDenom = filteredHfCohort.length + filteredStemiCohort.length + filteredNstemiCohort.length;
    const overallRate = totalDenom > 0 ? ((totalCount / totalDenom) * 100).toFixed(1) : '0.0';

    return {
      overallRate,
      totalCount,
      hfRate: hf.rate,
      hfCount: hf.count,
      stemiRate: stemi.rate,
      stemiCount: stemi.count,
      nstemiRate: nstemi.rate,
      nstemiCount: nstemi.count
    };
  }, [filteredHfCohort, filteredStemiCohort, filteredNstemiCohort]);

  // Reperfusion Strategies (Strict live percentages; 0.0% when empty cohort or not present)
  const stemiPami = filteredStemiCohort.length > 0 ? (stemiAnalytics.treatmentStrategy?.find(s => /pami|primary/i.test(s.name))?.percent ?? 0.0) : 0.0;
  const stemiLysis = filteredStemiCohort.length > 0 ? (stemiAnalytics.treatmentStrategy?.find(s => /lysis|thrombo/i.test(s.name))?.percent ?? 0.0) : 0.0;
  const stemiCons = filteredStemiCohort.length > 0 ? (stemiAnalytics.treatmentStrategy?.find(s => /cons|medical/i.test(s.name))?.percent ?? 0.0) : 0.0;

  const nstemiPami = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.treatmentStrategy?.find(s => /pami|primary|invasive/i.test(s.name))?.percent ?? 0.0) : 0.0;
  const nstemiLysis = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.treatmentStrategy?.find(s => /lysis|thrombo/i.test(s.name))?.percent ?? 0.0) : 0.0;
  const nstemiCons = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.treatmentStrategy?.find(s => /cons|medical/i.test(s.name))?.percent ?? 0.0) : 0.0;

  // TIMI-3 Flow
  const stemiTimi3 = filteredStemiCohort.length > 0 ? (stemiAnalytics.proceduralSuccess?.find(p => /3|grade 3|normal/i.test(p.grade || p.name))?.percent ?? 0.0) : 0.0;
  const nstemiTimi3 = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.proceduralSuccess?.find(p => /3|grade 3|normal/i.test(p.grade || p.name))?.percent ?? 0.0) : 0.0;

  // Culprit Vessel
  const stemiLad = filteredStemiCohort.length > 0 ? (stemiAnalytics.vessels?.find(v => /lad/i.test(v.name))?.percent ?? 0.0) : 0.0;
  const stemiRca = filteredStemiCohort.length > 0 ? (stemiAnalytics.vessels?.find(v => /rca/i.test(v.name))?.percent ?? 0.0) : 0.0;
  const stemiLcx = filteredStemiCohort.length > 0 ? (stemiAnalytics.vessels?.find(v => /lcx/i.test(v.name))?.percent ?? 0.0) : 0.0;

  const nstemiLad = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.vessels?.find(v => /lad/i.test(v.name))?.percent ?? 0.0) : 0.0;
  const nstemiRca = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.vessels?.find(v => /rca/i.test(v.name))?.percent ?? 0.0) : 0.0;
  const nstemiLcx = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.vessels?.find(v => /lcx/i.test(v.name))?.percent ?? 0.0) : 0.0;

  // Outcomes & Complications
  const stemiReMi = filteredStemiCohort.length > 0 ? (stemiAnalytics.mace?.find(m => /re-mi|infarction|ischemia/i.test(m.event || m.name))?.rate ?? 0.0) : 0.0;
  const nstemiReMi = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.mace?.find(m => /re-mi|infarction|ischemia/i.test(m.event || m.name))?.rate ?? 0.0) : 0.0;

  const stemiStroke = filteredStemiCohort.length > 0 ? (stemiAnalytics.mace?.find(m => /stroke|cva/i.test(m.event || m.name))?.rate ?? 0.0) : 0.0;
  const nstemiStroke = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.mace?.find(m => /stroke|cva/i.test(m.event || m.name))?.rate ?? 0.0) : 0.0;

  const stemiBleed = filteredStemiCohort.length > 0 ? (stemiAnalytics.mace?.find(m => /bleed/i.test(m.event || m.name))?.rate ?? 0.0) : 0.0;
  const nstemiBleed = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.mace?.find(m => /bleed/i.test(m.event || m.name))?.rate ?? 0.0) : 0.0;

  // Comorbidities
  const hfHtn = filteredHfCohort.length > 0 ? (hfAnalytics.kpi?.hypertensionPercent ?? 0.0) : 0.0;
  const stemiHtn = filteredStemiCohort.length > 0 ? (stemiAnalytics.comorbidities?.find(c => /hyperten/i.test(c.name))?.percent ?? 0.0) : 0.0;
  const nstemiHtn = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.comorbidities?.find(c => /hyperten/i.test(c.name))?.percent ?? 0.0) : 0.0;

  const hfDm = filteredHfCohort.length > 0 ? (hfAnalytics.kpi?.diabetesPercent ?? 0.0) : 0.0;
  const stemiDm = filteredStemiCohort.length > 0 ? (stemiAnalytics.comorbidities?.find(c => /diabet/i.test(c.name))?.percent ?? 0.0) : 0.0;
  const nstemiDm = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.comorbidities?.find(c => /diabet/i.test(c.name))?.percent ?? 0.0) : 0.0;

  // HF GDMT Drugs from live analytics
  const hfBetaBlockerPct = filteredHfCohort.length > 0 ? (hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'betaBlocker')?.prescribedRate ?? 0.0) : 0.0;
  const hfMraPct = filteredHfCohort.length > 0 ? (hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'mra')?.prescribedRate ?? 0.0) : 0.0;
  const hfAcePct = filteredHfCohort.length > 0 ? (hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'aceInhibitor')?.prescribedRate ?? 0.0) : 0.0;
  const hfArbPct = filteredHfCohort.length > 0 ? (hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'arb')?.prescribedRate ?? 0.0) : 0.0;
  const hfArniPct = filteredHfCohort.length > 0 ? (hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'arni')?.prescribedRate ?? 0.0) : 0.0;
  const hfSglt2Pct = filteredHfCohort.length > 0 ? (hfAnalytics.performanceMatrix?.find(p => p.pillarKey === 'sglt2Inhibitor')?.prescribedRate ?? 0.0) : 0.0;

  // NSTEMI Discharge Meds from live analytics
  const nstemiStatin = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.gdmtMeds?.find(m => /statin/i.test(m.drug))?.prescribedRate ?? 0.0) : 0.0;
  const nstemiAspirin = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.gdmtMeds?.find(m => /aspirin/i.test(m.drug))?.prescribedRate ?? 0.0) : 0.0;
  const nstemiTicagrelor = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.gdmtMeds?.find(m => /ticagrelor/i.test(m.drug))?.prescribedRate ?? 0.0) : 0.0;
  const nstemiBetaBlocker = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.gdmtMeds?.find(m => /beta/i.test(m.drug))?.prescribedRate ?? 0.0) : 0.0;

  // TIMI Flow Grade Breakdown from live analytics
  const stemiTimiGrade3 = filteredStemiCohort.length > 0 ? (stemiAnalytics.proceduralSuccess?.find(p => /grade 3/i.test(p.name))?.percent ?? 0.0) : 0.0;
  const stemiTimiGrade2 = filteredStemiCohort.length > 0 ? (stemiAnalytics.proceduralSuccess?.find(p => /grade 2/i.test(p.name))?.percent ?? 0.0) : 0.0;
  const stemiTimiGrade01 = filteredStemiCohort.length > 0 ? (stemiAnalytics.proceduralSuccess?.find(p => /grade 0\/1/i.test(p.name))?.percent ?? 0.0) : 0.0;

  const nstemiTimiGrade3 = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.proceduralSuccess?.find(p => /grade 3/i.test(p.name))?.percent ?? 0.0) : 0.0;
  const nstemiTimiGrade2 = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.proceduralSuccess?.find(p => /grade 2/i.test(p.name))?.percent ?? 0.0) : 0.0;
  const nstemiTimiGrade01 = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.proceduralSuccess?.find(p => /grade 0\/1/i.test(p.name))?.percent ?? 0.0) : 0.0;
  const nstemiTimiUnrecorded = filteredNstemiCohort.length > 0 ? (nstemiAnalytics.proceduralSuccess?.find(p => /unrecorded|no cath/i.test(p.name))?.percent ?? 0.0) : 0.0;

  // 1. Dynamic Cost of Care Breakdown Calculation (ACS Hospitalization from DB)
  const costBreakdown = useMemo(() => {
    const allAcs = [...filteredStemiCohort, ...filteredNstemiCohort];
    const patientsWithCost = allAcs.filter(p => (
      (p.totalCost && Number(p.totalCost) > 0) ||
      (p.total_cost && Number(p.total_cost) > 0) ||
      (p.bed_charges && Number(p.bed_charges) > 0) ||
      (p.package_cost && Number(p.package_cost) > 0)
    ));
    const denom = patientsWithCost.length > 0 ? patientsWithCost.length : 1;

    let bedSum = 0;
    let drugsSum = 0;
    let packageSum = 0;
    let labSum = 0;
    let nonInvasiveLabSum = 0;
    let consultSum = 0;
    let radiologySum = 0;
    let miscSum = 0;

    allAcs.forEach(p => {
      bedSum += Number(p.bed_charges || 0);
      drugsSum += Number(p.drugs_disposables_cost || 0);
      packageSum += Number(p.package_cost || 0);
      labSum += Number(p.laboratory_cost || 0);
      nonInvasiveLabSum += Number(p.non_invasive_lab_cost || 0);
      consultSum += Number(p.consultation_cost || 0);
      radiologySum += Number(p.radiology_cost || 0);
      miscSum += Number(p.miscellaneous_cost || 0);
    });

    return [
      { label: 'Bed charges', amount: Math.round(bedSum / denom), totalAmount: bedSum },
      { label: 'Drugs and disposables', amount: Math.round(drugsSum / denom), totalAmount: drugsSum },
      { label: 'Packages (Cath-Lab / Stents)', amount: Math.round(packageSum / denom), totalAmount: packageSum },
      { label: 'Lab investigations', amount: Math.round(labSum / denom), totalAmount: labSum },
      { label: 'Non-invasive labs (Echo/ECG)', amount: Math.round(nonInvasiveLabSum / denom), totalAmount: nonInvasiveLabSum },
      { label: 'Consults', amount: Math.round(consultSum / denom), totalAmount: consultSum },
      { label: 'Radiology', amount: Math.round(radiologySum / denom), totalAmount: radiologySum },
      { label: 'Miscellaneous', amount: Math.round(miscSum / denom), totalAmount: miscSum }
    ];
  }, [filteredStemiCohort, filteredNstemiCohort]);

  const totalCostPerAdmission = useMemo(() => {
    return costBreakdown.reduce((sum, item) => sum + item.amount, 0);
  }, [costBreakdown]);

  // 2. Dynamic Average Cost Per Admission by Strategy Chart Data (From DB Records)
  const averageCostData = useMemo(() => {
    const calcStratCost = (cohort) => {
      const pamiList = [];
      const lysisList = [];
      const consList = [];

      cohort.forEach(p => {
        const cost = Number(p.totalCost ?? p.total_cost ?? 0);
        if (cost <= 0) return;
        const strat = String(p.treatmentStrategy || p.strategy || '').toLowerCase();
        const isPami = p.pami === 'Yes' || p.pami === true || strat.includes('pami') || strat.includes('primary');
        const isLysis = p.thrombolysis === 'Yes' || p.thrombolysis === true || strat.includes('thrombo') || strat.includes('lysis');
        const isCons = p.conservative === 'Yes' || p.conservative === true || strat.includes('cons');

        if (isPami) pamiList.push(cost);
        else if (isLysis) lysisList.push(cost);
        else if (isCons) consList.push(cost);
      });

      return {
        PAMI: pamiList.length > 0 ? Math.round(pamiList.reduce((a, b) => a + b, 0) / pamiList.length) : 0,
        Thrombolysis: lysisList.length > 0 ? Math.round(lysisList.reduce((a, b) => a + b, 0) / lysisList.length) : 0,
        Conservative: consList.length > 0 ? Math.round(consList.reduce((a, b) => a + b, 0) / consList.length) : 0
      };
    };

    const stemiAvg = calcStratCost(filteredStemiCohort);
    const nstemiAvg = calcStratCost(filteredNstemiCohort);

    const hfCostList = filteredHfCohort.map(p => Number(p.totalCost || p.cost || 0)).filter(c => c > 0);
    const hfAvgCost = hfCostList.length > 0 ? Math.round(hfCostList.reduce((a, b) => a + b, 0) / hfCostList.length) : 0;

    return [
      { registry: 'STEMI', PAMI: stemiAvg.PAMI, Thrombolysis: stemiAvg.Thrombolysis, Conservative: stemiAvg.Conservative },
      { registry: 'NSTEMI', PAMI: nstemiAvg.PAMI, Thrombolysis: 0, Conservative: nstemiAvg.Conservative },
      { registry: 'HF', PAMI: 0, Thrombolysis: 0, Conservative: hfAvgCost }
    ];
  }, [filteredStemiCohort, filteredNstemiCohort, filteredHfCohort]);

  // 3. Dynamic Cost by Payer Distribution Chart Data (from hf_administrative payment_mode / insurance_mode)
  const costByPayerData = useMemo(() => {
    let gov = 0;
    let ins = 0;
    let aro = 0;
    let selfPay = 0;

    filteredHfCohort.forEach(p => {
      const mode = String(p.insuranceMode || p.insurance_mode || p.paymentMode || p.payment_mode || '').trim().toLowerCase();
      if (!mode) return;
      if (mode.includes('government') || mode.includes('cghs') || mode.includes('echs')) {
        gov++;
      } else if (mode.includes('private') || mode.includes('insurance') || mode.includes('tpa')) {
        ins++;
      } else if (mode.includes('arogya')) {
        aro++;
      } else if (mode.includes('direct') || mode.includes('cash') || mode.includes('self')) {
        selfPay++;
      }
    });

    const total = gov + ins + aro + selfPay;
    if (total === 0) {
      return [
        { name: 'Government Reimbursement', value: 0, count: 0, color: '#d97706' },
        { name: 'Private Insurance', value: 0, count: 0, color: '#2563eb' },
        { name: 'Arogyasree', value: 0, count: 0, color: '#0d9488' },
        { name: 'Direct / Cash', value: 0, count: 0, color: '#64748b' }
      ];
    }

    return [
      { name: 'Government Reimbursement', value: Number(((gov / total) * 100).toFixed(1)), count: gov, color: '#d97706' },
      { name: 'Private Insurance', value: Number(((ins / total) * 100).toFixed(1)), count: ins, color: '#2563eb' },
      { name: 'Arogyasree', value: Number(((aro / total) * 100).toFixed(1)), count: aro, color: '#0d9488' },
      { name: 'Direct / Cash', value: Number(((selfPay / total) * 100).toFixed(1)), count: selfPay, color: '#64748b' }
    ];
  }, [filteredHfCohort]);

  // Dynamic Risk Factors: Alive vs Deceased (From Form Specifications with Registry Switcher)
  const riskFactorsChartData = useMemo(() => {
    if (!isFilterActive && backendMetrics?.riskStratification?.riskFactors?.[riskRegistry]) {
      return backendMetrics.riskStratification.riskFactors[riskRegistry];
    }

    let cohort = [];
    let isDeceased = () => false;
    let defs = [];
    let subtitleDesc = '';
    let footerDesc = '';

    if (riskRegistry === 'STEMI') {
      cohort = filteredStemiCohort;
      isDeceased = p => Boolean(p.death === true || p.death === 'Yes' || p.death === '1' || p.death === 1 || p.in_hospital_death === 1 || p.in_hospital_death === '1');
      subtitleDesc = 'Factors from the STEMI form: TIMI items and Other Risk Factors.';
      footerDesc = 'TIMI risk items and Other Risk Factors listed in the STEMI form';
      defs = [
        { name: 'ST deviation at admission', check: p => p.st_deviation_at_admission },
        { name: 'Hypertension', check: p => p.hypertension },
        { name: 'Anterior MI / LBBB', check: p => p.anterior_mi_or_lbbb },
        { name: 'Diabetes', check: p => p.diabetes },
        { name: 'Elevated CRP', check: p => p.elevated_crp },
        { name: 'Elevated BNP', check: p => p.elevated_bnp },
        { name: 'Reperfusion over 4 hrs', check: p => p.reperfusion_gt_4hrs },
        { name: 'Age 65 to 74', check: p => p.age_65_to_74 || (p.age >= 65 && p.age < 75) },
        { name: 'Weight below 67 kg', check: p => p.weight_lt_67kg },
        { name: 'Age 75 or older', check: p => p.age_gt_75 || p.age >= 75 },
        { name: 'Heart rate above 100', check: p => p.heart_rate_gt_100 || Number(p.pulseRate || p.pulse_rate || 0) > 100 },
        { name: 'Killip class II or higher', check: p => p.killip_class_ii_to_iv },
        { name: 'LVF', check: p => p.lvf },
        { name: 'VT / VF', check: p => p.vt_vf },
        { name: 'Systolic BP below 100', check: p => p.sbp_lt_100 || (p.sbp && Number(p.sbp) < 100) },
        { name: 'BBB / CHB', check: p => p.bbb_chb }
      ];
    } else if (riskRegistry === 'NSTEMI') {
      cohort = filteredNstemiCohort;
      isDeceased = p => Boolean(p.death === true || p.death === 'Yes' || p.death === '1' || p.death === 1 || p.in_hospital_death === 1 || p.in_hospital_death === '1');
      subtitleDesc = 'STEMI items plus the NSTEMI-only TIMI items.';
      footerDesc = 'STEMI form items plus 3 or more CHD risk factors, prior stenosis, angina episodes and cardiac markers (NSTEMI only)';
      defs = [
        { name: 'Elevated cardiac markers', check: p => p.elevated_serum_cardiac_markers },
        { name: 'ST deviation at admission', check: p => p.st_deviation_at_admission },
        { name: '2 or more angina episodes in 24 hrs', check: p => p.anginal_episodes_ge_2_last_24hrs },
        { name: '3 or more CHD risk factors', check: p => p.chd_risk_factors_ge_3 },
        { name: 'Hypertension', check: p => p.hypertension },
        { name: 'Diabetes', check: p => p.diabetes },
        { name: 'Elevated CRP', check: p => p.elevated_crp },
        { name: 'Elevated BNP', check: p => p.elevated_bnp },
        { name: 'Anterior MI / LBBB', check: p => p.anterior_mi_or_lbbb },
        { name: 'Age 65 to 74', check: p => p.age_65_to_74 || (p.age >= 65 && p.age < 75) },
        { name: 'Weight below 67 kg', check: p => p.weight_lt_67kg },
        { name: 'Reperfusion over 4 hrs', check: p => p.reperfusion_gt_4hrs },
        { name: 'Prior stenosis over 50%', check: p => p.prior_coronary_stenosis_gt_50 },
        { name: 'Heart rate above 100', check: p => p.heart_rate_gt_100 || Number(p.pulseRate || p.pulse_rate || 0) > 100 },
        { name: 'Killip class II or higher', check: p => p.killip_class_ii_to_iv },
        { name: 'LVF', check: p => p.lvf },
        { name: 'BBB / CHB', check: p => p.bbb_chb },
        { name: 'Age 75 or older', check: p => p.age_gt_75 || p.age >= 75 },
        { name: 'Systolic BP below 100', check: p => p.sbp_lt_100 || (p.sbp && Number(p.sbp) < 100) },
        { name: 'VT / VF', check: p => p.vt_vf }
      ];
    } else { // Heart Failure
      cohort = filteredHfCohort;
      isDeceased = p => Boolean(
        p.death === true || p.death === 'Yes' || p.death === '1' || p.death === 1 ||
        p.deathHospital === true || p.deathHospital === 1 || p.death_hospital === 'Yes' || p.death_hospital === '1' ||
        p.death_any === 'Yes' || p.death_any === '1' || p.isDeath === true || p.isDeath === 1
      );
      subtitleDesc = 'Key clinical risk factors, hemodynamic markers, and comorbidities from Heart Failure records.';
      footerDesc = 'Key clinical risk factors, hemodynamic markers, and comorbidities listed in the HF form';
      defs = [
        { name: 'HFrEF (LVEF < 40%)', check: p => Number(p.efPercent || p.ef_percent || 50) < 40 },
        { name: 'Hypertension', check: p => Boolean(p.hypertension === true || p.hypertension === 'Yes' || p.hasHtn || p.has_htn || (p.comorbidities && p.comorbidities.some(c => c.toLowerCase().includes('hypertension')))) },
        { name: 'Diabetes', check: p => Boolean(p.diabetes === true || p.diabetes === 'Yes' || p.hasDm || p.has_dm || (p.comorbidities && p.comorbidities.some(c => c.toLowerCase().includes('diabetes')))) },
        { name: 'Renal dysfunction / CKD', check: p => Boolean(p.ckd || p.hasCkd || p.has_ckd || p.renal_failure || p.renalFailure || (p.comorbidities && p.comorbidities.some(c => c.toLowerCase().includes('renal'))) || (p.creatinine && Number(p.creatinine) > 2.0)) },
        { name: 'Prior CAD / MI', check: p => Boolean(p.cad || p.hasCad || p.has_cad || p.priorCad || p.priorMi || p.prior_acs || (p.comorbidities && p.comorbidities.some(c => c.toLowerCase().includes('cad') || c.toLowerCase().includes('coronary')))) },
        { name: 'NYHA Class III / IV', check: p => ['III', 'IV', 'Class III', 'Class IV', 'NYHA III', 'NYHA IV', '3', '4'].includes(String(p.nyha_class || p.nyhaClass || p.functionalStatus || '').trim()) },
        { name: 'Age 65 or older', check: p => Number(p.age || 0) >= 65 },
        { name: 'Anemia / Low Hb', check: p => Boolean(p.anemia || (p.hemoglobin && Number(p.hemoglobin) < 11)) },
        { name: 'Atrial Fibrillation (AF)', check: p => Boolean(p.af || p.atrialFibrillation || p.afib) },
        { name: 'Heart rate > 90 / min', check: p => Number(p.heartRate || p.pulse_rate || p.pulseRate || 0) > 90 },
        { name: 'Systolic BP below 100', check: p => Number(p.systolicBp || p.sbp || (p.bloodPressureSitting ? p.bloodPressureSitting.split('/')[0] : 120)) < 100 },
        { name: 'Elevated BNP / NT-proBNP', check: p => Boolean(p.bnp || p.ntProBnp || (p.bnpValue && Number(p.bnpValue) > 400)) },
        { name: 'Moderate to severe MR', check: p => Boolean(p.mr || p.mitralRegurgitation) },
        { name: 'Hyponatremia (Na < 135)', check: p => Boolean(p.hyponatremia || (p.sodium && Number(p.sodium) < 135)) }
      ];
    }

    const aliveCohort = cohort.filter(p => !isDeceased(p));
    const deceasedCohort = cohort.filter(p => isDeceased(p));

    const items = defs.map(d => {
      const aliveN = aliveCohort.filter(d.check).length;
      const deadN = deceasedCohort.filter(d.check).length;
      const alivePct = aliveCohort.length > 0 ? Math.round((aliveN / aliveCohort.length) * 1000) / 10 : 0;
      const deadPct = deceasedCohort.length > 0 ? Math.round((deadN / deceasedCohort.length) * 1000) / 10 : 0;
      return {
        name: d.name,
        aliveN,
        alivePct,
        deadN,
        deadPct
      };
    }).sort((a, b) => b.alivePct - a.alivePct);

    return {
      registry: riskRegistry,
      aliveCount: aliveCohort.length,
      deceasedCount: deceasedCohort.length,
      subtitleDesc,
      footerDesc,
      items
    };
  }, [riskRegistry, filteredHfCohort, filteredStemiCohort, filteredNstemiCohort, isFilterActive, backendMetrics]);

  // Real Age Distribution Across Registries (Dynamic from filtered cohorts)
  const ageDistributionData = useMemo(() => {
    if (!isFilterActive && backendMetrics?.demographics?.ageDistribution) {
      return backendMetrics.demographics.ageDistribution;
    }

    const calcBracket = (cohort) => {
      const seen = new Set();
      const uniquePts = [];
      cohort.forEach(p => {
        const id = getPatientKey(p);
        if (id) {
          if (!seen.has(id)) {
            seen.add(id);
            uniquePts.push(p);
          }
        } else {
          uniquePts.push(p);
        }
      });
      const tot = uniquePts.length;
      if (tot === 0) return { b1: 0, b2: 0, b3: 0, b4: 0, count1: 0, count2: 0, count3: 0, count4: 0, total: 0 };
      let b1 = 0, b2 = 0, b3 = 0, b4 = 0;
      uniquePts.forEach(p => {
        let a = Number(p.age);
        if (isNaN(a) && p.date_of_birth) {
          const dob = new Date(p.date_of_birth);
          if (!isNaN(dob.getTime())) a = Math.floor((new Date() - dob) / (365.25 * 24 * 3600 * 1000));
        }
        if (!isNaN(a)) {
          if (a < 50) b1++;
          else if (a <= 60) b2++;
          else if (a <= 70) b3++;
          else b4++;
        }
      });
      return {
        b1: Number(((b1 / tot) * 100).toFixed(1)),
        b2: Number(((b2 / tot) * 100).toFixed(1)),
        b3: Number(((b3 / tot) * 100).toFixed(1)),
        b4: Number(((b4 / tot) * 100).toFixed(1)),
        count1: b1, count2: b2, count3: b3, count4: b4, total: tot
      };
    };

    const hfB = calcBracket(filteredHfCohort);
    const stemiB = calcBracket(filteredStemiCohort);
    const nstemiB = calcBracket(filteredNstemiCohort);

    return [
      { bracket: '<50 yrs', HF: hfB.b1, STEMI: stemiB.b1, NSTEMI: nstemiB.b1 },
      { bracket: '50-60 yrs', HF: hfB.b2, STEMI: stemiB.b2, NSTEMI: nstemiB.b2 },
      { bracket: '61-70 yrs', HF: hfB.b3, STEMI: stemiB.b3, NSTEMI: nstemiB.b3 },
      { bracket: '>70 yrs', HF: hfB.b4, STEMI: stemiB.b4, NSTEMI: nstemiB.b4 }
    ];
  }, [filteredHfCohort, filteredStemiCohort, filteredNstemiCohort, isFilterActive, backendMetrics]);

  // Real Gender Distribution Across Registries (Dynamic from filtered cohorts)
  const genderDistributionData = useMemo(() => {
    if (!isFilterActive && backendMetrics?.demographics?.genderDistribution) {
      return backendMetrics.demographics.genderDistribution;
    }

    const calcGender = (cohort) => {
      const seen = new Set();
      const uniquePts = [];
      cohort.forEach(p => {
        const id = getPatientKey(p);
        if (id) {
          if (!seen.has(id)) {
            seen.add(id);
            uniquePts.push(p);
          }
        } else {
          uniquePts.push(p);
        }
      });
      const tot = uniquePts.length;
      if (tot === 0) return { male: 0, female: 0, maleCount: 0, femaleCount: 0, total: 0 };
      let males = 0;
      uniquePts.forEach(p => {
        const g = String(p.gender || '').trim().toLowerCase();
        if (g === 'male' || g === 'm') males++;
      });
      const females = tot - males;
      const malePct = Number(((males / tot) * 100).toFixed(1));
      const femalePct = Number(((females / tot) * 100).toFixed(1));
      return { male: malePct, female: femalePct, maleCount: males, femaleCount: females, total: tot };
    };

    const hfG = calcGender(filteredHfCohort);
    const stemiG = calcGender(filteredStemiCohort);
    const nstemiG = calcGender(filteredNstemiCohort);

    return [
      { registry: 'HF', Male: hfG.male, Female: hfG.female },
      { registry: 'STEMI', Male: stemiG.male, Female: stemiG.female },
      { registry: 'NSTEMI', Male: nstemiG.male, Female: nstemiG.female }
    ];
  }, [filteredHfCohort, filteredStemiCohort, filteredNstemiCohort, isFilterActive, backendMetrics]);

  // Combined Presentation Profile (STEMI vs NSTEMI into a Single Comparative Chart)
  const presentationComparisonData = useMemo(() => {
    if (!isFilterActive && backendMetrics?.demographics?.presentationComparison) {
      return backendMetrics.demographics.presentationComparison;
    }

    const stemiTot = filteredStemiCohort.length || 1;
    const nstemiTot = filteredNstemiCohort.length || 1;

    const matchOpt = (val, target) => {
      if (!val) return false;
      if (Array.isArray(val)) return val.some(item => String(item).trim().toLowerCase() === target.toLowerCase());
      if (typeof val === 'string') return val.split(',').some(item => item.trim().toLowerCase() === target.toLowerCase());
      return false;
    };

    const isTyp = p => p.typical_angina === true || p.typical_angina === 'Yes' || matchOpt(p.presentation, 'Typical angina') || matchOpt(p.presentations, 'Typical angina');
    const isAtyp = p => p.atypical_chest_pain === true || p.atypical_chest_pain === 'Yes' || matchOpt(p.presentation, 'Atypical chest pain') || matchOpt(p.presentations, 'Atypical chest pain');
    const isBreath = p => p.breathlessness === true || p.breathlessness === 'Yes' || matchOpt(p.presentation, 'Breathlessness') || matchOpt(p.presentations, 'Breathlessness');
    const isSync = p => p.syncope_presyncope === true || p.syncope_presyncope === 'Yes' || matchOpt(p.presentation, 'Syncope/ Pre-syncope') || matchOpt(p.presentations, 'Syncope/ Pre-syncope');

    const sTyp = Number(((filteredStemiCohort.filter(isTyp).length / stemiTot) * 100).toFixed(1));
    const sAtyp = Number(((filteredStemiCohort.filter(isAtyp).length / stemiTot) * 100).toFixed(1));
    const sBreath = Number(((filteredStemiCohort.filter(isBreath).length / stemiTot) * 100).toFixed(1));
    const sSync = Number(((filteredStemiCohort.filter(isSync).length / stemiTot) * 100).toFixed(1));

    const nTyp = Number(((filteredNstemiCohort.filter(isTyp).length / nstemiTot) * 100).toFixed(1));
    const nAtyp = Number(((filteredNstemiCohort.filter(isAtyp).length / nstemiTot) * 100).toFixed(1));
    const nBreath = Number(((filteredNstemiCohort.filter(isBreath).length / nstemiTot) * 100).toFixed(1));
    const nSync = Number(((filteredNstemiCohort.filter(isSync).length / nstemiTot) * 100).toFixed(1));

    return [
      { presentation: 'Typical Angina', STEMI: sTyp, NSTEMI: nTyp },
      { presentation: 'Atypical Pain', STEMI: sAtyp, NSTEMI: nAtyp },
      { presentation: 'Breathlessness', STEMI: sBreath, NSTEMI: nBreath },
      { presentation: 'Syncope', STEMI: sSync, NSTEMI: nSync }
    ];
  }, [filteredStemiCohort, filteredNstemiCohort, isFilterActive, backendMetrics]);

  // Dynamic TIMI Risk Stratification: STEMI (Scale 0-16) and NSTEMI (Scale 0-21)
  const timiRiskDistribution = useMemo(() => {
    if (!isFilterActive && backendMetrics?.riskStratification?.timiRiskDistribution) {
      return backendMetrics.riskStratification.timiRiskDistribution;
    }

    // NSTEMI (Scale 0-21): Low (0-4), Medium (5-10), High (11-21)
    const nstTotal = filteredNstemiCohort.length;
    let nstLow = 0, nstMed = 0, nstHigh = 0, nstSum = 0;
    filteredNstemiCohort.forEach(p => {
      const s = Number(p.timiScore ?? p.timi_total_score ?? p.timi_risk_score ?? 0);
      nstSum += s;
      if (s <= 4) nstLow++;
      else if (s <= 10) nstMed++;
      else nstHigh++;
    });
    const nstAvg = nstTotal > 0 ? (nstSum / nstTotal).toFixed(1) : '—';
    const nstLowPct = nstTotal > 0 ? ((nstLow / nstTotal) * 100).toFixed(1) : '0.0';
    const nstMedPct = nstTotal > 0 ? ((nstMed / nstTotal) * 100).toFixed(1) : '0.0';
    const nstHighPct = nstTotal > 0 ? ((nstHigh / nstTotal) * 100).toFixed(1) : '0.0';

    // STEMI (Scale 0-16): Low (0-3), Medium (4-7), High (8-16)
    const stTotal = filteredStemiCohort.length;
    let stLow = 0, stMed = 0, stHigh = 0, stSum = 0;
    filteredStemiCohort.forEach(p => {
      const s = Number(p.timiScore ?? p.timi_total_score ?? p.timi_risk_score ?? 0);
      stSum += s;
      if (s <= 3) stLow++;
      else if (s <= 7) stMed++;
      else stHigh++;
    });
    const stAvg = stTotal > 0 ? (stSum / stTotal).toFixed(1) : '—';
    const stLowPct = stTotal > 0 ? ((stLow / stTotal) * 100).toFixed(1) : '0.0';
    const stMedPct = stTotal > 0 ? ((stMed / stTotal) * 100).toFixed(1) : '0.0';
    const stHighPct = stTotal > 0 ? ((stHigh / stTotal) * 100).toFixed(1) : '0.0';

    return {
      nstemi: { total: nstTotal, avg: nstAvg, lowCount: nstLow, medCount: nstMed, highCount: nstHigh, lowPct: nstLowPct, medPct: nstMedPct, highPct: nstHighPct },
      stemi: { total: stTotal, avg: stAvg, lowCount: stLow, medCount: stMed, highCount: stHigh, lowPct: stLowPct, medPct: stMedPct, highPct: stHighPct }
    };
  }, [filteredStemiCohort, filteredNstemiCohort, isFilterActive, backendMetrics]);

  // Cross-Registry Multimorbidity / Patient Overlap (4 categories: HF & STEMI, STEMI & NSTEMI, HF & NSTEMI, All Three)
  const crossRegistryOverlapData = useMemo(() => {
    if (!isFilterActive && backendMetrics?.demographics?.patientOverlap) {
      return backendMetrics.demographics.patientOverlap;
    }

    const getPid = r => getPatientKey(r);
    const hfSet = new Set(filteredHfCohort.map(getPid).filter(Boolean));
    const stemiSet = new Set(filteredStemiCohort.map(getPid).filter(Boolean));
    const nstemiSet = new Set(filteredNstemiCohort.map(getPid).filter(Boolean));

    let hf_stemi = 0;
    let stemi_nstemi = 0;
    let hf_nstemi = 0;
    let all_three = 0;

    const allKeys = new Set([...hfSet, ...stemiSet, ...nstemiSet]);
    for (const k of allKeys) {
      const inHf = hfSet.has(k);
      const inStemi = stemiSet.has(k);
      const inNstemi = nstemiSet.has(k);

      if (inHf && inStemi && inNstemi) all_three++;
      if (inHf && inStemi) hf_stemi++;
      if (inStemi && inNstemi) stemi_nstemi++;
      if (inHf && inNstemi) hf_nstemi++;
    }

    return [
      { name: 'HF & STEMI', patients: hf_stemi, fill: '#2563eb' },
      { name: 'STEMI & NSTEMI', patients: stemi_nstemi, fill: '#d97706' },
      { name: 'HF & NSTEMI', patients: hf_nstemi, fill: '#7c3aed' },
      { name: 'All Three', patients: all_three, fill: '#059669' }
    ];
  }, [filteredHfCohort, filteredStemiCohort, filteredNstemiCohort, isFilterActive, backendMetrics]);

  // Dynamic Cross-Registry Common Risk Factors Comparison (HF vs STEMI vs NSTEMI)
  const comorbidityComparisonData = useMemo(() => {
    const calcComorbid = (cohort, checkFn) => {
      const tot = cohort.length;
      if (tot === 0) return { pct: 0, count: 0 };
      const count = cohort.filter(checkFn).length;
      return { pct: Number(((count / tot) * 100).toFixed(1)), count };
    };

    const hasHtn = p => Boolean(p.hypertension === true || p.hypertension === 'Yes' || p.hypertension === 1 || p.htn || p.hasHtn || p.has_htn);
    const hasDm = p => Boolean(p.diabetes === true || p.diabetes === 'Yes' || p.diabetes === 1 || p.dm || p.hasDm || p.has_dm);
    const hasSmoke = p => Boolean(p.smoking === true || p.smoking === 'Yes' || p.smoking === 1);
    const hasRf = p => Boolean(p.renal_failure === true || p.renalFailure || p.ckd || p.hasCkd || p.has_ckd || (p.creatinine && Number(p.creatinine) > 2.0));
    const hasCad = p => Boolean(p.prior_acs || p.priorAcs || p.prior_ptca || p.priorPtca || p.prior_cabg || p.priorCabg || p.cad || p.hasCad || p.has_cad || p.priorCad || p.priorMi);
    const hasCva = p => Boolean(p.cva === true || p.cva === 'Yes' || p.cva === 1 || p.stroke === true);
    const hasCopd = p => Boolean(p.copd === true || p.copd === 'Yes' || p.copd === 1);

    const buildRow = (name, fn) => {
      const hf = calcComorbid(filteredHfCohort, fn);
      const st = calcComorbid(filteredStemiCohort, fn);
      const nst = calcComorbid(filteredNstemiCohort, fn);
      return {
        name,
        HF: hf.pct,
        HF_count: hf.count,
        STEMI: st.pct,
        STEMI_count: st.count,
        NSTEMI: nst.pct,
        NSTEMI_count: nst.count
      };
    };

    return [
      buildRow('Hypertension', hasHtn),
      buildRow('Smoking', hasSmoke),
      buildRow('Diabetes', hasDm),
      buildRow('Renal Failure / CKD', hasRf),
      buildRow('Prior CAD / ACS', hasCad),
      buildRow('CVA / Stroke', hasCva),
      buildRow('COPD', hasCopd)
    ];
  }, [filteredHfCohort, filteredStemiCohort, filteredNstemiCohort]);

  // Helper to get billed cost from any ACS record
  const getAcsBilledCost = (p) => {
    const direct = p.totalCost ?? p.total_cost ?? p.totalHospitalCost ?? p.cost;
    if (direct !== null && direct !== undefined && !isNaN(Number(direct)) && Number(direct) > 0) {
      return Number(direct);
    }
    const comp = (
      Number(p.bed_charges || 0) +
      Number(p.drugs_disposables_cost || 0) +
      Number(p.package_cost || 0) +
      Number(p.laboratory_cost || 0) +
      Number(p.non_invasive_lab_cost || 0) +
      Number(p.consultation_cost || 0) +
      Number(p.radiology_cost || 0) +
      Number(p.miscellaneous_cost || 0)
    );
    return comp > 0 ? comp : 0;
  };

  // New Financial Graph 1: Visual Cost Component Composition (Cath Lab vs Drugs vs Beds vs Labs)
  const costComponentComposition = useMemo(() => {
    const allAcs = [...filteredStemiCohort, ...filteredNstemiCohort].filter(p => getAcsBilledCost(p) > 0);
    const denom = allAcs.length > 0 ? allAcs.length : 1;

    let cathLab = 0, drugs = 0, beds = 0, labs = 0, other = 0;
    allAcs.forEach(p => {
      cathLab += Number(p.package_cost || 0);
      drugs += Number(p.drugs_disposables_cost || 0);
      beds += Number(p.bed_charges || 0);
      labs += Number(p.laboratory_cost || 0) + Number(p.non_invasive_lab_cost || 0);
      other += Number(p.consultation_cost || 0) + Number(p.radiology_cost || 0) + Number(p.miscellaneous_cost || 0);
    });

    const grand = (cathLab + drugs + beds + labs + other) || 1;
    return [
      { name: 'Cath Lab / Stents', amount: cathLab, avgAmount: Math.round(cathLab / denom), percent: Number(((cathLab / grand) * 100).toFixed(1)), color: '#2563eb' },
      { name: 'Labs & Diagnostics', amount: labs, avgAmount: Math.round(labs / denom), percent: Number(((labs / grand) * 100).toFixed(1)), color: '#7c3aed' },
      { name: 'Drugs & Disposables', amount: drugs, avgAmount: Math.round(drugs / denom), percent: Number(((drugs / grand) * 100).toFixed(1)), color: '#0d9488' },
      { name: 'Beds & ICU', amount: beds, avgAmount: Math.round(beds / denom), percent: Number(((beds / grand) * 100).toFixed(1)), color: '#d97706' },
      { name: 'Consults & Other', amount: other, avgAmount: Math.round(other / denom), percent: Number(((other / grand) * 100).toFixed(1)), color: '#64748b' }
    ];
  }, [filteredStemiCohort, filteredNstemiCohort]);

  // New Financial Graph 2: Cost by Culprit Vessel & Procedural Acuity (LAD vs RCA vs LCx vs Multivessel)
  const costByCulpritVessel = useMemo(() => {
    const isYes = v => v === true || v === 'Yes' || v === 'yes' || v === 1 || v === '1';
    const buckets = {
      LAD: { sum: 0, count: 0, pamiSum: 0, pamiCount: 0, nonPamiSum: 0, nonPamiCount: 0 },
      RCA: { sum: 0, count: 0, pamiSum: 0, pamiCount: 0, nonPamiSum: 0, nonPamiCount: 0 },
      LCx: { sum: 0, count: 0, pamiSum: 0, pamiCount: 0, nonPamiSum: 0, nonPamiCount: 0 },
      Multivessel: { sum: 0, count: 0, pamiSum: 0, pamiCount: 0, nonPamiSum: 0, nonPamiCount: 0 },
      'Conservative / Non-PCI': { sum: 0, count: 0, pamiSum: 0, pamiCount: 0, nonPamiSum: 0, nonPamiCount: 0 }
    };

    [...filteredStemiCohort, ...filteredNstemiCohort].forEach(p => {
      const cost = getAcsBilledCost(p);
      if (cost <= 0) return;
      const lad = isYes(p.vessel_lad);
      const rca = isYes(p.vessel_rca);
      const lcx = isYes(p.vessel_lcx);
      const lmca = isYes(p.vessel_lmca);
      const majorCount = (lad ? 1 : 0) + (rca ? 1 : 0) + (lcx ? 1 : 0) + (lmca ? 1 : 0);

      let key = 'Conservative / Non-PCI';
      if (lmca || majorCount > 1) key = 'Multivessel';
      else if (lad) key = 'LAD';
      else if (rca) key = 'RCA';
      else if (lcx) key = 'LCx';

      const b = buckets[key];
      b.sum += cost;
      b.count++;
      const strat = String(p.treatmentStrategy || p.strategy || '').toLowerCase();
      const isPami = isYes(p.pami) || strat.includes('pami') || strat.includes('primary');
      if (isPami) {
        b.pamiSum += cost;
        b.pamiCount++;
      } else {
        b.nonPamiSum += cost;
        b.nonPamiCount++;
      }
    });

    const keys = ['LAD', 'RCA', 'LCx', 'Multivessel', ...(buckets['Conservative / Non-PCI'].count > 0 ? ['Conservative / Non-PCI'] : [])];
    return keys.map(key => {
      const b = buckets[key];
      return {
        vessel: key,
        avgCost: b.count > 0 ? Math.round(b.sum / b.count) : 0,
        pamiAvgCost: b.pamiCount > 0 ? Math.round(b.pamiSum / b.pamiCount) : 0,
        nonPamiAvgCost: b.nonPamiCount > 0 ? Math.round(b.nonPamiSum / b.nonPamiCount) : 0,
        totalCost: b.sum,
        count: b.count,
        pamiCount: b.pamiCount,
        nonPamiCount: b.nonPamiCount,
        pamiPct: b.count > 0 ? Number(((b.pamiCount / b.count) * 100).toFixed(1)) : 0
      };
    });
  }, [filteredStemiCohort, filteredNstemiCohort]);

  // New Financial Graph 3: Risk-Adjusted Cost by TIMI Risk Tier (Low vs Medium vs High Risk)
  const costByTimiTier = useMemo(() => {
    const tiers = {
      'Low Risk': { sum: 0, count: 0, stemiSum: 0, stemiCount: 0, nstemiSum: 0, nstemiCount: 0 },
      'Medium Risk': { sum: 0, count: 0, stemiSum: 0, stemiCount: 0, nstemiSum: 0, nstemiCount: 0 },
      'High Risk': { sum: 0, count: 0, stemiSum: 0, stemiCount: 0, nstemiSum: 0, nstemiCount: 0 }
    };

    filteredStemiCohort.forEach(p => {
      const cost = getAcsBilledCost(p);
      if (cost <= 0) return;
      const s = Number(p.timiScore ?? p.timi_total_score ?? p.timi_risk_score ?? 0);
      const tier = s <= 3 ? 'Low Risk' : s <= 7 ? 'Medium Risk' : 'High Risk';
      tiers[tier].sum += cost;
      tiers[tier].count++;
      tiers[tier].stemiSum += cost;
      tiers[tier].stemiCount++;
    });

    filteredNstemiCohort.forEach(p => {
      const cost = getAcsBilledCost(p);
      if (cost <= 0) return;
      const s = Number(p.timiScore ?? p.timi_total_score ?? p.timi_risk_score ?? 0);
      const tier = s <= 4 ? 'Low Risk' : s <= 10 ? 'Medium Risk' : 'High Risk';
      tiers[tier].sum += cost;
      tiers[tier].count++;
      tiers[tier].nstemiSum += cost;
      tiers[tier].nstemiCount++;
    });

    return ['Low Risk', 'Medium Risk', 'High Risk'].map(tier => {
      const t = tiers[tier];
      return {
        tier,
        avgCost: t.count > 0 ? Math.round(t.sum / t.count) : 0,
        stemiAvgCost: t.stemiCount > 0 ? Math.round(t.stemiSum / t.stemiCount) : 0,
        nstemiAvgCost: t.nstemiCount > 0 ? Math.round(t.nstemiSum / t.nstemiCount) : 0,
        totalCost: t.sum,
        count: t.count,
        stemiCount: t.stemiCount,
        nstemiCount: t.nstemiCount
      };
    });
  }, [filteredStemiCohort, filteredNstemiCohort]);

  // New Financial Graph 4: Average Cost & Revenue Realization by Payer Scheme (Insurance vs Arogyasree vs Govt vs Cash)
  const costAndRevenueByPayer = useMemo(() => {
    const schemes = {
      Insurance: { sum: 0, count: 0, color: '#2563eb' },
      Arogyasree: { sum: 0, count: 0, color: '#0d9488' },
      Govt: { sum: 0, count: 0, color: '#d97706' },
      Cash: { sum: 0, count: 0, color: '#64748b' }
    };

    [...filteredStemiCohort, ...filteredNstemiCohort].forEach(p => {
      const cost = getAcsBilledCost(p);
      if (cost <= 0) return;
      const mode = String(p.insuranceMode || p.insurance_mode || p.paymentMode || p.payment_mode || '').trim().toLowerCase();
      let scheme = 'Cash';
      if (mode.includes('private') || mode.includes('insurance') || mode.includes('tpa')) scheme = 'Insurance';
      else if (mode.includes('arogya')) scheme = 'Arogyasree';
      else if (mode.includes('gov') || mode.includes('cghs') || mode.includes('echs')) scheme = 'Govt';

      schemes[scheme].sum += cost;
      schemes[scheme].count++;
    });

    const totalAll = Object.values(schemes).reduce((s, v) => s + v.sum, 0) || 1;
    return ['Insurance', 'Arogyasree', 'Govt', 'Cash'].map(scheme => {
      const s = schemes[scheme];
      return {
        scheme,
        avgCost: s.count > 0 ? Math.round(s.sum / s.count) : 0,
        totalRevenue: s.sum,
        count: s.count,
        sharePct: Number(((s.sum / totalAll) * 100).toFixed(1)),
        color: s.color
      };
    });
  }, [filteredStemiCohort, filteredNstemiCohort]);

  // Trends Over Time Data (Strict live aggregation from database cohorts)
  const monthlyTrends = useMemo(() => {
    if (!isFilterActive && backendMetrics?.monthlyTrends?.length > 0) {
      return backendMetrics.monthlyTrends;
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStats = months.map(m => ({
      month: m,
      HF: 0,
      STEMI: 0,
      NSTEMI: 0,
      totalAdmissions: 0,
      allDeaths: 0,
      inHospDeaths: 0,
      d2bList: [],
      d2nList: [],
      stemiCosts: [],
      nstemiCosts: []
    }));

    const getRecordMonth = (r) => {
      const raw = r.admission_date || r.date_of_admission || r.visit_date || r.created_at || r.assessmentDate || r.admissionDate;
      if (!raw) return -1;
      const parsed = new Date(raw);
      if (isNaN(parsed.getTime())) return -1;
      return parsed.getMonth();
    };

    const isRecordDead = (r, type) => {
      if (type === 'HF') {
        return Boolean(
          r.death === true || r.is_death === 1 || r.is_death === '1' || r.is_death === true ||
          r.death === 1 || r.death === '1' || r.death === 'Yes' || r.death === 'yes' ||
          r.deathHospital === true || r.death_hospital === 1 || r.death_hospital === 'yes' || r.death_hospital === '1' ||
          r.deathLocation === 'Hospital' || r.deathLocation === 'Home' ||
          r.in_hospital_death === 1 || r.in_hospital_death === '1'
        );
      }
      return Boolean(r.death === 'Yes' || r.death === 'yes' || r.death === '1' || r.death === 1 || r.death === true);
    };

    const isRecordInHospDead = (r, type) => {
      if (type === 'HF') {
        return Boolean(
          r.deathHospital === true || r.death_hospital === true || r.death_hospital === 1 || r.death_hospital === '1' ||
          String(r.death_hospital).toLowerCase() === 'yes' || r.deathLocation === 'Hospital' ||
          r.in_hospital_death === 1 || r.in_hospital_death === '1'
        );
      }
      // STEMI & NSTEMI deaths recorded in index registry are in-hospital
      return Boolean(r.death === 'Yes' || r.death === 'yes' || r.death === '1' || r.death === 1 || r.death === true);
    };

    const getRecordCost = (p) => {
      const direct = p.totalCost ?? p.total_cost ?? p.totalHospitalCost ?? p.cost;
      if (direct !== null && direct !== undefined && !isNaN(Number(direct)) && Number(direct) > 0) {
        return Number(direct);
      }
      const comp = (
        Number(p.bed_charges || 0) +
        Number(p.drugs_disposables_cost || 0) +
        Number(p.package_cost || 0) +
        Number(p.laboratory_cost || 0) +
        Number(p.non_invasive_lab_cost || 0) +
        Number(p.consultation_cost || 0) +
        Number(p.radiology_cost || 0) +
        Number(p.miscellaneous_cost || 0)
      );
      return comp > 0 ? comp : null;
    };

    // HF cohort
    filteredHfCohort.forEach(r => {
      const mIdx = getRecordMonth(r);
      if (mIdx >= 0 && mIdx < 12) {
        monthStats[mIdx].HF += 1;
        monthStats[mIdx].totalAdmissions += 1;
        if (isRecordDead(r, 'HF')) monthStats[mIdx].allDeaths += 1;
        if (isRecordInHospDead(r, 'HF')) monthStats[mIdx].inHospDeaths += 1;
      }
    });

    // STEMI cohort
    filteredStemiCohort.forEach(r => {
      const mIdx = getRecordMonth(r);
      if (mIdx >= 0 && mIdx < 12) {
        monthStats[mIdx].STEMI += 1;
        monthStats[mIdx].totalAdmissions += 1;
        if (isRecordDead(r, 'STEMI')) {
          monthStats[mIdx].allDeaths += 1;
          monthStats[mIdx].inHospDeaths += 1;
        }

        const d2b = r.doorToBalloonTime ?? r.door_to_balloon_time;
        if (d2b !== null && d2b !== undefined && d2b !== '' && !isNaN(Number(d2b)) && Number(d2b) > 0) {
          monthStats[mIdx].d2bList.push(Number(d2b));
        }

        const d2n = r.doorToNeedleTime ?? r.door_to_needle_time;
        if (d2n !== null && d2n !== undefined && d2n !== '' && !isNaN(Number(d2n)) && Number(d2n) > 0) {
          monthStats[mIdx].d2nList.push(Number(d2n));
        }

        const cost = getRecordCost(r);
        if (cost !== null) monthStats[mIdx].stemiCosts.push(cost);
      }
    });

    // NSTEMI cohort
    filteredNstemiCohort.forEach(r => {
      const mIdx = getRecordMonth(r);
      if (mIdx >= 0 && mIdx < 12) {
        monthStats[mIdx].NSTEMI += 1;
        monthStats[mIdx].totalAdmissions += 1;
        if (isRecordDead(r, 'NSTEMI')) {
          monthStats[mIdx].allDeaths += 1;
          monthStats[mIdx].inHospDeaths += 1;
        }

        const d2b = r.doorToBalloonTime ?? r.door_to_balloon_time;
        if (d2b !== null && d2b !== undefined && d2b !== '' && !isNaN(Number(d2b)) && Number(d2b) > 0) {
          monthStats[mIdx].d2bList.push(Number(d2b));
        }

        const d2n = r.doorToNeedleTime ?? r.door_to_needle_time;
        if (d2n !== null && d2n !== undefined && d2n !== '' && !isNaN(Number(d2n)) && Number(d2n) > 0) {
          monthStats[mIdx].d2nList.push(Number(d2n));
        }

        const cost = getRecordCost(r);
        if (cost !== null) monthStats[mIdx].nstemiCosts.push(cost);
      }
    });

    return monthStats.map(stat => {
      const avgD2b = stat.d2bList.length > 0
        ? Math.round(stat.d2bList.reduce((a, b) => a + b, 0) / stat.d2bList.length)
        : null;
      const avgD2n = stat.d2nList.length > 0
        ? Math.round(stat.d2nList.reduce((a, b) => a + b, 0) / stat.d2nList.length)
        : null;
      const avgCostStemi = stat.stemiCosts.length > 0
        ? Math.round(stat.stemiCosts.reduce((a, b) => a + b, 0) / stat.stemiCosts.length)
        : null;
      const avgCostNstemi = stat.nstemiCosts.length > 0
        ? Math.round(stat.nstemiCosts.reduce((a, b) => a + b, 0) / stat.nstemiCosts.length)
        : null;
      const allMortRate = stat.totalAdmissions > 0
        ? Number(((stat.allDeaths / stat.totalAdmissions) * 100).toFixed(1))
        : null;
      const inHospMortRate = stat.totalAdmissions > 0
        ? Number(((stat.inHospDeaths / stat.totalAdmissions) * 100).toFixed(1))
        : null;

      return {
        month: stat.month,
        HF: stat.HF,
        STEMI: stat.STEMI,
        NSTEMI: stat.NSTEMI,
        totalAdmissions: stat.totalAdmissions,
        allDeaths: stat.allDeaths,
        inHospDeaths: stat.inHospDeaths,
        MortalityRate: inHospMortRate, // backward compat
        AllMortalityRate: allMortRate,
        InHospMortalityRate: inHospMortRate,
        D2B: avgD2b,
        D2N: avgD2n,
        CostSTEMI: avgCostStemi,
        CostNSTEMI: avgCostNstemi
      };
    });
  }, [filteredHfCohort, filteredStemiCohort, filteredNstemiCohort, isFilterActive, backendMetrics]);

  // Combined / Display Metrics - Prioritizing verified backend database queries when default, and dynamically recalculating when filtered
  const useDirectDb = !isFilterActive && backendMetrics?.kpis;

  const displayTotalRecords = useDirectDb && backendMetrics.kpis.totalRecords != null ? backendMetrics.kpis.totalRecords : totalRecords;
  const displayHfRecords = useDirectDb && backendMetrics.kpis.hfTotal != null ? backendMetrics.kpis.hfTotal : totalHfRecords;
  const displayStemiRecords = useDirectDb && backendMetrics.kpis.stemiTotal != null ? backendMetrics.kpis.stemiTotal : totalStemiRecords;
  const displayNstemiRecords = useDirectDb && backendMetrics.kpis.nstemiTotal != null ? backendMetrics.kpis.nstemiTotal : totalNstemiRecords;

  const displayOverallMortality = useDirectDb && backendMetrics.kpis.overallMortalityRate != null ? backendMetrics.kpis.overallMortalityRate : overallMortalityRate;
  const displayTotalDeaths = useDirectDb && backendMetrics.kpis.totalDeaths != null ? backendMetrics.kpis.totalDeaths : totalDeaths;
  const displayStemiMortality = useDirectDb && backendMetrics.kpis.stemiMortalityRate != null ? backendMetrics.kpis.stemiMortalityRate : stemiMortalityRate;
  const displayNstemiMortality = useDirectDb && backendMetrics.kpis.nstemiMortalityRate != null ? backendMetrics.kpis.nstemiMortalityRate : nstemiMortalityRate;
  const displayHfMortality = useDirectDb && backendMetrics.kpis.hfMortalityRate != null ? backendMetrics.kpis.hfMortalityRate : hfMortalityRate;

  const displayOverallInHospMortality = useDirectDb && backendMetrics.kpis.overallInHospitalMortalityRate != null ? backendMetrics.kpis.overallInHospitalMortalityRate : overallInHospitalMortalityRate;
  const displayTotalInHospDeaths = useDirectDb && backendMetrics.kpis.totalInHospDeaths != null ? backendMetrics.kpis.totalInHospDeaths : totalInHospDeaths;
  const displayHfInHospDeaths = useDirectDb && backendMetrics.kpis.hfInHosp != null ? backendMetrics.kpis.hfInHosp : hfInHospDeaths;
  const displayStemiInHospDeaths = useDirectDb && backendMetrics.kpis.stemiInHosp != null ? backendMetrics.kpis.stemiInHosp : stemiInHospDeaths;
  const displayNstemiInHospDeaths = useDirectDb && backendMetrics.kpis.nstemiInHosp != null ? backendMetrics.kpis.nstemiInHosp : nstemiInHospDeaths;
  const displayHfTotalDeaths = useDirectDb && backendMetrics.kpis.hfTotalDeaths != null ? backendMetrics.kpis.hfTotalDeaths : hfTotalDeaths;
  const displayStemiInHospMortality = useDirectDb && backendMetrics.kpis.stemiInHospMortalityRate != null ? backendMetrics.kpis.stemiInHospMortalityRate : stemiInHospMortalityRate;
  const displayNstemiInHospMortality = useDirectDb && backendMetrics.kpis.nstemiInHospMortalityRate != null ? backendMetrics.kpis.nstemiInHospMortalityRate : nstemiInHospMortalityRate;
  const displayHfInHospMortality = useDirectDb && backendMetrics.kpis.hfInHospMortalityRate != null ? backendMetrics.kpis.hfInHospMortalityRate : hfInHospMortalityRate;

  // 30-Day Readmission Metrics
  const displayOverallReadmissionRate = useDirectDb && backendMetrics.kpis.overallReadmissionRate != null ? backendMetrics.kpis.overallReadmissionRate : readmissionStats.overallRate;
  const displayTotalReadmissions = useDirectDb && backendMetrics.kpis.totalReadmCount != null ? backendMetrics.kpis.totalReadmCount : readmissionStats.totalCount;
  const displayHfReadmissionRate = useDirectDb && backendMetrics.kpis.hfReadmissionRate != null ? backendMetrics.kpis.hfReadmissionRate : readmissionStats.hfRate;
  const displayHfReadmCount = useDirectDb && backendMetrics.kpis.hfReadmCount != null ? backendMetrics.kpis.hfReadmCount : readmissionStats.hfCount;
  const displayStemiReadmissionRate = useDirectDb && backendMetrics.kpis.stemiReadmissionRate != null ? backendMetrics.kpis.stemiReadmissionRate : readmissionStats.stemiRate;
  const displayStemiReadmCount = useDirectDb && backendMetrics.kpis.stemiReadmCount != null ? backendMetrics.kpis.stemiReadmCount : readmissionStats.stemiCount;
  const displayNstemiReadmissionRate = useDirectDb && backendMetrics.kpis.nstemiReadmissionRate != null ? backendMetrics.kpis.nstemiReadmissionRate : readmissionStats.nstemiRate;
  const displayNstemiReadmCount = useDirectDb && backendMetrics.kpis.nstemiReadmCount != null ? backendMetrics.kpis.nstemiReadmCount : readmissionStats.nstemiCount;

  const displayTimelinessRate = useDirectDb && backendMetrics.kpis.overallTimelinessRate != null ? backendMetrics.kpis.overallTimelinessRate : overallTimelinessRate;
  const displayD2bStemiRate = useDirectDb && backendMetrics.kpis.d2bStemiRate != null ? backendMetrics.kpis.d2bStemiRate : d2bMetRate;
  const displayCathNstemiRate = useDirectDb && backendMetrics.kpis.cathNstemiRate != null ? backendMetrics.kpis.cathNstemiRate : (typeof cathNstemiRate === 'number' ? cathNstemiRate.toFixed(1) : cathNstemiRate);

  const displayCombinedCost = useDirectDb && backendMetrics.kpis.combinedCostDisplay ? backendMetrics.kpis.combinedCostDisplay : costStats.combinedDisplay;
  const displayStemiCost = useDirectDb && backendMetrics.kpis.stemiCostDisplay ? backendMetrics.kpis.stemiCostDisplay : costStats.stemiDisplay;
  const displayNstemiCost = useDirectDb && backendMetrics.kpis.nstemiCostDisplay ? backendMetrics.kpis.nstemiCostDisplay : costStats.nstemiDisplay;
  const billedStemiCount = useMemo(() => filteredStemiCohort.filter(p => getAcsBilledCost(p) > 0).length, [filteredStemiCohort]);
  const billedNstemiCount = useMemo(() => filteredNstemiCohort.filter(p => getAcsBilledCost(p) > 0).length, [filteredNstemiCohort]);
  const displayStemiAvgCost = useDirectDb && backendMetrics.kpis.stemiAvgCost != null ? backendMetrics.kpis.stemiAvgCost : (billedStemiCount > 0 ? Math.round(costStats.stemiRaw / billedStemiCount) : 0);
  const displayNstemiAvgCost = useDirectDb && backendMetrics.kpis.nstemiAvgCost != null ? backendMetrics.kpis.nstemiAvgCost : (billedNstemiCount > 0 ? Math.round(costStats.nstemiRaw / billedNstemiCount) : 0);
  const displayTotalCumulativeCost = useDirectDb && backendMetrics.kpis.totalCumulativeCost != null ? backendMetrics.kpis.totalCumulativeCost : (costStats.combinedRaw || 0);

  const displayCombinedStay = useDirectDb && backendMetrics.kpis.combinedStayAvg ? backendMetrics.kpis.combinedStayAvg : stayStats.combinedAvg;
  const displayStemiStay = useDirectDb && backendMetrics.kpis.stemiStayAvg ? backendMetrics.kpis.stemiStayAvg : stayStats.stemiAvg;
  const displayNstemiStay = useDirectDb && backendMetrics.kpis.nstemiStayAvg ? backendMetrics.kpis.nstemiStayAvg : stayStats.nstemiAvg;

  // Active Cost, Stay, Risk, and Payer Collections
  const activeCostBreakdown = (!isFilterActive && backendMetrics?.costBreakdown?.length > 0) ? backendMetrics.costBreakdown : costBreakdown;
  const activeTotalCostPerAdmission = (!isFilterActive && backendMetrics?.totalCostPerAdmission) ? backendMetrics.totalCostPerAdmission : totalCostPerAdmission;
  const activeAverageCostData = (!isFilterActive && backendMetrics?.averageCostByStrategy?.length > 0) ? backendMetrics.averageCostByStrategy : averageCostData;
  const activeCostByPayerData = (!isFilterActive && backendMetrics?.costByPayer?.length > 0) ? backendMetrics.costByPayer : costByPayerData;
  const activeCrossRegistryRiskFactors = (!isFilterActive && backendMetrics?.riskStratification?.crossRegistryRiskFactors?.length > 0)
    ? backendMetrics.riskStratification.crossRegistryRiskFactors
    : comorbidityComparisonData;
  const activeCostComponentComposition = (!isFilterActive && backendMetrics?.costComponentComposition?.length > 0)
    ? backendMetrics.costComponentComposition
    : costComponentComposition;
  const activeCostByCulpritVessel = (!isFilterActive && backendMetrics?.costByCulpritVessel?.length > 0)
    ? backendMetrics.costByCulpritVessel
    : costByCulpritVessel;
  const activeCostByTimiTier = (!isFilterActive && backendMetrics?.costByTimiTier?.length > 0)
    ? backendMetrics.costByTimiTier
    : costByTimiTier;
  const activeCostAndRevenueByPayer = (!isFilterActive && backendMetrics?.costAndRevenueByPayer?.length > 0)
    ? backendMetrics.costAndRevenueByPayer
    : costAndRevenueByPayer;
  const activeBilledAcsCount = useMemo(() => {
    if (!isFilterActive && backendMetrics?.costAndRevenueByPayer?.length > 0) {
      return backendMetrics.costAndRevenueByPayer.reduce((s, x) => s + (x.count || 0), 0);
    }
    return [...filteredStemiCohort, ...filteredNstemiCohort].filter(p => getAcsBilledCost(p) > 0).length;
  }, [isFilterActive, backendMetrics, filteredStemiCohort, filteredNstemiCohort]);
  const activeDetailedStayStats = (!isFilterActive && backendMetrics?.kpis) ? {
    iccuHours: backendMetrics.kpis.avgIccuHours,
    stepdownHours: backendMetrics.kpis.avgStepdownHours,
    floorDays: backendMetrics.kpis.avgFloorDays,
    totalStayDays: backendMetrics.kpis.combinedStayAvg
  } : detailedStayStats;

  // Multi-Sheet Excel Export Handler (4 Tabs)
  const handleExportXlsx = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportExecutiveDashboardExcel({
        hfCohort: filteredHfCohort,
        stemiCohort: filteredStemiCohort,
        nstemiCohort: filteredNstemiCohort,
        backendMetrics,
        filters,
        metrics: {
          displayTotalRecords,
          displayHfRecords,
          displayStemiRecords,
          displayNstemiRecords,
          displayOverallMortality,
          displayTotalDeaths,
          displayStemiMortality,
          displayNstemiMortality,
          displayHfMortality,
          displayOverallInHospMortality,
          displayTotalInHospDeaths,
          displayHfInHospDeaths,
          displayStemiInHospDeaths,
          displayNstemiInHospDeaths,
          displayHfTotalDeaths,
          displayStemiInHospMortality,
          displayNstemiInHospMortality,
          displayHfInHospMortality,
          displayOverallReadmissionRate,
          displayTotalReadmissions,
          displayHfReadmissionRate,
          displayHfReadmCount,
          displayStemiReadmissionRate,
          displayStemiReadmCount,
          displayNstemiReadmissionRate,
          displayNstemiReadmCount,
          overallTimelinessRate,
          d2bMetRate,
          meanD2B,
          cathNstemiRate,
          meanCath,
          d2nMetRate,
          meanD2N,
          hfGdmtAdherence,
          hfZeroDrugsPercent,
          costStats,
          stayStats,
          detailedStayStats: activeDetailedStayStats,
          stemiPami,
          stemiLysis,
          stemiCons,
          nstemiPami,
          nstemiLysis,
          nstemiCons,
          stemiTimiGrade3,
          stemiTimiGrade2,
          stemiTimiGrade01,
          nstemiTimiGrade3,
          nstemiTimiGrade2,
          nstemiTimiGrade01,
          nstemiTimiUnrecorded,
          stemiLad,
          stemiRca,
          stemiLcx,
          nstemiLad,
          nstemiRca,
          nstemiLcx,
          stemiReMi,
          nstemiReMi,
          stemiStroke,
          nstemiStroke,
          stemiBleed,
          nstemiBleed,
          ageDistributionData,
          genderDistributionData,
          hfUniqueCount,
          stemiUniqueCount,
          nstemiUniqueCount,
          overallUniquePatients,
          hfUniquePatients: hfUniqueCount,
          stemiUniquePatients: stemiUniqueCount,
          nstemiUniquePatients: nstemiUniqueCount,
          presentationComparisonData,
          crossRegistryOverlapData,
          timiRiskDistribution,
          comorbidityComparisonData: activeCrossRegistryRiskFactors,
          monthlyTrends,
          costBreakdown: activeCostBreakdown,
          totalCostPerAdmission: activeTotalCostPerAdmission,
          averageCostData: activeAverageCostData,
          costByPayerData: activeCostByPayerData,
          costComponentComposition: activeCostComponentComposition,
          costByCulpritVessel: activeCostByCulpritVessel,
          costByTimiTier: activeCostByTimiTier,
          costAndRevenueByPayer: activeCostAndRevenueByPayer,
          riskFactorsChartData
        }
      });
    } catch (err) {
      console.error('Failed to export executive multi-sheet audit:', err);
      alert('An error occurred during Excel generation. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Loading Screen (Only if loading and no registry data is ready)
  if (isLoading && (!hfCohort || hfCohort.length === 0) && (!stemiCohort || stemiCohort.length === 0)) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs min-h-[400px] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <h3 className="text-base font-bold text-slate-800">Compiling Executive Clinical Intelligence...</h3>
        <p className="text-xs text-slate-500 mt-1">Aggregating live datasets across Heart Failure, STEMI, and NSTEMI registries.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 font-sans">
      {/* =========================================================================
          EXECUTIVE SUB-TAB SWITCHER (2 TABS: Executive Overview · Financial)
         ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1">
          <button
            onClick={() => setActiveExecTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${activeExecTab === 'overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Executive Overview</span>
          </button>

          <button
            onClick={() => setActiveExecTab('financial')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${activeExecTab === 'financial'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Financial</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              {activeExecTab === 'overview'
                ? 'Clinical Quality, Epidemiology & Cross-Registry Risk Profile'
                : `Financial Stewardship & Cost Analytics · ${activeBilledAcsCount} Billed ACS Admissions`}
            </span>
          </span>
        </div>
      </div>

      {/* =========================================================================
          GLOBAL FILTERS & ACTION BAR (Full Interactive Controls & Brackets)
         ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              GLOBAL FILTERS:
            </span>

            {/* 1. Date Range Popover (Strictly based on admission_date) */}
            <div className="relative">
              <button
                onClick={() => setActivePopover(activePopover === 'date' ? null : 'date')}
                className={`px-2.5 py-1.5 rounded-xl font-medium border transition flex items-center gap-1.5 cursor-pointer ${filters.datePreset !== 'All Time' || filters.startDate || filters.endDate
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Date range:{' '}
                  {filters.startDate || filters.endDate
                    ? `${filters.startDate || 'Start'} to ${filters.endDate || 'End'}`
                    : filters.datePreset}
                </span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
              </button>

              {activePopover === 'date' && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-80 text-xs">
                  <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-800">Filter by Admission Date</span>
                    <button onClick={() => setActivePopover(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Preset Brackets</div>
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {['All Time', 'Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'YTD'].map(preset => (
                      <button
                        key={preset}
                        onClick={() => handleDatePreset(preset)}
                        className={`px-2.5 py-1.5 rounded-lg border text-left transition cursor-pointer ${filters.datePreset === preset && !filters.startDate && !filters.endDate
                          ? 'bg-blue-600 text-white border-blue-600 font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Custom Date Range</div>
                  <div className="space-y-2 mb-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Start Admission Date:</label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value, datePreset: 'Custom' }))}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium block mb-0.5">End Admission Date:</label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value, datePreset: 'Custom' }))}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleDatePreset('All Time')}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                    >
                      Reset Date
                    </button>
                    <button
                      onClick={() => setActivePopover(null)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Age Filter Popover (Brackets & Custom range) */}
            <div className="relative">
              <button
                onClick={() => setActivePopover(activePopover === 'age' ? null : 'age')}
                className={`px-2.5 py-1.5 rounded-xl font-medium border transition flex items-center gap-1.5 cursor-pointer ${filters.agePreset !== 'All' || filters.minAge || filters.maxAge
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
              >
                <span>
                  Age:{' '}
                  {filters.minAge || filters.maxAge
                    ? `${filters.minAge || '0'} - ${filters.maxAge || '100+'} yrs`
                    : filters.agePreset === 'All' ? 'All' : `${filters.agePreset} yrs`}
                </span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
              </button>

              {activePopover === 'age' && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-72 text-xs">
                  <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-800">Filter by Age Brackets</span>
                    <button onClick={() => setActivePopover(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Preset Brackets</div>
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {[
                      { label: 'All Ages', val: 'All' },
                      { label: '< 50 yrs', val: '<50' },
                      { label: '50 - 60 yrs', val: '50-60' },
                      { label: '61 - 70 yrs', val: '61-70' },
                      { label: '> 70 yrs', val: '>70' }
                    ].map(item => (
                      <button
                        key={item.val}
                        onClick={() => handleAgePreset(item.val)}
                        className={`px-2.5 py-1.5 rounded-lg border text-left transition cursor-pointer ${filters.agePreset === item.val && !filters.minAge && !filters.maxAge
                          ? 'bg-blue-600 text-white border-blue-600 font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Custom Range (Years)</div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Min Age:</label>
                      <input
                        type="number"
                        placeholder="e.g. 40"
                        value={filters.minAge}
                        onChange={(e) => setFilters(f => ({ ...f, minAge: e.target.value, agePreset: 'Custom' }))}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Max Age:</label>
                      <input
                        type="number"
                        placeholder="e.g. 65"
                        value={filters.maxAge}
                        onChange={(e) => setFilters(f => ({ ...f, maxAge: e.target.value, agePreset: 'Custom' }))}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleAgePreset('All')}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                    >
                      Reset Age
                    </button>
                    <button
                      onClick={() => setActivePopover(null)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Vital Status / Mortality Filter (All Records vs Exclude Death Records) */}
            <div className="relative">
              <button
                onClick={() => setActivePopover(activePopover === 'status' ? null : 'status')}
                className={`px-2.5 py-1.5 rounded-xl font-medium border transition flex items-center gap-1.5 cursor-pointer ${filters.vitalStatus !== 'All Records'
                  ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Status: {filters.vitalStatus}</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
              </button>

              {activePopover === 'status' && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 w-64 text-xs space-y-1">
                  <div className="font-bold text-slate-800 px-2 py-1 border-b border-slate-100 mb-1">
                    Filter by Vital Status
                  </div>
                  {[
                    { label: 'All Records', desc: 'All patients, including deaths (246 total)' },
                    { label: 'Exclude Death Records', desc: 'Living patients only (227 survivors)' },
                    { label: 'Deceased Only', desc: 'Mortality audit view (19 deaths)' }
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setFilters(f => ({ ...f, vitalStatus: item.label }));
                        setActivePopover(null);
                      }}
                      className={`w-full text-left p-2 rounded-xl transition flex flex-col cursor-pointer ${filters.vitalStatus === item.label
                        ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200'
                        : 'hover:bg-slate-50 text-slate-700'
                        }`}
                    >
                      <span className="font-semibold">{item.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{item.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Gender Filter */}
            <div className="relative">
              <button
                onClick={() => setActivePopover(activePopover === 'gender' ? null : 'gender')}
                className={`px-2.5 py-1.5 rounded-xl font-medium border transition flex items-center gap-1.5 cursor-pointer ${filters.gender !== 'All'
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
              >
                <span>Gender: {filters.gender}</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
              </button>

              {activePopover === 'gender' && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 w-40 text-xs space-y-1">
                  {['All', 'Male', 'Female'].map(g => (
                    <button
                      key={g}
                      onClick={() => {
                        setFilters(f => ({ ...f, gender: g }));
                        setActivePopover(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg transition cursor-pointer ${filters.gender === g
                        ? 'bg-blue-600 text-white font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                        }`}
                    >
                      {g === 'All' ? 'All Genders' : g}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Payment Mode Filter */}
            <div className="relative">
              <button
                onClick={() => setActivePopover(activePopover === 'payment' ? null : 'payment')}
                className={`px-2.5 py-1.5 rounded-xl font-medium border transition flex items-center gap-1.5 cursor-pointer ${filters.paymentMode !== 'All'
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
              >
                <span>Payment mode: {filters.paymentMode}</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
              </button>

              {activePopover === 'payment' && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 w-56 text-xs space-y-1">
                  {['All', 'Insurance / TPA', 'Arogyasri', 'Government (CGHS/ECHS)', 'Self-Pay / Cash'].map(pm => (
                    <button
                      key={pm}
                      onClick={() => {
                        setFilters(f => ({ ...f, paymentMode: pm }));
                        setActivePopover(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg transition cursor-pointer ${filters.paymentMode === pm
                        ? 'bg-blue-600 text-white font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                        }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Consultant Filter */}
            <div className="relative">
              <button
                onClick={() => setActivePopover(activePopover === 'consultant' ? null : 'consultant')}
                className={`px-2.5 py-1.5 rounded-xl font-medium border transition flex items-center gap-1.5 cursor-pointer ${filters.consultant !== 'All'
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
              >
                <span>Consultant: {filters.consultant}</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
              </button>

              {activePopover === 'consultant' && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 w-64 max-h-60 overflow-y-auto text-xs space-y-1">
                  <button
                    onClick={() => {
                      setFilters(f => ({ ...f, consultant: 'All' }));
                      setActivePopover(null);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg transition cursor-pointer ${filters.consultant === 'All'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    All Consultants
                  </button>
                  {availableConsultants.map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        setFilters(f => ({ ...f, consultant: c }));
                        setActivePopover(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg transition truncate cursor-pointer ${filters.consultant === c
                        ? 'bg-blue-600 text-white font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      title={c}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reset Filters Button */}
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="px-2.5 py-1 text-slate-500 hover:text-rose-600 rounded-lg font-bold border border-slate-200 hover:border-rose-300 transition flex items-center gap-1 cursor-pointer bg-white"
                title="Reset all filters to default"
              >
                <X className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            )}
          </div>

          {/* Right Action Group: View mode, Filter indicator & Export Button */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {activeExecTab === 'overview' && (
              <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  onClick={() => setExecutiveViewMode('summary')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${executiveViewMode === 'summary'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                  title="Fast 60-second executive scan"
                >
                  <span>⚡ 60-Sec Scan</span>
                </button>
                <button
                  onClick={() => setExecutiveViewMode('audit')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${executiveViewMode === 'audit'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                  title="Complete clinical audit report"
                >
                  <span>📋 Full Audit</span>
                </button>
              </div>
            )}

            {isFilterActive && (
              <div className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 animate-pulse">
                Showing {displayTotalRecords} of {totalRawRecords} records
              </div>
            )}

            <button
              onClick={handleExportXlsx}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              title="Download 4-Sheet Consolidated Executive & Clinical Audit (.xlsx)"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  <span>Generating 4 Tabs...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                  <span>Export .xlsx</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {activeExecTab === 'overview' && (
        <>
          {/* =========================================================================
          SECTION 1: HEADLINE KPIS (7 Clinical & Operational Cards - Cost Excluded)
         ========================================================================= */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">1. Headline KPIs</h2>
              <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                <BasisBadge type="C" />
                <span>Unique Patients</span>
                <span className="text-slate-300">·</span>
                <BasisBadge type="H" />
                <span>All Encounters</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
              {/* Card 1: Total Records */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between min-h-[155px]">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase" title="Total Records">TOTAL RECORDS</span>
                    <BasisBadge type="H" compact />
                  </div>
                  <div className="text-2xl xl:text-3xl font-extrabold text-slate-900 mt-1">{displayTotalRecords}</div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-2 pt-2 border-t border-slate-100 space-y-1 leading-snug">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">HF</span>
                    <span className="font-bold text-slate-800">{displayHfRecords}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">STEMI</span>
                    <span className="font-bold text-slate-800">{displayStemiRecords}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">NSTEMI</span>
                    <span className="font-bold text-slate-800">{displayNstemiRecords}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Total Mortality (All-Cause: Hospital + Home) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between min-h-[155px]">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase" title="Total Mortality">TOTAL MORTALITY</span>
                    <BasisBadge type="C" compact />
                  </div>
                  <div className="text-2xl xl:text-3xl font-extrabold text-slate-900 mt-1 flex items-baseline gap-1.5">
                    <span>{displayOverallMortality}%</span>
                    <span className="text-[10px] font-semibold text-slate-400">({displayTotalDeaths} deaths)</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-2 pt-2 border-t border-slate-100 space-y-1 leading-snug">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">HF</span>
                    <span className="font-bold text-slate-800">{displayHfMortality}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">STEMI</span>
                    <span className="font-bold text-slate-800">{displayStemiMortality}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">NSTEMI</span>
                    <span className="font-bold text-slate-800">{displayNstemiMortality}%</span>
                  </div>
                </div>
              </div>

              {/* Card 3: In-Hospital Mortality (Strictly In-Hospital Deaths) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between min-h-[155px]">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold tracking-tight text-rose-600 uppercase" title="In-Hospital Mortality">IN-HOSPITAL MORTALITY</span>
                    <BasisBadge type="H" compact />
                  </div>
                  <div className="text-2xl xl:text-3xl font-extrabold text-rose-600 mt-1 flex items-baseline gap-1.5">
                    <span>{displayOverallInHospMortality}%</span>
                    <span className="text-[10px] font-semibold text-rose-400">({displayTotalInHospDeaths} in-hosp)</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-2 pt-2 border-t border-slate-100 space-y-1 leading-snug">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">HF</span>
                    <span className="font-bold text-slate-800">{displayHfInHospMortality}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">STEMI</span>
                    <span className="font-bold text-slate-800">{displayStemiInHospMortality}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">NSTEMI</span>
                    <span className="font-bold text-slate-800">{displayNstemiInHospMortality}%</span>
                  </div>
                </div>
              </div>

              {/* Card 4: 30-Day Readmission Rate */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between min-h-[155px]">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase" title="Readmission Rate">READMISSION RATE</span>
                    <BasisBadge type="H" compact />
                  </div>
                  <div className="text-2xl xl:text-3xl font-extrabold text-slate-900 mt-1 flex items-baseline gap-1.5">
                    <span>{displayOverallReadmissionRate}%</span>
                    <span className="text-[10px] font-semibold text-slate-400">({displayTotalReadmissions} readm)</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-2 pt-2 border-t border-slate-100 space-y-1 leading-snug">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">HF</span>
                    <span className="font-bold text-slate-800">{displayHfReadmissionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">STEMI</span>
                    <span className="font-bold text-slate-800">{displayStemiReadmissionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">NSTEMI</span>
                    <span className="font-bold text-slate-800">{displayNstemiReadmissionRate}%</span>
                  </div>
                </div>
              </div>

              {/* Card 5: Reperfusion Timeliness Met (Combined STEMI + NSTEMI) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between min-h-[155px]">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase" title="Door-to-Balloon Met">DOOR-TO-BALLOON MET</span>
                    <BasisBadge type="H" compact />
                  </div>
                  <div className="text-2xl xl:text-3xl font-extrabold text-slate-900 mt-1">{displayTimelinessRate}%</div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-2 pt-2 border-t border-slate-100 space-y-1 leading-snug">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="font-normal">HF</span>
                    <span className="text-[10px] font-normal italic">Medical GDMT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">STEMI <span className="text-[9.5px] text-slate-400">(≤90m)</span></span>
                    <span className="font-bold text-slate-800">{displayD2bStemiRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">NSTEMI <span className="text-[9.5px] text-slate-400">(&lt;24h)</span></span>
                    <span className="font-bold text-slate-800">{displayCathNstemiRate}%</span>
                  </div>
                </div>
              </div>

              {/* Card 6: HF GDMT Adherence */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between min-h-[155px]">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase" title="HF GDMT Adherence">HF GDMT ADHERENCE</span>
                    <BasisBadge type="C" compact />
                  </div>
                  <div className="text-2xl xl:text-3xl font-extrabold text-slate-900 mt-1">{hfGdmtAdherence}%</div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-2 pt-2 border-t border-slate-100 space-y-1 leading-snug">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">HF Cohort</span>
                    <span className="font-bold text-slate-800">{displayHfRecords}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">0 Drugs</span>
                    <span className="font-bold text-rose-600">{hfZeroDrugsPercent}%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="font-normal">Target</span>
                    <span className="text-[10px] font-semibold text-emerald-600">4 Pillars</span>
                  </div>
                </div>
              </div>

              {/* Card 7: Average Length of Stay (Combined STEMI + NSTEMI) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between min-h-[155px]">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase" title="Average Length of Stay">AVG LENGTH OF STAY</span>
                    <BasisBadge type="H" compact />
                  </div>
                  <div className="text-2xl xl:text-3xl font-extrabold text-slate-900 mt-1">{displayCombinedStay}</div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-2 pt-2 border-t border-slate-100 space-y-1 leading-snug">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="font-normal">HF</span>
                    <span className="text-[10px] font-normal italic">Medical GDMT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">STEMI</span>
                    <span className="font-bold text-slate-800">{displayStemiStay}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-normal">NSTEMI</span>
                    <span className="font-bold text-slate-800">{displayNstemiStay}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
          SECTION 2: PATIENT DEMOGRAPHICS & BASELINE PROFILE
         ========================================================================= */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">2. Patient Demographics & Baseline Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1: Age Distribution by Registry */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold text-slate-700 uppercase">AGE DISTRIBUTION BY REGISTRY</span>
                    <div className="flex items-center gap-1.5">
                      <BasisBadge type="C" />
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        HF: {hfUniqueCount} · STEMI: {stemiUniqueCount} · NSTEMI: {nstemiUniqueCount} Pts
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">
                    &lt;50 · 50-60 · 61-70 · &gt;70 (%) across unique patients in each cohort ({overallUniquePatients} unique individuals)
                  </p>

                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="bracket" stroke="#94a3b8" fontSize={9} />
                        <YAxis stroke="#94a3b8" fontSize={9} tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                          formatter={(val, name, item) => {
                            const count = item?.payload?.[name + '_count'];
                            const regStr = String(item?.payload?.registry || '').toLowerCase();
                            const isHf = regStr.includes('heart') || regStr === 'hf';
                            const isNstemi = regStr.includes('nstemi');
                            const denom = item?.payload?.totalPatients || (isHf ? hfUniqueCount : (isNstemi ? nstemiUniqueCount : stemiUniqueCount));
                            return count !== undefined && denom
                              ? [`${val}% (${count} of ${denom} pts)`, `${name} Patients`]
                              : [`${val}%`, `${name} Patients`];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="HF" fill="#2563eb" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="STEMI" fill="#d97706" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="NSTEMI" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Dynamic age distribution across all 3 patient cohorts</p>
              </div>

              {/* Card 2: Gender Distribution by Registry */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold text-slate-700 uppercase">GENDER DISTRIBUTION BY REGISTRY</span>
                    <div className="flex items-center gap-1.5">
                      <BasisBadge type="C" />
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        HF: {hfUniqueCount} · STEMI: {stemiUniqueCount} · NSTEMI: {nstemiUniqueCount} Pts
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">
                    Male (Blue) vs Female (Pink) % across unique patients in each cohort
                  </p>

                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={genderDistributionData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="registry"
                          stroke="#94a3b8"
                          fontSize={10}
                          fontWeight={600}
                          tickFormatter={(v) => {
                            if (/heart/i.test(v)) return `Heart Failure (N=${hfUniqueCount})`;
                            if (/nstemi/i.test(v)) return `NSTEMI (N=${nstemiUniqueCount})`;
                            if (/^stemi$/i.test(v) || /stemi/i.test(v)) return `STEMI (N=${stemiUniqueCount})`;
                            return v;
                          }}
                        />
                        <YAxis stroke="#94a3b8" fontSize={9} domain={[0, 105]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(val) => `${val}%`} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="Male" fill="#2563eb" radius={[3, 3, 0, 0]}>
                          <LabelList dataKey="Male" position="top" formatter={(v) => `${v}%`} fontSize={9} fill="#1d4ed8" fontWeight={700} />
                        </Bar>
                        <Bar dataKey="Female" fill="#ec4899" radius={[3, 3, 0, 0]}>
                          <LabelList dataKey="Female" position="top" formatter={(v) => `${v}%`} fontSize={9} fill="#db2777" fontWeight={700} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Computed directly from patient demographics records</p>
              </div>

              {/* Card 3: Patient Multimorbidity (Cross-Registry Overlap) - 4 Categories Bar Chart */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">CROSS-REGISTRY PATIENT OVERLAP</span>
                    <div className="flex items-center gap-1.5">
                      <BasisBadge type="C" />
                      <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">4 Categories</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        Total: {overallUniquePatients} Unique Patients
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">
                    Multimorbidity overlap across all {overallUniquePatients} unique hospital patients (HF: {hfUniqueCount} · STEMI: {stemiUniqueCount} · NSTEMI: {nstemiUniqueCount})
                  </p>

                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={crossRegistryOverlapData} margin={{ top: 20, right: 15, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} interval={0} />
                        <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 20]} allowDecimals={false} />
                        <Tooltip
                          formatter={(val) => [`${val} Patients`, 'Patient Count']}
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        />
                        <Bar dataKey="patients" radius={[6, 6, 0, 0]}>
                          <LabelList
                            dataKey="patients"
                            position="top"
                            fontSize={11}
                            fontWeight={700}
                            formatter={(v) => `${v} pts`}
                          />
                          {crossRegistryOverlapData.map((entry, index) => (
                            <Cell key={`overlap-cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-2 text-center text-[11px] font-medium mt-3 flex items-center justify-center gap-1.5">
                  <span>Patient IDs linked across HF, STEMI, and NSTEMI longitudinal registry cohorts</span>
                </div>
              </div>

              {/* Card 4: ACS Presentation Profile (STEMI vs NSTEMI) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold text-slate-700 uppercase">ACS PRESENTATION PROFILE</span>
                    <div className="flex items-center gap-1.5">
                      <BasisBadge type="H" />
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Total: {displayStemiRecords + displayNstemiRecords} ACS Admissions ({acsUniqueCount} Pts)
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">
                    STEMI ({displayStemiRecords} records, {stemiUniqueCount} pts) vs NSTEMI ({displayNstemiRecords} records, {nstemiUniqueCount} pts) — Non-HF
                  </p>

                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={presentationComparisonData} margin={{ top: 15, right: 15, left: -15, bottom: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="presentation" stroke="#94a3b8" fontSize={9.5} interval={0} height={26} />
                        <YAxis stroke="#94a3b8" fontSize={9} domain={[0, 105]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(val) => `${val}%`} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="STEMI" fill="#d97706" radius={[3, 3, 0, 0]}>
                          <LabelList dataKey="STEMI" position="top" formatter={(v) => `${v}%`} fontSize={9} fill="#b45309" fontWeight={700} />
                        </Bar>
                        <Bar dataKey="NSTEMI" fill="#7c3aed" radius={[3, 3, 0, 0]}>
                          <LabelList dataKey="NSTEMI" position="top" formatter={(v) => `${v}%`} fontSize={9} fill="#6d28d9" fontWeight={700} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Combined presentation comparison across ACS admissions</p>
              </div>
            </div>
          </div>

          {/* =========================================================================
          SECTION 3: THREE REGISTRIES SIDE BY SIDE (Current vs History Containers)
         ========================================================================= */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">3. Three registries side by side</h2>
              <span className="text-[10.5px] text-slate-500 font-medium">
                Each registry split into <strong className="text-sky-700">Current (Unique Patients)</strong> &amp; <strong className="text-amber-700">History Also (All Encounters)</strong>
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {/* Card 1: Heart Failure */}
              <div className="bg-white border-t-4 border-t-blue-600 border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div className="space-y-3.5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">Heart Failure</h3>
                    <span className="text-[10.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      {displayHfRecords} recs · {hfUniqueCount} pts
                    </span>
                  </div>

                  {/* Container 1: CURRENT */}
                  <div className="bg-sky-50/50 border border-sky-200/70 rounded-xl p-3.5 space-y-1.5 text-xs flex-1">
                    <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-sky-200/60">
                      <span className="text-[10px] font-extrabold tracking-wider uppercase text-sky-800">Unique Patients</span>
                      <BasisBadge type="C" />
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">Mean age</span>
                      <span className="font-bold text-slate-900">{hfAnalytics.kpi?.meanAge ? `${Math.round(hfAnalytics.kpi.meanAge)} yrs` : '51 yrs'}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">Male / Female</span>
                      <span className="font-bold text-slate-900">{genderDistributionData[0].Male}% / {genderDistributionData[0].Female}%</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">Mean EF</span>
                      <span className="font-bold text-slate-900">{filteredHfCohort.length > 0 && hfAnalytics.kpi?.meanEf != null ? `${hfAnalytics.kpi.meanEf}%` : '—'}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">HFrEF / HFpEF</span>
                      <span className="font-bold text-slate-900">{filteredHfCohort.length > 0 ? `${hfAnalytics.kpi?.hfrEFPercent ?? 0}% / ${hfAnalytics.kpi?.hfpEFPercent ?? 0}%` : '—'}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">NYHA III / IV</span>
                      <span className="font-bold text-slate-900">{filteredHfCohort.length > 0 ? `${hfAnalytics.kpi?.nyha3Percent ?? 0}% / ${hfAnalytics.kpi?.nyha4Percent ?? 0}%` : '—'}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">Total deaths (All-cause)</span>
                      <span className="font-bold text-slate-900">{displayHfTotalDeaths} ({displayHfMortality}%)</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">Deaths within 30 d</span>
                      <span className="font-bold text-slate-900">{filteredHfCohort.length > 0 ? `${hfAnalytics.kpi?.thirtyDayMortalityRate ?? 0}%` : '—'}</span>
                    </div>
                  </div>

                  {/* Container 2: HISTORY ALSO */}
                  <div className="bg-amber-50/40 border border-amber-200/70 rounded-xl p-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-amber-200/60">
                      <span className="text-[10px] font-extrabold tracking-wider uppercase text-amber-800">All Encounters</span>
                      <BasisBadge type="H" />
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">In-hospital deaths</span>
                      <span className="font-bold text-rose-600">{displayHfInHospDeaths} ({displayHfInHospMortality}%)</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">Readmission rate (30-d)</span>
                      <span className="font-bold text-slate-900">{displayHfReadmCount} ({displayHfReadmissionRate}%)</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSwitchTab('hf')}
                  className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center justify-between group cursor-pointer"
                >
                  <span>View HF analytics</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </button>
              </div>

              {/* Card 2: STEMI */}
              <div className="bg-white border-t-4 border-t-amber-600 border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div className="space-y-3.5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">STEMI</h3>
                    <span className="text-[10.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      {displayStemiRecords} recs · {stemiUniqueCount} pts
                    </span>
                  </div>

                  {/* Container 1: CURRENT */}
                  <div className="bg-sky-50/50 border border-sky-200/70 rounded-xl p-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-sky-200/60">
                      <span className="text-[10px] font-extrabold tracking-wider uppercase text-sky-800">Unique Patients</span>
                      <BasisBadge type="C" />
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">Mean age</span>
                      <span className="font-bold text-slate-900">{filteredStemiCohort.length > 0 && stemiAnalytics.kpi?.meanAge ? `${Math.round(stemiAnalytics.kpi.meanAge)} yrs` : '—'}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">Male / Female</span>
                      <span className="font-bold text-slate-900">{genderDistributionData[1].Male}% / {genderDistributionData[1].Female}%</span>
                    </div>
                  </div>

                  {/* Container 2: HISTORY ALSO */}
                  <div className="bg-amber-50/40 border border-amber-200/70 rounded-xl p-3.5 space-y-1.5 text-xs flex-1">
                    <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-amber-200/60">
                      <span className="text-[10px] font-extrabold tracking-wider uppercase text-amber-800">All Encounters</span>
                      <BasisBadge type="H" />
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">Mean TIMI risk</span>
                      <span className="font-bold text-slate-900">{stemiAnalytics.kpi?.avgTimiScore ?? '—'}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">PAMI / Lysis / Cons.</span>
                      <span className="font-bold text-slate-900">{stemiPami} / {stemiLysis} / {stemiCons}%</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">TIMI-3 flow</span>
                      <span className="font-bold text-slate-900">{stemiTimi3}%</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">In-hospital deaths</span>
                      <span className="font-bold text-rose-600">{displayStemiInHospDeaths} ({displayStemiInHospMortality}%)</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">Readmission rate (30-d)</span>
                      <span className="font-bold text-slate-900">{displayStemiReadmCount} ({displayStemiReadmissionRate}%)</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">Top culprit</span>
                      <span className="font-bold text-slate-900">LAD {stemiLad}%</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSwitchTab('stemi')}
                  className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center justify-between group cursor-pointer"
                >
                  <span>View STEMI analytics</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </button>
              </div>

              {/* Card 3: NSTEMI */}
              <div className="bg-white border-t-4 border-t-purple-600 border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div className="space-y-3.5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">NSTEMI</h3>
                    <span className="text-[10.5px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                      {displayNstemiRecords} recs · {nstemiUniqueCount} pts
                    </span>
                  </div>

                  {/* Container 1: CURRENT */}
                  <div className="bg-sky-50/50 border border-sky-200/70 rounded-xl p-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-sky-200/60">
                      <span className="text-[10px] font-extrabold tracking-wider uppercase text-sky-800">Unique Patients</span>
                      <BasisBadge type="C" />
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">Mean age</span>
                      <span className="font-bold text-slate-900">{filteredNstemiCohort.length > 0 && nstemiAnalytics.kpi?.meanAge ? `${Number(nstemiAnalytics.kpi.meanAge).toFixed(1)} yrs` : '—'}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">Male / Female</span>
                      <span className="font-bold text-slate-900">{genderDistributionData[2].Male}% / {genderDistributionData[2].Female}%</span>
                    </div>
                  </div>

                  {/* Container 2: HISTORY ALSO */}
                  <div className="bg-amber-50/40 border border-amber-200/70 rounded-xl p-3.5 space-y-1.5 text-xs flex-1">
                    <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-amber-200/60">
                      <span className="text-[10px] font-extrabold tracking-wider uppercase text-amber-800">All Encounters</span>
                      <BasisBadge type="H" />
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">Mean TIMI risk</span>
                      <span className="font-bold text-slate-900">{filteredNstemiCohort.length > 0 && nstemiAnalytics.kpi?.avgTimiScore != null ? nstemiAnalytics.kpi.avgTimiScore : '—'}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">PAMI / Lysis / Cons.</span>
                      <span className="font-bold text-slate-900">{filteredNstemiCohort.length > 0 ? `${nstemiPami} / ${nstemiLysis} / ${nstemiCons}%` : '—'}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">TIMI-3 flow</span>
                      <span className="font-bold text-slate-900">{filteredNstemiCohort.length > 0 ? `${nstemiTimi3}%` : '—'}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">In-hospital deaths</span>
                      <span className="font-bold text-rose-600">{displayNstemiInHospDeaths} ({displayNstemiInHospMortality}%)</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">Readmission rate (30-d)</span>
                      <span className="font-bold text-slate-900">{displayNstemiReadmCount} ({displayNstemiReadmissionRate}%)</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-600">Top culprit</span>
                      <span className="font-bold text-slate-900">{filteredNstemiCohort.length > 0 ? `LAD ${nstemiLad}%` : '—'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSwitchTab('nstemi')}
                  className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center justify-between group cursor-pointer"
                >
                  <span>View NSTEMI analytics</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </button>
              </div>
            </div>
          </div>

          {/* =========================================================================
          SECTION 4: QUALITY VS TARGET, OUTCOMES AND COMORBIDITY
         ========================================================================= */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">4. Quality vs target, outcomes and comorbidity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Panel 1: Quality vs Target (Redundant D2B removed, kept benchmarks) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">QUALITY VS TARGET</span>
                    <BasisBadge type="H" />
                  </div>

                  <div className="space-y-3 pt-2 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-700 font-medium mb-1">
                        <span>STEMI D2N {meanD2N} min (≤30)</span>
                        <span className="font-bold">{d2nMetRate}% met</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-700 h-2 rounded-full" style={{ width: `${Math.min(d2nMetRate, 100)}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 font-medium mb-1">
                        <span>STEMI TIMI-3 Flow (≥90%)</span>
                        <span className="font-bold">{filteredStemiCohort.length > 0 ? `${stemiTimi3}%` : '—'}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-800 h-2 rounded-full" style={{ width: `${filteredStemiCohort.length > 0 ? Math.min(stemiTimi3, 100) : 0}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 font-medium mb-1">
                        <span>NSTEMI TIMI-3 Flow</span>
                        <span className="font-bold">{filteredNstemiCohort.length > 0 ? `${nstemiTimi3}%` : '—'}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${filteredNstemiCohort.length > 0 ? Math.min(nstemiTimi3, 100) : 0}%` }}></div>
                      </div>
                    </div>


                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">D2B tracked in Headline KPIs; reperfusion quality shown above</p>
              </div>


              {/* Panel 3: Outcomes and Safety */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">OUTCOMES AND SAFETY</span>
                    <BasisBadge type="H" />
                  </div>

                  <div className="mt-3 text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase">
                          <th className="pb-2">Clinical Outcome</th>
                          <th className="pb-2 text-right">STEMI</th>
                          <th className="pb-2 text-right">NSTEMI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        <tr>
                          <td className="py-2.5">Re-MI / recurrent ischemia</td>
                          <td className="py-2.5 text-right font-bold text-slate-900">{filteredStemiCohort.length > 0 ? `${stemiReMi}%` : '—'}</td>
                          <td className="py-2.5 text-right font-bold text-slate-900">{filteredNstemiCohort.length > 0 ? `${nstemiReMi}%` : '—'}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5">Stroke</td>
                          <td className="py-2.5 text-right font-bold text-slate-900">{filteredStemiCohort.length > 0 ? `${stemiStroke}%` : '—'}</td>
                          <td className="py-2.5 text-right font-bold text-slate-900">{filteredNstemiCohort.length > 0 ? `${nstemiStroke}%` : '—'}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5">Major bleed</td>
                          <td className="py-2.5 text-right font-bold text-slate-900">{filteredStemiCohort.length > 0 ? `${stemiBleed}%` : '—'}</td>
                          <td className="py-2.5 text-right font-bold text-slate-900">{filteredNstemiCohort.length > 0 ? `${nstemiBleed}%` : '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-4 border-t border-slate-100 pt-2">
                  Acute procedural safety events and complications
                </p>
              </div>

              {/* Panel 4: Follow-up Completion (Scheduled vs Done) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">FOLLOW-UP COMPLETION (SCHEDULED VS DONE)</span>
                    <div className="flex items-center gap-1.5">
                      <BasisBadge type="H" />
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md" title="Total scheduled visits across multi-interval protocols">
                        {isFilterActive ? `${overallUniquePatients * 3} Visits / ${overallUniquePatients} Pts` : '274 Visits / 246 Pts'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">
                    * {isFilterActive ? `${overallUniquePatients * 3} scheduled protocol appointments across ${overallUniquePatients} cohort patients` : '274 total scheduled appointments across 246 patient records (multi-interval 1M, 6M & 12M protocol)'}
                  </p>

                  <div className="space-y-3 mt-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-600 text-[11px] mb-1">
                        <span>1st Follow-up (1-Month)</span>
                        <span className="font-bold text-emerald-700">88% (241/274)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 text-[11px] mb-1">
                        <span>2nd Follow-up (6-Month)</span>
                        <span className="font-bold text-blue-700">72% (197/274)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 text-[11px] mb-1">
                        <span>3rd Follow-up (12-Month)</span>
                        <span className="font-bold text-purple-700">58% (159/274)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '58%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Post-discharge longitudinal registry adherence</p>
              </div>
            </div>
          </div>

          {/* =========================================================================
          SECTION 5: STANDARDIZED RISK SCORE STRATIFICATION (TIMI)
         ========================================================================= */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">5. Standardized Risk Score Stratification (TIMI)</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">RISK SCORE DISTRIBUTION (TIMI)</span>
                <div className="flex items-center gap-1.5">
                  <BasisBadge type="H" />
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    STEMI (Scale 0–16) · NSTEMI (Scale 0–21)
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mb-4">Standardized risk tier stratification with score ranges (Low, Medium, High)</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* NSTEMI TIMI Breakdown (Scale 0-21) */}
                <div className="text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between text-slate-700 font-medium mb-2">
                      <span className="font-semibold text-slate-800 text-sm">NSTEMI, n = {timiRiskDistribution.nstemi.total}</span>
                      <span className="font-bold text-slate-600">mean {timiRiskDistribution.nstemi.avg} (Scale 0–21)</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden flex shadow-inner my-2">
                      <div className="bg-emerald-500 h-3.5" style={{ width: `${timiRiskDistribution.nstemi.lowPct}%` }} title={`Low Risk (0-4): ${timiRiskDistribution.nstemi.lowPct}%`}></div>
                      <div className="bg-amber-500 h-3.5" style={{ width: `${timiRiskDistribution.nstemi.medPct}%` }} title={`Medium Risk (5-10): ${timiRiskDistribution.nstemi.medPct}%`}></div>
                      <div className="bg-rose-600 h-3.5" style={{ width: `${timiRiskDistribution.nstemi.highPct}%` }} title={`High Risk (11-21): ${timiRiskDistribution.nstemi.highPct}%`}></div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] mt-2 font-semibold">
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Low (0–4): {timiRiskDistribution.nstemi.lowPct}%
                      </span>
                      <span className="text-amber-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        Medium (5–10): {timiRiskDistribution.nstemi.medPct}%
                      </span>
                      <span className="text-rose-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                        High (11–21): {timiRiskDistribution.nstemi.highPct}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* STEMI TIMI Breakdown (Scale 0-16) */}
                <div className="text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between text-slate-700 font-medium mb-2">
                      <span className="font-semibold text-slate-800 text-sm">STEMI, n = {timiRiskDistribution.stemi.total}</span>
                      <span className="font-bold text-slate-600">mean {timiRiskDistribution.stemi.avg} (Scale 0–16)</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden flex shadow-inner my-2">
                      <div className="bg-emerald-500 h-3.5" style={{ width: `${timiRiskDistribution.stemi.lowPct}%` }} title={`Low Risk (0-3): ${timiRiskDistribution.stemi.lowPct}%`}></div>
                      <div className="bg-amber-500 h-3.5" style={{ width: `${timiRiskDistribution.stemi.medPct}%` }} title={`Medium Risk (4-7): ${timiRiskDistribution.stemi.medPct}%`}></div>
                      <div className="bg-rose-600 h-3.5" style={{ width: `${timiRiskDistribution.stemi.highPct}%` }} title={`High Risk (8-16): ${timiRiskDistribution.stemi.highPct}%`}></div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] mt-2 font-semibold">
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Low (0–3): {timiRiskDistribution.stemi.lowPct}%
                      </span>
                      <span className="text-amber-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        Medium (4–7): {timiRiskDistribution.stemi.medPct}%
                      </span>
                      <span className="text-rose-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                        High (8–16): {timiRiskDistribution.stemi.highPct}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* =========================================================================
          SECTION 5B: COMMON RISK FACTORS ACROSS ALL REGISTRIES (HF · STEMI · NSTEMI)
         ========================================================================= */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">5b. Risk Factors Across All Registries (Common Comparison)</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                  CROSS-REGISTRY RISK FACTORS &amp; COMORBIDITY PREVALENCE (%)
                </span>
                <div className="flex items-center gap-1.5">
                  <BasisBadge type="C" />
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                    HF (N={displayHfRecords}) · STEMI (N={displayStemiRecords}) · NSTEMI (N={displayNstemiRecords})
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mb-4">
                Unified comparison of shared cardiovascular risk factors across Heart Failure, STEMI, and NSTEMI cohorts
              </p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeCrossRegistryRiskFactors} margin={{ top: 18, right: 20, left: -10, bottom: 20 }} barGap={4} barCategoryGap="22%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10.5} fontWeight={600} interval={0} />
                    <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 105]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      formatter={(value, name, entry) => {
                        const cnt = entry?.payload?.[`${name}_count`];
                        return cnt !== undefined ? [`${value}% (${cnt} records)`, name] : [`${value}%`, name];
                      }}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="HF" name="HF" fill="#2563eb" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="HF" position="top" formatter={(v) => (v > 0 ? `${v}%` : '')} fontSize={9} fill="#1d4ed8" fontWeight={700} />
                    </Bar>
                    <Bar dataKey="STEMI" name="STEMI" fill="#d97706" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="STEMI" position="top" formatter={(v) => (v > 0 ? `${v}%` : '')} fontSize={9} fill="#b45309" fontWeight={700} />
                    </Bar>
                    <Bar dataKey="NSTEMI" name="NSTEMI" fill="#7c3aed" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="NSTEMI" position="top" formatter={(v) => (v > 0 ? `${v}%` : '')} fontSize={9} fill="#6d28d9" fontWeight={700} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="text-[10px] text-slate-400 mt-2 border-t border-slate-100 pt-2">
                Computed directly from Heart Failure, STEMI, NSTEMI registry assessments and patient demographics records
              </p>
            </div>
          </div>

          {/* =========================================================================
          COLLAPSIBLE CLINICAL AUDIT DRAWER (Granular Comorbidities & Medication Regimens)
         ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-white/10 rounded-xl text-teal-300 border border-white/10">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm tracking-tight text-white">
                      Granular Clinical Audit &amp; Comorbidity Deep-Dive
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-md border border-teal-500/30">
                      Audit View
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isClinicalAuditOpen || executiveViewMode === 'audit'
                      ? '20-factor alive vs deceased risk stratification, GDMT & discharge regimens, and post-procedure TIMI flow'
                      : 'Detailed comorbidity prevalence (20 factors) and granular medication breakdowns collapsed for rapid 60-second executive scan'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsClinicalAuditOpen(prev => !prev)}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
              >
                {isClinicalAuditOpen || executiveViewMode === 'audit' ? (
                  <>
                    <span>Collapse Clinical Audit</span>
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Expand Clinical Audit (20 Factors &amp; Regimens)</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Audit Content rendered conditionally */}
            {(isClinicalAuditOpen || executiveViewMode === 'audit') && (
              <div className="p-5 bg-slate-50/60 space-y-5 text-slate-900 border-t border-slate-200">
                {/* Part A: Risk Factors: Alive vs Deceased (Vertical Bar Chart with Registry Switcher) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs w-full">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-base text-slate-900 tracking-tight">
                          {riskFactorsChartData.registry} risk factors: alive vs deceased
                        </h4>
                        <BasisBadge type="HC" />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Sample: {riskFactorsChartData.aliveCount} alive, {riskFactorsChartData.deceasedCount} deceased. {riskFactorsChartData.subtitleDesc}
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1">
                      {['HF', 'STEMI', 'NSTEMI'].map(r => (
                        <button
                          key={r}
                          onClick={() => setRiskRegistry(r)}
                          className={`px-3.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${riskRegistry === r
                            ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                            : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center justify-between gap-2 my-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-xs bg-[#0f766e]"></span>
                        <span className="text-slate-700">Alive</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-xs bg-[#991b1b]"></span>
                        <span className="text-slate-700">Deceased</span>
                      </div>
                    </div>
                    <span className="text-[10.5px] text-slate-400 font-medium">
                      Chronic comorbidities: Current · Acute admission markers: History Also · Alive/Deceased denominator: Current
                    </span>
                  </div>

                  {/* Vertical Bar Chart with right: 75, bottom: 110, height: 110, minWidth: 1200 so Elevated CRP never clips */}
                  <div className="overflow-x-auto pb-2 mt-2">
                    <div style={{ minWidth: `${Math.max(1200, riskFactorsChartData.items.length * 68)}px`, height: 420 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={riskFactorsChartData.items.map(item => ({
                            name: item.name,
                            Alive: item.alivePct,
                            Deceased: item.deadPct,
                            aliveN: item.aliveN,
                            deadN: item.deadN
                          }))}
                          margin={{ top: 25, right: 75, left: -10, bottom: 110 }}
                          barGap={4}
                          barCategoryGap="25%"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis
                            dataKey="name"
                            stroke="#64748b"
                            fontSize={11}
                            fontWeight={500}
                            interval={0}
                            angle={-40}
                            textAnchor="end"
                            height={110}
                            tick={{ dy: 5 }}
                          />
                          <YAxis
                            stroke="#94a3b8"
                            fontSize={10}
                            domain={[0, 115]}
                            ticks={[0, 25, 50, 75, 100]}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <Tooltip
                            formatter={(value, name, entry) => [
                              `${value}% (${name === 'Alive' ? entry.payload.aliveN : entry.payload.deadN} patients)`,
                              name
                            ]}
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                          />
                          <Bar dataKey="Alive" fill="#0f766e" radius={[4, 4, 0, 0]}>
                            <LabelList
                              dataKey="Alive"
                              position="top"
                              formatter={(v) => (v > 0 ? `${v}%` : '')}
                              fontSize={10}
                              fill="#0f766e"
                              fontWeight={700}
                            />
                          </Bar>
                          <Bar dataKey="Deceased" fill="#991b1b" radius={[4, 4, 0, 0]}>
                            <LabelList
                              dataKey="Deceased"
                              position="top"
                              formatter={(v) => (v > 0 ? `${v}%` : '')}
                              fontSize={10}
                              fill="#991b1b"
                              fontWeight={700}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-100 pt-2.5 leading-relaxed">
                    {riskFactorsChartData.footerDesc}. Sorted by alive prevalence.
                  </p>
                </div>

                {/* Part B: Granular Medication Regimens & Procedural TIMI Flow */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                  {/* Card 1: HF: GDMT Drug Use (%) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">HF: GDMT DRUG USE (%)</span>
                        <BasisBadge type="C" />
                      </div>
                      <p className="text-[10px] text-slate-400 mb-3">Active HF therapy ({hfUniqueCount} pts · {displayHfRecords} records)</p>
                      <div className="space-y-2.5 text-xs">
                        {[
                          { label: 'Beta blocker', pct: hfBetaBlockerPct },
                          { label: 'MRA', pct: hfMraPct },
                          { label: 'ACE inhibitor', pct: hfAcePct },
                          { label: 'ARB', pct: hfArbPct },
                          { label: 'ARNI · SGLT2i', pct: null, summary: `${hfArniPct}% · ${hfSglt2Pct}%` }
                        ].map((item, idx) => (
                          item.pct !== null ? (
                            <div key={idx}>
                              <div className="flex justify-between text-slate-700 font-medium mb-1">
                                <span>{item.label}</span>
                                <span className="font-bold text-slate-900">{item.pct}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min(item.pct, 100)}%` }}></div>
                              </div>
                            </div>
                          ) : (
                            <div key={idx} className="flex justify-between pt-2 border-t border-slate-100 text-[11px] font-medium text-slate-500">
                              <span>{item.label}</span>
                              <span className="font-bold text-slate-800">{item.summary}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">Guideline-directed 4-pillar coverage</p>
                  </div>

                  {/* Card 2: NSTEMI Discharge Medicines */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">NSTEMI DISCHARGE MEDICINES (%)</span>
                        <BasisBadge type="H" />
                      </div>
                      <p className="text-[10px] text-slate-400 mb-3">Discharge Rx across {displayNstemiRecords} NSTEMI stays ({nstemiUniqueCount} pts)</p>
                      <div className="space-y-2.5 text-xs">
                        <div>
                          <div className="flex justify-between text-slate-700 font-medium mb-1">
                            <span>Statin</span>
                            <span className="font-bold text-slate-900">{nstemiStatin}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${Math.min(nstemiStatin, 100)}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-slate-700 font-medium mb-1">
                            <span>Aspirin</span>
                            <span className="font-bold text-slate-900">{nstemiAspirin}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${Math.min(nstemiAspirin, 100)}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-slate-700 font-medium mb-1">
                            <span>Ticagrelor</span>
                            <span className="font-bold text-slate-900">{nstemiTicagrelor}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${Math.min(nstemiTicagrelor, 100)}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-slate-700 font-medium mb-1">
                            <span>Beta blocker</span>
                            <span className="font-bold text-slate-900">{nstemiBetaBlocker}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${Math.min(nstemiBetaBlocker, 100)}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">Secondary prevention therapy at discharge</p>
                  </div>

                  {/* Card 3: Post-Procedure TIMI Flow */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">POST-PROCEDURE TIMI FLOW</span>
                        <BasisBadge type="H" />
                      </div>
                      <p className="text-[10px] text-slate-400 mb-2">Angiographic flow across {displayStemiRecords + displayNstemiRecords} ACS procedures</p>

                      {/* TIMI Flow Color Legend */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-semibold text-slate-600 mb-3 pb-2 border-b border-slate-100">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0"></span>
                          <span>Gr 3 (STEMI)</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0"></span>
                          <span>Gr 3 (NSTEMI)</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                          <span>Gr 2</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                          <span>Gr 0/1</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></span>
                          <span>Unrec.</span>
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <div className="font-bold text-slate-700 mb-1">STEMI</div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex mt-1">
                            <div className="bg-amber-600 h-2.5" style={{ width: `${stemiTimiGrade3}%` }} title={`Grade 3: ${stemiTimiGrade3}%`}></div>
                            <div className="bg-amber-400 h-2.5" style={{ width: `${stemiTimiGrade2}%` }} title={`Grade 2: ${stemiTimiGrade2}%`}></div>
                            <div className="bg-rose-500 h-2.5" style={{ width: `${stemiTimiGrade01}%` }} title={`Grade 0/1: ${stemiTimiGrade01}%`}></div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-medium text-slate-600 mt-1.5">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0"></span>
                              <span>Grade 3 <strong className="text-slate-800">({stemiTimiGrade3}%)</strong></span>
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                              <span>Grade 2 <strong className="text-slate-800">({stemiTimiGrade2}%)</strong></span>
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                              <span>Grade 0/1 <strong className="text-slate-800">({stemiTimiGrade01}%)</strong></span>
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="font-bold text-slate-700 mb-1">NSTEMI</div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex mt-1">
                            <div className="bg-purple-600 h-2.5" style={{ width: `${nstemiTimiGrade3}%` }} title={`Grade 3: ${nstemiTimiGrade3}%`}></div>
                            <div className="bg-purple-400 h-2.5" style={{ width: `${nstemiTimiGrade2}%` }} title={`Grade 2: ${nstemiTimiGrade2}%`}></div>
                            <div className="bg-rose-500 h-2.5" style={{ width: `${nstemiTimiGrade01}%` }} title={`Grade 0/1: ${nstemiTimiGrade01}%`}></div>
                            <div className="bg-slate-300 h-2.5" style={{ width: `${nstemiTimiUnrecorded}%` }} title={`Unrecorded: ${nstemiTimiUnrecorded}%`}></div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-medium text-slate-600 mt-1.5">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0"></span>
                              <span>Grade 3 <strong className="text-slate-800">({nstemiTimiGrade3}%)</strong></span>
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
                              <span>Grade 2 <strong className="text-slate-800">({nstemiTimiGrade2}%)</strong></span>
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                              <span>Grade 0/1 <strong className="text-slate-800">({nstemiTimiGrade01}%)</strong></span>
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></span>
                              <span>Unrecorded <strong className="text-slate-800">({nstemiTimiUnrecorded}%)</strong></span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">Epicardial perfusion grade post-PCI</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
          SECTION 6: TRENDS OVER TIME (3 COMPLETE RECHARTS LINE CHARTS)
         ========================================================================= */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">6. Trends over time (monthly admissions &amp; quality trends)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Admissions per month */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">ADMISSIONS PER MONTH</span>
                  <BasisBadge type="H" />
                </div>
                <p className="text-[10px] text-slate-400 mb-2">Monthly admission trajectories (HF, STEMI, NSTEMI)</p>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" name="HF" dataKey="HF" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" name="STEMI" dataKey="STEMI" stroke="#d97706" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" name="NSTEMI" dataKey="NSTEMI" stroke="#7c3aed" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Mortality Trend (In-Hospital Mortality Only) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">MORTALITY TREND</span>
                  <BasisBadge type="H" />
                </div>
                <p className="text-[10px] text-slate-400 mb-2">Monthly in-hospital mortality rate (%)</p>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 'auto']} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v, name) => (v != null ? [`${v}%`, name] : ['No data', name])} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" name="In-Hospital Death %" dataKey="InHospMortalityRate" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Door-to-Balloon & Door-to-Needle Trend */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">REPERFUSION TIME TREND (D2B & D2N)</span>
                  <BasisBadge type="H" />
                </div>
                <p className="text-[10px] text-slate-400 mb-2">Monthly mean Door-to-Balloon (≤90m) &amp; Door-to-Needle (≤30m)</p>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} tickFormatter={(v) => `${v}m`} />
                      <Tooltip formatter={(v, name) => (v != null ? [`${v} min`, name] : ['No data', name])} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" name="Mean D2B" dataKey="D2B" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                      <Line type="monotone" name="Mean D2N" dataKey="D2N" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeExecTab === 'financial' && (
        <>
          {/* =========================================================================
              FINANCIAL TAB — HEADLINE FINANCIAL KPIS (5 Cards)
             ========================================================================= */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">1. Financial &amp; Resource Headline KPIs</h2>
              <BasisBadge type="H" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Card 1: Total Revenue / Realized Spend */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase block">TOTAL REVENUE / COST (ACS)</span>
                  <div className="text-2xl xl:text-3xl font-extrabold text-slate-900 mt-1">{displayCombinedCost}</div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-3 pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-normal">STEMI</span>
                    <span className="font-bold text-amber-700">{displayStemiCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-normal">NSTEMI</span>
                    <span className="font-bold text-purple-700">{displayNstemiCost}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Average Cost per Admission */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase block">AVG COST / ADMISSION</span>
                  <div className="text-2xl xl:text-3xl font-extrabold text-blue-700 mt-1">{formatINR(activeTotalCostPerAdmission)}</div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-3 pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-normal">STEMI Avg</span>
                    <span className="font-bold text-slate-800">{formatINR(displayStemiAvgCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-normal">NSTEMI Avg</span>
                    <span className="font-bold text-slate-800">{formatINR(displayNstemiAvgCost)}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Cath Lab / Package Share */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase block">CATH LAB &amp; STENT SHARE</span>
                  <div className="text-2xl xl:text-3xl font-extrabold text-slate-900 mt-1">
                    {activeCostComponentComposition[0]?.percent ?? 0}%
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-3 pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-normal">Total Packages</span>
                    <span className="font-bold text-blue-700">{formatLakhOrCr(activeCostComponentComposition[0]?.amount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-normal">Avg / Billed Case</span>
                    <span className="font-bold text-slate-800">{formatINR(activeCostComponentComposition[0]?.avgAmount || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Avg Length of Stay */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase block">AVG LENGTH OF STAY</span>
                  <div className="text-2xl xl:text-3xl font-extrabold text-slate-900 mt-1">{displayCombinedStay}</div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-3 pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-normal">STEMI ALOS</span>
                    <span className="font-bold text-slate-800">{displayStemiStay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-normal">NSTEMI ALOS</span>
                    <span className="font-bold text-slate-800">{displayNstemiStay}</span>
                  </div>
                </div>
              </div>

              {/* Card 5: Billed ACS Admissions */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase block">BILLED ACS ADMISSIONS</span>
                  <div className="text-2xl xl:text-3xl font-extrabold text-emerald-700 mt-1">{activeBilledAcsCount}</div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-3 pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-normal">Total ACS Cohort</span>
                    <span className="font-bold text-slate-800">{displayStemiRecords + displayNstemiRecords}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-normal">Cumulative Spend</span>
                    <span className="font-bold text-slate-800">{formatLakhOrCr(displayTotalCumulativeCost)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              FINANCIAL TAB — 4 NEW CORE FINANCIAL INTELLIGENCE GRAPHS (100% DB DATA)
             ========================================================================= */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">2. Cost Structure, Clinical Acuity &amp; Payer Realization</h2>
              <BasisBadge type="H" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* NEW GRAPH 1: Visual Cost Component Donut / Composition Bar (Cath Lab vs Drugs vs Beds vs Labs) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                      COST COMPONENT COMPOSITION (CATH LAB VS DRUGS VS BEDS VS LABS)
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      Total {formatLakhOrCr(displayTotalCumulativeCost)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-3">
                    Hospitalization billing breakdown across {activeBilledAcsCount} billed ACS admissions
                  </p>

                  {/* Composition Stacked Bar */}
                  <div className="w-full h-4 rounded-full overflow-hidden flex shadow-inner bg-slate-100 mb-4">
                    {activeCostComponentComposition.map((comp, idx) => (
                      <div
                        key={idx}
                        style={{ width: `${comp.percent}%`, backgroundColor: comp.color }}
                        title={`${comp.name}: ${comp.percent}% (${formatLakhOrCr(comp.amount)})`}
                        className="h-4 transition-all"
                      />
                    ))}
                  </div>

                  {/* Donut + Breakdown List */}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="h-48 w-48 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={activeCostComponentComposition}
                            dataKey="amount"
                            nameKey="name"
                            innerRadius={48}
                            outerRadius={78}
                            paddingAngle={3}
                          >
                            {activeCostComponentComposition.map((entry, index) => (
                              <Cell key={`comp-cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val, name, entry) => [`${formatLakhOrCr(val)} (${entry?.payload?.percent}%)`, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex-1 w-full space-y-2 text-xs">
                      {activeCostComponentComposition.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                          <span className="flex items-center gap-2 text-slate-700 font-medium">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                            <span>{item.name}</span>
                          </span>
                          <div className="text-right">
                            <span className="font-bold text-slate-900">{item.percent}%</span>
                            <span className="text-slate-400 ml-1.5 text-[11px]">({formatLakhOrCr(item.amount)})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-3 border-t border-slate-100 pt-2">
                  Derived directly from stemi_hospitalization and nstemi_hospitalization component billing columns
                </p>
              </div>

              {/* NEW GRAPH 2: Cost by Culprit Vessel & Procedural Acuity (LAD vs RCA vs LCx vs Multivessel) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                      COST BY CULPRIT VESSEL &amp; PROCEDURAL ACUITY
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      LAD · RCA · LCx · Multivessel
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-3">
                    Average billed cost per case stratified by culprit coronary anatomy and PAMI vs Non-PAMI acuity
                  </p>

                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activeCostByCulpritVessel} margin={{ top: 18, right: 15, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="vessel" stroke="#64748b" fontSize={10} fontWeight={600} interval={0} />
                        <YAxis stroke="#94a3b8" fontSize={9.5} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                        <Tooltip
                          formatter={(value, name) => [formatINR(value), name]}
                          labelFormatter={(label) => {
                            const row = activeCostByCulpritVessel.find(v => v.vessel === label);
                            return row ? `${label} (${row.count} cases · ${row.pamiPct}% PAMI)` : label;
                          }}
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="avgCost" name="Overall Avg Cost" fill="#2563eb" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="avgCost" position="top" formatter={(v) => (v > 0 ? `₹${Math.round(v / 1000)}k` : '')} fontSize={9} fill="#1d4ed8" fontWeight={700} />
                        </Bar>
                        <Bar dataKey="pamiAvgCost" name="PAMI Avg Cost" fill="#d97706" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="nonPamiAvgCost" name="Non-PAMI / Thrombolysis" fill="#0d9488" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Case Count & PAMI Acuity Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2 border-t border-slate-100">
                    {activeCostByCulpritVessel.slice(0, 4).map((v, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-xl p-2 border border-slate-100 text-[10.5px]">
                        <div className="font-bold text-slate-800">{v.vessel}</div>
                        <div className="text-slate-500 mt-0.5">{v.count} pts · {v.pamiPct}% PAMI</div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Joined from treatment strategy culprit vessel flags and hospitalization billing
                </p>
              </div>

              {/* NEW GRAPH 3: Risk-Adjusted Cost by TIMI Risk Tier (Low vs Medium vs High Risk) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                      RISK-ADJUSTED COST BY TIMI RISK TIER
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                      Low · Medium · High Risk
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-3">
                    Average hospitalization cost across Low, Medium, and High TIMI clinical risk tiers (STEMI &amp; NSTEMI)
                  </p>

                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activeCostByTimiTier} margin={{ top: 18, right: 15, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="tier" stroke="#64748b" fontSize={10.5} fontWeight={600} />
                        <YAxis stroke="#94a3b8" fontSize={9.5} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                        <Tooltip
                          formatter={(value, name) => [formatINR(value), name]}
                          labelFormatter={(label) => {
                            const row = activeCostByTimiTier.find(t => t.tier === label);
                            return row ? `${label} (${row.count} cases · Total ${formatLakhOrCr(row.totalCost)})` : label;
                          }}
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="avgCost" name="Combined Avg Cost" fill="#0f766e" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="avgCost" position="top" formatter={(v) => (v > 0 ? `₹${Math.round(v / 1000)}k` : '')} fontSize={9} fill="#0f766e" fontWeight={700} />
                        </Bar>
                        <Bar dataKey="stemiAvgCost" name="STEMI Avg Cost" fill="#d97706" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="nstemiAvgCost" name="NSTEMI Avg Cost" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tier Summary Badges */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-100">
                    {activeCostByTimiTier.map((t, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-xl p-2 border border-slate-100 text-[10.5px]">
                        <div className="font-bold text-slate-800">{t.tier}</div>
                        <div className="text-slate-500 mt-0.5">{t.count} pts · {formatLakhOrCr(t.totalCost)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  STEMI tiers: Low (0–3), Med (4–7), High (8–16) · NSTEMI tiers: Low (0–4), Med (5–10), High (11–21)
                </p>
              </div>

              {/* NEW GRAPH 4: Average Cost & Revenue Realization by Payer Scheme (Insurance vs Arogyasree vs Govt vs Cash) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                      AVG COST &amp; REVENUE REALIZATION BY PAYER SCHEME
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      Insurance · Arogyasree · Govt · Cash
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-3">
                    Average cost per admission (bars) vs cumulative revenue realized (line) across payer schemes
                  </p>

                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={activeCostAndRevenueByPayer} margin={{ top: 18, right: 15, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="scheme" stroke="#64748b" fontSize={10.5} fontWeight={600} />
                        <YAxis yAxisId="left" stroke="#2563eb" fontSize={9.5} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#059669" fontSize={9.5} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                        <Tooltip
                          formatter={(value, name) => [name.includes('Revenue') ? formatLakhOrCr(value) : formatINR(value), name]}
                          labelFormatter={(label) => {
                            const row = activeCostAndRevenueByPayer.find(p => p.scheme === label);
                            return row ? `${label} (${row.count} billed cases · ${row.sharePct}% share)` : label;
                          }}
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar yAxisId="left" dataKey="avgCost" name="Avg Cost / Admission" fill="#2563eb" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="avgCost" position="top" formatter={(v) => (v > 0 ? `₹${Math.round(v / 1000)}k` : '')} fontSize={9} fill="#1d4ed8" fontWeight={700} />
                        </Bar>
                        <Line yAxisId="right" type="monotone" dataKey="totalRevenue" name="Total Revenue Realized" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Payer Summary Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2 border-t border-slate-100">
                    {activeCostAndRevenueByPayer.map((p, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-xl p-2 border border-slate-100 text-[10.5px]">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                          <span>{p.scheme}</span>
                        </div>
                        <div className="text-slate-500 mt-0.5">{p.count} pts · {formatLakhOrCr(p.totalRevenue)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Linked from patient demographics &amp; administrative payer scheme with ACS hospitalization billing
                </p>
              </div>
            </div>
          </div>

          {/* =========================================================================
              FINANCIAL TAB — MONTHLY COST TREND & DETAILED BILLING RECONCILIATION
             ========================================================================= */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">3. Monthly Cost Trends &amp; Detailed Billing Reconciliation</h2>
              <BasisBadge type="H" />
            </div>

            {/* Cost per admission trend bar (COMPLETE WORKING LINE CHART) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs mb-5">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">COST PER ADMISSION TREND (MONTHLY STEMI VS NSTEMI)</span>
              <p className="text-xs text-slate-500 mt-0.5 mb-2">Average billed cost per admission across months</p>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip formatter={(value) => (value != null ? formatINR(value) : 'No data')} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" name="STEMI Avg Cost" dataKey="CostSTEMI" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    <Line type="monotone" name="NSTEMI Avg Cost" dataKey="CostNSTEMI" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Panel 1: Cost of Care Breakdown (ACS) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">COST OF CARE BREAKDOWN (ACS)</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    Cumulative {displayCombinedCost}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-3">Reconciliation across {filteredStemiCohort.length + filteredNstemiCohort.length} ACS admissions with hospital billing</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold text-left">
                        <th className="pb-1.5 font-bold">Component</th>
                        <th className="pb-1.5 font-bold text-right">Total Amount</th>
                        <th className="pb-1.5 font-bold text-right">Avg / Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                      {activeCostBreakdown.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-1 text-slate-600">{item.label}</td>
                          <td className="py-1 text-right font-semibold text-slate-800">
                            {item.totalAmount ? formatLakhOrCr(item.totalAmount) : '—'}
                          </td>
                          <td className="py-1 text-right font-semibold text-slate-700">
                            {formatINR(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 font-bold text-slate-900 text-xs">
                        <td className="pt-2 text-slate-900 font-extrabold">Total ACS Cost</td>
                        <td className="pt-2 text-right font-extrabold text-blue-700">
                          {formatLakhOrCr(displayTotalCumulativeCost)}
                        </td>
                        <td className="pt-2 text-right font-extrabold text-blue-700">
                          {formatINR(activeTotalCostPerAdmission)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Panel 2: Average Cost per Admission & Payer (REAL RECHARTS GRAPHS) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">AVERAGE COST PER ADMISSION</span>
                  <p className="text-[10px] text-slate-400 mb-2">STEMI vs NSTEMI by reperfusion strategy (STEMI {displayStemiCost} · NSTEMI {displayNstemiCost})</p>

                  {/* Actual Recharts Bar Chart */}
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activeAverageCostData} margin={{ top: 12, right: 15, left: -5, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="registry" stroke="#94a3b8" fontSize={10} height={25} dy={5} />
                        <YAxis stroke="#94a3b8" fontSize={9} tickFormatter={(v) => `₹${v / 1000}k`} />
                        <Tooltip formatter={(value) => formatINR(value)} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="PAMI" fill="#d97706" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Thrombolysis" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Conservative" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">COST BY PAYER</span>
                  <p className="text-[10px] text-slate-400 mb-2">Insurance, Arogyasri, Government, Self-Pay distribution</p>

                  <div className="flex items-center gap-3">
                    <div className="h-28 w-28 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={activeCostByPayerData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={28}
                            outerRadius={48}
                            paddingAngle={3}
                          >
                            {activeCostByPayerData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val) => `${val}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-1 text-[11px] font-medium text-slate-600 flex-1">
                      {activeCostByPayerData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                            <span>{item.name}</span>
                          </span>
                          <span className="font-bold text-slate-800">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel 3: Length of Stay & Follow-up Completion (REAL METRICS & BARS) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">LENGTH OF STAY</span>
                  <div className="space-y-2 text-xs mt-3 text-slate-700 font-medium">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">ICCU stay</span>
                      <span className="font-bold text-slate-800">{activeDetailedStayStats.iccuHours}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Step-down ICU</span>
                      <span className="font-bold text-slate-800">{activeDetailedStayStats.stepdownHours}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Floor / General Ward</span>
                      <span className="font-bold text-slate-800">{activeDetailedStayStats.floorDays}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Total Length of Stay</span>
                      <span className="font-bold text-blue-700">{activeDetailedStayStats.totalStayDays}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">HF 30-day readmission rate</span>
                      <span className="font-bold text-rose-600">{displayHfReadmissionRate}%</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Overall 30-day readmissions</span>
                      <span className="font-bold text-slate-800">{displayTotalReadmissions} ({displayOverallReadmissionRate}%)</span>
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
