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

  // Colors for therapy intensity & unified chart styling
  const UNIFIED_BAR_COLOR = '#0d9488';
  const INTENSITY_COLORS = ['#e62031', '#0d9488', '#0284c7', '#8b5cf6', '#f59e0b', '#10b981'];

  // Neat modern tooltip styling with smooth rounded borders
  const tooltipStyle = {
    content: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
      padding: '10px 14px',
    },
    label: {
      fontWeight: 700,
      color: '#0f172a',
      marginBottom: '6px',
      fontSize: '13px',
    },
    item: {
      fontSize: '12px',
      fontWeight: 600,
      padding: '2px 0',
    },
    cursor: {
      fill: '#f1f5f9',
      opacity: 0.5,
      radius: 6,
    }
  };

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
                  GDMT Category Prescription Profile ({kpi.totalHfRecords || kpi.totalPatients} Records)
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Cohort: {kpi.totalHfRecords || kpi.totalPatients} Records
              </span>
            </div>

            {/* Vertical Column Chart */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={categoryProfileData} 
                  margin={{ top: 22, right: 15, left: -20, bottom: 5 }} 
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
                    domain={[0, 115]} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={tooltipStyle.content}
                    labelStyle={tooltipStyle.label}
                    itemStyle={tooltipStyle.item}
                    cursor={tooltipStyle.cursor}
                    formatter={(val, name, props) => [
                      `${val}% (${props.payload.count} HF Records)`,
                      'Prescribed'
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Bar 
                    dataKey="percent" 
                    name="% Prescribed" 
                    fill="#0284c7" 
                    radius={[5, 5, 0, 0]}
                  >
                    <LabelList 
                      dataKey="percent" 
                      position="top" 
                      formatter={(val) => `${val}%`} 
                      style={{ fontSize: '11px', fontWeight: 'bold', fill: '#0284c7', fontFamily: 'ui-monospace, monospace' }} 
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
              </div>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Cohort: {kpi.totalHfRecords || kpi.totalPatients} Records
              </span>
            </div>

            {/* Clustered Column Chart */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={coverageData}
                  margin={{ top: 22, right: 15, left: -20, bottom: 5 }}
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
                    domain={[0, 128]}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={tooltipStyle.content}
                    labelStyle={tooltipStyle.label}
                    itemStyle={tooltipStyle.item}
                    cursor={tooltipStyle.cursor}
                    formatter={(val, name, props) => [
                      `${val}% (${name === '% Drugs Given' ? props.payload.onDrugCount : props.payload.deviationsCount} HF Records)`,
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
                      formatter={(val) => `${val}%`} 
                      style={{ fontSize: '9.5px', fontWeight: 'bold', fill: '#0284c7', fontFamily: 'ui-monospace, monospace' }} 
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
                      formatter={(val) => `${val}%`} 
                      style={{ fontSize: '9.5px', fontWeight: 'bold', fill: '#ea580c', fontFamily: 'ui-monospace, monospace' }} 
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
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                  <button
                    onClick={() => setAdherenceViewMode('bar')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      adherenceViewMode === 'bar'
                        ? 'bg-white text-teal-700 shadow-2xs'
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
                        ? 'bg-white text-teal-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Activity className="w-3 h-3" />
                    <span>Curve</span>
                  </button>
                </div>
                <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                  Cohort: {kpi.totalHfRecords || kpi.totalPatients} Records
                </span>
              </div>
            </div>

            {/* Chart View */}
            <div className="h-64 my-2">
              {adherenceViewMode === 'bar' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adherenceData} margin={{ top: 22, right: 15, left: -15, bottom: 5 }} barSize={34}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="bracket" 
                      tick={{ fontSize: 9.5, fill: '#334155', fontWeight: 600 }} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false} 
                    />
                    <YAxis 
                      unit="%"
                      domain={[0, 'dataMax + 15']}
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false} 
                    />
                    <Tooltip 
                      cursor={tooltipStyle.cursor}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white text-slate-800 p-3 rounded-xl shadow-xl border border-slate-200 text-xs">
                            <div className="font-bold text-slate-900 text-[13px]">{d.bracket} Adherence</div>
                            <div className="text-slate-500 mt-0.5">{d.deviations} Deviations</div>
                            <div className="text-sm font-black font-mono text-teal-700 mt-1">
                              {d.percent}% <span className="text-xs font-normal text-slate-500">({d.patients} HF Records)</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Bar dataKey="percent" name="% HF Records" fill={UNIFIED_BAR_COLOR} radius={[6, 6, 0, 0]}>
                      {adherenceData.map((entry, index) => (
                        <Cell key={`cell-adh-${index}`} fill={UNIFIED_BAR_COLOR} />
                      ))}
                      <LabelList 
                        dataKey="percent" 
                        position="top" 
                        formatter={(val) => `${val}%`} 
                        style={{ fontSize: '11px', fontWeight: 'bold', fill: '#0f172a', fontFamily: 'ui-monospace, monospace' }} 
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={adherenceData} margin={{ top: 22, right: 15, left: -15, bottom: 5 }}>
                    <defs>
                      <linearGradient id="adherenceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={UNIFIED_BAR_COLOR} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={UNIFIED_BAR_COLOR} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="bracket" tick={{ fontSize: 9.5, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis unit="%" domain={[0, 'dataMax + 15']} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={tooltipStyle.content}
                      labelStyle={tooltipStyle.label}
                      itemStyle={tooltipStyle.item}
                      cursor={tooltipStyle.cursor}
                      formatter={(val, name, props) => [`${val}% (${props.payload.patients} HF Records)`, 'Percentage']} 
                    />
                    <Area 
                      type="natural" 
                      dataKey="percent" 
                      name="% HF Records"
                      stroke={UNIFIED_BAR_COLOR} 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#adherenceGrad)"
                      dot={{ r: 4, fill: UNIFIED_BAR_COLOR, strokeWidth: 2, stroke: '#ffffff' }}
                    >
                      <LabelList 
                        dataKey="percent" 
                        position="top" 
                        offset={8} 
                        formatter={(val) => `${val}%`}
                        style={{ fontSize: '11px', fontWeight: 'bold', fill: '#0f766e', fontFamily: 'ui-monospace, monospace' }} 
                      />
                    </Area>
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
              </div>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Cohort: {kpi.totalHfRecords || kpi.totalPatients} Records
              </span>
            </div>

            {/* Vertical Column Chart for Drugs Taken */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={drugsTakenDistribution} 
                  margin={{ top: 22, right: 15, left: -20, bottom: 5 }} 
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
                    domain={[0, 'dataMax + 18']} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={tooltipStyle.content}
                    labelStyle={tooltipStyle.label}
                    itemStyle={tooltipStyle.item}
                    cursor={tooltipStyle.cursor}
                    formatter={(val, name, props) => [
                      `${val}% (${props.payload.count} HF Records)`,
                      '% HF Records'
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Bar 
                    dataKey="percent" 
                    name="% HF Records" 
                    fill={UNIFIED_BAR_COLOR}
                    radius={[5, 5, 0, 0]}
                  >
                    {drugsTakenDistribution.map((entry, index) => (
                      <Cell key={`cell-drug-${index}`} fill={UNIFIED_BAR_COLOR} />
                    ))}
                    <LabelList 
                      dataKey="percent" 
                      position="top" 
                      formatter={(val) => `${val}%`} 
                      style={{ fontSize: '11px', fontWeight: 'bold', fill: '#0f172a', fontFamily: 'ui-monospace, monospace' }} 
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
              </div>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Cohort: {kpi.totalHfRecords || kpi.totalPatients} Records
              </span>
            </div>

            {/* Clustered Column Chart */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverageData} margin={{ top: 22, right: 15, left: -20, bottom: 5 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    interval={0}
                    tick={{ fontSize: 9.5, fill: '#334155', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis unit="%" domain={[0, 128]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={tooltipStyle.content}
                    labelStyle={tooltipStyle.label}
                    itemStyle={tooltipStyle.item}
                    cursor={tooltipStyle.cursor}
                    formatter={(val, name, props) => [
                      `${val}% (${name === '% on Drug' ? props.payload.onDrugCount : props.payload.withCICount} HF Records)`,
                      name
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Bar dataKey="onDrug" name="% on Drug" fill="#0284c7" radius={[4, 4, 0, 0]}>
                    <LabelList 
                      dataKey="onDrug" 
                      position="top" 
                      formatter={(val) => `${val}%`} 
                      style={{ fontSize: '9.5px', fontWeight: 'bold', fill: '#0284c7', fontFamily: 'ui-monospace, monospace' }} 
                    />
                  </Bar>
                  <Bar dataKey="withCI" name="% with Contraindication" fill="#ea580c" radius={[4, 4, 0, 0]}>
                    <LabelList 
                      dataKey="withCI" 
                      position="top" 
                      formatter={(val) => `${val}%`} 
                      style={{ fontSize: '9.5px', fontWeight: 'bold', fill: '#ea580c', fontFamily: 'ui-monospace, monospace' }} 
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
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                  Cohort: {kpi.totalHfRecords || kpi.totalPatients} Records
                </span>
                <button
                  onClick={onOpenExclusionGuide}
                  className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                  <span>Exclusion Guide</span>
                </button>
              </div>
            </div>

            {/* Clustered Column Chart */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceData} margin={{ top: 22, right: 15, left: -20, bottom: 5 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    interval={0}
                    tick={{ fontSize: 9.5, fill: '#334155', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis unit="%" domain={[0, 128]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={tooltipStyle.content}
                    labelStyle={tooltipStyle.label}
                    itemStyle={tooltipStyle.item}
                    cursor={tooltipStyle.cursor}
                    formatter={(val, name, props) => [`${val}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Bar dataKey="appropCare" name="% Appropriate Care" fill="#10b981" radius={[4, 4, 0, 0]}>
                    <LabelList 
                      dataKey="appropCare" 
                      position="top" 
                      formatter={(val) => `${val}%`} 
                      style={{ fontSize: '9.5px', fontWeight: 'bold', fill: '#059669', fontFamily: 'ui-monospace, monospace' }} 
                    />
                  </Bar>
                  <Bar dataKey="deviations" name="% Clinical Deviations" fill="#ea580c" radius={[4, 4, 0, 0]}>
                    <LabelList 
                      dataKey="deviations" 
                      position="top" 
                      formatter={(val) => `${val}%`} 
                      style={{ fontSize: '9.5px', fontWeight: 'bold', fill: '#ea580c', fontFamily: 'ui-monospace, monospace' }} 
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
