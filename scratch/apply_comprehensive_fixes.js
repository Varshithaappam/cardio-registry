const fs = require('fs');

const filePath = 'frontend/src/components/dashboard/AdminExecutiveDashboard.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// Check where totalRecords is
const targetAnchor = '  const totalRawRecords = hfCohort.length + stemiCohort.length + nstemiCohort.length;\n';
if (!code.includes(targetAnchor)) {
  console.error('Could not find targetAnchor in file!');
  process.exit(1);
}

const uniqueDefs = `
  // Helper to extract a unique patient identifier across datasets
  const getPatientKey = (p) => {
    return p?.regPatientId || p?.reg_patient_id || p?.patient_id || p?.patientId || p?.uhid || p?.mr_no || p?.id || p?.hf_id || p?.stemi_id || p?.nstemi_id || null;
  };

  // Unique Patient Counts across cohorts (Honors active filters strictly)
  const hfUniqueCount = useMemo(() => {
    if (filteredHfCohort.length === 0) return 0;
    if (!isFilterActive && backendMetrics?.kpis?.hfUniquePatients) return backendMetrics.kpis.hfUniquePatients;
    const set = new Set();
    filteredHfCohort.forEach(p => {
      const id = getPatientKey(p);
      if (id) set.add(id);
    });
    return set.size || filteredHfCohort.length;
  }, [filteredHfCohort, isFilterActive, backendMetrics]);

  const stemiUniqueCount = useMemo(() => {
    if (filteredStemiCohort.length === 0) return 0;
    if (!isFilterActive && backendMetrics?.kpis?.stemiUniquePatients) return backendMetrics.kpis.stemiUniquePatients;
    const set = new Set();
    filteredStemiCohort.forEach(p => {
      const id = getPatientKey(p);
      if (id) set.add(id);
    });
    return set.size || filteredStemiCohort.length;
  }, [filteredStemiCohort, isFilterActive, backendMetrics]);

  const nstemiUniqueCount = useMemo(() => {
    if (filteredNstemiCohort.length === 0) return 0;
    if (!isFilterActive && backendMetrics?.kpis?.nstemiUniquePatients) return backendMetrics.kpis.nstemiUniquePatients;
    const set = new Set();
    filteredNstemiCohort.forEach(p => {
      const id = getPatientKey(p);
      if (id) set.add(id);
    });
    return set.size || filteredNstemiCohort.length;
  }, [filteredNstemiCohort, isFilterActive, backendMetrics]);

  const overallUniquePatients = useMemo(() => {
    if (filteredHfCohort.length === 0 && filteredStemiCohort.length === 0 && filteredNstemiCohort.length === 0) return 0;
    if (!isFilterActive && backendMetrics?.kpis?.overallUniquePatients) return backendMetrics.kpis.overallUniquePatients;
    const set = new Set();
    [...filteredHfCohort, ...filteredStemiCohort, ...filteredNstemiCohort].forEach(p => {
      const id = getPatientKey(p);
      if (id) set.add(id);
    });
    return set.size || (totalRecords > 0 ? totalRecords : 0);
  }, [filteredHfCohort, filteredStemiCohort, filteredNstemiCohort, totalRecords, isFilterActive, backendMetrics]);

  const acsUniqueCount = useMemo(() => {
    if (filteredStemiCohort.length === 0 && filteredNstemiCohort.length === 0) return 0;
    if (!isFilterActive && backendMetrics?.kpis?.acsUniquePatients) return backendMetrics.kpis.acsUniquePatients;
    const set = new Set();
    [...filteredStemiCohort, ...filteredNstemiCohort].forEach(p => {
      const id = getPatientKey(p);
      if (id) set.add(id);
    });
    return set.size || (totalStemiRecords + totalNstemiRecords > 0 ? totalStemiRecords + totalNstemiRecords : 0);
  }, [filteredStemiCohort, filteredNstemiCohort, totalStemiRecords, totalNstemiRecords, isFilterActive, backendMetrics]);
`;

code = code.replace(targetAnchor, targetAnchor + uniqueDefs);
console.log('Added unique definitions');

// Replace date filter logic in filterRecord
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

if (!code.includes(oldDateFilter)) {
  console.error('Could not find oldDateFilter in file!');
  process.exit(1);
}
code = code.replace(oldDateFilter, newDateFilter);
console.log('Updated date filter in filterRecord');

// Update calcBracket and calcGender
const oldCalcBracket = `    const calcBracket = (cohort) => {
      const tot = cohort.length;
      if (tot === 0) return { b1: 0, b2: 0, b3: 0, b4: 0 };
      let b1 = 0, b2 = 0, b3 = 0, b4 = 0;
      cohort.forEach(p => {
        let a = Number(p.age);
        if (isNaN(a) && p.date_of_birth) {
          const dob = new Date(p.date_of_birth);
          if (!isNaN(dob.getTime())) a = Math.floor((new Date() - dob) / (365.25 * 24 * 3600 * 1000));
        }
        if (!isNaN(a)) {
          if (a < 50) b1++;
          else if (a <= 60) b2++;
          else if (a <= 70) b3++;
          else b4++;
        }
      });
      return {
        b1: Number(((b1 / tot) * 100).toFixed(1)),
        b2: Number(((b2 / tot) * 100).toFixed(1)),
        b3: Number(((b3 / tot) * 100).toFixed(1)),
        b4: Number(((b4 / tot) * 100).toFixed(1))
      };
    };`;

const newCalcBracket = `    const calcBracket = (cohort) => {
      const seen = new Set();
      const uniquePts = [];
      cohort.forEach(p => {
        const id = getPatientKey(p);
        if (id) {
          if (!seen.has(id)) {
            seen.add(id);
            uniquePts.push(p);
          }
        } else {
          uniquePts.push(p);
        }
      });
      const tot = uniquePts.length;
      if (tot === 0) return { b1: 0, b2: 0, b3: 0, b4: 0, count1: 0, count2: 0, count3: 0, count4: 0, total: 0 };
      let b1 = 0, b2 = 0, b3 = 0, b4 = 0;
      uniquePts.forEach(p => {
        let a = Number(p.age);
        if (isNaN(a) && p.date_of_birth) {
          const dob = new Date(p.date_of_birth);
          if (!isNaN(dob.getTime())) a = Math.floor((new Date() - dob) / (365.25 * 24 * 3600 * 1000));
        }
        if (!isNaN(a)) {
          if (a < 50) b1++;
          else if (a <= 60) b2++;
          else if (a <= 70) b3++;
          else b4++;
        }
      });
      return {
        b1: Number(((b1 / tot) * 100).toFixed(1)),
        b2: Number(((b2 / tot) * 100).toFixed(1)),
        b3: Number(((b3 / tot) * 100).toFixed(1)),
        b4: Number(((b4 / tot) * 100).toFixed(1)),
        count1: b1, count2: b2, count3: b3, count4: b4, total: tot
      };
    };`;

if (!code.includes(oldCalcBracket)) {
  console.error('Could not find oldCalcBracket in file!');
  process.exit(1);
}
code = code.replace(oldCalcBracket, newCalcBracket);
console.log('Updated calcBracket to unique patient basis');

const oldCalcGender = `    const calcGender = (cohort) => {
      const tot = cohort.length;
      if (tot === 0) return { male: 0, female: 0 };
      let males = 0;
      cohort.forEach(p => {
        const g = String(p.gender || '').trim().toLowerCase();
        if (g === 'male' || g === 'm') males++;
      });
      const malePct = Number(((males / tot) * 100).toFixed(1));
      const femalePct = Number((100 - malePct).toFixed(1));
      return { male: malePct, female: femalePct };
    };`;

const newCalcGender = `    const calcGender = (cohort) => {
      const seen = new Set();
      const uniquePts = [];
      cohort.forEach(p => {
        const id = getPatientKey(p);
        if (id) {
          if (!seen.has(id)) {
            seen.add(id);
            uniquePts.push(p);
          }
        } else {
          uniquePts.push(p);
        }
      });
      const tot = uniquePts.length;
      if (tot === 0) return { male: 0, female: 0, maleCount: 0, femaleCount: 0, total: 0 };
      let males = 0;
      uniquePts.forEach(p => {
        const g = String(p.gender || '').trim().toLowerCase();
        if (g === 'male' || g === 'm') males++;
      });
      const females = tot - males;
      const malePct = Number(((males / tot) * 100).toFixed(1));
      const femalePct = Number(((females / tot) * 100).toFixed(1));
      return { male: malePct, female: femalePct, maleCount: males, femaleCount: females, total: tot };
    };`;

if (!code.includes(oldCalcGender)) {
  console.error('Could not find oldCalcGender in file!');
  process.exit(1);
}
code = code.replace(oldCalcGender, newCalcGender);
console.log('Updated calcGender to unique patient basis');

// Overlap getPid update
code = code.replace('const getPid = r => r.regPatientId || r.reg_patient_id;', 'const getPid = r => getPatientKey(r);');
console.log('Updated getPid in crossRegistryOverlapData');

// Update Section 2 Cards Header Badges & Subtitles
const oldCard1 = `          {/* Card 1: Age Distribution by Registry */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">AGE DISTRIBUTION BY REGISTRY</span>
              <p className="text-[10px] text-slate-400 mb-2">&lt;50 · 50-60 · 61-70 · &gt;70 (%) across cohorts</p>`;

const newCard1 = `          {/* Card 1: Age Distribution by Registry */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase">AGE DISTRIBUTION BY REGISTRY</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  HF: {hfUniqueCount} · STEMI: {stemiUniqueCount} · NSTEMI: {nstemiUniqueCount} Pts
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                &lt;50 · 50-60 · 61-70 · &gt;70 (%) across unique patients in each cohort ({overallUniquePatients} unique individuals)
              </p>`;

code = code.replace(oldCard1, newCard1);
console.log('Updated Card 1 Header');

const oldCard2 = `          {/* Card 2: Gender Distribution by Registry */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">GENDER DISTRIBUTION BY REGISTRY</span>
              <p className="text-[10px] text-slate-400 mb-2">Male (Blue) vs Female (Pink) % distribution across cohorts</p>`;

const newCard2 = `          {/* Card 2: Gender Distribution by Registry */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase">GENDER DISTRIBUTION BY REGISTRY</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  HF: {hfUniqueCount} · STEMI: {stemiUniqueCount} · NSTEMI: {nstemiUniqueCount} Pts
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                Male (Blue) vs Female (Pink) % across unique patients in each cohort
              </p>`;

code = code.replace(oldCard2, newCard2);
console.log('Updated Card 2 Header');

const oldCard3 = `          {/* Card 3: Patient Multimorbidity (Cross-Registry Overlap) - 4 Categories Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">CROSS-REGISTRY PATIENT OVERLAP</span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  4 Categories
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">Patients documented across multiple condition cohorts</p>`;

const newCard3 = `          {/* Card 3: Patient Multimorbidity (Cross-Registry Overlap) - 4 Categories Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
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

code = code.replace(oldCard3, newCard3);
console.log('Updated Card 3 Header');

const oldCard4 = `          {/* Card 4: ACS Presentation Profile (STEMI vs NSTEMI) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">ACS PRESENTATION PROFILE</span>
              <p className="text-[10px] text-slate-400 mb-2">STEMI vs NSTEMI symptom presentation on admission (%)</p>`;

const newCard4 = `          {/* Card 4: ACS Presentation Profile (STEMI vs NSTEMI) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase">ACS PRESENTATION PROFILE</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  Total: {displayStemiRecords + displayNstemiRecords} ACS Admissions ({acsUniqueCount} Pts)
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                STEMI ({displayStemiRecords} records, {stemiUniqueCount} pts) vs NSTEMI ({displayNstemiRecords} records, {nstemiUniqueCount} pts) — Non-HF
              </p>`;

code = code.replace(oldCard4, newCard4);
console.log('Updated Card 4 Header');

// Update Section 3 Card 1 HF patients count
code = code.replace(
  '<p className="text-xs text-slate-500 mb-4">{displayHfRecords} records · {hfAnalytics.kpi?.uniquePatients || 23} patients</p>',
  '<p className="text-xs text-slate-500 mb-4">{displayHfRecords} records · {hfUniqueCount} patients</p>'
);
console.log('Updated Section 3 Card 1 HF count');

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully wrote updated AdminExecutiveDashboard.jsx');
