import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Heart,
  Activity,
  AlertTriangle,
  Clock,
  Zap,
  TrendingUp,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  CheckCircle,
  Pill,
  Flame,
  Award,
  ChevronRight,
  Download,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  Database,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LabelList
} from 'recharts';
import {
  filterAcsCohort,
  computeAcsAnalytics,
  generateAcsAuditExcel
} from '../../utils/acsEngine';
import { fetchStemiCohort } from '../../api/acsApi';
import ChartTooltip from './ChartTooltip';

const RADIAN = Math.PI / 180;

const renderDonutSliceLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  payload
}) => {
  if (percent === undefined || percent === null || percent <= 0.01) return null;

  const pctLabel = (payload && payload.percent !== undefined)
    ? `${payload.percent}%`
    : `${(percent * 100).toFixed(1)}%`;

  const sin = Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);

  // If slice is large enough (>= 15%), render white text centered inside slice
  if (percent >= 0.15) {
    const midRadius = innerRadius + (outerRadius - innerRadius) * 0.52;
    const x = cx + midRadius * cos;
    const y = cy + midRadius * sin;

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: '11px',
          fontWeight: '800',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          filter: 'drop-shadow(0 1px 2px rgba(15,23,42,0.85))',
          pointerEvents: 'none'
        }}
      >
        {pctLabel}
      </text>
    );
  } else {
    // Smaller slice (< 15%): leader line pointing to label outside
    const sx = cx + (outerRadius + 2) * cos;
    const sy = cy + (outerRadius + 2) * sin;
    const mx = cx + (outerRadius + 8) * cos;
    const my = cy + (outerRadius + 8) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 12;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g className="pointer-events-none">
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke="#0284c7"
          strokeWidth={1.5}
          fill="none"
        />
        <circle cx={ex} cy={ey} r={2} fill="#0284c7" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 3}
          y={ey}
          textAnchor={textAnchor}
          dominantBaseline="central"
          style={{
            fontSize: '10px',
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
};

export default function StemiDashboard() {
  const [dbCohort, setDbCohort] = useState([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Load from live database
  const loadData = useCallback(async () => {
    setIsLoadingDb(true);
    try {
      const res = await fetchStemiCohort('database');
      if (res && res.data) {
        setDbCohort(res.data);
      }
    } catch (err) {
      console.error('Failed to load STEMI DB cohort:', err);
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Active live cohort directly from database
  const activeCohort = dbCohort;

  // Compute analytics dynamically
  const analytics = useMemo(() => {
    return computeAcsAnalytics(activeCohort, 'STEMI');
  }, [activeCohort]);

  // Excel audit export
  const handleExportExcel = async () => {
    if (activeCohort.length === 0 || isExporting) return;
    try {
      setIsExporting(true);
      await generateAcsAuditExcel(activeCohort, {}, 'STEMI');
    } catch (err) {
      console.error('Failed to export STEMI Excel audit:', err);
      alert('Export failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const { kpi, ageDistribution, comorbidities, presentation, timiScoreDistribution, treatmentStrategy, thrombolysisAgents, vessels, proceduralSuccess, gdmtMeds, mace } = analytics;

  // Custom Donut Center Helpers & Summaries
  const typicalItem = presentation.find(p => p.name === 'Typical angina') || presentation[0] || { percent: 0 };
  const pamiItem = treatmentStrategy.find(s => s.name === 'PAMI') || treatmentStrategy[0] || { percent: 0 };
  const dominantAge = [...ageDistribution].sort((a, b) => b.count - a.count)[0] || { bracket: '55-64y', percent: 0 };
  const dominantLytic = [...thrombolysisAgents].sort((a, b) => b.count - a.count)[0] || { name: 'TNK', percent: 0 };
  const htnVal = comorbidities.find(c => c.name === 'Hypertension')?.percent ?? 0;
  const dmVal = comorbidities.find(c => c.name === 'Diabetes')?.percent ?? 0;
  const aspVal = gdmtMeds.find(m => m.drug === 'Aspirin')?.prescribedRate ?? 0;
  const statVal = gdmtMeds.find(m => m.drug === 'Statin')?.prescribedRate ?? 0;
  const ladVal = vessels.find(v => v.name === 'LAD')?.percent ?? 0;
  const rcaVal = vessels.find(v => v.name === 'RCA')?.percent ?? 0;
  const lcxVal = vessels.find(v => v.name === 'LCX')?.percent ?? 0;

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* =========================================================================
          ROW 0: HERO HEADER BANNER
         ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
            <Heart className="w-5 h-5 fill-rose-100" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                STEMI Clinical Intelligence Dashboard
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              ACC/AHA Guideline Surveillance • Door-to-Balloon &amp; Door-to-Needle Timeliness • Live Database Records
            </p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={loadData}
            disabled={isLoadingDb}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoadingDb ? 'animate-spin text-rose-500' : ''}`} />
            <span>{isLoadingDb ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={activeCohort.length === 0 || isExporting}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            title="Download multi-sheet clinical audit workbook"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
            <span>{isExporting ? 'Generating Audit...' : 'Export Audit Workbook'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          ROW 1: TOP-LEVEL KPI STAT CARDS (5 Cards in 5-Column Grid)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Total Records */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">TOTAL STEMI RECORDS</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{kpi.totalRecords}</span>
              <span className="text-xs font-bold text-slate-500">Records</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-semibold flex items-center justify-between">
            <span className="text-slate-600 font-bold">Live Database Cohort</span>
            <span className="text-slate-400">100% Audited</span>
          </div>
        </div>

        {/* Card 2: Mean Age & Gender */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">MEAN AGE &amp; GENDER</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{kpi.meanAge}</span>
              <span className="text-xs font-bold text-slate-500">Years</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] font-bold flex items-center justify-between">
            <span className="text-slate-600">&#9794; {kpi.malePercent}% ({kpi.males})</span>
            <span className="text-pink-600">&#9792; {kpi.femalePercent}% ({kpi.females})</span>
          </div>
        </div>

        {/* Card 3: Deaths */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">DEATHS</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-600">{kpi.mortalityRate}%</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-semibold flex items-center justify-between">
            <span>{kpi.totalDeaths} of {kpi.totalRecords} Records</span>
            <span className="text-slate-400 text-[10px]">In-Hospital</span>
          </div>
        </div>

        {/* Card 4: Mean Door-to-Balloon */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">MEAN DOOR-TO-BALLOON</span>
            <Clock className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{kpi.meanDoorToBalloon}</span>
              <span className="text-xs font-bold text-slate-500">mins</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] flex items-center justify-between">
            <span className="text-slate-500 text-[10px]">Target: &le; 90 mins</span>

          </div>
        </div>

        {/* Card 5: Mean Door-to-Needle */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">MEAN DOOR-TO-NEEDLE</span>
            <Zap className="w-4 h-4 text-cyan-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{kpi.meanDoorToNeedle}</span>
              <span className="text-xs font-bold text-slate-500">mins</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] flex items-center justify-between">
            <span className="text-slate-500 text-[10px]">Target: &le; 30 mins</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: DEMOGRAPHICS, COMORBIDITIES & PRESENTATION (3 Equal Columns)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Col 1: Age Distribution Spectrum */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xs font-bold text-slate-900">Age Distribution Spectrum</h2>
                <p className="text-[10px] text-slate-500">Stratification across all STEMI records</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                Mean: {Math.round(kpi.meanAge)}y
              </span>
            </div>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistribution} margin={{ top: 16, right: 8, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="bracket" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {ageDistribution.map((entry, index) => (
                      <Cell key={`age-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="percent" position="top" formatter={(val) => `${val}%`} style={{ fontSize: '9px', fill: '#475569', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-semibold text-slate-500">
            <span>Dominant Age: <strong className="text-slate-800">{dominantAge.bracket} ({dominantAge.percent}%)</strong></span>
            <span>Audited: 100%</span>
          </div>
        </div>

        {/* Col 2: Background Comorbidities Profile */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xs font-bold text-slate-900">Background Comorbidities</h2>
                <p className="text-[10px] text-slate-500">All 9 Clinical Information background fields</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                9 Risk Factors
              </span>
            </div>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={comorbidities} margin={{ top: 0, right: 35, left: 16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" interval={0} tick={{ fontSize: 9, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} width={92} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="percent" radius={[0, 3, 3, 0]}>
                    {comorbidities.map((entry, index) => (
                      <Cell key={`como-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="percent" position="right" formatter={(v) => `${v}%`} style={{ fontSize: '9px', fill: '#475569', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-semibold text-slate-500">
            <span>Primary Burden: <strong className="text-slate-800">HTN ({htnVal}%), DM ({dmVal}%)</strong></span>
            <span>Audited: 100%</span>
          </div>
        </div>

        {/* Col 3: Presentation Profile with Center Text */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-xs font-bold text-slate-900">Presentation Profile</h2>
                <p className="text-[10px] text-slate-500">All 4 Clinical Information symptom fields</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                Typical: {typicalItem.percent}%
              </span>
            </div>

            {/* Donut with Category Percentage Labels */}
            <div className="relative w-full h-[235px] flex items-center justify-center my-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={presentation}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={84}
                    paddingAngle={3}
                    dataKey="count"
                    label={renderDonutSliceLabel}
                    labelLine={false}
                  >
                    {presentation.map((entry, index) => (
                      <Cell key={`pres-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 leading-none">{typicalItem.percent}%</span>
                <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase mt-1">TYPICAL</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 text-[10px]">
            {presentation.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }}></span>
                <span className="text-slate-600 truncate">{item.name}</span>
                <span className="font-bold text-slate-900 ml-auto">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: TIMI RISK, STRATEGY & DISCHARGE MEDICATIONS (3 Equal Columns)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        

<div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xs font-bold text-slate-900">Thrombolytic Agents</h2>
                <p className="text-[10px] text-slate-500">All 4 drugs from thrombolysis form</p>
              </div>
            </div>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={thrombolysisAgents} margin={{ top: 16, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
                    {thrombolysisAgents.map((entry, index) => (
                      <Cell key={`tlt-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="percent" position="top" formatter={(val) => `${val}%`} style={{ fontSize: '9px', fill: '#475569', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-semibold text-slate-500">
            <span>Primary Agent: <strong className="text-slate-800">{dominantLytic.name} ({dominantLytic.percent}%)</strong></span>
            <span>Audit: 100% Validated</span>
          </div>
        </div>

        {/* Col 2: Treatment Strategy Allocation */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-xs font-bold text-slate-900">Primary Reperfusion Strategy</h2>
                <p className="text-[10px] text-slate-500">PAMI vs TLT vs Conservative</p>
              </div>
            </div>

            {/* Donut with Category Percentage Labels */}
            <div className="relative w-full h-[240px] flex items-center justify-center my-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={treatmentStrategy}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={84}
                    paddingAngle={3}
                    dataKey="count"
                    label={renderDonutSliceLabel}
                    labelLine={false}
                  >
                    {treatmentStrategy.map((entry, index) => (
                      <Cell key={`strat-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 leading-none">{pamiItem.percent}%</span>
                <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase mt-1">PAMI</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[10px]">
            {treatmentStrategy.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }}></span>
                  <span className="text-slate-700 font-semibold">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.percent}% ({item.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Col 3: Discharge Medications Adherence - FULL UTILIZATION, NO SCROLLING, ALL 12 HEADINGS */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-xs font-bold text-slate-900">Discharge Medications</h2>
                <p className="text-[10px] text-slate-500">All 12 medications from registry form</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                12 Pharmacotherapies
              </span>
            </div>

            <div className="h-[340px] w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={gdmtMeds} margin={{ top: 2, right: 35, left: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 8.5, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="drug" interval={0} tick={{ fontSize: 8.5, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} width={122} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="prescribedRate" radius={[0, 3, 3, 0]}>
                    {gdmtMeds.map((entry, index) => (
                      <Cell key={`med-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="prescribedRate" position="right" formatter={(v) => `${v}%`} style={{ fontSize: '8.5px', fill: '#475569', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-semibold text-slate-500">
            <span>Core Regimen: <strong className="text-slate-800">Aspirin ({aspVal}%), Statin ({statVal}%)</strong></span>
            <span>Secondary GDMT</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 4: THROMBOLYSIS, CULPRIT ANATOMY & PROCEDURAL FLOW (3 Equal Columns)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Col 1: Thrombolytic Agents */}
        {/* Col 1: Admission TIMI Risk Score Distribution (0-16 Points, 2 pts as 1 unit) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xs font-bold text-slate-900">TIMI Risk Score Distribution</h2>
                <p className="text-[10px] text-slate-500">Scores 0-16 (2 pts / unit)</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-bold border border-blue-200">0-3 Low</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-200">4-7 Int</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[9px] font-bold border border-rose-200">8-16 High</span>
              </div>
            </div>

            <div className="h-[290px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timiScoreDistribution} margin={{ top: 18, right: 8, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="score" tick={{ fontSize: 9.5, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {timiScoreDistribution.map((entry, index) => (
                      <Cell key={`timi-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="count" position="top" style={{ fontSize: '8.5px', fill: '#475569', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-semibold text-slate-500">
            <span>Mean Score: <strong className="text-slate-800">{kpi.avgTimiScore} / 16 pts</strong></span>
            <span>2 pts as 1 unit</span>
          </div>
        </div>
        {/* Col 2: Culprit Vessel Breakdown - ALL 8 VESSELS DISPLAYED */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xs font-bold text-slate-900">Culprit Vessel Breakdown</h2>
                <p className="text-[10px] text-slate-500">All 8 vessels from angiogram form</p>
              </div>
            </div>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={vessels} margin={{ top: 0, right: 35, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" interval={0} tick={{ fontSize: 9, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} width={78} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="percent" radius={[0, 3, 3, 0]}>
                    {vessels.map((entry, index) => (
                      <Cell key={`ves-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="percent" position="right" formatter={(v) => `${v}%`} style={{ fontSize: '8.5px', fill: '#475569', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[9.5px] font-semibold text-slate-500">
            <span>Anterior (LAD): <strong className="text-slate-800">{ladVal}%</strong></span>
            <span>Inferior (RCA): <strong className="text-slate-800">{rcaVal}%</strong></span>
            <span>Lateral (LCX): <strong className="text-slate-800">{lcxVal}%</strong></span>
          </div>
        </div>

        {/* Col 3: Procedural Success Rate */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-xs font-bold text-slate-900">Procedural Success Rate</h2>
                <p className="text-[10px] text-slate-500">Post-procedure coronary TIMI flow</p>
              </div>
            </div>

            {/* Circular Gauge Ring with Category Percentage Labels */}
            <div className="relative w-full h-[220px] flex items-center justify-center my-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={proceduralSuccess}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={84}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="count"
                    label={renderDonutSliceLabel}
                    labelLine={false}
                  >
                    {proceduralSuccess.map((entry, index) => (
                      <Cell key={`proc-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-blue-700 leading-none">{kpi.proceduralSuccessRate}%</span>
                <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase mt-1">TIMI 3 FLOW</span>
              </div>
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-100 text-[10px]">
            {proceduralSuccess.map((flow, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: flow.fill }}></span>
                  <span className="text-slate-700 font-semibold">{flow.name}</span>
                </div>
                <span className="font-bold text-slate-900">{flow.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 5: LONGITUDINAL IN-HOSPITAL MACE SURVEILLANCE (Matching Image 3)
         ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h2 className="text-xs font-bold text-slate-900">In-Hospital MACE &amp; Adverse Safety Endpoints</h2>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Audited in-hospital adverse event ledger</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {mace.map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-2xs transition">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800 truncate" title={item.metric}>
                  {item.metric}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${item.badgeColor}`}>
                  {item.percent}%
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900">{item.count}</span>
                <span className="text-[11px] text-slate-500 font-semibold">Patients</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 truncate font-medium">
                {item.details}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
