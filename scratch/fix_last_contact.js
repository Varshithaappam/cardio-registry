const fs = require('fs');
const path = require('path');

const frontendPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'NurseFollowUpReport.jsx');
let frontendCode = fs.readFileSync(frontendPath, 'utf8').replace(/\r\n/g, '\n');

const oldLine = `<span>Last Contact: {task.last_contact_date ? formatDateTime(task.last_contact_date) : 'None Recorded'}</span>`;

const newLine = `<span>Last Contact: <strong className="text-slate-800">{
                                           (() => {
                                             const logs = patientLogs[uniqueKey] || [];
                                             const latestLog = logs[0];
                                             if (latestLog && (latestLog.created_at || latestLog.contact_date)) {
                                               return formatDateTime(latestLog.created_at || latestLog.contact_date);
                                             }
                                             return task.last_contact_date ? formatDate(task.last_contact_date) : 'None Recorded';
                                           })()
                                         }</strong></span>`;

if (frontendCode.includes(oldLine)) {
  frontendCode = frontendCode.replace(oldLine, newLine);
  fs.writeFileSync(frontendPath, frontendCode, 'utf8');
  console.log('✅ Successfully updated Last Contact timestamp logic in NurseFollowUpReport.jsx');
} else {
  console.log('❌ Could not match oldLine');
}
