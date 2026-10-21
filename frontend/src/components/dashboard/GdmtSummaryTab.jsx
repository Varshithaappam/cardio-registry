import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Pill, 
  Layers, 
  TrendingUp, 
  AlertTriangle, 
  Info, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Flame,
  Activity,
  Droplets,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  LabelList
} from 'recharts';

export default function GdmtSummaryTab({ analytics, onOpenExclusionGuide }) {
  const [adherenceViewMode, setAdherenceViewMode] = useState('bar'); // 'bar' | 'curve'

  if (!analytics || !analytics.kpi) return null;

  const { kpi, performanceMatrix, adherenceDistribution, drugsTakenDistribution } = analytics;

  // Clustered Coverage Data (Prescription vs Contraindication vs Deviations)
  const coverageData = performanceMatrix.map(p => ({
    name: p.drugName,
    onDrug: p.prescribedRate,
    withCI: p.contraindicatedRate,
    deviations: p.deviationRate,
    onDrugCount: p.prescribedCount,
    withCICount: p.contraindicatedCount,
    deviationsCount: p.totalDeviations
  }));

  // Safety & Compliance Data (Appropriate Care vs Deviations)
  const complianceData = performanceMatrix.map(p => ({
    name: p.drugName,
    appropCare: p.appropriatenessScore,
    deviations: p.deviationRate,
    totalDeviations: p.totalDeviations
  }));

  // GDMT Category Prescription Profile Data
  const categoryProfileData = performanceMatrix.map(p => ({
    name: p.drugName,
    count: p.prescribedCount,
    percent: p.prescribedRate
  }));

  // Adherence Distribution Data matching Excel Rows 37-46
  const adherenceData = (adherenceDistribution || []).map(d => ({
    bracket: d.bracket,
    deviations: d.deviations !== undefined ? d.deviations : (
      d.bracket === '0.0%' ? 6 :
      d.bracket === '16.7%' ? 5 :
      d.bracket === '33.3%' ? 4 :
      d.bracket === '50.0%' ? 3 :
      d.bracket === '66.7%' ? 2 :
      d.bracket === '83.3%' ? 1 : 0
    ),
    patients: d.count,
    percent: d.percent
  }));

  // Find peak adherence bracket
  const peakAdherence = [...(adherenceData || [])].sort((a, b) => b.patients - a.patients)[0];

  // Colors for therapy intensity
  const INTENSITY_COLORS = ['#e62031', '#0d9488', '#0284c7', '#8b5cf6', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-4">
      {/* ROW 1: 2 Graphs side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. GDMT Category Prescription Profile */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                  MULTIDIMENSIONAL PILLAR PROFILE
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  GDMT Category Prescription Profile ({kpi.totalPatients} Pts)
                </h3>
                {/* Visual Label Explanation */}
                <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5 text-sky-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#0284c7]"></span>
                    Blue: % Prescribed
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Cohort: N={kpi.totalPatients}
              </span>
            </div>

            {/* Vertical Column Chart */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={categoryProfileData} 
                  margin={{ top: 28, right: 15, left: -20, bottom: 5 }} 
                  barSize={32}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    interval={0}
                    tick={{ fontSize: 9.5, fill: '#334155', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    unit="%" 
                    domain={[0, 95]} 
                    ticks={[0, 25, 50, 75, 95]} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    formatter={(val, name, props) => [
                      `${val}% (${props.payload.count} Patients)`,
                      'Prescribed'
                    ]}
                  />
                  <Bar 
                    dataKey="percent" 
                    name="% Prescribed" 
                    fill="#0284c7" 
                    radius={[5, 5, 0, 0]}
                  >
                    <LabelList 
                      dataKey="percent" 
                      position="top" 
                      formatter={(val) => `${val}% prescribed`} 
                      fill="#0284c7" 
                      fontSize={9} 
                      fontWeight={700} 
                      offset={6}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 2. Drugs Given Irrespective of CI vs. Clinical Deviations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                  PRESCRIPTION VS. DEVIATION GAP ANALYSIS
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Drugs Given Irrespective of CI vs. Clinical Deviations
                </h3>
                {/* Visual Label Explanation */}
                <div className="flex items-center gap-3 mt-1 text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5 text-sky-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#0284c7]"></span>
                    Blue: % Drugs Given
                  </span>
                  <span className="flex items-center gap-1.5 text-orange-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#ea580c]"></span>
                    Orange: % Clinical Deviations
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Cohort: N={kpi.totalPatients}
              </span>
            </div>

            {/* Clustered Column Chart */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={coverageData}
                  margin={{ top: 28, right: 15, left: -20, bottom: 5 }}
                  barGap={4}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    tick={{ fontSize: 9.5, fill: "#334155", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    unit="%"
                    domain={[0, 115]}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(val, name, props) => [
                      `${val}% (${name === '% Drugs Given' ? props.payload.onDrugCount : props.payload.deviationsCount} Patients)`,
                      name
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
                  <Bar
                    dataKey="onDrug"
                    name="% Drugs Given"
                    fill="#0284c7"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList 
                      dataKey="onDrug" 
                      position="top" 
                      formatter={(val) => `${val}% given`} 
                      fill="#0284c7" 
                      fontSize={8.5} 
                      fontWeight={700} 
                      offset={5}
                    />
                  </Bar>
                  <Bar
                    dataKey="deviations"
                    name="% Clinical Deviations"
                    fill="#ea580c"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList 
                      dataKey="deviations" 
                      position="top" 
                      formatter={(val) => `${val}% dev`} 
                      fill="#ea580c" 
                      fontSize={8.5} 
                      fontWeight={700} 
                      offset={5}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: 2 Graphs side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 3. % Adherence to GDMT Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                  GUIDELINE ADHERENCE EPIDEMIOLOGY
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  % Adherence to GDMT Distribution
                </h3>
                {/* Visual Label Explanation */}
                <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#3b82f6]"></span>
                    Blue: Number of Patients (UHID Count)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                  <button
                    onClick={() => setAdherenceViewMode('bar')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      adherenceViewMode === 'bar'
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BarChart2 className="w-3 h-3" />
                    <span>Bar</span>
                  </button>
                  <button
                    onClick={() => setAdherenceViewMode('curve')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      adherenceViewMode === 'curve'
                        ? 'bg-white text-teal-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Activity className="w-3 h-3" />
                    <span>Curve</span>
                  </button>
                </div>
                <span className="text-[11px] font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md border border-teal-200">
                  Peak: {peakAdherence?.bracket}
                </span>
              </div>
            </div>

            {/* Chart View */}
            <div className="h-64 my-2">
              {adherenceViewMode === 'bar' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adherenceData} margin={{ top: 28, right: 15, left: -20, bottom: 5 }} barSize={30}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="bracket" 
                      tick={{ fontSize: 9.5, fill: '#334155', fontWeight: 600 }} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false} 
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg border border-slate-700 text-xs">
                            <div className="font-bold text-sky-400">{d.bracket} Adherence</div>
                            <div className="text-slate-300 mt-0.5">{d.deviations} Deviations</div>
                            <div className="text-sm font-black font-mono text-white mt-1">
                              {d.patients} Patients <span className="text-xs font-normal text-slate-400">({d.percent}%)</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="patients" name="Number of Patients (UHID)" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="patients" position="top" formatter={(val) => `${val} pts`} fill="#1e293b" fontSize={9} fontWeight={700} offset={5} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={adherenceData} margin={{ top: 20, right: 15, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="adherenceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="bracket" tick={{ fontSize: 9.5, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(val, name, props) => [`${val} Patients (${props.payload.percent}%)`, 'Count']} />
                    <Area 
                      type="natural" 
                      dataKey="patients" 
                      stroke="#0d9488" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#adherenceGrad)"
                      dot={{ r: 3.5, fill: '#0d9488', strokeWidth: 2, stroke: '#ffffff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* 4. Number of GDMT Drugs Taken Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                  THERAPY INTENSITY SPECTRUM
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Number of GDMT Drugs Taken Distribution
                </h3>
                {/* Visual Label Explanation */}
                <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5 text-teal-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-teal-600"></span>
                    Color Bars: % Cohort Taking 0 to 5 GDMT Drugs
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Cohort: N={kpi.totalPatients}
              </span>
            </div>

            {/* Vertical Column Chart for Drugs Taken with values on top */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={drugsTakenDistribution} 
                  margin={{ top: 28, right: 15, left: -20, bottom: 5 }} 
                  barSize={32}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="drugs" 
                    interval={0}
                    tick={{ fontSize: 9.5, fill: '#334155', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    unit="%" 
                    domain={[0, 'dataMax + 12']} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    formatter={(val, name, props) => [
                      `${val}% (${props.payload.count} Patients)`,
                      props.payload.drugs
                    ]}
                  />
                  <Bar 
                    dataKey="percent" 
                    name="% Patients" 
                    radius={[5, 5, 0, 0]}
                  >
                    {drugsTakenDistribution.map((entry, index) => (
                      <Cell key={`cell-drug-${index}`} fill={INTENSITY_COLORS[index % INTENSITY_COLORS.length]} />
                    ))}
                    <LabelList 
                      dataKey="percent" 
                      position="top" 
                      formatter={(val) => `${val}%`} 
                      fill="#0f172a" 
                      fontSize={9.5} 
                      fontWeight={700} 
                      offset={6}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: 2 Graphs side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 5. Cohort Coverage Comparison: Clustered Columns (Prescription vs Contraindications) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                  COHORT COVERAGE COMPARISON
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  GDMT Prescription vs. Contraindications
                </h3>
                {/* Visual Label Explanation */}
                <div className="flex items-center gap-3 mt-1 text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5 text-sky-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#0284c7]"></span>
                    Blue: % on Drug
                  </span>
                  <span className="flex items-center gap-1.5 text-orange-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#ea580c]"></span>
                    Orange: % with Contraindication
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Cohort: N={kpi.totalPatients}
              </span>
            </div>

            {/* Clustered Column Chart */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverageData} margin={{ top: 28, right: 15, left: -20, bottom: 5 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    interval={0}
                    tick={{ fontSize: 9.5, fill: '#334155', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis unit="%" domain={[0, 115]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(val, name, props) => [
                      `${val}% (${name === '% on Drug' ? props.payload.onDrugCount : props.payload.withCICount} Patients)`,
                      name
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Bar dataKey="onDrug" name="% on Drug" fill="#0284c7" radius={[4, 4, 0, 0]}>
                    <LabelList 
                      dataKey="onDrug" 
                      position="top" 
                      formatter={(val) => `${val}% on drug`} 
                      fill="#0284c7" 
                      fontSize={8.5} 
                      fontWeight={700} 
                      offset={5}
                    />
                  </Bar>
                  <Bar dataKey="withCI" name="% with Contraindication" fill="#ea580c" radius={[4, 4, 0, 0]}>
                    <LabelList 
                      dataKey="withCI" 
                      position="top" 
                      formatter={(val) => `${val}% contra`} 
                      fill="#ea580c" 
                      fontSize={8.5} 
                      fontWeight={700} 
                      offset={5}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 6. Safety & Compliance Spectrum: Clustered Columns (% Appropriate Care vs % Deviations) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                  SAFETY & COMPLIANCE SPECTRUM
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Appropriate Care vs. Clinical Deviations
                </h3>
                {/* Visual Label Explanation */}
                <div className="flex items-center gap-3 mt-1 text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#10b981]"></span>
                    Green: % Appropriate Care
                  </span>
                  <span className="flex items-center gap-1.5 text-orange-700">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#ea580c]"></span>
                    Orange: % Clinical Deviations
                  </span>
                </div>
              </div>
              <button
                onClick={onOpenExclusionGuide}
                className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold transition cursor-pointer self-start sm:self-auto"
              >
                <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                <span>Exclusion Guide</span>
              </button>
            </div>

            {/* Clustered Column Chart */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceData} margin={{ top: 28, right: 15, left: -20, bottom: 5 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    interval={0}
                    tick={{ fontSize: 9.5, fill: '#334155', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis unit="%" domain={[0, 115]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(val, name, props) => [`${val}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Bar dataKey="appropCare" name="% Appropriate Care" fill="#10b981" radius={[4, 4, 0, 0]}>
                    <LabelList 
                      dataKey="appropCare" 
                      position="top" 
                      formatter={(val) => `${val}% approp`} 
                      fill="#059669" 
                      fontSize={8.5} 
                      fontWeight={700} 
                      offset={5}
                    />
                  </Bar>
                  <Bar dataKey="deviations" name="% Clinical Deviations" fill="#ea580c" radius={[4, 4, 0, 0]}>
                    <LabelList 
                      dataKey="deviations" 
                      position="top" 
                      formatter={(val) => `${val}% dev`} 
                      fill="#ea580c" 
                      fontSize={8.5} 
                      fontWeight={700} 
                      offset={5}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
