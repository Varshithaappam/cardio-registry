import React from 'react';
import { 
  Users, 
  Calendar, 
  Heart, 
  TrendingDown, 
  Link as LinkIcon, 
  ShieldCheck, 
  Info, 
  Activity, 
  Flame, 
  Droplets 
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';

export default function KeyPointsTab({ analytics }) {
  if (!analytics || !analytics.kpi) return null;

  const { kpi, ageDistribution } = analytics;

  // Gender Chart Data
  const genderData = [
    { name: 'Male', value: kpi.males, color: '#0284c7' }, // sky-600
    { name: 'Female', value: kpi.females, color: '#ec4899' } // pink-500
  ];

  // Phenotype Donut Data
  const phenotypeData = [
    { name: 'HFrEF (≤40%)', value: kpi.hfrEFCount, color: '#0d9488' }, // teal-600
    { name: 'HFmrEF (41-49%)', value: kpi.hfmrEFCount || 0, color: '#0284c7' }, // sky-600
    { name: 'HFpEF (≥50%)', value: kpi.hfpEFCount, color: '#1e293b' }  // slate-800
  ].filter(d => d.value > 0);

  // NYHA Radial Data
  const nyhaData = [
    { name: 'NYHA Class I', count: kpi.nyha1Count, fill: '#10b981' },
    { name: 'NYHA Class II', count: kpi.nyha2Count, fill: '#06b6d4' },
    { name: 'NYHA Class III', count: kpi.nyha3Count, fill: '#f59e0b' },
    { name: 'NYHA Class IV', count: kpi.nyha4Count, fill: '#ef4444' }
  ];

  // Comorbidity Burden Data
  const comorbidityData = [
    { name: 'Diabetes mellitus', percent: kpi.diabetesPercent, count: kpi.diabetesCount, fill: '#0284c7' },
    { name: 'Hypertension', percent: kpi.hypertensionPercent, count: kpi.hypertensionCount, fill: '#ea580c' },
    { name: 'Renal failure / CKD', percent: kpi.renalFailurePercent, count: kpi.renalFailureCount, fill: '#10b981' }
  ];

  // Find peak age bracket
  const peakAge = [...(ageDistribution || [])].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="space-y-6">
      {/* 6 Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Patients */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Patients (UHIDs) in Dataset
              </span>
              <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 font-mono tracking-tight">
              {kpi.totalPatients} Patients
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">
              Unique Hospital Identifiers
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400">
            Formula: =COUNTA(UHID)
          </div>
        </div>

        {/* Card 2: Mean Age (Highlighted) */}
        <div className="bg-white p-4 rounded-2xl border-2 border-teal-500/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                Mean Age (Years)
              </span>
              <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg border border-teal-200/40">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 font-mono tracking-tight">
              {kpi.meanAge} yrs
            </div>
            <div className="text-[11px] text-slate-700 font-medium mt-1">
              Standard Deviation: ±{kpi.sdAge} yrs
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-teal-100 text-[10px] font-mono text-teal-700">
            Formula: =AVERAGE(Age)
          </div>
        </div>

        {/* Card 3: Mean EF % */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Mean EF %
              </span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Heart className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-blue-600 font-mono tracking-tight">
              {kpi.meanEf}%
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">
              Ejection Fraction Average
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400">
            Formula: =AVERAGE(EF%)
          </div>
        </div>

        {/* Card 4: Deaths Recorded */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Deaths Recorded
              </span>
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-rose-600 font-mono tracking-tight">
              {kpi.deathsRecorded} Deaths
            </div>
            <div className="text-[11px] text-rose-700 font-bold mt-1">
              {kpi.mortalityPercent}% Cohort Mortality
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400">
            Formula: =COUNTIF(Death, "Y*")
          </div>
        </div>

        {/* Card 5: Mean GDMT Drugs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Mean GDMT Drugs / Patient
              </span>
              <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                <LinkIcon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 font-mono tracking-tight">
              {kpi.meanGdmtDrugs} / 6
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">
              Average Pillars Prescribed
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400">
            Formula: =AVERAGE(GDMT Taken)
          </div>
        </div>

        {/* Card 6: Mean % GDMT Adherence */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Mean % GDMT Adherence
              </span>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600 font-mono tracking-tight">
              {kpi.meanAdherencePercent}%
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-1">
              Zero Deviation Appropriate Care
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400">
            Formula: =AVERAGE(% GDMT adhered)
          </div>
        </div>
      </div>

      {/* 4-Panel Clinical Epidemiology Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Panel 1: Gender Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Gender Distribution</h3>
            <span className="text-[11px] font-mono font-semibold text-slate-400">N={kpi.totalPatients}</span>
          </div>

          <div className="h-44 flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val, name) => [`${val} (${Math.round((val / kpi.totalPatients) * 1000) / 10}%)`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            <div className="bg-sky-50/60 border border-sky-100 p-2 rounded-xl">
              <span className="flex items-center gap-1.5 text-sky-800 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                {kpi.males} Male
              </span>
              <span className="text-[11px] font-mono text-sky-600 block mt-0.5 font-semibold">
                {kpi.malePercent}%
              </span>
            </div>
            <div className="bg-pink-50/60 border border-pink-100 p-2 rounded-xl">
              <span className="flex items-center gap-1.5 text-pink-800 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                {kpi.females} Female
              </span>
              <span className="text-[11px] font-mono text-pink-600 block mt-0.5 font-semibold">
                {kpi.femalePercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Panel 2: HF Phenotype Classification */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">HF Phenotype Classification</h3>
            <span className="text-[11px] font-mono font-semibold text-slate-400">LVEF %</span>
          </div>

          <div className="h-44 flex items-center justify-center my-2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={phenotypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {phenotypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val, name) => [`${val} (${Math.round((val / kpi.totalPatients) * 1000) / 10}%)`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Callout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black font-mono text-teal-700 leading-none">
                {kpi.hfrEFPercent}%
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                HFrEF
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            <div className="bg-teal-50/60 border border-teal-100 p-2 rounded-xl">
              <span className="font-bold text-teal-900 block truncate">
                {kpi.hfrEFCount} HFrEF
              </span>
              <span className="text-[10px] text-teal-700 font-semibold block mt-0.5">
                ≤40% ({kpi.hfrEFPercent}%)
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
              <span className="font-bold text-slate-900 block truncate">
                {kpi.hfpEFCount} HFpEF
              </span>
              <span className="text-[10px] text-slate-600 font-semibold block mt-0.5">
                &gt;40% ({kpi.hfpEFPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Panel 3: NYHA Functional Classification */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">NYHA Functional Class</h3>
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Class III & IV
            </span>
          </div>

          <div className="h-44 flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="70%" 
                innerRadius="30%" 
                outerRadius="95%" 
                barSize={10} 
                data={nyhaData} 
                startAngle={180} 
                endAngle={0}
              >
                <RadialBar
                  minAngle={15}
                  background={{ fill: '#f1f5f9' }}
                  clockWise
                  dataKey="count"
                  cornerRadius={6}
                />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            <div className="bg-amber-50/80 border border-amber-200 p-2 rounded-xl flex items-center justify-between">
              <span className="font-bold text-amber-900">NYHA Class III (Moderate)</span>
              <span className="font-mono font-bold text-amber-800">{kpi.nyha3Count} pts ({kpi.nyha3Percent}%)</span>
            </div>
            <div className="bg-rose-50/80 border border-rose-200 p-2 rounded-xl flex items-center justify-between">
              <span className="font-bold text-rose-900">NYHA Class IV (Severe)</span>
              <span className="font-mono font-bold text-rose-800">{kpi.nyha4Count} pts ({kpi.nyha4Percent}%)</span>
            </div>
          </div>
        </div>

        {/* Panel 4: Age Distribution Spectrum */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Age Distribution Spectrum</h3>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              Peak: {peakAge?.bracket || '61-70y'}
            </span>
          </div>

          <div className="h-44 flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ageDistribution || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="ageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="bracket" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val, name) => [`${val} Patients`, 'Enrolled']} />
                <Area type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#ageGradient)" dot={{ r: 3, fill: '#0d9488' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-600 font-medium">
              Peak Density: <strong className="text-teal-700 font-bold">{peakAge?.bracket}</strong> ({peakAge?.count} Patients, {peakAge?.percent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Cardiorenal & Metabolic Burden Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
              Cardiorenal & Metabolic Burden
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Diabetes Mellitus, Hypertension & Renal Impairment
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluated across all diagnostic records and serum creatinine contraindication markers. Values shown directly above columns.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full self-start sm:self-auto border border-slate-200">
            Cohort: {kpi.totalPatients} Patients
          </span>
        </div>

        {/* Bar Chart */}
        <div className="h-64 my-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comorbidityData} margin={{ top: 25, right: 30, left: 0, bottom: 5 }} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip 
                formatter={(val, name, props) => [`${val}% (${props.payload.count} Patients)`, props.payload.name]}
              />
              <Bar 
                dataKey="percent" 
                radius={[8, 8, 0, 0]}
                label={{ position: 'top', formatter: (val) => `${val}%`, fill: '#0f172a', fontSize: 12, fontWeight: 700 }}
              >
                {comorbidityData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3 Detail Cards underneath (Matching screenshot 2 exactly) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          {/* DM */}
          <div className="bg-sky-50/50 border border-sky-200 rounded-xl p-4">
            <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider block">
              Diabetes Mellitus
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900 font-mono">
                {kpi.diabetesCount} Patients
              </span>
              <span className="text-xs font-bold text-sky-700 font-mono">
                ({kpi.diabetesPercent}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-2 leading-normal">
              Matches any comorbidity column = "Diabetes mellitus" / DM
            </p>
          </div>

          {/* HTN */}
          <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-4">
            <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider block">
              Hypertension (HTN)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900 font-mono">
                {kpi.hypertensionCount} Patients
              </span>
              <span className="text-xs font-bold text-orange-700 font-mono">
                ({kpi.hypertensionPercent}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-2 leading-normal">
              Matches any comorbidity column = "HYPERTENSION" / HTN
            </p>
          </div>

          {/* Renal */}
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Renal Failure / CKD Flagged
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900 font-mono">
                {kpi.renalFailureCount} Patients
              </span>
              <span className="text-xs font-bold text-emerald-700 font-mono">
                ({kpi.renalFailurePercent}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-2 leading-normal">
              Renal contraindication flagged by Serum Creatinine &gt; 2.5 mg/dL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
