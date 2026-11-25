const fs = require('fs');

const filePath = 'frontend/src/components/dashboard/AdminExecutiveDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix unique counts definitions
const oldCounts = `  // Unique Patient Counts across registries (Direct from backend DB or dynamically calculated)
  const hfUniqueCount = useMemo(() => {
    if (!isFilterActive && backendMetrics?.kpis?.hfUniquePatients) return backendMetrics.kpis.hfUniquePatients;
    const set = new Set();
    filteredHfCohort.forEach(p => {
      const id = p.regPatientId || p.reg_patient_id || p.patient_id || p.uhid || p.patientId || p.mr_no || p.id || p.hf_id;
      if (id) set.add(id);
    });
    return set.size || filteredHfCohort.length;
  }, [filteredHfCohort, isFilterActive, backendMetrics]);

  const stemiUniqueCount = useMemo(() => {
    if (!isFilterActive && backendMetrics?.kpis?.stemiUniquePatients) return backendMetrics.kpis.stemiUniquePatients;
    const set = new Set();
    filteredStemiCohort.forEach(p => {
      const id = p.regPatientId || p.reg_patient_id || p.patient_id || p.uhid || p.patientId || p.mr_no || p.id || p.stemi_id;
      if (id) set.add(id);
    });
    return set.size || filteredStemiCohort.length;
  }, [filteredStemiCohort, isFilterActive, backendMetrics]);

  const nstemiUniqueCount = useMemo(() => {
    if (!isFilterActive && backendMetrics?.kpis?.nstemiUniquePatients) return backendMetrics.kpis.nstemiUniquePatients;
    const set = new Set();
    filteredNstemiCohort.forEach(p => {
      const id = p.regPatientId || p.reg_patient_id || p.patient_id || p.uhid || p.patientId || p.mr_no || p.id || p.nstemi_id;
      if (id) set.add(id);
    });
    return set.size || filteredNstemiCohort.length;
  }, [filteredNstemiCohort, isFilterActive, backendMetrics]);

  const overallUniquePatients = useMemo(() => {
    if (!isFilterActive && backendMetrics?.kpis?.overallUniquePatients) {
      return backendMetrics.kpis.overallUniquePatients;
    }
    const set = new Set();
    [...filteredHfCohort, ...filteredStemiCohort, ...filteredNstemiCohort].forEach(p => {
      const id = p.regPatientId || p.reg_patient_id || p.patient_id || p.uhid || p.patientId || p.mr_no || p.id || p.hf_id || p.stemi_id || p.nstemi_id;
      if (id) set.add(id);
    });
    return set.size || (totalRecords > 0 ? totalRecords : 24);
  }, [filteredHfCohort, filteredStemiCohort, filteredNstemiCohort, totalRecords, isFilterActive, backendMetrics]);

  const acsUniqueCount = useMemo(() => {
    if (!isFilterActive && backendMetrics?.kpis?.acsUniquePatients) {
      return backendMetrics.kpis.acsUniquePatients;
    }
    const set = new Set();
    [...filteredStemiCohort, ...filteredNstemiCohort].forEach(p => {
      const id = p.regPatientId || p.reg_patient_id || p.patient_id || p.uhid || p.patientId || p.mr_no || p.id || p.stemi_id || p.nstemi_id;
      if (id) set.add(id);
    });
    return set.size || (totalStemiRecords + totalNstemiRecords > 0 ? totalStemiRecords + totalNstemiRecords : 23);
  }, [filteredStemiCohort, filteredNstemiCohort, totalStemiRecords, totalNstemiRecords, isFilterActive, backendMetrics]);`;

const newCounts = `  // Unique Patient Counts across registries (Direct from backend DB or dynamically calculated)
  const hfUniqueCount = useMemo(() => {
    if (!isFilterActive && backendMetrics?.kpis?.hfUniquePatients) return backendMetrics.kpis.hfUniquePatients;
    const set = new Set();
    filteredHfCohort.forEach(p => {
      const id = p.regPatientId || p.reg_patient_id || p.patient_id || p.uhid || p.patientId || p.mr_no || p.id || p.hf_id;
      if (id) set.add(id);
    });
    return set.size;
  }, [filteredHfCohort, isFilterActive, backendMetrics]);

  const stemiUniqueCount = useMemo(() => {
    if (!isFilterActive && backendMetrics?.kpis?.stemiUniquePatients) return backendMetrics.kpis.stemiUniquePatients;
    const set = new Set();
    filteredStemiCohort.forEach(p => {
      const id = p.regPatientId || p.reg_patient_id || p.patient_id || p.uhid || p.patientId || p.mr_no || p.id || p.stemi_id;
      if (id) set.add(id);
    });
    return set.size;
  }, [filteredStemiCohort, isFilterActive, backendMetrics]);

  const nstemiUniqueCount = useMemo(() => {
    if (!isFilterActive && backendMetrics?.kpis?.nstemiUniquePatients) return backendMetrics.kpis.nstemiUniquePatients;
    const set = new Set();
    filteredNstemiCohort.forEach(p => {
      const id = p.regPatientId || p.reg_patient_id || p.patient_id || p.uhid || p.patientId || p.mr_no || p.id || p.nstemi_id;
      if (id) set.add(id);
    });
    return set.size;
  }, [filteredNstemiCohort, isFilterActive, backendMetrics]);

  const overallUniquePatients = useMemo(() => {
    if (!isFilterActive && backendMetrics?.kpis?.overallUniquePatients) {
      return backendMetrics.kpis.overallUniquePatients;
    }
    const set = new Set();
    [...filteredHfCohort, ...filteredStemiCohort, ...filteredNstemiCohort].forEach(p => {
      const id = p.regPatientId || p.reg_patient_id || p.patient_id || p.uhid || p.patientId || p.mr_no || p.id || p.hf_id || p.stemi_id || p.nstemi_id;
      if (id) set.add(id);
    });
    return set.size;
  }, [filteredHfCohort, filteredStemiCohort, filteredNstemiCohort, isFilterActive, backendMetrics]);

  const acsUniqueCount = useMemo(() => {
    if (!isFilterActive && backendMetrics?.kpis?.acsUniquePatients) {
      return backendMetrics.kpis.acsUniquePatients;
    }
    const set = new Set();
    [...filteredStemiCohort, ...filteredNstemiCohort].forEach(p => {
      const id = p.regPatientId || p.reg_patient_id || p.patient_id || p.uhid || p.patientId || p.mr_no || p.id || p.stemi_id || p.nstemi_id;
      if (id) set.add(id);
    });
    return set.size;
  }, [filteredStemiCohort, filteredNstemiCohort, isFilterActive, backendMetrics]);`;

if (!content.includes(oldCounts)) {
  console.error('Could not find oldCounts block');
  process.exit(1);
}
content = content.replace(oldCounts, newCounts);
console.log('1. Replaced unique counts definitions');

// 2. Fix filterRecord date extraction
const oldDateFilter = `    // 3. Admission Date Filter (Strictly admission_date / visit_date)
    const rawDate = r.admission_date || r.date_of_admission || r.visit_date || r.created_at || r.assessmentDate;
    if (rawDate) {
      const recDate = new Date(rawDate);
      if (!isNaN(recDate.getTime())) {
        if (filters.startDate) {
          const start = new Date(filters.startDate + 'T00:00:00');
          if (recDate < start) return false;
        }
        if (filters.endDate) {
          const end = new Date(filters.endDate + 'T23:59:59');
          if (recDate > end) return false;
        }
      }
    } else if (filters.startDate || filters.endDate) {
      return false;
    }`;

const newDateFilter = `    // 3. Admission Date Filter (Strictly admission date / visit date across all naming styles)
    const rawDate = r.admissionDate || r.admission_date || r.date_of_admission || r.visitDate || r.visit_date || r.presentationDate || r.presentation_date || r.created_at || r.createdAt || r.assessmentDate || r.assessment_date;
    if (rawDate) {
      let dateStr = '';
      if (typeof rawDate === 'string') {
        dateStr = rawDate.slice(0, 10);
      } else if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
        dateStr = rawDate.toISOString().slice(0, 10);
      } else {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) dateStr = d.toISOString().slice(0, 10);
      }

      if (dateStr && /^\\d{4}-\\d{2}-\\d{2}$/.test(dateStr)) {
        if (filters.startDate && dateStr < filters.startDate) return false;
        if (filters.endDate && dateStr > filters.endDate) return false;
      }
    } else if (filters.startDate || filters.endDate) {
      return false;
    }`;

if (!content.includes(oldDateFilter)) {
  console.error('Could not find oldDateFilter block');
  process.exit(1);
}
content = content.replace(oldDateFilter, newDateFilter);
console.log('2. Replaced date filter logic in filterRecord');

// 3. Update Section 2 Cards badges and subtitles
const oldCard1Header = `              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase">AGE DISTRIBUTION BY REGISTRY</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  Total: {overallUniquePatients} Unique Patients
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                &lt;50 · 50-60 · 61-70 · &gt;70 (%) across unique patients (HF: {hfUniqueCount} · STEMI: {stemiUniqueCount} · NSTEMI: {nstemiUniqueCount})
              </p>`;

const newCard1Header = `              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase">AGE DISTRIBUTION BY REGISTRY</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  HF: {hfUniqueCount} · STEMI: {stemiUniqueCount} · NSTEMI: {nstemiUniqueCount} Pts
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                &lt;50 · 50-60 · 61-70 · &gt;70 (%) across unique patients in each cohort ({overallUniquePatients} unique individuals)
              </p>`;

if (!content.includes(oldCard1Header)) {
  console.error('Could not find oldCard1Header block');
  process.exit(1);
}
content = content.replace(oldCard1Header, newCard1Header);
console.log('3. Replaced Card 1 Age Distribution header');

const oldCard2Header = `              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase">GENDER DISTRIBUTION BY REGISTRY</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  Total: {overallUniquePatients} Unique Patients
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                Male (Blue) vs Female (Pink) % distribution across unique patients
              </p>`;

const newCard2Header = `              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase">GENDER DISTRIBUTION BY REGISTRY</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  HF: {hfUniqueCount} · STEMI: {stemiUniqueCount} · NSTEMI: {nstemiUniqueCount} Pts
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                Male (Blue) vs Female (Pink) % across unique patients in each cohort
              </p>`;

if (!content.includes(oldCard2Header)) {
  console.error('Could not find oldCard2Header block');
  process.exit(1);
}
content = content.replace(oldCard2Header, newCard2Header);
console.log('4. Replaced Card 2 Gender Distribution header');

// 4. Update Card 3 Overlap header to clarify it is the 24 unique patients across all registries
const oldCard3Header = `              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">CROSS-REGISTRY PATIENT OVERLAP</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  Total: {overallUniquePatients} Unique Patients
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                4 multimorbidity categories across {overallUniquePatients} unique patients (HF: {hfUniqueCount} · STEMI: {stemiUniqueCount} · NSTEMI: {nstemiUniqueCount})
              </p>`;

const newCard3Header = `              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">CROSS-REGISTRY PATIENT OVERLAP</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">4 Categories</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                    Total: {overallUniquePatients} Unique Patients
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                Multimorbidity overlap across all {overallUniquePatients} unique hospital patients (HF: {hfUniqueCount} · STEMI: {stemiUniqueCount} · NSTEMI: {nstemiUniqueCount})
              </p>`;

if (!content.includes(oldCard3Header)) {
  console.error('Could not find oldCard3Header block');
  process.exit(1);
}
content = content.replace(oldCard3Header, newCard3Header);
console.log('5. Replaced Card 3 Overlap header');

// 5. Update Card 4 ACS Presentation header
const oldCard4Header = `              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase">ACS PRESENTATION PROFILE</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  Total: {totalStemiRecords + totalNstemiRecords} ACS Cases ({acsUniqueCount} Pts)
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                STEMI ({totalStemiRecords} records, {stemiUniqueCount} pts) vs NSTEMI ({totalNstemiRecords} records, {nstemiUniqueCount} pts)
              </p>`;

const newCard4Header = `              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase">ACS PRESENTATION PROFILE</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  Total: {displayStemiRecords + displayNstemiRecords} ACS Admissions ({acsUniqueCount} Pts)
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                STEMI ({displayStemiRecords} records, {stemiUniqueCount} pts) vs NSTEMI ({displayNstemiRecords} records, {nstemiUniqueCount} pts) — Non-HF
              </p>`;

if (!content.includes(oldCard4Header)) {
  console.error('Could not find oldCard4Header block');
  process.exit(1);
}
content = content.replace(oldCard4Header, newCard4Header);
console.log('6. Replaced Card 4 ACS Presentation header');

fs.writeFileSync(filePath, content, 'utf8');
console.log('All updates written cleanly to', filePath);
