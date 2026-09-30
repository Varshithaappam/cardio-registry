const fs = require('fs');
const path = require('path');

const frontendPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'NurseFollowUpReport.jsx');
let frontendCode = fs.readFileSync(frontendPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update filteredTasks statusFilter logic to strictly match specific statuses
const oldFilterStatus = `      // 2. Overall Registry Status Filter
      let matchesStatus = true;
      if (statusFilter !== 'All') {
        if (statusFilter === 'Required') {
          matchesStatus = task.status === 'Required' || task.status === 'Scheduled' || task.status === 'Follow-Up Scheduled';
        } else if (statusFilter === 'Pending Nurse Outreach' || statusFilter === 'Pending') {
          matchesStatus = task.status === 'Pending Nurse Outreach' || task.status === 'Pending' || task.status === 'Pending Outreach' || task.status === 'Required';
        } else {
          matchesStatus = task.status === statusFilter;
        }
      }`;

const newFilterStatus = `      // 2. Overall Registry Status Filter
      let matchesStatus = true;
      if (statusFilter !== 'All') {
        if (statusFilter === 'Required') {
          matchesStatus = task.status === 'Required' || task.status === 'Follow-Up Scheduled';
        } else if (statusFilter === 'Pending Nurse Outreach' || statusFilter === 'Pending') {
          matchesStatus = task.status === 'Pending Nurse Outreach' || task.status === 'Pending' || task.status === 'Pending Outreach';
        } else if (statusFilter === 'Scheduled') {
          matchesStatus = task.status === 'Scheduled';
        } else if (statusFilter === 'Completed') {
          matchesStatus = task.status === 'Completed';
        } else if (statusFilter === 'Missed / Overdue') {
          matchesStatus = task.status === 'Missed / Overdue' || task.status === 'Overdue / Urgent Action';
        } else if (statusFilter === 'Patient Unreachable') {
          matchesStatus = task.status === 'Patient Unreachable';
        } else if (statusFilter === 'Escalated to Cardiologist') {
          matchesStatus = task.status === 'Escalated to Cardiologist';
        } else if (statusFilter === 'No Follow-Up Needed') {
          matchesStatus = task.status === 'No Follow-Up Needed';
        } else {
          matchesStatus = task.status === statusFilter;
        }
      }`;

if (frontendCode.includes(oldFilterStatus)) {
  frontendCode = frontendCode.replace(oldFilterStatus, newFilterStatus);
  console.log('✅ Updated filteredTasks strict status matching logic');
} else {
  console.log('⚠️ Could not find oldFilterStatus');
}

// 2. Update KPI calculations to match strict status definitions
const oldKpiCalc = `    const required = tasks.filter((t) => t.status === 'Required' || t.status === 'Scheduled' || t.status === 'Follow-Up Scheduled').length;
    const pending = tasks.filter((t) => t.status === 'Pending Nurse Outreach' || t.status === 'Pending').length;`;

const newKpiCalc = `    const required = tasks.filter((t) => t.status === 'Required' || t.status === 'Follow-Up Scheduled').length;
    const pending = tasks.filter((t) => t.status === 'Pending Nurse Outreach' || t.status === 'Pending' || t.status === 'Pending Outreach').length;`;

if (frontendCode.includes(oldKpiCalc)) {
  frontendCode = frontendCode.replace(oldKpiCalc, newKpiCalc);
  console.log('✅ Updated KPI calculations');
} else {
  console.log('⚠️ Could not find oldKpiCalc');
}

// 3. Make KPI cards clickable to toggle status filters
const oldKpiCardTotal = `<div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">`;
const newKpiCardTotal = `<div onClick={() => setStatusFilter('All')} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2 cursor-pointer hover:border-slate-300 transition-all">`;

const oldKpiCardRequired = `<div className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-blue-600 shadow-2xs space-y-2">`;
const newKpiCardRequired = `<div onClick={() => setStatusFilter('Required')} className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-blue-600 shadow-2xs space-y-2 cursor-pointer hover:border-blue-300 transition-all">`;

const oldKpiCardPending = `<div className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-amber-500 shadow-2xs space-y-2">`;
const newKpiCardPending = `<div onClick={() => setStatusFilter('Pending Nurse Outreach')} className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-amber-500 shadow-2xs space-y-2 cursor-pointer hover:border-amber-300 transition-all">`;

const oldKpiCardOverdue = `<div className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-red-500 shadow-2xs space-y-2">`;
const newKpiCardOverdue = `<div onClick={() => setStatusFilter('Missed / Overdue')} className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-red-500 shadow-2xs space-y-2 cursor-pointer hover:border-red-300 transition-all">`;

const oldKpiCardCompleted = `<div className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-teal-600 shadow-2xs space-y-2">`;
const newKpiCardCompleted = `<div onClick={() => setStatusFilter('Completed')} className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-teal-600 shadow-2xs space-y-2 cursor-pointer hover:border-teal-300 transition-all">`;

frontendCode = frontendCode.replace(oldKpiCardTotal, newKpiCardTotal);
frontendCode = frontendCode.replace(oldKpiCardRequired, newKpiCardRequired);
frontendCode = frontendCode.replace(oldKpiCardPending, newKpiCardPending);
frontendCode = frontendCode.replace(oldKpiCardOverdue, newKpiCardOverdue);
frontendCode = frontendCode.replace(oldKpiCardCompleted, newKpiCardCompleted);

fs.writeFileSync(frontendPath, frontendCode, 'utf8');
console.log('✅ Applied strict filter matching and clickable KPI cards in NurseFollowUpReport.jsx');
