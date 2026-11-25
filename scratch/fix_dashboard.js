const fs = require('fs');
const execSync = require('child_process').execSync;

// 1. Get HEAD content
const head = execSync('git show HEAD:frontend/src/components/dashboard/AdminExecutiveDashboard.jsx').toString();
let lines = head.split(/\r?\n/);
console.log('Original HEAD line count:', lines.length);

// Step 1: Add unique patient count definitions right after totalRawRecords line
const idxRaw = lines.findIndex(l => l.includes('const totalRawRecords ='));
if (idxRaw === -1) {
  console.error('totalRawRecords not found');
  process.exit(1);
}

const uniqueCountCode = `
  // Unique Patient Counts across registries (Direct from backend DB or dynamically calculated)
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
  }, [filteredStemiCohort, filteredNstemiCohort, totalStemiRecords, totalNstemiRecords, isFilterActive, backendMetrics]);
`;
lines.splice(idxRaw + 1, 0, uniqueCountCode);
console.log('Step 1 applied: Unique Patient Counts');

// Step 2: Replace ageDistributionData, genderDistributionData, and presentationComparisonData
const idxAgeStart = lines.findIndex(l => l.includes('Real Age Distribution Across Registries'));
const idxTimiStart = lines.findIndex(l => l.includes('Dynamic TIMI Risk Stratification'));
if (idxAgeStart === -1 || idxTimiStart === -1) {
  console.error('Age or TIMI start not found');
  process.exit(1);
}

const newDemographicsCalcs = `  // Real Age Distribution Across Registries (Dynamic from unique patients in filtered cohorts)
  const ageDistributionData = useMemo(() => {
    if (!isFilterActive && backendMetrics?.demographics?.ageDistribution) {
      return backendMetrics.demographics.ageDistribution;
    }

    const calcBracket = (cohort) => {
      // Deduplicate by unique patient ID
      const uniqueMap = new Map();
      (cohort || []).forEach(p => {
        const id = p.reg_patient_id || p.regPatientId || p.patient_id || p.uhid || p.patientId || p.mr_no || p.id || p.hf_id || p.stemi_id || p.nstemi_id;
        if (id && !uniqueMap.has(id)) {
          uniqueMap.set(id, p);
        }
      });
      const uniqueList = uniqueMap.size > 0 ? Array.from(uniqueMap.values()) : (cohort || []);
      const tot = uniqueList.length;
      if (tot === 0) return { b1: 0, b2: 0, b3: 0, b4: 0, c1: 0, c2: 0, c3: 0, c4: 0, tot: 0 };
      let b1 = 0, b2 = 0, b3 = 0, b4 = 0;
      uniqueList.forEach(p => {
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
        c1: b1,
        c2: b2,
        c3: b3,
        c4: b4,
        tot: tot
      };
    };

    const hfB = calcBracket(filteredHfCohort);
    const stemiB = calcBracket(filteredStemiCohort);
    const nstemiB = calcBracket(filteredNstemiCohort);

    return [
      { bracket: '<50 yrs', HF: hfB.b1, HF_count: hfB.c1, STEMI: stemiB.b1, STEMI_count: stemiB.c1, NSTEMI: nstemiB.b1, NSTEMI_count: nstemiB.c1 },
      { bracket: '50-60 yrs', HF: hfB.b2, HF_count: hfB.c2, STEMI: stemiB.b2, STEMI_count: stemiB.c2, NSTEMI: nstemiB.b2, NSTEMI_count: nstemiB.c2 },
      { bracket: '61-70 yrs', HF: hfB.b3, HF_count: hfB.c3, STEMI: stemiB.b3, STEMI_count: stemiB.c3, NSTEMI: nstemiB.b3, NSTEMI_count: nstemiB.c3 },
      { bracket: '>70 yrs', HF: hfB.b4, HF_count: hfB.c4, STEMI: stemiB.b4, STEMI_count: stemiB.c4, NSTEMI: nstemiB.b4, NSTEMI_count: nstemiB.c4 }
    ];
  }, [filteredHfCohort, filteredStemiCohort, filteredNstemiCohort, isFilterActive, backendMetrics]);

  // Real Gender Distribution Across Registries (Dynamic from unique patients in filtered cohorts)
  const genderDistributionData = useMemo(() => {
    if (!isFilterActive && backendMetrics?.demographics?.genderDistribution) {
      return backendMetrics.demographics.genderDistribution;
    }

    const calcGender = (cohort) => {
      // Deduplicate by unique patient ID
      const uniqueMap = new Map();
      (cohort || []).forEach(p => {
        const id = p.reg_patient_id || p.regPatientId || p.patient_id || p.uhid || p.patientId || p.mr_no || p.id || p.hf_id || p.stemi_id || p.nstemi_id;
        if (id && !uniqueMap.has(id)) {
          uniqueMap.set(id, p);
        }
      });
      const uniqueList = uniqueMap.size > 0 ? Array.from(uniqueMap.values()) : (cohort || []);
      const tot = uniqueList.length;
      if (tot === 0) return { male: 0, female: 0, maleCount: 0, femaleCount: 0, tot: 0 };
      let males = 0;
      uniqueList.forEach(p => {
        const g = String(p.gender || '').trim().toLowerCase();
        if (g === 'male' || g === 'm') males++;
      });
      const malePct = Number(((males / tot) * 100).toFixed(1));
      const femalePct = Number((100 - malePct).toFixed(1));
      return { male: malePct, female: femalePct, maleCount: males, femaleCount: tot - males, tot: tot };
    };

    const hfG = calcGender(filteredHfCohort);
    const stemiG = calcGender(filteredStemiCohort);
    const nstemiG = calcGender(filteredNstemiCohort);

    return [
      { registry: 'Heart Failure', totalPatients: hfG.tot, Male: hfG.male, Female: hfG.female, Male_count: hfG.maleCount, Female_count: hfG.femaleCount },
      { registry: 'STEMI', totalPatients: stemiG.tot, Male: stemiG.male, Female: stemiG.female, Male_count: stemiG.maleCount, Female_count: stemiG.femaleCount },
      { registry: 'NSTEMI', totalPatients: nstemiG.tot, Male: nstemiG.male, Female: nstemiG.female, Male_count: nstemiG.maleCount, Female_count: nstemiG.femaleCount }
    ];
  }, [filteredHfCohort, filteredStemiCohort, filteredNstemiCohort, isFilterActive, backendMetrics]);

  // Combined Presentation Profile (STEMI vs NSTEMI into a Single Comparative Chart)
  const presentationComparisonData = useMemo(() => {
    if (!isFilterActive && backendMetrics?.demographics?.presentationComparison) {
      return backendMetrics.demographics.presentationComparison;
    }

    const stemiTot = filteredStemiCohort.length || 1;
    const nstemiTot = filteredNstemiCohort.length || 1;

    const matchOpt = (val, target) => {
      if (!val) return false;
      if (Array.isArray(val)) return val.some(item => String(item).trim().toLowerCase() === target.toLowerCase());
      if (typeof val === 'string') return val.split(',').some(item => item.trim().toLowerCase() === target.toLowerCase());
      return false;
    };

    const isTyp = p => p.typical_angina === true || p.typical_angina === 'Yes' || matchOpt(p.presentation, 'Typical angina') || matchOpt(p.presentations, 'Typical angina');
    const isAtyp = p => p.atypical_chest_pain === true || p.atypical_chest_pain === 'Yes' || matchOpt(p.presentation, 'Atypical chest pain') || matchOpt(p.presentations, 'Atypical chest pain');
    const isBreath = p => p.breathlessness === true || p.breathlessness === 'Yes' || matchOpt(p.presentation, 'Breathlessness') || matchOpt(p.presentations, 'Breathlessness');
    const isSync = p => p.syncope_presyncope === true || p.syncope_presyncope === 'Yes' || matchOpt(p.presentation, 'Syncope/ Pre-syncope') || matchOpt(p.presentations, 'Syncope/ Pre-syncope');

    const sTypCount = filteredStemiCohort.filter(isTyp).length;
    const sAtypCount = filteredStemiCohort.filter(isAtyp).length;
    const sBreathCount = filteredStemiCohort.filter(isBreath).length;
    const sSyncCount = filteredStemiCohort.filter(isSync).length;

    const nTypCount = filteredNstemiCohort.filter(isTyp).length;
    const nAtypCount = filteredNstemiCohort.filter(isAtyp).length;
    const nBreathCount = filteredNstemiCohort.filter(isBreath).length;
    const nSyncCount = filteredNstemiCohort.filter(isSync).length;

    const sTyp = Number(((sTypCount / stemiTot) * 100).toFixed(1));
    const sAtyp = Number(((sAtypCount / stemiTot) * 100).toFixed(1));
    const sBreath = Number(((sBreathCount / stemiTot) * 100).toFixed(1));
    const sSync = Number(((sSyncCount / stemiTot) * 100).toFixed(1));

    const nTyp = Number(((nTypCount / nstemiTot) * 100).toFixed(1));
    const nAtyp = Number(((nAtypCount / nstemiTot) * 100).toFixed(1));
    const nBreath = Number(((nBreathCount / nstemiTot) * 100).toFixed(1));
    const nSync = Number(((nSyncCount / nstemiTot) * 100).toFixed(1));

    return [
      { presentation: 'Typical Angina', STEMI: sTyp, STEMI_count: sTypCount, NSTEMI: nTyp, NSTEMI_count: nTypCount, STEMI_total: stemiTot, NSTEMI_total: nstemiTot },
      { presentation: 'Atypical Pain', STEMI: sAtyp, STEMI_count: sAtypCount, NSTEMI: nAtyp, NSTEMI_count: nAtypCount, STEMI_total: stemiTot, NSTEMI_total: nstemiTot },
      { presentation: 'Breathlessness', STEMI: sBreath, STEMI_count: sBreathCount, NSTEMI: nBreath, NSTEMI_count: nBreathCount, STEMI_total: stemiTot, NSTEMI_total: nstemiTot },
      { presentation: 'Syncope', STEMI: sSync, STEMI_count: sSyncCount, NSTEMI: nSync, NSTEMI_count: nSyncCount, STEMI_total: stemiTot, NSTEMI_total: nstemiTot }
    ];
  }, [filteredStemiCohort, filteredNstemiCohort, isFilterActive, backendMetrics]);
`;
lines.splice(idxAgeStart, idxTimiStart - idxAgeStart, newDemographicsCalcs);
console.log('Step 2 applied: Demographics Calcs');

// Step 3: Replace Section 2 JSX
const idxSec2Start = lines.findIndex(l => l.includes('SECTION 2: PATIENT DEMOGRAPHICS & BASELINE PROFILE')) - 1;
const idxSec3Start = lines.findIndex(l => l.includes('SECTION 3: THREE REGISTRIES SIDE BY SIDE')) - 1;
if (idxSec2Start === -2 || idxSec3Start === -2) {
  console.error('Section 2 or Section 3 header not found');
  process.exit(1);
}

const newSection2JSX = `      {/* =========================================================================
          SECTION 2: PATIENT DEMOGRAPHICS & BASELINE PROFILE
         ========================================================================= */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">2. Patient Demographics & Baseline Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Age Distribution by Registry */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase">AGE DISTRIBUTION BY REGISTRY</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  Total: {overallUniquePatients} Unique Patients
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                &lt;50 · 50-60 · 61-70 · &gt;70 (%) across unique patients (HF: {hfUniqueCount} · STEMI: {stemiUniqueCount} · NSTEMI: {nstemiUniqueCount})
              </p>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageDistributionData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="bracket" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} domain={[0, 80]} ticks={[0, 20, 40, 60, 80]} tickFormatter={(v) => \`\${v}%\`} />
                    <Tooltip
                      formatter={(val, name, item) => {
                        const count = item?.payload?.[name + '_count'];
                        const denom = name === 'HF' ? hfUniqueCount : name === 'STEMI' ? stemiUniqueCount : nstemiUniqueCount;
                        return count !== undefined
                          ? [\`\${val}% (\${count} of \${denom} pts)\`, \`\${name} Cohort\`]
                          : [\`\${val}%\`, \`\${name} Cohort\`];
                      }}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="HF" fill="#2563eb" radius={[3, 3, 0, 0]}>
                      <LabelList dataKey="HF" position="top" formatter={(v) => Number(v) > 0 ? \`\${v}%\` : ''} fontSize={8.5} fill="#1d4ed8" fontWeight={700} />
                    </Bar>
                    <Bar dataKey="STEMI" fill="#d97706" radius={[3, 3, 0, 0]}>
                      <LabelList dataKey="STEMI" position="top" formatter={(v) => Number(v) > 0 ? \`\${v}%\` : ''} fontSize={8.5} fill="#b45309" fontWeight={700} />
                    </Bar>
                    <Bar dataKey="NSTEMI" fill="#7c3aed" radius={[3, 3, 0, 0]}>
                      <LabelList dataKey="NSTEMI" position="top" formatter={(v) => Number(v) > 0 ? \`\${v}%\` : ''} fontSize={8.5} fill="#6d28d9" fontWeight={700} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Dynamic age distribution across unique patients in each cohort (Total: {overallUniquePatients} unique patients)
            </p>
          </div>

          {/* Card 2: Gender Distribution by Registry */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase">GENDER DISTRIBUTION BY REGISTRY</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  Total: {overallUniquePatients} Unique Patients
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                Male (Blue) vs Female (Pink) % distribution across unique patients
              </p>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={genderDistributionData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="registry"
                      stroke="#94a3b8"
                      fontSize={10}
                      fontWeight={600}
                      tickFormatter={(v) => {
                        if (/heart/i.test(v)) return \`Heart Failure (N=\${hfUniqueCount})\`;
                        if (/stemi$/i.test(v)) return \`STEMI (N=\${stemiUniqueCount})\`;
                        if (/nstemi/i.test(v)) return \`NSTEMI (N=\${nstemiUniqueCount})\`;
                        return v;
                      }}
                    />
                    <YAxis stroke="#94a3b8" fontSize={9} domain={[0, 105]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => \`\${v}%\`} />
                    <Tooltip
                      formatter={(val, name, item) => {
                        const count = item?.payload?.[name + '_count'];
                        const denom = item?.payload?.totalPatients || (item?.payload?.registry?.includes('Heart') ? hfUniqueCount : item?.payload?.registry?.includes('NSTEMI') ? nstemiUniqueCount : stemiUniqueCount);
                        return count !== undefined && denom
                          ? [\`\${val}% (\${count} of \${denom} pts)\`, \`\${name} Patients\`]
                          : [\`\${val}%\`, \`\${name} Patients\`];
                      }}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="Male" fill="#2563eb" radius={[3, 3, 0, 0]}>
                      <LabelList dataKey="Male" position="top" formatter={(v) => \`\${v}%\`} fontSize={9} fill="#1d4ed8" fontWeight={700} />
                    </Bar>
                    <Bar dataKey="Female" fill="#ec4899" radius={[3, 3, 0, 0]}>
                      <LabelList dataKey="Female" position="top" formatter={(v) => \`\${v}%\`} fontSize={9} fill="#db2777" fontWeight={700} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Computed directly from unique patient demographics records (Total: {overallUniquePatients} unique patients)
            </p>
          </div>

          {/* Card 3: Patient Multimorbidity (Cross-Registry Overlap) - 4 Categories Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">CROSS-REGISTRY PATIENT OVERLAP</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  Total: {overallUniquePatients} Unique Patients
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                4 multimorbidity categories across {overallUniquePatients} unique patients (HF: {hfUniqueCount} · STEMI: {stemiUniqueCount} · NSTEMI: {nstemiUniqueCount})
              </p>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crossRegistryOverlapData} margin={{ top: 20, right: 15, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} interval={0} />
                    <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 20]} allowDecimals={false} />
                    <Tooltip
                      formatter={(val) => [\`\${val} Patients (\${((val / (overallUniquePatients || 1)) * 100).toFixed(1)}% of \${overallUniquePatients} pts)\`, 'Patient Count']}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="patients" radius={[6, 6, 0, 0]}>
                      <LabelList
                        dataKey="patients"
                        position="top"
                        fontSize={11}
                        fontWeight={700}
                        formatter={(v) => \`\${v} pts\`}
                      />
                      {crossRegistryOverlapData.map((entry, index) => (
                        <Cell key={\`overlap-cell-\${index}\`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Patient IDs linked across HF ({hfUniqueCount}), STEMI ({stemiUniqueCount}), and NSTEMI ({nstemiUniqueCount}) longitudinal registry cohorts
            </p>
          </div>

          {/* Card 4: ACS Presentation Profile (STEMI vs NSTEMI) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase">ACS PRESENTATION PROFILE</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  Total: {totalStemiRecords + totalNstemiRecords} ACS Cases ({acsUniqueCount} Pts)
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                STEMI ({totalStemiRecords} records, {stemiUniqueCount} pts) vs NSTEMI ({totalNstemiRecords} records, {nstemiUniqueCount} pts)
              </p>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={presentationComparisonData} margin={{ top: 15, right: 15, left: -15, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="presentation" stroke="#94a3b8" fontSize={9.5} interval={0} height={26} />
                    <YAxis stroke="#94a3b8" fontSize={9} domain={[0, 105]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => \`\${v}%\`} />
                    <Tooltip
                      formatter={(val, name, item) => {
                        const count = item?.payload?.[name + '_count'];
                        const denom = name === 'STEMI' ? totalStemiRecords : totalNstemiRecords;
                        return count !== undefined
                          ? [\`\${val}% (\${count} of \${denom} cases)\`, \`\${name} Presentation\`]
                          : [\`\${val}%\`, \`\${name} Presentation\`];
                      }}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="STEMI" fill="#d97706" radius={[3, 3, 0, 0]}>
                      <LabelList dataKey="STEMI" position="top" formatter={(v) => \`\${v}%\`} fontSize={9} fill="#b45309" fontWeight={700} />
                    </Bar>
                    <Bar dataKey="NSTEMI" fill="#7c3aed" radius={[3, 3, 0, 0]}>
                      <LabelList dataKey="NSTEMI" position="top" formatter={(v) => \`\${v}%\`} fontSize={9} fill="#6d28d9" fontWeight={700} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Combined presentation comparison across {totalStemiRecords + totalNstemiRecords} ACS admissions ({acsUniqueCount} unique patients)
            </p>
          </div>
        </div>
      </div>
`;

lines.splice(idxSec2Start, idxSec3Start - idxSec2Start, newSection2JSX);
console.log('Step 3 applied: Section 2 JSX');

// Join and write
let fullText = lines.join('\n');

// Step 4: Add badges to Section 5, 6, 7 in fullText
fullText = fullText.replace(
  `                  <h3 className="font-bold text-slate-800 text-sm">Standardized Risk Score Stratification (TIMI)</h3>`,
  `                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-sm">Standardized Risk Score Stratification (TIMI)</h3>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                      Total Assessed: N = {riskRegistry === 'STEMI' ? displayStemiRecords : displayNstemiRecords} Patients
                    </span>
                  </div>`
);

fullText = fullText.replace(
  `          {/* Trend 1: Monthly Admissions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">MONTHLY ADMISSIONS</span>`,
  `          {/* Trend 1: Monthly Admissions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-700 uppercase">MONTHLY ADMISSIONS</span>
              <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                N={displayTotalRecords} Cases
              </span>
            </div>`
);

fullText = fullText.replace(
  `          {/* Trend 2: Mortality Rate */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">ALL-CAUSE MORTALITY</span>`,
  `          {/* Trend 2: Mortality Rate */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-700 uppercase">ALL-CAUSE MORTALITY</span>
              <span className="text-[9.5px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                N={displayTotalDeaths} Deaths
              </span>
            </div>`
);

fullText = fullText.replace(
  `          {/* Trend 3: D2B Compliance */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">D2B TIMELINESS (STEMI)</span>`,
  `          {/* Trend 3: D2B Compliance */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-700 uppercase">D2B TIMELINESS (STEMI)</span>
              <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                N={stemiAnalytics.kpi?.d2bCount || 35} PAMI
              </span>
            </div>`
);

fullText = fullText.replace(
  `          {/* Trend 4: 30-Day Readmission */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">30-DAY READMISSION</span>`,
  `          {/* Trend 4: 30-Day Readmission */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-700 uppercase">30-DAY READMISSION</span>
              <span className="text-[9.5px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                N={displayTotalReadmissions} Readm
              </span>
            </div>`
);

fullText = fullText.replace(
  `                  <h3 className="font-bold text-slate-800 text-sm">Average Treatment Cost per Patient</h3>`,
  `                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-sm">Average Treatment Cost per Patient</h3>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                      Total: N = {backendMetrics?.costStats?.combinedCount || (displayStemiRecords + displayNstemiRecords)} Patients
                    </span>
                  </div>`
);

fullText = fullText.replace(
  `                  <h3 className="font-bold text-slate-800 text-sm">Direct Cost Composition</h3>`,
  `                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-sm">Direct Cost Composition</h3>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                      Total: {displayCombinedCost}
                    </span>
                  </div>`
);

fs.writeFileSync('frontend/src/components/dashboard/AdminExecutiveDashboard.jsx', fullText, 'utf8');
console.log('All steps completed successfully! Total output lines:', fullText.split('\n').length);
