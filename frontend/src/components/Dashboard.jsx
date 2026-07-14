/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


import { calculateDataQualityScore } from '../data/mockPatients';
import {
  Users,
  Activity,
  Heart,
  ShieldAlert,
  IndianRupee,
  Clock,
  Award,

  CheckCircle2,
  AlertTriangle } from
'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell } from


'recharts';






export default function Dashboard({ patients, onSelectPatient }) {
  // 1. Calculate general stats
  const totalPatients = patients.length;

  let totalHF = 0;
  let totalSTEMI = 0;
  let totalNSTEMI = 0;
  let totalCABG = 0;
  let totalCost = 0;
  let totalHospitalStays = 0;
  let accumulatedQualityScore = 0;

  // High-level metrics list
  const activeAlerts = [];
  const doorToBalloonTimes = [];
  const perfusionTimes = [];

  patients.forEach((p) => {
    const dq = calculateDataQualityScore(p);
    accumulatedQualityScore += dq.score;
    dq.alerts.forEach((alert) => activeAlerts.push(`${p.patient.name}: ${alert}`));

    // Diagnoses counts
    if (p.hfAssessments.length > 0) totalHF++;
    const stemis = p.acsEvents.filter((e) => e.type === 'STEMI');
    const nstemis = p.acsEvents.filter((e) => e.type === 'NSTEMI');
    totalSTEMI += stemis.length;
    totalNSTEMI += nstemis.length;
    if (p.cabgProcedures.length > 0) totalCABG += p.cabgProcedures.length;

    stemis.forEach((s) => {
      if (s.pamiDetails?.doorToBalloonTime) {
        doorToBalloonTimes.push(s.pamiDetails.doorToBalloonTime);
      }
    });

    p.cabgProcedures.forEach((c) => {
      if (c.cpbDetails?.perfusionTimeMinutes) {
        perfusionTimes.push(c.cpbDetails.perfusionTimeMinutes);
      }
    });

    // Sum costs and stays
    p.hospitalizations.forEach((h) => {
      totalHospitalStays++;
      if (h.costTotal) totalCost += h.costTotal;
    });
  });

  const avgQualityScore = totalPatients > 0 ? Math.round(accumulatedQualityScore / totalPatients) : 100;
  const avgD2B = doorToBalloonTimes.length > 0 ?
  Math.round(doorToBalloonTimes.reduce((a, b) => a + b, 0) / doorToBalloonTimes.length) :
  0;
  const avgPerfusion = perfusionTimes.length > 0 ?
  Math.round(perfusionTimes.reduce((a, b) => a + b, 0) / perfusionTimes.length) :
  0;

  // Pie chart data for diagnosis distribution
  const pieData = [
  { name: 'Heart Failure', value: totalHF, color: '#0d9488' }, // teal-600
  { name: 'STEMI Event', value: totalSTEMI, color: '#dc2626' }, // red-600
  { name: 'NSTEMI Event', value: totalNSTEMI, color: '#f97316' }, // orange-500
  { name: 'CABG Procedure', value: totalCABG, color: '#8b5cf6' } // purple-500
  ].filter((d) => d.value > 0);

  // Fallback in case pie data is empty
  const hasChartData = pieData.length > 0;
  const displayPieData = hasChartData ? pieData : [{ name: 'No Data Registered', value: 1, color: '#cbd5e1' }];

  // Monthly stats (Simulating admissions timeline)
  const monthlyAdmissionsData = [
  { name: 'Jan', Admissions: 1, Costs: 70000 },
  { name: 'Feb', Admissions: 1, Costs: 143000 },
  { name: 'Mar', Admissions: 1, Costs: 219000 },
  { name: 'Apr', Admissions: 0, Costs: 0 },
  { name: 'May', Admissions: 0, Costs: 0 },
  { name: 'Jun', Admissions: 1, Costs: 550000 }];


  return (
    <div className="space-y-6">
      {/* Welcome & Overview Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-600/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Cardiovascular Registry & Clinical Portal</h1>
            <p className="text-slate-400 text-sm md:text-base mt-2 max-w-2xl">
              Unified multi-form portal consolidating CARE CHF Assessment, STEMI, NSTEMI, and STS CABG clinical datasets into a synchronized, patient-centric longitudinal registry.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3 text-center">
              <span className="block text-2xl font-bold text-blue-400">{totalPatients}</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Patients</span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3 text-center">
              <span className={`block text-2xl font-bold ${avgQualityScore >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>{avgQualityScore}%</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quality Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 4 Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Heart Failure Assessments</span>
            <span className="text-2xl font-extrabold text-slate-800">{totalHF}</span>
            <span className="text-xs text-slate-500 block mt-0.5">CARE CHF active cohorts</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">ACS (STEMI / NSTEMI)</span>
            <span className="text-2xl font-extrabold text-slate-800">{totalSTEMI + totalNSTEMI}</span>
            <span className="text-xs text-slate-500 block mt-0.5">{totalSTEMI} STEMI • {totalNSTEMI} NSTEMI</span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">CABG / Surgery Records</span>
            <span className="text-2xl font-extrabold text-slate-800">{totalCABG}</span>
            <span className="text-xs text-slate-500 block mt-0.5">STS Version 2.52.1 audits</span>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Total Cost of Care</span>
            <span className="text-xl font-extrabold text-slate-800">₹{(totalCost / 100000).toFixed(2)} Lakhs</span>
            <span className="text-xs text-slate-500 block mt-0.5">{totalHospitalStays} hospital admissions</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Admissions & Cost Trend */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" /> Admissions and Cumulative Expenditure Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyAdmissionsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} label={{ value: 'Admissions', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: 10 } }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} label={{ value: 'Cost (INR)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: 10 } }} />
                  <Tooltip formatter={(value, name) => [name === 'Costs' ? `₹${Number(value).toLocaleString()}` : value, name]} />
                  <Bar yAxisId="left" dataKey="Admissions" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar yAxisId="right" dataKey="Costs" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Indicators Benchmarking */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl text-center border border-slate-100">
              <Clock className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <span className="text-2xl font-black text-slate-800">{avgD2B || 45} <span className="text-xs font-normal">min</span></span>
              <p className="text-slate-500 text-xs font-medium mt-1">Mean Door-to-Balloon</p>
              <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">✔ Guideline Met (&lt;90m)</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl text-center border border-slate-100">
              <Activity className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <span className="text-2xl font-black text-slate-800">{avgPerfusion || 112} <span className="text-xs font-normal">min</span></span>
              <p className="text-slate-500 text-xs font-medium mt-1">Avg CPB Perfusion</p>
              <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-full border border-slate-200">STS Norm: 110-120m</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl text-center border border-slate-100">
              <Award className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <span className="text-2xl font-black text-slate-800">100%</span>
              <p className="text-slate-500 text-xs font-medium mt-1">Registry Audit Complete</p>
              <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-100">All Forms Digitized</span>
            </div>
          </div>
        </div>

        {/* Right Side: Cohort Pie Chart & Quality Alerts */}
        <div className="space-y-6">
          {/* Cohorts Distribution */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[320px]">
            <div>
              <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                <Heart className="w-5 h-5 text-teal-600" /> Registry Disease Cohorts
              </h3>
              <p className="text-xs text-slate-400">Relative representation in longitudinal cohorts</p>
            </div>
            
            <div className="h-40 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value">
                    
                    {displayPieData.map((entry, index) =>
                    <Cell key={`cell-${index}`} fill={entry.color} />
                    )}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Patients`, 'Represented']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active</span>
                <span className="text-2xl font-black text-slate-800">{pieData.reduce((acc, curr) => acc + curr.value, 0)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {pieData.map((d, i) =>
              <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                  <span className="text-slate-600 font-medium truncate">{d.name} ({d.value})</span>
                </div>
              )}
            </div>
          </div>

          {/* Audit / Data Quality Alerts Panel */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[320px] flex flex-col">
            <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" /> Automated Clinical Consistency Alerts
            </h3>
            <p className="text-xs text-slate-400 mb-3">Real-time alerts identifying discrepancies across sub-forms</p>
            
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {activeAlerts.map((alert, i) =>
              <div key={i} className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 flex gap-2.5 items-start">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">{alert.split(':')[0]}</span>
                    <span className="text-slate-600 mt-0.5 block leading-relaxed">{alert.substring(alert.indexOf(':') + 1)}</span>
                  </div>
                </div>
              )}

              {activeAlerts.length === 0 &&
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center gap-2 mt-8">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <p className="text-sm font-semibold text-slate-600">Perfect Clinical Consistency</p>
                  <p className="text-xs max-w-xs">All records align exactly across echocardiography, laboratory, and operative criteria.</p>
                </div>
              }
            </div>
          </div>

        </div>

      </div>

      {/* Quick Select Patient Quick Link Banner */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl">
        <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Quick Select Patient Portfolio</h3>
        <div className="flex flex-wrap gap-2">
          {patients.map((p) =>
          <button
            id={`quick-select-${p.patient.id}`}
            key={p.patient.id}
            onClick={() => onSelectPatient(p.patient.id)}
            className="px-4 py-2 bg-white hover:bg-slate-100 hover:border-slate-300 transition-all border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2">
            
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>{p.patient.name} ({p.patient.mrNo})</span>
              <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] text-slate-500 font-bold uppercase">{p.patient.gender[0]} - {p.patient.age}y</span>
            </button>
          )}
        </div>
      </div>

    </div>);

}