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
  Legend,
  LabelList
} from 'recharts';

const RADIAN = Math.PI / 180;

/**
 * Custom Donut Slice Label:
 * - If segment is >= 10%, centers percentage label directly inside the colored arc with high-contrast text.
 * - If segment < 10% (very small slice), renders an outer label with a leader line pointing to the slice.
 * - High contrast: white text with drop shadow on dark segments, dark text on lighter segments.
 */
function renderDonutSegmentLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  fill
}) {
  if (percent === undefined || percent === null || percent <= 0) return null;

  const pctLabel = `${Math.round(percent * 100)}%`;
  const sin = Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);

  // If slice represents a sufficient percentage (>= 18%), center inside segment
  if (percent >= 0.18) {
    const midRadius = innerRadius + (outerRadius - innerRadius) * 0.52;
    const x = cx + midRadius * cos;
    const y = cy + midRadius * sin;

    // High-contrast font color:
    // White text on dark segments, dark text on light segments
    const isLight = fill && (fill === '#ffffff' || fill.toLowerCase().includes('f8') || fill.toLowerCase().includes('fa'));
    const textColor = isLight ? '#1e293b' : '#ffffff';

    return (
      <text
        x={x}
        y={y}
        fill={textColor}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: '12px',
          fontWeight: '800',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          filter: isLight ? 'none' : 'drop-shadow(0 1px 2px rgba(15,23,42,0.85))',
          pointerEvents: 'none'
        }}
      >
        {pctLabel}
      </text>
    );
  } else {
    // Smaller slice (< 18%): outer label with a leader line pointing to the slice
    const sx = cx + (outerRadius + 2) * cos;
    const sy = cy + (outerRadius + 2) * sin;
    const mx = cx + (outerRadius + 12) * cos;
    const my = cy + (outerRadius + 12) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 14;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g className="pointer-events-none">
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke="#94a3b8"
          strokeWidth={1.5}
          fill="none"
        />
        <circle cx={ex} cy={ey} r={2} fill="#64748b" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 4}
          y={ey}
          textAnchor={textAnchor}
          dominantBaseline="central"
          style={{
            fontSize: '11px',
            fontWeight: '800',
            fill: '#0f172a',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace'
          }}
        >
          {pctLabel}
        </text>
      </g>
    );
  }
}

export default function KeyPointsTab({ analytics, onOpenExclusionGuide }) {
  const [adherenceViewMode, setAdherenceViewMode] = useState('bar'); // 'bar' | 'curve'

  // Flag to temporarily hide detail cards underneath all graphs
  const SHOW_GRAPH_DETAIL_CARDS = false;

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

  const UNIFIED_BAR_COLOR = '#0d9488'; // Signature Teal-600 across all primary distribution graphs
  const totalHfRecordsCount = kpi.totalHfRecords || kpi.totalPatients || 1;
  const toHfPercent = count => totalHfRecordsCount > 0 ? Math.round(((count || 0) / totalHfRecordsCount) * 1000) / 10 : 0;

  // Comorbidity Burden Data
  const comorbidityData = [
    { name: 'Diabetes mellitus', percent: kpi.diabetesPercent, count: kpi.diabetesCount, fill: UNIFIED_BAR_COLOR },
    { name: 'Hypertension', percent: kpi.hypertensionPercent, count: kpi.hypertensionCount, fill: UNIFIED_BAR_COLOR },
    { name: 'Renal failure / CKD', percent: kpi.renalFailurePercent, count: kpi.renalFailureCount, fill: UNIFIED_BAR_COLOR }
  ];

  // Mortality Endpoints & Post-Discharge Timeline Data (% of HF Records)
  const mortalityChartData = [
    { 
      name: 'Total Deaths', 
      count: kpi.deathsRecorded || 0, 
      percent: toHfPercent(kpi.deathsRecorded || 0), 
      fill: UNIFIED_BAR_COLOR,
      rateLabel: `${toHfPercent(kpi.deathsRecorded || 0)}% of HF Records`
    },
    { 
      name: 'Deaths in Hospital', 
      count: kpi.deathsHospital || 0, 
      percent: toHfPercent(kpi.deathsHospital || 0), 
      fill: UNIFIED_BAR_COLOR,
      rateLabel: `${toHfPercent(kpi.deathsHospital || 0)}% of HF Records`
    },
    { 
      name: 'Deaths in Home', 
      count: kpi.deathsHome || 0, 
      percent: toHfPercent(kpi.deathsHome || 0), 
      fill: UNIFIED_BAR_COLOR,
      rateLabel: `${toHfPercent(kpi.deathsHome || 0)}% of HF Records`
    },
    { 
      name: '≤30 Days of Discharge', 
      count: kpi.deathsWithin30Days || 0, 
      percent: toHfPercent(kpi.deathsWithin30Days || 0), 
      fill: UNIFIED_BAR_COLOR,
      rateLabel: `${toHfPercent(kpi.deathsWithin30Days || 0)}% of HF Records`
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
              {kpi.totalHfRecords || kpi.totalPatients} 
            </div>
          </div>
        </div>
        {/* Card 3: Mean Age */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Mean Age (Years)
              </span>
              <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 font-mono tracking-tight">
              {kpi.meanAge} yrs
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
          </div>
        </div>
      </div>

      {/* 4-Panel Clinical Epidemiology Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Panel 1: Gender Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Gender Distribution</h3>
            <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">Cohort: {kpi.totalHfRecords || kpi.totalPatients} Records</span>
          </div>

          <div className="h-48 my-1 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={76}
                  paddingAngle={3}
                  dataKey="value"
                  label={renderDonutSegmentLabel}
                  labelLine={false}
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
            {/* Center KPI summary */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black font-mono text-slate-800 leading-none">
                {kpi.uniquePatients || (kpi.males + kpi.females)}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                Patients
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100">
            <div className="bg-sky-50/60 border border-sky-100 px-3 py-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0"></span>
                <span className="text-xs font-bold text-sky-900 truncate">Male</span>
              </div>
              <div className="text-right font-mono shrink-0 pl-1">
                <span className="text-xs font-black text-slate-900">{kpi.males}</span>
                <span className="text-[10px] font-bold text-sky-700 ml-1">({kpi.malePercent}%)</span>
              </div>
            </div>
            <div className="bg-pink-50/60 border border-pink-100 px-3 py-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0"></span>
                <span className="text-xs font-bold text-pink-900 truncate">Female</span>
              </div>
              <div className="text-right font-mono shrink-0 pl-1">
                <span className="text-xs font-black text-slate-900">{kpi.females}</span>
                <span className="text-[10px] font-bold text-pink-700 ml-1">({kpi.femalePercent}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: HF Phenotype Classification */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">HF Phenotype Classification</h3>
            <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">Cohort: {kpi.totalHfRecords || kpi.totalPatients} Records</span>
          </div>

          <div className="h-48 my-1 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={phenotypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={76}
                  paddingAngle={4}
                  dataKey="value"
                  label={renderDonutSegmentLabel}
                  labelLine={false}
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
            {/* Center KPI summary */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black font-mono text-teal-850 leading-none text-teal-800">
                {kpi.totalHfRecords || (kpi.hfrEFCount + kpi.hfpEFCount)}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                Records
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100">
            <div className="bg-teal-50/60 border border-teal-100 px-3 py-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0"></span>
                <span className="text-xs font-bold text-teal-900 truncate">HFrEF</span>
              </div>
              <div className="text-right font-mono shrink-0 pl-1">
                <span className="text-xs font-black text-slate-900">{kpi.hfrEFCount}</span>
                <span className="text-[10px] font-bold text-teal-700 ml-1">({kpi.hfrEFPercent}%)</span>
              </div>
            </div>
            <div className="bg-sky-50/60 border border-sky-100 px-3 py-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0"></span>
                <span className="text-xs font-bold text-sky-900 truncate">HFpEF</span>
              </div>
              <div className="text-right font-mono shrink-0 pl-1">
                <span className="text-xs font-black text-slate-900">{kpi.hfpEFCount}</span>
                <span className="text-[10px] font-bold text-sky-700 ml-1">({kpi.hfpEFPercent}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: NYHA Functional Classification */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">NYHA Functional Class</h3>
            <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">Cohort: {kpi.totalHfRecords || kpi.totalPatients} Records</span>
          </div>

          <div className="h-48 flex items-center justify-center my-1">
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

          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100">
            <div className="bg-amber-50/60 border border-amber-100 px-3 py-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                <span className="text-xs font-bold text-amber-900 truncate">Class III</span>
              </div>
              <div className="text-right font-mono shrink-0 pl-1">
                <span className="text-xs font-black text-slate-900">{kpi.nyha3Count}</span>
                <span className="text-[10px] font-bold text-amber-700 ml-1">({kpi.nyha3Percent}%)</span>
              </div>
            </div>
            <div className="bg-rose-50/60 border border-rose-100 px-3 py-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                <span className="text-xs font-bold text-rose-900 truncate">Class IV</span>
              </div>
              <div className="text-right font-mono shrink-0 pl-1">
                <span className="text-xs font-black text-slate-900">{kpi.nyha4Count}</span>
                <span className="text-[10px] font-bold text-rose-700 ml-1">({kpi.nyha4Percent}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 4: Age Distribution Spectrum */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Age Distribution Spectrum</h3>
            <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">Cohort: {kpi.totalHfRecords || kpi.totalPatients} Records</span>
          </div>

          <div className="h-48 my-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ageDistribution || []} margin={{ top: 22, right: 15, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="ageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="bracket" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 'dataMax + 2']} />
                <Tooltip 
                  contentStyle={tooltipStyle.content}
                  labelStyle={tooltipStyle.label}
                  itemStyle={tooltipStyle.item}
                  cursor={tooltipStyle.cursor}
                  formatter={(val, name) => [`${val} HF Records`, 'Enrolled']} 
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#0d9488" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#ageGradient)" 
                  dot={{ r: 4, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }} 
                >
                  <LabelList 
                    dataKey="count" 
                    position="top" 
                    offset={8} 
                    style={{ fontSize: '10.5px', fontWeight: 'bold', fill: '#0f766e', fontFamily: 'ui-monospace, monospace' }} 
                  />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2.5 border-t border-slate-100">
            <div className="bg-teal-50/60 border border-teal-100 px-3 py-2 rounded-xl flex items-center justify-between text-xs">
              <span className="font-bold text-teal-900">Peak Density</span>
              <span className="font-mono font-bold text-teal-800">
                {peakAge?.bracket} <span className="text-[10px] font-medium text-slate-500">({peakAge?.count} Records, {peakAge?.percent}%)</span>
              </span>
            </div>
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
                <BarChart data={comorbidityData} margin={{ top: 22, right: 20, left: -15, bottom: 5 }} barSize={38}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis unit="%" domain={[0, 115]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
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

          {/* 3 Detail Cards underneath (Temporarily hidden) */}
          {SHOW_GRAPH_DETAIL_CARDS && (
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
          )}
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
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Cohort: {kpi.totalHfRecords || kpi.totalPatients} Records
              </span>
            </div>

            {/* Bar Chart */}
            <div className="h-64 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mortalityChartData} margin={{ top: 22, right: 15, left: -15, bottom: 5 }} barSize={38}>
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
                    domain={[0, 'dataMax + 15']}
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
                      props.payload.name
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Bar 
                    dataKey="percent" 
                    name="% HF Records" 
                    fill={UNIFIED_BAR_COLOR}
                    radius={[6, 6, 0, 0]}
                  >
                    {mortalityChartData.map((entry, index) => (
                      <Cell key={`cell-mortality-${index}`} fill={UNIFIED_BAR_COLOR} />
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

          {/* 4 Detail Cards underneath (Temporarily hidden) */}
          {SHOW_GRAPH_DETAIL_CARDS && (
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
          )}
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

          {/* 6 Detail Cards Underneath (Temporarily hidden) */}
          {SHOW_GRAPH_DETAIL_CARDS && (
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
          )}
        </div>

        {/* Right: Appropriate Care vs. Clinical Deviations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                Appropriate Care vs. Clinical Deviations
              </h3>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 self-start sm:self-auto">
                Cohort: {kpi.totalHfRecords || kpi.totalPatients} Records
              </span>
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

          {/* 6 Detail Cards Underneath (Temporarily hidden) */}
          {SHOW_GRAPH_DETAIL_CARDS && (
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
          )}
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

          {/* 6 Detail Cards Underneath (Temporarily hidden) */}
          {SHOW_GRAPH_DETAIL_CARDS && (
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
          )}
        </div>

        {/* Right: Drugs Given Irrespective of CI vs. Clinical Deviations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                Drugs Given Irrespective of CI vs. Clinical Deviations
              </h3>
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

          {/* 6 Detail Cards Underneath (Temporarily hidden) */}
          {SHOW_GRAPH_DETAIL_CARDS && (
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
          )}
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

          {/* Adherence Bracket Detail Cards Underneath (Temporarily hidden) */}
          {SHOW_GRAPH_DETAIL_CARDS && (
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
          )}
        </div>

        {/* Right: Number of GDMT Drugs Taken Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                Number of GDMT Drugs Taken Distribution
              </h3>
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
                      props.payload.drugs
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

          {/* Drugs Taken Distribution Detail Cards Underneath (Temporarily hidden) */}
          {SHOW_GRAPH_DETAIL_CARDS && (
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
          )}
        </div>
      </div>
    </div>
  );
}
