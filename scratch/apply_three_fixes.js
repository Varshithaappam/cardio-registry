const fs = require('fs');
const path = require('path');

// 1. Update backend/routes/nurseFollowUpReportRoutes.js to use OUTER APPLY TOP 1 for nf and nr to eliminate SQL join duplication
const backendPath = path.join(__dirname, '..', 'backend', 'routes', 'nurseFollowUpReportRoutes.js');
let backendCode = fs.readFileSync(backendPath, 'utf8').replace(/\r\n/g, '\n');

// Replace LEFT JOIN nstemi_followup & nstemi_registry with OUTER APPLY
const oldNstemiJoins = `        LEFT JOIN nstemi_followup nf ON (nol.nstemi_followup_id = nf.followup_id OR (t.source_record_id = nf.nstemi_id AND t.timeframe = nf.followup_month))
        LEFT JOIN nstemi_registry nr ON (nf.nstemi_id = nr.nstemi_id OR t.source_record_id = nr.nstemi_id)`;

const newNstemiJoins = `        OUTER APPLY (
          SELECT TOP 1 nf.followup_id, nf.nstemi_id, nf.followup_month
          FROM nstemi_followup nf
          WHERE (nol.nstemi_followup_id IS NOT NULL AND nf.followup_id = nol.nstemi_followup_id)
             OR (t.source_record_id IS NOT NULL AND nf.nstemi_id = t.source_record_id AND (t.timeframe IS NULL OR nf.followup_month = t.timeframe))
          ORDER BY CASE WHEN nol.nstemi_followup_id = nf.followup_id THEN 0 ELSE 1 END ASC, nf.followup_id DESC
        ) nf
        OUTER APPLY (
          SELECT TOP 1 nr.nstemi_id, nr.acs_no, nr.ip_no
          FROM nstemi_registry nr
          WHERE (nf.nstemi_id IS NOT NULL AND nr.nstemi_id = nf.nstemi_id)
             OR (t.source_record_id IS NOT NULL AND nr.nstemi_id = t.source_record_id)
             OR (nr.reg_patient_id = nol.reg_patient_id)
          ORDER BY CASE WHEN t.source_record_id = nr.nstemi_id THEN 0 ELSE 1 END ASC, nr.nstemi_id DESC
        ) nr`;

backendCode = backendCode.split(oldNstemiJoins).join(newNstemiJoins);
fs.writeFileSync(backendPath, backendCode, 'utf8');
console.log('✅ Updated backend SQL query to eliminate NSTEMI log duplication!');

// 2. Update NurseFollowUpReport.jsx to add frontend log deduplication by unique key
const frontendPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'NurseFollowUpReport.jsx');
let frontendCode = fs.readFileSync(frontendPath, 'utf8').replace(/\r\n/g, '\n');

const oldFetchLogs = `      const response = await api.get(\`/nurse-dashboard/\${regPatientId}/logs?registry=\${registryType}&registry_type=\${registryType}\`);
      if (response.data && response.data.success) {
        setPatientLogs((prev) => ({ ...prev, [key]: response.data.data || [] }));
      } else {
        setPatientLogs((prev) => ({ ...prev, [key]: [] }));
      }`;

const newFetchLogs = `      const response = await api.get(\`/nurse-dashboard/\${regPatientId}/logs?registry=\${registryType}&registry_type=\${registryType}\`);
      if (response.data && response.data.success) {
        const rawLogs = response.data.data || [];
        const uniqueLogs = [];
        const seenKeys = new Set();
        for (const log of rawLogs) {
          const uKey = log.log_id ? \`log-\${log.log_id}\` : \`\${log.log_type}-\${log.created_at}-\${log.outcome}\`;
          if (!seenKeys.has(uKey)) {
            seenKeys.add(uKey);
            uniqueLogs.push(log);
          }
        }
        setPatientLogs((prev) => ({ ...prev, [key]: uniqueLogs }));
      } else {
        setPatientLogs((prev) => ({ ...prev, [key]: [] }));
      }`;

if (frontendCode.includes(oldFetchLogs)) {
  frontendCode = frontendCode.replace(oldFetchLogs, newFetchLogs);
  console.log('✅ Added timeline log deduplication in NurseFollowUpReport.jsx');
}

fs.writeFileSync(frontendPath, frontendCode, 'utf8');

// 3. Update dateUtils.js to force Asia/Kolkata (IST) timezone
const dateUtilsPath = path.join(__dirname, '..', 'frontend', 'src', 'utils', 'dateUtils.js');
const dateUtilsCode = `/**
 * Date Utilities for CARE Registry
 * Standardized for Indian Standard Time (IST - Asia/Kolkata):
 * - Date format: DD-MM-YYYY (e.g. 27-08-2026)
 * - Date & Time format: DD-MM-YYYY, HH:mm (e.g. 27-08-2026, 15:09)
 * - Time format: HH:mm (e.g. 15:09)
 */

export const formatDateForDisplay = (dateVal) => {
  if (!dateVal) return '';
  let str = String(dateVal).trim();
  if (!str || str === 'null' || str === 'undefined') return '';

  if (/^\\d{2}-\\d{2}-\\d{4}$/.test(str)) return str;
  if (/^\\d{2}\\/\\d{2}\\/\\d{4}$/.test(str)) return str.replace(/\\//g, '-');

  const dateObj = new Date(str.includes('Z') || str.includes('+') ? str : str.replace(' ', 'T'));
  if (isNaN(dateObj.getTime())) return str;

  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(dateObj);
    let day = '', month = '', year = '';
    for (const part of parts) {
      if (part.type === 'day') day = part.value;
      if (part.type === 'month') month = part.value;
      if (part.type === 'year') year = part.value;
    }
    return \`\${day}-\${month}-\${year}\`;
  } catch (e) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return \`\${day}-\${month}-\${year}\`;
  }
};

export const formatDateTimeForDisplay = (dateVal) => {
  if (!dateVal) return 'N/A';
  const str = String(dateVal).trim();
  if (!str || str === 'null' || str === 'undefined') return 'N/A';

  const dateObj = new Date(str.includes('Z') || str.includes('+') ? str : str.replace(' ', 'T'));
  if (isNaN(dateObj.getTime())) {
    return formatDateForDisplay(str);
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(dateObj);
    let day = '', month = '', year = '', hour = '', minute = '';
    for (const part of parts) {
      if (part.type === 'day') day = part.value;
      if (part.type === 'month') month = part.value;
      if (part.type === 'year') year = part.value;
      if (part.type === 'hour') hour = part.value;
      if (part.type === 'minute') minute = part.value;
    }
    return \`\${day}-\${month}-\${year}, \${hour}:\${minute}\`;
  } catch (e) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return \`\${day}-\${month}-\${year}, \${hours}:\${minutes}\`;
  }
};

export const formatTimeForDisplay = (dateVal) => {
  if (!dateVal) return '';
  const str = String(dateVal).trim();
  const dateObj = new Date(str.includes('Z') || str.includes('+') ? str : str.replace(' ', 'T'));
  if (isNaN(dateObj.getTime())) return '';

  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(dateObj);
    let hour = '', minute = '';
    for (const part of parts) {
      if (part.type === 'hour') hour = part.value;
      if (part.type === 'minute') minute = part.value;
    }
    return \`\${hour}:\${minute}\`;
  } catch (e) {
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return \`\${hours}:\${minutes}\`;
  }
};

export const formatDateForDatabase = (dmYDate) => {
  if (!dmYDate) return null;
  const str = String(dmYDate).trim();
  if (!str) return null;

  if (/^\\d{4}-\\d{2}-\\d{2}/.test(str)) {
    return str.split('T')[0].split(' ')[0];
  }
  
  const sep = str.includes('-') ? '-' : '/';
  const parts = str.split(sep);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (day && month && year && year.length === 4) {
      return \`\${year}-\${month.padStart(2, '0')}-\${day.padStart(2, '0')}\`;
    }
  }
  return str;
};

export const formatDate = formatDateForDisplay;
export const formatDateTime = formatDateTimeForDisplay;
export const formatTime = formatTimeForDisplay;
`;

fs.writeFileSync(dateUtilsPath, dateUtilsCode, 'utf8');
console.log('✅ Updated dateUtils.js to use Asia/Kolkata (IST) timezone site-wide!');

// 4. Update AcsFollowupPdfModal.jsx to remove Download button and keep only Print button
const acsModalPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'modals', 'AcsFollowupPdfModal.jsx');
let acsModalCode = fs.readFileSync(acsModalPath, 'utf8').replace(/\r\n/g, '\n');

// Replace buttons header block
const oldButtonsBlock = `<div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-white/20"
              title="Download PDF Document"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-white/20"
              title="Print Record"
            >
              <Printer className="w-4 h-4" />
              <span>Print PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>`;

const newButtonsBlock = `<div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-white/20"
              title="Print Record"
            >
              <Printer className="w-4 h-4" />
              <span>Print PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>`;

if (acsModalCode.includes(oldButtonsBlock)) {
  acsModalCode = acsModalCode.replace(oldButtonsBlock, newButtonsBlock);
  console.log('✅ Removed Download PDF button from AcsFollowupPdfModal.jsx (Print PDF retained)');
} else {
  console.log('⚠️ Could not find oldButtonsBlock in AcsFollowupPdfModal.jsx');
}

fs.writeFileSync(acsModalPath, acsModalCode, 'utf8');
console.log('All 3 fixes applied successfully!');
