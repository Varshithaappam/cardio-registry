/**
 * Clinical Intelligence & GDMT Adherence Dashboard
 * Production-ready 3-Tier Clinical Architecture with executive epidemiology,
 * guideline deviation analytics, dynamic multi-parameter cohort filtering,
 * and interactive patient cohort explorer.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  Download, 
  Sparkles, 
  FileSpreadsheet, 
  Activity, 
  Loader2,
  RefreshCw,
  Database
} from 'lucide-react';

import UniversalFilterBar from './dashboard/UniversalFilterBar';
import KeyPointsTab from './dashboard/KeyPointsTab';
import PatientDossierModal from './dashboard/PatientDossierModal';
import ContraindicationDrawer from './dashboard/ContraindicationDrawer';
import StemiDashboard from './dashboard/StemiDashboard';
import NstemiDashboard from './dashboard/NstemiDashboard';
import AdminExecutiveDashboard from './dashboard/AdminExecutiveDashboard';
import { Flame, Stethoscope, Building2 } from 'lucide-react';

import { fetchGdmtCohort } from '../api/gdmtApi';
import { filterCohort, computeAnalytics } from '../utils/gdmtEngine';
import { exportCohortExcel } from '../utils/excelReportGenerator';

export default function Dashboard() {
  const [activeDashboardTab, setActiveDashboardTab] = useState('executive'); // 'executive' | 'hf' | 'stemi' | 'nstemi'
  const [dataSource, setDataSource] = useState('database'); // database source
  const [cohortData, setCohortData] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  // Universal Filter State
  const [filters, setFilters] = useState({
    registry: 'All Registries',
    phenotype: 'All Phenotypes',
    gender: 'All Genders',
    minAge: '',
    maxAge: '',
    startDate: '',
    endDate: '',
    search: '',
    vitalStatus: 'All Records'
  });

  // Interactive Chart Cross-Filtering State (Brushing / Linked Charts)
  const [chartFilters, setChartFilters] = useState({});

  // Modal / Drawer State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load cohort from API or standardized fallback
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchGdmtCohort(dataSource);
        if (isMounted && result && result.data) {
          setCohortData(result.data);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load cohort');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [dataSource]);

  // Handle filter changes
  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function handleResetFilters() {
    setFilters({
      registry: 'All Registries',
      phenotype: 'All Phenotypes',
      gender: 'All Genders',
      minAge: '',
      maxAge: '',
      startDate: '',
      endDate: '',
      search: '',
      vitalStatus: 'All Records'
    });
    setChartFilters({});
  }

  // Toggle chart-level cross filters (clicking a slice toggles it on; clicking again toggles it off)
  function handleChartFilterToggle(dimension, value) {
    setChartFilters(prev => {
      const next = { ...prev };
      if (next[dimension] === value) {
        delete next[dimension];
      } else {
        next[dimension] = value;
      }
      return next;
    });
  }

  // Clear all chart-level cross filters
  function handleClearChartFilters() {
    setChartFilters({});
  }

  // Filter cohort dynamically in real time (universal filters + linked chart cross-filters)
  const filteredCohort = useMemo(() => {
    let result = filterCohort(cohortData, filters);

    // Apply interactive chart cross-filters
    const activeKeys = Object.keys(chartFilters);
    if (activeKeys.length > 0) {
      result = result.filter(patient => {
        for (const dim of activeKeys) {
          const val = chartFilters[dim];
          if (!val) continue;

          if (dim === 'gender') {
            if (String(patient.gender || '').toLowerCase() !== String(val).toLowerCase()) {
              return false;
            }
          } else if (dim === 'phenotype') {
            const extractPhenotype = (str) => {
              const s = String(str || '').toLowerCase();
              if (s.includes('hfref')) return 'HFrEF';
              if (s.includes('hfpef')) return 'HFpEF';
              return 'Unspecified';
            };
            if (extractPhenotype(patient.hfType) !== extractPhenotype(val)) {
              return false;
            }
          } else if (dim === 'nyha' || dim === 'nyhaClass') {
            const extractNyha = (str) => {
              const s = String(str || '').toLowerCase();
              if (s.includes('class iv') || s.includes('class 4') || /\b(iv|4)\b/.test(s)) return 'IV';
              if (s.includes('class iii') || s.includes('class 3') || /\b(iii|3)\b/.test(s)) return 'III';
              if (s.includes('class ii') || s.includes('class 2') || /\b(ii|2)\b/.test(s)) return 'II';
              if (s.includes('class i') || s.includes('class 1') || /\b(i|1)\b/.test(s)) return 'I';
              return 'Unspecified';
            };
            if (extractNyha(patient.functionalStatus) !== extractNyha(val)) {
              return false;
            }
          } else if (dim === 'ageGroup') {
            const age = Number(patient.age);
            if (isNaN(age)) return false;
            const target = String(val).toLowerCase();
            if (target.includes('<50') || target.includes('under 50')) {
              if (age >= 50) return false;
            } else if (target.includes('50-60')) {
              if (age < 50 || age > 60) return false;
            } else if (target.includes('61-70')) {
              if (age < 61 || age > 70) return false;
            } else if (target.includes('>70') || target.includes('over 70')) {
              if (age <= 70) return false;
            }
          } else if (dim === 'comorbidity') {
            const comorbStr = (patient.comorbidities || []).join(' ').toLowerCase();
            const target = String(val).toLowerCase();
            if (target.includes('diabet') || target.includes('dm')) {
              if (!(comorbStr.includes('diabet') || comorbStr.includes('dm') || patient.hasDiabetes || patient.diabetes)) return false;
            } else if (target.includes('hyperten') || target.includes('htn')) {
              if (!(comorbStr.includes('hyperten') || comorbStr.includes('htn') || patient.hasHypertension || patient.hypertension)) return false;
            } else if (target.includes('renal') || target.includes('ckd')) {
              const hasRenal = Boolean(
                (patient.creatinine !== null && patient.creatinine !== undefined && Number(patient.creatinine) > 2.5) ||
                patient.renalFailure ||
                comorbStr.includes('renal') ||
                comorbStr.includes('ckd') ||
                /renal|ckd/i.test(patient.presentDiagnosis || '') ||
                /renal|ckd/i.test(patient.admissionReason || '') ||
                /renal|ckd/i.test(patient.otherAdmissionReason || '') ||
                /renal|ckd/i.test(patient.previousDiagnosis || '')
              );
              if (!hasRenal) return false;
            }
          } else if (dim === 'drugPrescribed') {
            const drug = String(val).toLowerCase();
            let pillarKey = null;
            if (drug.includes('beta')) pillarKey = 'betaBlocker';
            else if (drug.includes('arni')) pillarKey = 'arni';
            else if (drug.includes('ace')) pillarKey = 'aceInhibitor';
            else if (drug.includes('arb')) pillarKey = 'arb';
            else if (drug.includes('mra') || drug.includes('aldosterone') || drug.includes('spirono') || drug.includes('eplerenone')) pillarKey = 'mra';
            else if (drug.includes('sglt2') || drug.includes('dapa') || drug.includes('empa')) pillarKey = 'sglt2Inhibitor';

            if (pillarKey) {
              const evalStat = patient.pillarEvaluations?.[pillarKey];
              if (!evalStat?.prescribed && !patient[pillarKey]) {
                return false;
              }
            } else {
              const summary = String(patient.prescribedDrugsSummary || '').toLowerCase();
              if (!summary.includes(drug)) return false;
            }
          }
        }
        return true;
      });
    }

    return result;
  }, [cohortData, filters, chartFilters]);

  // Re-compute all analytics dynamically on any filter change
  const analytics = useMemo(() => {
    return computeAnalytics(filteredCohort);
  }, [filteredCohort]);

  // Export Multi-Sheet Excel Workbook handler
  async function handleExportExcel() {
    if (filteredCohort.length === 0 || isExporting) return;
    try {
      setIsExporting(true);
      await exportCohortExcel(filteredCohort, analytics);
    } catch (err) {
      console.error('Failed to export Excel report:', err);
      alert('Failed to generate Excel report: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-12">
      {/* Global Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-xs shrink-0">
            <Heart className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Clinical Intelligence Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
                N={activeDashboardTab === 'executive' ? 246 : activeDashboardTab === 'stemi' ? 62 : activeDashboardTab === 'nstemi' ? 46 : (cohortData.length || 138)}
                {activeDashboardTab === 'executive' && ' (All Registries)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Cardiovascular Patient Registry • Cohort Analytics & Guideline Adherence Engine
            </p>
          </div>
        </div>

        {/* Right Actions: Export Report */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          {/* Sub-Tab Navigation Switcher */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveDashboardTab('executive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeDashboardTab === 'executive'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Executive</span>
            </button>

            <button
              onClick={() => setActiveDashboardTab('hf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeDashboardTab === 'hf'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Heart Failure</span>
            </button>

            <button
              onClick={() => setActiveDashboardTab('stemi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeDashboardTab === 'stemi'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>STEMI</span>
            </button>

            <button
              onClick={() => setActiveDashboardTab('nstemi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeDashboardTab === 'nstemi'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>NSTEMI</span>
            </button>
          </div>

          {/* Export Report Button (Active in HF tab) */}
          {activeDashboardTab === 'hf' && (
            <button
              id="btn-export-excel"
              onClick={handleExportExcel}
              disabled={filteredCohort.length === 0 || isExporting}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs hover:shadow-xs disabled:opacity-50 cursor-pointer"
              title="Download multi-sheet Excel workbook (Sheet1, Notes, GDMT Summary, Contraindications, CI Flags, Key Points)"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>{isExporting ? 'Generating Excel...' : 'Export Report (.xlsx)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeDashboardTab === 'executive' ? (
        <AdminExecutiveDashboard 
          onSwitchTab={setActiveDashboardTab} 
          initialHfCohort={cohortData}
        />
      ) : activeDashboardTab === 'stemi' ? (
        <StemiDashboard />
      ) : activeDashboardTab === 'nstemi' ? (
        <NstemiDashboard />
      ) : (
        <>
          {/* Universal Multi-Parameter Filter Bar */}
          <UniversalFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            totalCount={cohortData.length}
            filteredCount={filteredCohort.length}
            dataSource={dataSource}
            onSourceChange={setDataSource}
            isLoading={isLoading}
          />

          {/* Interactive Chart Cross-Filter Pills & Reset Bar */}
          {Object.keys(chartFilters).length > 0 && (
            <div className="bg-white border border-teal-200 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                  <span>Active Chart Filters:</span>
                </div>
                {Object.entries(chartFilters).map(([dim, val]) => (
                  <span 
                    key={dim}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-xs group"
                  >
                    <span className="capitalize text-teal-300 font-medium">{dim}:</span>
                    <span>{val}</span>
                    <button
                      onClick={() => handleChartFilterToggle(dim, val)}
                      className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                      title={`Remove ${val} filter`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <span className="text-xs text-slate-500 font-mono">
                  ({filteredCohort.length} of {cohortData.length} records matching)
                </span>
              </div>
              <button
                onClick={handleClearChartFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Clear All Filters</span>
              </button>
            </div>
          )}

          {/* Loading / Error States */}
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">Processing Clinical Intelligence Pipeline...</h3>
              <p className="text-xs text-slate-500 mt-1">
                Evaluating 6 GDMT drug pillars, contraindication flags, and adherence brackets.
              </p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800 text-xs">
              <p className="font-bold">Error loading cohort: {error}</p>
              <button 
                onClick={() => setDataSource('standardized')}
                className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold"
              >
                Switch to Standardized Cohort
              </button>
            </div>
          ) : (
            /* Unified Dashboard View */
            <KeyPointsTab 
              analytics={analytics} 
              chartFilters={chartFilters}
              onChartFilterToggle={handleChartFilterToggle}
              onOpenExclusionGuide={() => setIsDrawerOpen(true)}
            />
          )}
        </>
      )}

      {/* Patient Detail Dossier Modal */}
      <PatientDossierModal
        patient={selectedPatient}
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />

      {/* Contraindication Criteria Slide-over Drawer */}
      <ContraindicationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}