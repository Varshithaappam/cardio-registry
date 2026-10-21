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
import GdmtSummaryTab from './dashboard/GdmtSummaryTab';
import PatientDossierModal from './dashboard/PatientDossierModal';
import ContraindicationDrawer from './dashboard/ContraindicationDrawer';

import { fetchGdmtCohort } from '../api/gdmtApi';
import { filterCohort, computeAnalytics, exportCohortCsv } from '../utils/gdmtEngine';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('keyPoints'); // 'keyPoints' | 'gdmt'
  const [dataSource, setDataSource] = useState('database'); // database source
  const [cohortData, setCohortData] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Universal Filter State
  const [filters, setFilters] = useState({
    registry: 'All Registries',
    phenotype: 'All Phenotypes',
    gender: 'All Genders',
    startDate: '',
    endDate: '',
    search: ''
  });

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
      startDate: '',
      endDate: '',
      search: ''
    });
  }

  // Filter cohort dynamically in real time
  const filteredCohort = useMemo(() => {
    return filterCohort(cohortData, filters);
  }, [cohortData, filters]);

  // Re-compute all analytics dynamically on any filter change
  const analytics = useMemo(() => {
    return computeAnalytics(filteredCohort);
  }, [filteredCohort]);

  // Export CSV Report handler
  function handleExportCsv() {
    exportCohortCsv(filteredCohort);
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
                N={cohortData.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Cardiovascular Patient Registry • Cohort Analytics & Guideline Adherence Engine
            </p>
          </div>
        </div>

        {/* Right Actions: Tabs & Export Report */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          {/* Tab Switcher Buttons */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200/80 flex items-center gap-1 text-xs font-bold">
            <button
              id="tab-key-points"
              onClick={() => setActiveTab('keyPoints')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'keyPoints'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Key Points</span>
            </button>

            <button
              id="tab-gdmt-summary"
              onClick={() => setActiveTab('gdmt')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'gdmt'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>GDMT Analysis</span>
            </button>
          </div>

          {/* Export Report Button */}
          <button
            id="btn-export-csv"
            onClick={handleExportCsv}
            disabled={filteredCohort.length === 0}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs hover:shadow-xs disabled:opacity-50 cursor-pointer"
            title="Download CSV report of filtered cohort with all derived flags"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

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
        /* Tab Views */
        <div>
          {activeTab === 'keyPoints' && (
            <KeyPointsTab analytics={analytics} />
          )}

          {activeTab === 'gdmt' && (
            <GdmtSummaryTab 
              analytics={analytics} 
              onOpenExclusionGuide={() => setIsDrawerOpen(true)}
            />
          )}
        </div>
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