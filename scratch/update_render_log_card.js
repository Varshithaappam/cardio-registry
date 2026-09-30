const fs = require('fs');
const path = require('path');

const frontendPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'NurseFollowUpReport.jsx');
let frontendCode = fs.readFileSync(frontendPath, 'utf8').replace(/\r\n/g, '\n');

const startIndex = frontendCode.indexOf('const renderLogCard = (log, index, isCurrent) => {');
const endIndex = frontendCode.indexOf('return (', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newHeader = `const renderLogCard = (log, index, isCurrent) => {
                                        const episodeTag = log.episode_id || (log.registry_id ? \`\${log.registry_type || 'HF'}-\${String(log.registry_id).padStart(2, '0')}\` : 'Episode');
                                        const statusText = log.episode_status || 'Completed';
                                        const isStandardOutreach = log.log_type === 'standard_outreach' || log.log_type === 'Manual Outreach Log' || log.outcome === 'Patient Contacted & Appointment Confirmed';
                                        const isHfDetailed = !isStandardOutreach && (log.log_type === 'detailed_hf_log' || Boolean(log.notes && log.notes.includes('[HF Detailed Follow-up]')) || (Boolean(log.outcome && log.outcome.includes('Detailed HF Form')) && !log.notes?.includes('[STEMI Detailed') && !log.notes?.includes('[NSTEMI Detailed')));
                                        const isStemiDetailed = !isStandardOutreach && (log.log_type === 'detailed_stemi_log' || Boolean(log.notes && log.notes.includes('[STEMI Detailed Follow-up]')) || (Boolean(log.outcome && log.outcome.includes('Detailed STEMI Form')) && !log.notes?.includes('[HF Detailed') && !log.notes?.includes('[NSTEMI Detailed')));
                                        const isNstemiDetailed = !isStandardOutreach && (log.log_type === 'detailed_nstemi_log' || Boolean(log.notes && log.notes.includes('[NSTEMI Detailed Follow-up]')) || (Boolean(log.outcome && log.outcome.includes('Detailed NSTEMI Form')) && !log.notes?.includes('[HF Detailed') && !log.notes?.includes('[STEMI Detailed')));
                                        const isDetailedForm = (isHfDetailed || isStemiDetailed || isNstemiDetailed) && !isStandardOutreach;\n\n                                        `;
  
  frontendCode = frontendCode.substring(0, startIndex) + newHeader + frontendCode.substring(endIndex);
  fs.writeFileSync(frontendPath, frontendCode, 'utf8');
  console.log('✅ Successfully updated renderLogCard header in NurseFollowUpReport.jsx');
} else {
  console.log('❌ Could not find startIndex or endIndex');
}
