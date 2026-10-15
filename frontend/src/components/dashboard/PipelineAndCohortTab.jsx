import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Cpu, 
  LineChart, 
  ArrowRight, 
  Search, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';

export default function PipelineAndCohortTab({ patients, onSelectPatient }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('adherencePercent');
  const [sortDirection, setSortDirection] = useState('asc'); // lowest adherence first to surface deviations
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Filter cohort for table
  const filteredPatients = useMemo(() => {
    let result = [...patients];

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(p => 
        String(p.uhid || '').toLowerCase().includes(q) ||
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.ipNo || '').toLowerCase().includes(q) ||
        String(p.prescribedDrugsSummary || '').toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [patients, searchTerm, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredPatients.length / pageSize) || 1;
  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, currentPage, pageSize]);

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  return (
    <div className="space-y-6">
      {/* 3-Tier Visual Architecture Diagram */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-6 md:p-8 rounded-2xl text-white shadow-md relative overflow-hidden border border-slate-700">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          <div className="max-w-3xl">
            <span className="text-[10px] font-bold tracking-widest uppercase text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full">
              Clinical Informatics Framework
            </span>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mt-2">
              3-Tier Clinical Intelligence & Guideline Adherence Architecture
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 leading-relaxed">
              Real-time translation of uncurated bedside EHR streams into mathematical guideline compliance scores, automated contraindication detection, and executive epidemiology telemetry.
            </p>
          </div>

          {/* 3-Tier Step Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Tier 1 */}
            <div className="bg-slate-800/80 backdrop-blur-xs border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between hover:border-teal-500/40 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
                    Tier 1 Ingest
                  </span>
                  <Database className="w-4 h-4 text-sky-400" />
                </div>
                <h4 className="font-bold text-white text-sm">Raw Hospital Data Ingest</h4>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Raw admission logs, vitals (BP, HR), bedside labs (Potassium, Creatinine, BNP), and unstructured prescription lines.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Ingest: MSSQL / Excel</span>
                <span className="text-sky-400 font-bold">278 UHIDs</span>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="bg-slate-800/80 backdrop-blur-xs border border-teal-500/50 rounded-xl p-5 flex flex-col justify-between relative shadow-lg shadow-teal-950/40">
              <div className="absolute -top-2.5 right-4 bg-teal-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                Active Rule Engine
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30">
                    Tier 2 Intelligence
                  </span>
                  <Cpu className="w-4 h-4 text-teal-400" />
                </div>
                <h4 className="font-bold text-white text-sm">Clinical Intelligence Engine</h4>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Automated contraindication detection (Creatinine &gt; 2.5, SBP &lt; 90, HR &lt; 50, K⁺ &gt; 5.0), 6-pillar deviation matrix generation, and adherence scoring.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] font-mono text-teal-300 flex items-center justify-between">
                <span>Deterministic GDMT Matrix</span>
                <span className="font-bold">6 Drug Pillars</span>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="bg-slate-800/80 backdrop-blur-xs border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between hover:border-teal-500/40 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    Tier 3 Executive
                  </span>
                  <LineChart className="w-4 h-4 text-purple-400" />
                </div>
                <h4 className="font-bold text-white text-sm">Executive Analytical Metrics</h4>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Real-time aggregated KPIs, adherence histograms, clinical safety dashboards, patient dossiers, and automated regulatory reporting.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] font-mono text-purple-300 flex items-center justify-between">
                <span>Live Dashboard Telemetry</span>
                <span className="font-bold">100% Dynamic</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Patient Cohort Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Interactive Patient Cohort Explorer
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click on any row to open the complete Clinical Dossier Modal with full labs, vitals, and 6-pillar GDMT justifications.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter cohort..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500 w-48 sm:w-60"
              />
            </div>

            {/* Page Size Selector */}
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 select-none">
              <tr>
                <th 
                  className="py-3 px-3.5 cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('uhid')}
                >
                  <div className="flex items-center gap-1">
                    <span>UHID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3.5">IP No</th>
                <th 
                  className="py-3 px-3.5 cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('age')}
                >
                  <div className="flex items-center gap-1">
                    <span>Age / Sex</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3.5">HF Phenotype</th>
                <th className="py-3 px-3.5">NYHA Class</th>
                <th className="py-3 px-3.5">Creatinine & K⁺</th>
                <th 
                  className="py-3 px-3.5 text-center cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('prescribedDrugsCount')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>GDMT Count</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3.5 text-center cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('deviationsCount')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Deviations</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3.5 text-center cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('adherencePercent')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Adherence %</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3.5 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paginatedPatients.length > 0 ? (
                paginatedPatients.map((patient) => {
                  const adh = patient.adherencePercent;
                  const devCount = patient.deviationsCount;
                  const isHighRisk = devCount >= 4;

                  return (
                    <tr 
                      key={patient.uhid + patient.ipNo}
                      onClick={() => onSelectPatient(patient)}
                      className="hover:bg-teal-50/40 cursor-pointer transition"
                    >
                      {/* UHID */}
                      <td className="py-3 px-3.5 font-mono font-bold text-teal-800">
                        {patient.uhid}
                      </td>

                      {/* IP No */}
                      <td className="py-3 px-3.5 font-mono text-slate-600">
                        {patient.ipNo}
                      </td>

                      {/* Age / Sex */}
                      <td className="py-3 px-3.5">
                        <span className="font-semibold text-slate-900">{patient.age}y</span>
                        <span className="text-[11px] text-slate-500 ml-1">({patient.gender[0]})</span>
                      </td>

                      {/* Phenotype */}
                      <td className="py-3 px-3.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          patient.hfType === 'HFrEF' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                          patient.hfType === 'HFpEF' ? 'bg-slate-100 text-slate-800 border border-slate-200' :
                          'bg-sky-50 text-sky-800 border border-sky-200'
                        }`}>
                          {patient.hfType} ({patient.efPercent}%)
                        </span>
                      </td>

                      {/* NYHA Class */}
                      <td className="py-3 px-3.5">
                        <span className={`text-xs font-semibold ${
                          patient.functionalStatus.includes('IV') ? 'text-rose-700' :
                          patient.functionalStatus.includes('III') ? 'text-amber-700' :
                          'text-slate-700'
                        }`}>
                          {patient.functionalStatus}
                        </span>
                      </td>

                      {/* Creatinine & K+ */}
                      <td className="py-3 px-3.5 font-mono text-[11px]">
                        <span className={patient.creatinine > 2.5 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                          Cr: {patient.creatinine}
                        </span>
                        <span className="text-slate-400 mx-1">|</span>
                        <span className={patient.potassium > 5.0 ? 'text-amber-600 font-bold' : 'text-slate-800'}>
                          K: {patient.potassium}
                        </span>
                      </td>

                      {/* Prescribed Drugs Count */}
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-900">
                        {patient.prescribedDrugsCount} / 6
                      </td>

                      {/* Deviations */}
                      <td className="py-3 px-3.5 text-center font-mono">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          devCount === 0 ? 'bg-emerald-100 text-emerald-800' :
                          devCount <= 2 ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {devCount}
                        </span>
                      </td>

                      {/* Adherence % */}
                      <td className="py-3 px-3.5 text-center font-mono">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-black ${
                          adh >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          adh >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {adh}%
                        </span>
                      </td>

                      {/* View Button */}
                      <td className="py-3 px-3.5 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectPatient(patient); }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Dossier</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-sm">
                    No patients match your filter parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
          <div>
            Showing <span className="font-bold font-mono text-slate-900">
              {filteredPatients.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span> to <span className="font-bold font-mono text-slate-900">
              {Math.min(currentPage * pageSize, filteredPatients.length)}
            </span> of <span className="font-bold font-mono text-slate-900">
              {filteredPatients.length}
            </span> Cohort Patients
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-bold text-slate-800">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
