const fs = require('fs');
const path = require('path');

const frontendPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'NurseFollowUpReport.jsx');
let frontendCode = fs.readFileSync(frontendPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update handleOpenModal to normalize initialStatus
const oldHandleOpenModal = `    setFormData({
      contact_mode: 'Phone Call',
      outcome: 'Patient Contacted & Appointment Confirmed',
      status: task.status || 'Pending Nurse Outreach',`;

const newHandleOpenModal = `    let initialStatus = task.status || 'Pending Nurse Outreach';
    if (initialStatus === 'Required' || initialStatus === 'YES - Post-Discharge Visit Scheduled') {
      initialStatus = 'Pending Nurse Outreach';
    }
    setFormData({
      contact_mode: 'Phone Call',
      outcome: 'Patient Contacted & Appointment Confirmed',
      status: initialStatus,`;

if (frontendCode.includes(oldHandleOpenModal)) {
  frontendCode = frontendCode.replace(oldHandleOpenModal, newHandleOpenModal);
  console.log('✅ Updated handleOpenModal status initialization in NurseFollowUpReport.jsx');
} else {
  console.log('⚠️ Could not find oldHandleOpenModal');
}

// 2. Update filteredTasks statusFilter logic to include Pending Nurse Outreach & Required matching
const oldFilterStatus = `      // 2. Overall Registry Status Filter
      let matchesStatus = true;
      if (statusFilter !== 'All') {
        if (statusFilter === 'Required') {
          matchesStatus = task.status === 'Required' || task.status === 'Follow-Up Scheduled';
        } else {
          matchesStatus = task.status === statusFilter;
        }
      }`;

const newFilterStatus = `      // 2. Overall Registry Status Filter
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

if (frontendCode.includes(oldFilterStatus)) {
  frontendCode = frontendCode.replace(oldFilterStatus, newFilterStatus);
  console.log('✅ Updated filteredTasks status matching logic in NurseFollowUpReport.jsx');
} else {
  console.log('⚠️ Could not find oldFilterStatus');
}

// 3. Add <option value="Required">Required</option> to outreach log modal select dropdown
const oldSelectOption = `<option value="Pending Nurse Outreach">Pending Nurse Outreach</option>
                    <option value="Scheduled">Scheduled</option>`;

const newSelectOption = `<option value="Pending Nurse Outreach">Pending Nurse Outreach</option>
                    <option value="Required">Required / Action Needed</option>
                    <option value="Scheduled">Scheduled</option>`;

if (frontendCode.includes(oldSelectOption)) {
  frontendCode = frontendCode.replace(oldSelectOption, newSelectOption);
  console.log('✅ Updated modal select options in NurseFollowUpReport.jsx');
} else {
  console.log('⚠️ Could not find oldSelectOption');
}

fs.writeFileSync(frontendPath, frontendCode, 'utf8');
console.log('Done applying pending filter fix!');
