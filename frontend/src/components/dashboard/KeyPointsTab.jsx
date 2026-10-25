import React, { useState } from 'react';
import { 
  Users, 
  ClipboardList,
  Calendar, 
  Heart, 
  TrendingDown, 
  Link as LinkIcon, 
  ShieldCheck, 
  Info, 
  Activity, 
  Flame, 
  Droplets,
  HelpCircle,
  BarChart2,
  Building2,
  Home,
  Clock
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

export default function KeyPointsTab({ analytics, onOpenExclusionGuide }) {
  const [adherenceViewMode, setAdherenceViewMode] = useState('bar'); // 'bar' | 'curve'

  if (!analytics || !analytics.kpi) return null;

  const { kpi, ageDistribution, performanceMatrix, adherenceDistribution, drugsTakenDistribution } = analytics;

  // Gender Chart Data
  const genderData = [
    { name: 'Male', value: kpi.males, color: '#0284c7' }, // sky-600
    { name: 'Female', value: kpi.females, color: '#ec4899' } // pink-500
  ];

  // Phenotype Donut Data (strictly HFrEF & HFpEF from hf_final_clinical_assessment)
  const phenotypeData = [
    { name: 'HFrEF (Reduced)', value: kpi.hfrEFCount || 0, color: '#0d9488' },
    { name: 'HFpEF (Preserved)', value: kpi.hfpEFCount || 0, color: '#0284c7' }
  ].filter(d => d.value > 0);

  // NYHA Radial Data
  const nyhaData = [
    { name: 'Class I', count: kpi.nyha1Count, fill: '#10b981' },
    { name: 'Class II', count: kpi.nyha2Count, fill: '#06b6d4' },
    { name: 'Class III', count: kpi.nyha3Count, fill: '#f59e0b' },
    { name: 'Class IV', count: kpi.nyha4Count, fill: '#ef4444' }
  ];

  // Comorbidity Burden Data
  const comorbidityData = [
    { name: 'Diabetes mellitus', percent: kpi.diabetesPercent, count: kpi.diabetesCount, fill: '#0284c7' },
    { name: 'Hypertension', percent: kpi.hypertensionPercent, count: kpi.hypertensionCount, fill: '#ea580c' },
    { name: 'Renal failure / CKD', percent: kpi.renalFailurePercent, count: kpi.renalFailureCount, fill: '#10b981' }
  ];

  // Mortality Endpoints & Post-Discharge Timeline Data
  const mortalityChartData = [
    { 
      name: 'Total Deaths', 
      count: kpi.deathsRecorded || 0, 
      rate: kpi.mortalityPercent || 0, 
      fill: '#e11d48',
      rateLabel: `${kpi.mortalityPercent || 0}% Cohort Mortality`
    },
    { 
      name: 'Deaths in Hospital', 
      count: kpi.deathsHospital || 0, 
      rate: kpi.deathsHospitalPercent || 0, 
      fill: '#f59e0b',
      rateLabel: `${kpi.deathsHospitalPercent || 0}% of Deaths`
    },
    { 
      name: 'Deaths in Home', 
      count: kpi.deathsHome || 0, 
      rate: kpi.deathsHomePercent || 0, 
      fill: '#8b5cf6',
      rateLabel: `${kpi.deathsHomePercent || 0}% of Deaths`
    },
    { 
      name: '≤30 Days of Discharge', 
      count: kpi.deathsWithin30Days || 0, 
      rate: kpi.deathsWithin30DaysPercent || 0, 
      fill: '#ef4444',
      rateLabel: `${kpi.deathsWithin30DaysPercent || 0}% of Deaths`
    }
  ];

  // Mortality Location Distribution Donut Data
  const mortalityLocationData = [
    { name: 'Home', value: kpi.deathsHome || 0, color: '#8b5cf6' },
    { name: 'Hospital', value: kpi.deathsHospital || 0, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  // Clustered Coverage Data (Prescription vs Contraindication vs Deviations)
  const coverageData = (performanceMatrix || []).map(p => ({
    name: p.drugName,
    onDrug: p.prescribedRate,
    withCI: p.contraindicatedRate,
    deviations: p.deviationRate,
    onDrugCount: p.prescribedCount,
    withCICount: p.contraindicatedCount,
    deviationsCount: p.totalDeviations
  }));

  // Safety & Compliance Data (Appropriate Care vs Deviations)
  const totalHfCount = kpi.totalHfRecords || kpi.totalPatients || 123;
  const complianceData = (performanceMatrix || []).map(p => ({
    name: p.drugName,
    appropCare: p.appropriatenessScore,
    deviations: p.deviationRate,
    appropCareCount: Math.max(0, totalHfCount - (p.totalDeviations || 0)),
    totalDeviations: p.totalDeviations
  }));

  // GDMT Category Prescription Profile Data
  const categoryProfileData = (performanceMatrix || []).map(p => ({
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

  // Find peak age bracket
  const peakAge = [...(ageDistribution || [])].sort((a, b) => b.count - a.count)[0];

  // Modern rounded neat tooltip styling
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
    <div className="space-y-6">
      {/* 7 Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Card 1: Unique Patients */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Patient's (UHID's)
              </span>
              <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 font-mono tracking-tight">
              {kpi.uniquePatients || kpi.totalPatients} Patients
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">
              Unique Hospital Identifiers
            </div>
          </div>
        </div>

        {/* Card 2: Total HF Records */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total HF Records
              </span>
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <ClipboardList className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-indigo-600 font-mono tracking-tight">
              {kpi.totalHfRecords || kpi.totalPatients} Records
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">
              Documented Admissions
            </div>
          </div>
        </div>

        {/* Card 3: Mean Age (Highlighted) */}
        <div className="bg-white p-3.5 rounded-2xl border-2 border-teal-500/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
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
        </div>

        {/* Card 4: Mean EF % */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
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
        </div>

        {/* Card 5: Deaths Recorded */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
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
        </div>

        {/* Card 6: Mean GDMT Drugs */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Mean GDMT Drugs / Record
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
        </div>

        {/* Card 7: Mean % GDMT Adherence */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
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
        </div>
      </div>

      {/* 4-Panel Clinical Epidemiology Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Panel 1: Gender Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Gender Distribution</h3>
            <span className="text-[11px] font-mono font-semibold text-slate-400">N={kpi.uniquePatients || 18} Patients</span>
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
                  contentStyle={tooltipStyle.content}
                  labelStyle={tooltipStyle.label}
                  itemStyle={tooltipStyle.item}
                  formatter={(val, name) => [`${val} (${Math.round((val / (kpi.totalHfRecords || kpi.totalPatients)) * 1000) / 10}%)`, name]}
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
                  wrapperStyle={{ zIndex: 50 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0];
                      const count = item.value;
                      const total = kpi.totalHfRecords || kpi.totalPatients || 123;
                      const pct = Math.round((count / total) * 1000) / 10;
                      return (
                        <div className="bg-slate-900/95 text-white px-3 py-2 rounded-xl shadow-xl border border-slate-700/60 backdrop-blur-xs text-xs pointer-events-none">
                          <p className="font-bold text-teal-300">{item.name}</p>
                          <p className="text-slate-200 mt-0.5 font-mono">
                            {count} HF Records ({pct}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
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
                Reduced EF ({kpi.hfrEFPercent}%)
              </span>
            </div>
            <div className="bg-sky-50 border border-sky-100 p-2 rounded-xl">
              <span className="font-bold text-sky-900 block truncate">
                {kpi.hfpEFCount} HFpEF
              </span>
              <span className="text-[10px] text-sky-700 font-semibold block mt-0.5">
                Preserved EF ({kpi.hfpEFPercent}%)
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
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white p-2.5 rounded-lg shadow-md border border-slate-200 text-xs">
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-slate-600 mt-0.5">
                            count : <span className="font-semibold text-slate-900">{item.count} HF Records</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            <div className="bg-amber-50/80 border border-amber-200 p-2 rounded-xl flex items-center justify-between">
              <span className="font-bold text-amber-900">NYHA Class III (Moderate)</span>
              <span className="font-mono font-bold text-amber-800">{kpi.nyha3Count} HF Records ({kpi.nyha3Percent}%)</span>
            </div>
            <div className="bg-rose-50/80 border border-rose-200 p-2 rounded-xl flex items-center justify-between">
              <span className="font-bold text-rose-900">NYHA Class IV (Severe)</span>
              <span className="font-mono font-bold text-rose-800">{kpi.nyha4Count} HF Records ({kpi.nyha4Percent}%)</span>
            </div>
          </div>
        </div>

        {/* Panel 4: Age Distribution Spectrum */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Age Distribution Spectrum</h3>
            <span className="text-[11px] font-mono font-semibold text-slate-400">N={kpi.uniquePatients || 18} Patients</span>
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
                <Tooltip 
                  contentStyle={tooltipStyle.content}
                  labelStyle={tooltipStyle.label}
                  itemStyle={tooltipStyle.item}
                  cursor={tooltipStyle.cursor}
                  formatter={(val, name) => [`${val} HF Records`, 'Enrolled']} 
                />
                <Area type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#ageGradient)" dot={{ r: 3, fill: '#0d9488' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-600 font-medium">
              Peak Density: <strong className="text-teal-700 font-bold">{peakAge?.bracket}</strong> ({peakAge?.count} HF Records, {peakAge?.percent}%)
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Row: Comorbidities (Left) & Mortality Endpoints & 30-Day Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Diabetes Mellitus, Hypertension & Renal Impairment */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Diabetes Mellitus, Hypertension & Renal Impairment
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Evaluated directly from final clinical assessment records
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Cohort: {kpi.totalHfRecords || kpi.totalPatients} Records
              </span>
            </div>

            {/* Bar Chart */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comorbidityData} margin={{ top: 15, right: 20, left: -15, bottom: 5 }} barSize={38}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={tooltipStyle.content}
                    labelStyle={tooltipStyle.label}
                    itemStyle={tooltipStyle.item}
                    cursor={tooltipStyle.cursor}
                    formatter={(val, name, props) => [`${val}% (${props.payload.count} HF Records)`, props.payload.name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Bar 
                    dataKey="percent" 
                    name="% HF Records"
                    radius={[6, 6, 0, 0]}
                  >
                    {comorbidityData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3 Detail Cards underneath */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
            {/* DM */}
            <div className="bg-sky-50/50 border border-sky-200 rounded-xl p-2.5">
              <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block truncate">
                Diabetes
              </span>
              <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                <span className="text-base font-black text-slate-900 font-mono">
                  {kpi.diabetesCount}
                </span>
                <span className="text-[11px] font-bold text-sky-700 font-mono">
                  ({kpi.diabetesPercent}%)
                </span>
              </div>
            </div>

            {/* HTN */}
            <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-2.5">
              <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block truncate">
                Hypertension
              </span>
              <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                <span className="text-base font-black text-slate-900 font-mono">
                  {kpi.hypertensionCount}
                </span>
                <span className="text-[11px] font-bold text-orange-700 font-mono">
                  ({kpi.hypertensionPercent}%)
                </span>
              </div>
            </div>

            {/* Renal */}
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-2.5">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block truncate">
                Renal Failure
              </span>
              <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                <span className="text-base font-black text-slate-900 font-mono">
                  {kpi.renalFailureCount}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 font-mono">
                  ({kpi.renalFailurePercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Mortality Endpoints & 30-Day Discharge Timeline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Mortality Endpoints & 30-Day Discharge Timeline
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Survival endpoints, location & 30-day timeline
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200 self-start sm:self-auto">
                {kpi.deathsRecorded || 0} Deaths ({kpi.mortalityPercent || 0}%)
              </span>
            </div>

            {/* Bar Chart */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mortalityChartData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }} barSize={34}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    interval={0}
                    tick={{ fontSize: 9.5, fill: '#334155', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    allowDecimals={false}
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
                      `${val} HF Records (${props.payload.rateLabel})`,
                      props.payload.name
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Bar 
                    dataKey="count" 
                    name="HF Records" 
                    radius={[5, 5, 0, 0]}
                  >
                    {mortalityChartData.map((entry, index) => (
                      <Cell key={`cell-mortality-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4 Detail Cards underneath */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
            {/* Total Deaths */}
            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-2.5">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block truncate">
                Total Deaths
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-base font-black text-slate-900 font-mono">
                  {kpi.deathsRecorded || 0}
                </span>
                <span className="text-[10px] font-bold text-rose-700 font-mono">
                  ({kpi.mortalityPercent || 0}%)
                </span>
              </div>
            </div>

            {/* Hospital Deaths */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-2.5">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block truncate">
                In Hospital
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-base font-black text-slate-900 font-mono">
                  {kpi.deathsHospital || 0}
                </span>
                <span className="text-[10px] font-bold text-amber-700 font-mono">
                  ({kpi.deathsHospitalPercent || 0}%)
                </span>
              </div>
            </div>

            {/* Home Deaths */}
            <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-2.5">
              <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block truncate">
                At Home
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-base font-black text-slate-900 font-mono">
                  {kpi.deathsHome || 0}
                </span>
                <span className="text-[10px] font-bold text-purple-700 font-mono">
                  ({kpi.deathsHomePercent || 0}%)
                </span>
              </div>
            </div>

            {/* <= 30 Days */}
            <div className="bg-red-50/50 border border-red-200 rounded-xl p-2.5">
              <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block truncate">
                ≤30 Days
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-base font-black text-slate-900 font-mono">
                  {kpi.deathsWithin30Days || 0}
                </span>
                <span className="text-[10px] font-bold text-red-700 font-mono">
                  ({kpi.deathsWithin30DaysPercent || 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GDMT SECTION: 3 Rows of 2 Graphs (6 Graphs Total) */}

      {/* ROW 1: GDMT Prescription vs. Contraindications (Left) & Appropriate Care vs. Clinical Deviations (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: GDMT Prescription vs. Contraindications (278 Patients Full Registry) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                GDMT Prescription vs. Contraindications (278 Patients Full Registry)
              </h3>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Cohort: N={kpi.uniquePatients || 278}
              </span>
            </div>

            {/* Clustered Column Chart */}
            <div className="h-64 my-2">
       <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverageData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }} barGap={4}>
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
                  <Bar dataKey="onDrug" name="% on Drug" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withCI" name="% with Contraindication" fill="#ea580c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 6 Detail Cards Underneath */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 pt-3 border-t border-slate-100">
            {coverageData.map((item, i) => (
              <div key={i} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {item.name}
                </span>
                <div className="mt-1.5 space-y-0.5 text-[11px] font-mono">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">On Drug:</span>
                    <span className="font-black text-sky-600">
                      {item.onDrugCount} <span className="font-normal text-slate-500">({item.onDrug}%)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">With CI:</span>
                    <span className="font-black text-amber-700">
                      {item.withCICount} <span className="font-normal text-slate-500">({item.withCI}%)</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Appropriate Care vs. Clinical Deviations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                Appropriate Care vs. Clinical Deviations
              </h3>
            </div>

            {/* Clustered Column Chart */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }} barGap={4}>
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
                    contentStyle={tooltipStyle.content}
                    labelStyle={tooltipStyle.label}
                    itemStyle={tooltipStyle.item}
                    cursor={tooltipStyle.cursor}
                    formatter={(val, name, props) => [`${val}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Bar dataKey="appropCare" name="% Appropriate Care" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deviations" name="% Clinical Deviations" fill="#ea580c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 6 Detail Cards Underneath */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 pt-3 border-t border-slate-100">
            {complianceData.map((item, i) => (
              <div key={i} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {item.name}
                </span>
                <div className="mt-1.5 space-y-0.5 text-[11px] font-mono">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Approp:</span>
                    <span className="font-black text-emerald-600">
                      {item.appropCareCount} <span className="font-normal text-slate-500">({item.appropCare}%)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Deviations:</span>
                    <span className="font-black text-orange-600">
                      {item.totalDeviations} <span className="font-normal text-slate-500">({item.deviations}%)</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 2: GDMT Category Prescription Profile (Left) & Drugs Given Irrespective of CI vs. Clinical Deviations (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: GDMT Category Prescription Profile (123 Records) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                GDMT Category Prescription Profile ({kpi.totalHfRecords || 123} Records)
              </h3>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Cohort: N={kpi.totalHfRecords || kpi.totalPatients}
              </span>
            </div>

            {/* Vertical Column Chart */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={categoryProfileData} 
                  margin={{ top: 10, right: 15, left: -20, bottom: 5 }} 
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
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 6 Detail Cards Underneath */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 pt-3 border-t border-slate-100">
            {categoryProfileData.map((item, i) => (
              <div key={i} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {item.name}
                </span>
                <div className="mt-1.5 flex items-baseline justify-between gap-1 font-mono">
                  <span className="text-sm font-black text-slate-900">
                    {item.count} <span className="text-[10px] font-medium text-slate-500">Records</span>
                  </span>
                  <span className="text-xs font-bold text-sky-600">
                    {item.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Drugs Given Irrespective of CI vs. Clinical Deviations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                Drugs Given Irrespective of CI vs. Clinical Deviations
              </h3>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Cohort: N={kpi.totalHfRecords || kpi.totalPatients}
              </span>
            </div>

            {/* Clustered Column Chart */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={coverageData}
                  margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
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
                  />
                  <Bar
                    dataKey="deviations"
                    name="% Clinical Deviations"
                    fill="#ea580c"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 6 Detail Cards Underneath */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 pt-3 border-t border-slate-100">
            {coverageData.map((item, i) => (
              <div key={i} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {item.name}
                </span>
                <div className="mt-1.5 space-y-0.5 text-[11px] font-mono">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Given:</span>
                    <span className="font-black text-sky-600">
                      {item.onDrugCount} <span className="font-normal text-slate-500">({item.onDrug}%)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Deviations:</span>
                    <span className="font-black text-orange-600">
                      {item.deviationsCount} <span className="font-normal text-slate-500">({item.deviations}%)</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3: % Adherence to GDMT Distribution (Left) & Number of GDMT Drugs Taken Distribution (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: % Adherence to GDMT Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                % Adherence to GDMT Distribution
              </h3>

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
                  <BarChart data={adherenceData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }} barSize={30}>
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
                      cursor={tooltipStyle.cursor}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white text-slate-800 p-3 rounded-xl shadow-xl border border-slate-200 text-xs">
                            <div className="font-bold text-slate-900 text-[13px]">{d.bracket} Adherence</div>
                            <div className="text-slate-500 mt-0.5">{d.deviations} Deviations</div>
                            <div className="text-sm font-black font-mono text-blue-600 mt-1">
                              {d.patients} HF Records <span className="text-xs font-normal text-slate-400">({d.percent}%)</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Bar dataKey="patients" name="HF Records" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={adherenceData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="adherenceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="bracket" tick={{ fontSize: 9.5, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={tooltipStyle.content}
                      labelStyle={tooltipStyle.label}
                      itemStyle={tooltipStyle.item}
                      cursor={tooltipStyle.cursor}
                      formatter={(val, name, props) => [`${val} HF Records (${props.payload.percent}%)`, 'Count']} 
                    />
                    <Area 
                      type="natural" 
                      dataKey="patients" 
                      name="HF Records"
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

          {/* Adherence Bracket Detail Cards Underneath */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2 pt-3 border-t border-slate-100">
            {adherenceData.map((item, i) => (
              <div key={i} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-800 truncate block">
                  {item.bracket}
                </span>
                <div className="mt-1 flex items-baseline justify-between gap-1 font-mono">
                  <span className="text-xs font-black text-slate-900">
                    {item.patients} <span className="text-[9px] font-medium text-slate-500">HF Rec</span>
                  </span>
                  <span className="text-[11px] font-bold text-blue-600">
                    {item.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Number of GDMT Drugs Taken Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                Number of GDMT Drugs Taken Distribution
              </h3>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Cohort: N={kpi.totalHfRecords || kpi.totalPatients}
              </span>
            </div>

            {/* Vertical Column Chart for Drugs Taken */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={drugsTakenDistribution} 
                  margin={{ top: 10, right: 15, left: -20, bottom: 5 }} 
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
                    contentStyle={tooltipStyle.content}
                    labelStyle={tooltipStyle.label}
                    itemStyle={tooltipStyle.item}
                    cursor={tooltipStyle.cursor}
                    formatter={(val, name, props) => [
                      `${val}% (${props.payload.count} HF Records)`,
                      props.payload.drugs
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Bar 
                    dataKey="percent" 
                    name="% HF Records" 
                    radius={[5, 5, 0, 0]}
                  >
                    {drugsTakenDistribution.map((entry, index) => (
                      <Cell key={`cell-drug-${index}`} fill={INTENSITY_COLORS[index % INTENSITY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Drugs Taken Distribution Detail Cards Underneath */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2 pt-3 border-t border-slate-100">
            {(drugsTakenDistribution || []).map((item, i) => (
              <div key={i} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-800 truncate block">
                  {item.drugs}
                </span>
                <div className="mt-1 flex items-baseline justify-between gap-1 font-mono">
                  <span className="text-xs font-black text-slate-900">
                    {item.count} <span className="text-[9px] font-medium text-slate-500">HF Rec</span>
                  </span>
                  <span className="text-[11px] font-bold text-teal-600">
                    {item.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
