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
  Droplets
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
  RadialBar
} from 'recharts';

export default function GdmtSummaryTab({ analytics, onOpenExclusionGuide }) {
  if (!analytics || !analytics.kpi) return null;

  const { kpi, performanceMatrix, adherenceDistribution, drugsTakenDistribution } = analytics;

  // Clustered Coverage Data (Prescription vs Contraindication)
  const coverageData = performanceMatrix.map(p => ({
    name: p.drugName,
    onDrug: p.prescribedRate,
    withCI: p.contraindicatedRate,
    onDrugCount: p.prescribedCount,
    withCICount: p.contraindicatedCount
  }));

  // Safety & Compliance Data (Appropriate Care vs Deviations)
  const complianceData = performanceMatrix.map(p => ({
    name: p.drugName,
    appropCare: p.appropriatenessScore,
    deviations: p.deviationRate,
    totalDeviations: p.totalDeviations
  }));

  // Continuous Adherence Curve Data
  const adherenceCurveData = (adherenceDistribution || []).map(d => ({
    bracket: d.bracket,
    patients: d.count,
    percent: d.percent
  }));

  // Find peak adherence bracket
  const peakAdherence = [...(adherenceCurveData || [])].sort((a, b) => b.patients - a.patients)[0];

  // Colors for therapy intensity donut
  const INTENSITY_COLORS = ['#94a3b8', '#0d9488', '#0284c7', '#8b5cf6', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* 5 GDMT Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Mean Adherence */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Mean GDMT Adherence
              </span>
              <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 font-mono tracking-tight">
              {kpi.meanAdherencePercent}%
            </div>
            <div className="text-[11px] text-amber-700 font-bold mt-1">
              ▲ Benchmark Gap: -{Math.round((100 - kpi.meanAdherencePercent) * 10) / 10}%
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400">
            Formula: =AVERAGE('% of GDMT adhered to')
          </div>
        </div>

        {/* Metric 2: Prescribed Drugs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Prescribed Drugs / Patient
              </span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Pill className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 font-mono tracking-tight">
              {kpi.meanGdmtDrugs} / 6 Pillars
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">
              Target: &gt;4 Pillars (Quadruple Therapy)
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400">
            Formula: =AVERAGE('Number of GDMT Drugs Taken')
          </div>
        </div>

        {/* Metric 3: Quadruple Therapy */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Quadruple Therapy (4 Pillars)
              </span>
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-purple-600 font-mono tracking-tight">
              {kpi.quadrupleTherapyPercent}% ({kpi.quadrupleTherapyCount} Patients)
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">
              Guideline Target: &gt;50%
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            ARNI/RAAS + BB + MRA + SGLT2i
          </div>
        </div>

        {/* Metric 4: Triple Therapy */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Triple Therapy (3 Pillars)
              </span>
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-indigo-600 font-mono tracking-tight">
              {kpi.tripleTherapyPercent}% ({kpi.tripleTherapyCount} Patients)
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">
              Partial Optimization Stage
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            3 GDMT Pillars Prescribed
          </div>
        </div>

        {/* Metric 5: Primary CI Driver */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Primary CI Driver
              </span>
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl font-black text-amber-800 tracking-tight">
              Renal Profile ({kpi.primaryCiCount} Flagged)
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">
              Serum Creatinine &gt; 2.5 mg/dL
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            Primary physiological barrier
          </div>
        </div>
      </div>

      {/* Cohort Coverage Comparison: Clustered Columns (Prescription vs Contraindications) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
              Cohort Coverage Comparison
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              GDMT Prescription vs. Contraindications ({kpi.totalPatients} Patients Full Registry)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Clustered column analysis comparing % on Drug against % with Contraindications. Hover over bars to view exact counts and percentages.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
            Registry Cohort: N={kpi.totalPatients}
          </span>
        </div>

        {/* Clustered Column Chart */}
        <div className="h-64 my-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={coverageData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip 
                formatter={(val, name, props) => [
                  `${val}% (${name === '% on Drug' ? props.payload.onDrugCount : props.payload.withCICount} Patients)`,
                  name
                ]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="onDrug" name="% on Drug" fill="#0284c7" radius={[6, 6, 0, 0]} />
              <Bar dataKey="withCI" name="% with Contraindication" fill="#ea580c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 6 Summary Pill Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
          {performanceMatrix.map((p) => (
            <div key={p.pillarKey} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <span className="block text-xs font-bold text-slate-800 truncate">{p.drugName}</span>
              <span className="block text-[11px] font-mono font-bold text-sky-700 mt-1">
                {p.prescribedRate}% on drug
              </span>
              <span className="block text-[10px] font-mono font-semibold text-orange-700 mt-0.5">
                {p.contraindicatedRate}% contra
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety & Compliance Spectrum: Clustered Columns (% Appropriate Care vs % Deviations) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
              Safety & Compliance Spectrum
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Guideline Deviations vs. Appropriate Care Across 6 Pillars ({kpi.totalPatients} Patients)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Clustered columns displaying % Appropriate Care (Green) vs % Clinical Deviations (Orange/Red) with value labels.
            </p>
          </div>
          <button
            onClick={onOpenExclusionGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-auto"
          >
            <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
            <span>Exclusion Guide</span>
          </button>
        </div>

        {/* Clustered Column Chart */}
        <div className="h-64 my-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={complianceData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip 
                formatter={(val, name, props) => [`${val}%`, name]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="appropCare" name="% Appropriate Care" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="deviations" name="% Clinical Deviations" fill="#ea580c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 6 Summary Pill Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
          {performanceMatrix.map((p) => (
            <div key={p.pillarKey} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <span className="block text-xs font-bold text-slate-800 truncate">{p.drugName}</span>
              <span className="block text-[11px] font-mono font-bold text-emerald-700 mt-1">
                {p.appropriatenessScore}% approp
              </span>
              <span className="block text-[10px] font-mono font-semibold text-rose-700 mt-0.5">
                {p.deviationRate}% dev
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* The 6 GDMT Drug Pillars Performance Matrix Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              The 6 GDMT Drug Pillars Performance Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive clinical audit across the 6 guideline classes with explicit deviation taxonomy.
            </p>
          </div>
          <button
            onClick={onOpenExclusionGuide}
            className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 font-bold self-start sm:self-auto cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>View Contraindication Criteria</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Drug Pillar & Key Agents</th>
                <th className="py-3 px-4">Prescribed Rate</th>
                <th className="py-3 px-4">Contraindicated</th>
                <th className="py-3 px-4">Given with CI (Dev)</th>
                <th className="py-3 px-4">Withheld without CI (Dev)</th>
                <th className="py-3 px-4 text-center">Total Deviations</th>
                <th className="py-3 px-4 text-center">Deviation Rate</th>
                <th className="py-3 px-4 text-center">Appropriateness Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {performanceMatrix.map((row) => (
                <tr key={row.pillarKey} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block text-sm">{row.drugName}</span>
                    <span className="text-[11px] text-slate-500 italic block mt-0.5">{row.agents}</span>
                  </td>

                  {/* Prescribed Rate */}
                  <td className="py-3.5 px-4 font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-sky-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(row.prescribedRate, 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-slate-900">{row.prescribedRate}%</span>
                      <span className="text-[11px] text-slate-400">({row.prescribedCount})</span>
                    </div>
                  </td>

                  {/* Contraindicated Rate */}
                  <td className="py-3.5 px-4 font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                      {row.contraindicatedRate}% ({row.contraindicatedCount})
                    </span>
                  </td>

                  {/* Given with CI */}
                  <td className="py-3.5 px-4 font-mono">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="w-3 h-3 text-rose-500" />
                      {row.givenWithContraindication} pts
                    </span>
                  </td>

                  {/* Withheld without CI */}
                  <td className="py-3.5 px-4 font-mono">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      {row.withheldWithoutContraindication} pts
                    </span>
                  </td>

                  {/* Total Deviations */}
                  <td className="py-3.5 px-4 font-mono text-center font-bold text-slate-900">
                    {row.totalDeviations}
                  </td>

                  {/* Deviation Rate */}
                  <td className="py-3.5 px-4 font-mono text-center font-bold text-rose-600">
                    {row.deviationRate}%
                  </td>

                  {/* Appropriateness Score */}
                  <td className="py-3.5 px-4 font-mono text-center">
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black ${
                      row.appropriatenessScore >= 70 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      row.appropriatenessScore >= 40 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {row.appropriatenessScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Continuous Population Frequency Curve: Adherence Bell Curve */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
              Continuous Population Frequency Curve
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              % Adherence to GDMT Distribution ({kpi.totalPatients} Patients Full Registry)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Smooth mathematical density bell curve showing exact UHID patient counts across the 7 discrete adherence brackets.
            </p>
          </div>
          <span className="text-xs font-bold bg-teal-50 text-teal-800 px-3 py-1.5 rounded-xl border border-teal-200 self-start sm:self-auto">
            Peak Frequency: {peakAdherence?.bracket} Adherence ({peakAdherence?.patients} Patients)
          </span>
        </div>

        {/* Bell Curve Area Chart */}
        <div className="h-64 my-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={adherenceCurveData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="adherenceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="bracket" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val, name, props) => [`${val} Patients (${props.payload.percent}%)`, 'Count']} />
              <Area 
                type="natural" 
                dataKey="patients" 
                stroke="#0d9488" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#adherenceGrad)"
                dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#ffffff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 7 Discrete Adherence Bracket Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
          {adherenceCurveData.map((d) => {
            const isPeak = d.bracket === peakAdherence?.bracket;
            return (
              <div 
                key={d.bracket} 
                className={`p-3 rounded-xl text-center border transition-all ${
                  isPeak 
                    ? 'bg-teal-50 border-2 border-teal-500 shadow-xs' 
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className={`block text-xs font-black font-mono ${isPeak ? 'text-teal-900' : 'text-slate-800'}`}>
                  {d.bracket}
                </span>
                <span className="block text-sm font-bold font-mono text-slate-900 mt-1">
                  {d.patients} pts
                </span>
                <span className="block text-[10px] text-slate-500 font-semibold mt-0.5">
                  {d.percent}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Therapy Intensity Spectrum (Number of GDMT Drugs Taken Donut + Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel 1: Drugs Taken Spectrum */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                Therapy Intensity Spectrum
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Number of GDMT Drugs Taken ({kpi.totalPatients} Patients Cohort)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Radial ring breakdown of concurrent drug therapy load.
              </p>
            </div>

            <div className="h-56 flex items-center justify-center my-3 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={drugsTakenDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {drugsTakenDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={INTENSITY_COLORS[index % INTENSITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name, props) => [`${val} Patients (${props.payload.percent}%)`, props.payload.drugs]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL</span>
                <span className="text-xl font-black font-mono text-slate-900 leading-tight">
                  {kpi.totalPatients}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Patients</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
            {drugsTakenDistribution.map((d, idx) => (
              <div key={d.drugs} className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: INTENSITY_COLORS[idx % INTENSITY_COLORS.length] }}
                  ></span>
                  <span className="truncate">{d.drugs}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-base font-bold font-mono text-slate-900">{d.count}</span>
                  <span className="text-[10px] font-mono text-slate-500">{d.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Prescription vs Deviation Gap Analysis */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                Prescription vs. Deviation Gap Analysis
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Drugs Given Irrespective of CI vs. Clinical Deviations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Grouped analysis measuring prescription volume against emitted clinical deviations.
              </p>
            </div>

            <div className="h-56 my-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverageData.slice(0, 4)} margin={{ top: 15, right: 20, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis unit="%" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="onDrug" name="% Drugs Given" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withCI" name="% With Contraindication" fill="#ea580c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {performanceMatrix.slice(0, 4).map((p) => (
              <div key={p.pillarKey} className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
                <span className="font-bold text-slate-900 block truncate">{p.drugName}</span>
                <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-sky-700 font-semibold">{p.prescribedRate}% given</span>
                  <span className="text-rose-600 font-semibold">{p.deviationRate}% dev</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
