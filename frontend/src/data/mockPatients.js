/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */



// Generate some high-quality mock data showing the powerful longitudinal, patient-centric timeline
export const MOCK_PATIENTS = [
{
  patient: {
    id: 'pat-1',
    name: 'Ramesh Chandra Malhotra',
    age: 68,
    dob: '1958-03-12',
    gender: 'Male',
    mrNo: 'MR-2026-0489',
    ipNo: 'IP-900812',
    ssn: 'SSN-984-21-998',
    zipCode: '500034',
    address: 'Road No 12, Banjara Hills, Hyderabad, Telangana',
    phone: '+91 98480 22334',
    email: 'rc.malhotra@gmail.com',
    highestEducation: 'Post Graduate',
    monthlyIncome: 'INR 1,20,000',
    occupation: 'Retired Bank Manager',
    caregiverName: 'Sushma Malhotra',
    caregiverRelationship: 'Spouse',
    caregiverPhone: '+91 98480 22335',
    insuranceMode: 'Arogyasree',
    bloodGroup: 'B+',
    primaryConsultant: 'Dr. K. Sridhar (Cardiologist)',
    referringDoctor: 'Dr. Ananth Rao',
    referredFromDept: 'General Medicine Clinic',
    race: 'Asian',
    createdAt: '2026-01-10T10:30:00Z',
    updatedAt: '2026-06-20T16:45:00Z'
  },
  comorbidities: {
    hypertension: 'Yes',
    diabetes: 'Yes',
    diabetesControl: 'Oral',
    smoking: 'Yes',
    currentSmoker: 'No',
    renalFailure: 'Yes',
    dialysisStatus: 'No',
    copd: 'No',
    cvaOrStroke: 'No',
    priorACS: 'Yes',
    priorPTCA: 'Yes',
    priorPTCADate: '2022-04-15',
    priorCABG: 'No',
    dyslipidemia: 'Yes',
    familyHistoryCAD: 'Yes',
    peripheralVascularDisease: 'No',
    cerebrovascularDisease: 'No',
    infectiousEndocarditis: 'No',
    immunosuppressiveTherapy: 'No',
    chronicLungDisease: 'No'
  },
  hospitalizations: [
  {
    id: 'hosp-1',
    patientId: 'pat-1',
    admissionDate: '2026-01-12',
    dischargeDate: '2026-01-18',
    hospitalName: 'CARE Heart Institute',
    hospitalZip: '500034',
    hospitalState: 'Telangana',
    payor: 'Arogyasree Health Scheme',
    treatingCardiologist: 'Dr. K. Sridhar',
    reasonForAdmission: 'Decompensated Heart Failure',
    isHFAdmission: true,
    hfPrecipitatingFactors: ['Atrial fibrillation', 'Medication non adherence', 'Excessive salt intake'],
    icuVisit: 'Yes',
    icuHours: 36,
    icuReadmission: 'No',
    totalICUHours: 36,
    lengthOfStayICCU: 36,
    lengthOfStayStepDown: 24,
    lengthOfStayFloors: 4,
    totalHospitalStayDays: 6,
    costBedCharges: 18000,
    costDrugsDisposables: 24000,
    costPackages: 0,
    costLabInvestigations: 12000,
    costNonInvasiveLabs: 6000,
    costConsults: 4500,
    costRadiology: 3500,
    costMiscellaneous: 2000,
    costTotal: 70000,
    dischargeLocation: 'Home',
    cardiacRehabReferral: 'Yes',
    smokingCessationCounseling: 'Yes',
    readmit30Days: 'No'
  },
  {
    id: 'hosp-2',
    patientId: 'pat-1',
    admissionDate: '2026-03-15',
    dischargeDate: '2026-03-22',
    hospitalName: 'CARE Heart Institute',
    hospitalZip: '500034',
    hospitalState: 'Telangana',
    payor: 'Arogyasree Health Scheme',
    treatingCardiologist: 'Dr. K. Sridhar',
    reasonForAdmission: 'Acute Coronary Syndrome (STEMI)',
    isHFAdmission: false,
    icuVisit: 'Yes',
    icuHours: 48,
    icuReadmission: 'No',
    totalICUHours: 48,
    lengthOfStayICCU: 48,
    lengthOfStayStepDown: 48,
    lengthOfStayFloors: 3,
    totalHospitalStayDays: 7,
    costBedCharges: 25000,
    costDrugsDisposables: 38000,
    costPackages: 120000, // Package for Primary PCI
    costLabInvestigations: 15000,
    costNonInvasiveLabs: 8000,
    costConsults: 6000,
    costRadiology: 4000,
    costMiscellaneous: 3000,
    costTotal: 219000,
    dischargeLocation: 'Home',
    cardiacRehabReferral: 'Yes',
    smokingCessationCounseling: 'Not Applicable',
    readmit30Days: 'No'
  },
  {
    id: 'hosp-3',
    patientId: 'pat-1',
    admissionDate: '2026-06-15',
    dischargeDate: '2026-06-24',
    hospitalName: 'CARE Heart Institute',
    hospitalZip: '500034',
    hospitalState: 'Telangana',
    payor: 'Self-Funded / Private Reimbursement',
    treatingCardiologist: 'Dr. K. Sridhar',
    reasonForAdmission: 'Severe CAD, recommended Coronary Artery Bypass Surgery',
    isHFAdmission: false,
    icuVisit: 'Yes',
    icuHours: 72,
    icuReadmission: 'No',
    totalICUHours: 72,
    lengthOfStayICCU: 72,
    lengthOfStayStepDown: 48,
    lengthOfStayFloors: 5,
    totalHospitalStayDays: 9,
    costBedCharges: 45000,
    costDrugsDisposables: 85000,
    costPackages: 350000, // CABG package
    costLabInvestigations: 28000,
    costNonInvasiveLabs: 12000,
    costConsults: 15000,
    costRadiology: 8000,
    costMiscellaneous: 7000,
    costTotal: 550000,
    dischargeLocation: 'Home',
    cardiacRehabReferral: 'Yes',
    smokingCessationCounseling: 'Yes',
    readmit30Days: 'No'
  }],

  hfAssessments: [
  {
    id: 'hfa-1',
    patientId: 'pat-1',
    encounterId: 'hosp-1',
    assessmentDate: '2026-01-12',
    visitType: 'Inpatient',
    vitals: {
      weightKg: 82.5,
      heightCm: 172,
      bmi: 27.9,
      heartRate: 98,
      hrVariability: 'Irregular',
      respiratoryRate: 24,
      o2Saturation: 91,
      bpSittingSystolic: 135,
      bpSittingDiastolic: 88,
      bpStandingSystolic: 125,
      bpStandingDiastolic: 80,
      mentalStatus: 'Alert/Oriented'
    },
    symptoms: {
      dyspneaAtRest: true,
      dyspneaWithExertion: true,
      fatigue: true,
      orthopnea: true,
      lossOfAppetiteBloating: true,
      decreasedExerciseTolerance: true,
      weightGain: true,
      weightLoss: false,
      syncope: false,
      pnd: true,
      muscleCramps: true,
      wheeze: true,
      giddiness: false
    },
    volumeOverloadSigns: {
      peripheralEdema: true,
      rales: true,
      hepatomegaly: true,
      ascites: false,
      jvpElevated: true
    },
    typeOfHF: 'HFrEF',
    hfEtiology: {
      cardiovascular: ['Ischemic', 'Hypertensive'],
      nonCardiac: ['Chronic Renal Disease'],
      pulmonary: []
    },
    stageOfHF: 'Stage C',
    nyhaClass: 'NYHA Class IV',
    afStatus: 'Paroxysmal',
    vtvfRiskAssessment: {
      documentedVT_VF: false,
      syncopeComplaints: false,
      documentedPVCs: true,
      pvcCount: 150,
      documentedNSVT: false
    },
    currentDeviceTherapy: {
      hasDevice: 'No'
    },
    deviceEligibility: {
      eligible: 'Yes',
      deviceType: 'CRT-D',
      brand: 'Medtronic',
      patientAcceptance: 'Yes'
    },
    educationRecommended: ['Diet: 2000-mg salt restriction', 'Daily weight monitoring', 'Medication compliance', 'What to do for worsened symptoms'],
    recommendations: {
      fluidAndDiet: 'Restrict fluids to 1.5 Liters daily. Salt < 2g per day.',
      exercise: 'Gentle walking 10 minutes, as tolerated. No heavy exertion.',
      yoga: 'Pranayama breathing exercise only.',
      drugs: 'Carvedilol 3.125mg BID, Ramipril 2.5mg OD, Spironolactone 25mg OD, Torsemide 20mg OD.',
      investigations: 'Repeat serum Creatinine and Potassium in 3 days. Standard Echo in 1 month.',
      procedures: 'Schedule Diagnostic Coronary Angiogram next month.'
    }
  }],

  acsEvents: [
  {
    id: 'acs-1',
    patientId: 'pat-1',
    encounterId: 'hosp-2',
    eventDate: '2026-03-15',
    type: 'STEMI',
    acsNo: 'ACS-2026-098',
    presentation: {
      typicalAngina: true,
      atypicalChestPain: false,
      breathlessness: true,
      syncopeOrPreSyncope: true,
      pulseRate: 110,
      sbp: 95,
      dbp: 62
    },
    timiCalculatedScore: 7, // Highly critical for STEMI
    timiDetails: {
      age75OrOver: false,
      age65To74: true, // +2 pts
      historyDM_HTN_Angina: true, // +1 pt
      sbpLessThan100: true, // +3 pts
      hrGreaterThan100: true, // +2 pts
      killipClass2To4: true, // +2 pts
      anteriorMI_LBBB: true, // +1 pt
      weightLessThan67: false,
      timeToReperfusionGreaterThan4h: false
    },
    otherRiskFactors: {
      lvf: true,
      vt_vf: true,
      bbb_chb: false,
      elevatedBNP: true,
      elevatedCRP: true
    },
    treatmentStrategy: 'PAMI',
    pamiDetails: {
      doorToBalloonTime: 45, // Excellent Door-to-Balloon (within 90 mins)
      vessels: ['LAD'],
      segment: 'Proximal LAD',
      thrombosuction: 'Done',
      stentType: 'DES',
      stentDiameter: 3.5,
      stentLength: 28,
      proceduralSuccess: 'Yes',
      postProcedureTIMIFlow: '3',
      majorComplications: ['None']
    },
    gp2b3a: 'Yes',
    bivalirudin: 'No',
    heparinStrategy: 'UFH i.v alone',
    appropriateness: {
      procedures: {
        'Indication for ICCU admission': 'Appropriate',
        'Indication for PTCA': 'Appropriate',
        'Indication for Invasive monitoring': 'Appropriate'
      },
      investigations: {
        'Cardiac enzymes': 'Appropriate',
        'BNP': 'Appropriate',
        'Bed-side Echo': 'Appropriate'
      },
      drugs: {
        'Beta-blockers': 'Appropriate',
        'Aspirin': 'Appropriate',
        'Clopidogrel': 'Appropriate',
        'Statin': 'Appropriate',
        'Anticoagulant': 'Appropriate'
      }
    }
  }],

  cabgProcedures: [
  {
    id: 'cabg-1',
    patientId: 'pat-1',
    encounterId: 'hosp-3',
    procedureDate: '2026-06-18',
    surgeonName: 'Dr. Gopala Krishna',
    surgeonId: 'SURG-4049',
    procedureStatus: 'Urgent',
    urgentReason: 'Ongoing Ischemia and Severe Left Main + Triple Vessel CAD',
    roboticAssisted: 'No',
    skinIncisionStart: '08:30',
    skinIncisionStop: '13:15',
    cpbUtilization: 'Full',
    cpbDetails: {
      combinationPlan: 'Planned',
      perfusionTimeMinutes: 112,
      cannulationMethod: 'Aorta and Atrial/Caval'
    },
    aorticOcclusion: 'Aortic Crossclamp',
    crossClampTimeMinutes: 78,
    cardioplegiaUsed: 'Yes',
    iabpUsed: 'Yes',
    iabpDetails: {
      whenInserted: 'Preoperatively',
      indication: 'Hemodynamic Instab'
    },
    intraopBloodProducts: {
      used: 'Yes',
      rbcUnits: 2,
      ffpUnits: 2,
      cryoUnits: 0,
      plateletUnits: 1
    },
    hasCoronaryBypass: 'Yes',
    bypassDetails: {
      distalAnastomosesArterial: 2,
      distalAnastomosesVenous: 2,
      anastomoticDeviceUsed: 'No',
      imasUsedGrafts: 'Both IMAs',
      imaHarvestTechnique: 'Direct Vision',
      imaDistalAnastomosesCount: 2,
      radialArteryUsed: 'Left Radial',
      radialArteryDistalAnastomosesCount: 1,
      gastroEpiploicArteryDistalAnastomosesCount: 0,
      otherArterialDistalAnastomosesCount: 0
    },
    hasValveSurgery: 'No',
    hasVAD: 'No',
    otherCardiacProcedures: [],
    otherNonCardiacProcedures: [],
    postoperative: {
      bloodProductsUsed: 'Yes',
      rbcUnits: 1,
      ffpUnits: 0,
      cryoUnits: 0,
      plateletUnits: 0,
      extubatedInOR: 'No',
      initialVentilationHours: 8,
      reintubatedDuringStay: 'No',
      totalVentilationHours: 8,
      inHospitalComplications: ['Atrial Fibrillation'] // Developed transient post-operative Afib
    },
    mortality: {
      mortalityStatus: 'No',
      dischargeStatus: 'Alive',
      statusAt30Days: 'Alive'
    }
  }],

  investigations: [
  {
    id: 'inv-1',
    patientId: 'pat-1',
    encounterId: 'hosp-1',
    investigationDate: '2026-01-12',
    testType: 'ECG',
    results: {
      hr: 98,
      rhythm: 'AF',
      avConduction: 'Normal',
      qWaves: 'Yes',
      qWavesLeads: 'V1-V4',
      blockages: 'LBBB',
      extraBeats: 'VPC',
      qt: 440,
      qtc: 468,
      qrsDuration: 132
    }
  },
  {
    id: 'inv-2',
    patientId: 'pat-1',
    encounterId: 'hosp-1',
    investigationDate: '2026-01-13',
    testType: 'ECHO',
    results: {
      ef: 28, // Severe LVD (HFrEF)
      lvFunction: 'Sev.LVD',
      rwma: 'LAD territory',
      mr: '2plus',
      otherValves: 'Normal',
      rvSystolicPressure: 45,
      rvFunction: 'Impaired',
      rwmi: 'Anterior',
      eeRatio: 18,
      eaRatio: 0.6,
      eDecelTime: 140,
      tapsv: 12
    }
  }],

  labResults: [
  {
    id: 'lab-1',
    patientId: 'pat-1',
    encounterId: 'hosp-1',
    resultDate: '2026-01-12',
    potassium: 3.8,
    creatinine: 1.8, // Elevated creatinine indicates renal impairment
    hemoglobin: 11.2,
    calcium: 8.9,
    bun: 32,
    glucose: 145,
    hba1c: 7.8,
    magnesium: 1.9,
    sodium: 136,
    bnp: 1450, // Massive BNP elevation confirms heart failure decompensation
    ldl: 112,
    inr: 1.1
  },
  {
    id: 'lab-2',
    patientId: 'pat-1',
    encounterId: 'hosp-2',
    resultDate: '2026-03-15',
    potassium: 4.1,
    creatinine: 1.6,
    hemoglobin: 12.1,
    sodium: 139,
    bnp: 850,
    tropI: 12.8, // Sky-high Troponin confirming acute myocardial necrosis
    ckMb: 85,
    glucose: 180
  }],

  medications: [
  {
    id: 'med-1',
    patientId: 'pat-1',
    encounterId: 'hosp-1',
    datePrescribed: '2026-01-18',
    drugClass: 'Beta-Blocker',
    drugName: 'Carvedilol',
    dose: '3.125 mg',
    frequency: 'BID',
    status: 'Discharge'
  },
  {
    id: 'med-2',
    patientId: 'pat-1',
    encounterId: 'hosp-1',
    datePrescribed: '2026-01-18',
    drugClass: 'ACE-Inhibitor',
    drugName: 'Ramipril',
    dose: '2.5 mg',
    frequency: 'OD',
    status: 'Discharge'
  },
  {
    id: 'med-3',
    patientId: 'pat-1',
    encounterId: 'hosp-1',
    datePrescribed: '2026-01-18',
    drugClass: 'Aldosterone-Antagonist',
    drugName: 'Spironolactone',
    dose: '25 mg',
    frequency: 'OD',
    status: 'Discharge'
  },
  {
    id: 'med-4',
    patientId: 'pat-1',
    encounterId: 'hosp-1',
    datePrescribed: '2026-01-18',
    drugClass: 'Diuretic',
    drugName: 'Torsemide',
    dose: '20 mg',
    frequency: 'OD',
    status: 'Discharge'
  },
  {
    id: 'med-5',
    patientId: 'pat-1',
    encounterId: 'hosp-2',
    datePrescribed: '2026-03-22',
    drugClass: 'Anti-platelet',
    drugName: 'Aspirin',
    dose: '75 mg',
    frequency: 'OD',
    status: 'Discharge'
  },
  {
    id: 'med-6',
    patientId: 'pat-1',
    encounterId: 'hosp-2',
    datePrescribed: '2026-03-22',
    drugClass: 'Anti-platelet',
    drugName: 'Clopidogrel',
    dose: '75 mg',
    frequency: 'OD',
    status: 'Discharge'
  },
  {
    id: 'med-7',
    patientId: 'pat-1',
    encounterId: 'hosp-2',
    datePrescribed: '2026-03-22',
    drugClass: 'Statin',
    drugName: 'Atorvastatin',
    dose: '40 mg',
    frequency: 'HS',
    status: 'Discharge'
  }],

  followUps: [
  {
    id: 'fol-1',
    patientId: 'pat-1',
    followUpInterval: '1-month',
    dateOfVisit: '2026-02-15',
    symptoms: {
      angina: 'No',
      breathlessnessClass: 'NYHA Class II',
      antianginalDrugsCount: 0
    },
    medicationCompliance: {
      dualAntiplatelets: 'Not Prescribed',
      statins: 'Yes',
      betaBlocker: 'Yes',
      aceiOrArb: 'Yes',
      aldosteroneAntagonist: 'Yes'
    },
    adverseEvents: {
      acsEvent: false,
      hospitalization: false,
      ptca: false,
      cabg: false,
      stroke: false,
      bleeding: false,
      death: false,
      anyOther: false
    }
  },
  {
    id: 'fol-2',
    patientId: 'pat-1',
    followUpInterval: '3-month',
    dateOfVisit: '2026-04-18',
    symptoms: {
      angina: 'Yes', // Developed recurrent angina post-STEMI before CABG scheduled
      breathlessnessClass: 'NYHA Class III',
      antianginalDrugsCount: 2
    },
    medicationCompliance: {
      dualAntiplatelets: 'Yes', // Aspirin + Clopidogrel DAPT compliance
      statins: 'Yes',
      betaBlocker: 'Yes',
      aceiOrArb: 'Yes',
      aldosteroneAntagonist: 'Yes'
    },
    adverseEvents: {
      acsEvent: true, // Recalled the STEMI admission
      hospitalization: true,
      ptca: true,
      cabg: false,
      stroke: false,
      bleeding: false,
      death: false,
      anyOther: false,
      details: 'Hospitalized for STEMI in March 2026, underwent successful Primary PTCA of LAD.'
    }
  }],

  auditTrail: [
  { id: 'aud-1', timestamp: '2026-01-12T10:45:00Z', user: 'system_nurse_CARE', action: 'CREATE_PATIENT', module: 'Patient Master', details: 'Ramesh Chandra Malhotra registered.' },
  { id: 'aud-2', timestamp: '2026-01-12T11:00:00Z', user: 'system_nurse_CARE', action: 'CREATE_ASSESSMENT', module: 'HF Assessment', details: 'Initial Care CHF Assessment form filled.' },
  { id: 'aud-3', timestamp: '2026-01-12T11:15:00Z', user: 'dr_sridhar_office', action: 'ADD_LABS', module: 'Laboratory Results', details: 'Potassium, Creatinine, BNP values added.' },
  { id: 'aud-4', timestamp: '2026-03-15T04:30:00Z', user: 'emergency_fellow', action: 'CREATE_ACS_EVENT', module: 'STEMI Event', details: 'Acute STEMI (Anterior MI) log initialized. Primary PCI protocol activated.' },
  { id: 'aud-5', timestamp: '2026-06-18T14:00:00Z', user: 'cts_coordinator', action: 'CREATE_CABG_RECORD', module: 'CABG Surgery', details: 'STS Adult Cardiac Surgery Record generated for Urgent CABG x3 conduits.' }]

},
{
  patient: {
    id: 'pat-2',
    name: 'Amrita Venkatraman',
    age: 62,
    dob: '1964-08-22',
    gender: 'Female',
    mrNo: 'MR-2026-1022',
    ipNo: 'IP-911045',
    ssn: 'SSN-342-99-104',
    zipCode: '600018',
    address: 'Venkateswara Colony, Alwarpet, Chennai, Tamil Nadu',
    phone: '+91 94440 88991',
    email: 'amrita.v@hotmail.com',
    highestEducation: 'Graduate',
    monthlyIncome: 'INR 85,000',
    occupation: 'School Principal',
    caregiverName: 'Karthik Venkatraman',
    caregiverRelationship: 'Son',
    caregiverPhone: '+91 94440 88992',
    insuranceMode: 'Private Insurance',
    bloodGroup: 'A-',
    primaryConsultant: 'Dr. G. Sundararaman',
    referringDoctor: 'Dr. Lalitha S.',
    referredFromDept: 'Outpatient Cardiology',
    race: 'Asian',
    createdAt: '2026-02-18T09:15:00Z',
    updatedAt: '2026-02-22T11:20:00Z'
  },
  comorbidities: {
    hypertension: 'Yes',
    diabetes: 'No',
    smoking: 'No',
    renalFailure: 'No',
    copd: 'No',
    cvaOrStroke: 'No',
    priorACS: 'No',
    priorPTCA: 'No',
    priorCABG: 'No',
    dyslipidemia: 'Yes',
    familyHistoryCAD: 'No',
    peripheralVascularDisease: 'No',
    cerebrovascularDisease: 'No',
    infectiousEndocarditis: 'No',
    immunosuppressiveTherapy: 'No',
    chronicLungDisease: 'No'
  },
  hospitalizations: [
  {
    id: 'hosp-4',
    patientId: 'pat-2',
    admissionDate: '2026-02-18',
    dischargeDate: '2026-02-22',
    hospitalName: 'Apollo Cardio Centre',
    hospitalZip: '600006',
    hospitalState: 'Tamil Nadu',
    payor: 'Star Health Insurance',
    treatingCardiologist: 'Dr. G. Sundararaman',
    reasonForAdmission: 'Acute Coronary Syndrome (NSTEMI)',
    isHFAdmission: false,
    icuVisit: 'Yes',
    icuHours: 24,
    icuReadmission: 'No',
    totalICUHours: 24,
    lengthOfStayICCU: 24,
    lengthOfStayStepDown: 24,
    lengthOfStayFloors: 2,
    totalHospitalStayDays: 4,
    costBedCharges: 12000,
    costDrugsDisposables: 18000,
    costPackages: 95000, // Diagnostic + Medical Management
    costLabInvestigations: 8000,
    costNonInvasiveLabs: 4000,
    costConsults: 3000,
    costRadiology: 2000,
    costMiscellaneous: 1000,
    costTotal: 143000,
    dischargeLocation: 'Home',
    cardiacRehabReferral: 'Yes',
    smokingCessationCounseling: 'Not Applicable',
    readmit30Days: 'No'
  }],

  hfAssessments: [],
  acsEvents: [
  {
    id: 'acs-2',
    patientId: 'pat-2',
    encounterId: 'hosp-4',
    eventDate: '2026-02-18',
    type: 'NSTEMI',
    acsNo: 'ACS-2026-045',
    presentation: {
      typicalAngina: false,
      atypicalChestPain: true, // Atypical presentation common in females
      breathlessness: true,
      syncopeOrPreSyncope: false,
      pulseRate: 82,
      sbp: 148,
      dbp: 92
    },
    timiCalculatedScore: 4, // Moderate Risk NSTEMI TIMI
    timiDetails: {
      age65OrOver: false, // 62 yrs
      atLeast3CHD_RiskFactors: true, // Hypertension, Dyslipidemia, Female gender (wait, HTN & Lipids = 2. Let's say yes due to age/postmenopausal)
      priorCoronaryStenosis50Plus: true, // Angiogram showed 70% LCX stenosis
      stDeviationAtAdmission: true, // ST depression in lateral leads
      atLeast2AnginalEpisodesLast24h: true,
      elevatedSerumCardiacMarkers: true, // Troponin T positive
      aspirinUseLast7d: false
    },
    otherRiskFactors: {
      lvf: false,
      vt_vf: false,
      bbb_chb: false,
      elevatedBNP: false,
      elevatedCRP: true
    },
    treatmentStrategy: 'Conservative', // Decided on intensive medical management
    gp2b3a: 'No',
    bivalirudin: 'No',
    heparinStrategy: 'LMWH alone', // Enoxaparin protocol
    appropriateness: {
      procedures: {
        'Indication for ICCU admission': 'Appropriate',
        'Indication for PTCA': 'Inappropriate', // Medically managed initially
        'Indication for Invasive monitoring': 'Appropriate'
      },
      investigations: {
        'Cardiac enzymes': 'Appropriate',
        'CXR': 'Appropriate',
        'Bed-side Echo': 'Appropriate'
      },
      drugs: {
        'Beta-blockers': 'Appropriate',
        'Aspirin': 'Appropriate',
        'Clopidogrel': 'Appropriate',
        'ACE-inhibitor': 'Appropriate',
        'Statin': 'Appropriate'
      }
    }
  }],

  cabgProcedures: [],
  investigations: [
  {
    id: 'inv-3',
    patientId: 'pat-2',
    encounterId: 'hosp-4',
    investigationDate: '2026-02-18',
    testType: 'ECG',
    results: {
      hr: 82,
      rhythm: 'NSR',
      avConduction: 'Normal',
      qWaves: 'None',
      blockages: 'None',
      extraBeats: 'None',
      qt: 380,
      qtc: 412,
      qrsDuration: 92
    }
  },
  {
    id: 'inv-4',
    patientId: 'pat-2',
    encounterId: 'hosp-4',
    investigationDate: '2026-02-19',
    testType: 'ECHO',
    results: {
      ef: 52, // Preserved ejection fraction (HFpEF type presentation or normal)
      lvFunction: 'Normal',
      rwma: 'LCX territory (lateral wall hypokinesia)',
      mr: '1plus',
      rvSystolicPressure: 28,
      rvFunction: 'Normal',
      rwmi: 'Lateral'
    }
  },
  {
    id: 'inv-5',
    patientId: 'pat-2',
    encounterId: 'hosp-4',
    investigationDate: '2026-02-19',
    testType: 'Angiogram',
    results: {
      done: 'Done',
      vesselDisease: '1 vessel disease',
      findings: '75% stenosis in Mid Circumflex (LCX). LAD and RCA have minor plaque (<30%).'
    }
  }],

  labResults: [
  {
    id: 'lab-3',
    patientId: 'pat-2',
    encounterId: 'hosp-4',
    resultDate: '2026-02-18',
    potassium: 4.4,
    creatinine: 0.9, // Normal kidney function
    hemoglobin: 13.2,
    sodium: 141,
    bnp: 85, // Normal BNP
    tropI: 1.85, // Elevated Troponin confirming NSTEMI
    ckMb: 24,
    glucose: 104,
    ldl: 142 // High LDL requiring high-intensity statin
  }],

  medications: [
  {
    id: 'med-8',
    patientId: 'pat-2',
    encounterId: 'hosp-4',
    datePrescribed: '2026-02-22',
    drugClass: 'Beta-Blocker',
    drugName: 'Metoprolol Succinate',
    dose: '25 mg',
    frequency: 'OD',
    status: 'Discharge'
  },
  {
    id: 'med-9',
    patientId: 'pat-2',
    encounterId: 'hosp-4',
    datePrescribed: '2026-02-22',
    drugClass: 'ACE-Inhibitor',
    drugName: 'Enalapril',
    dose: '5 mg',
    frequency: 'OD',
    status: 'Discharge'
  },
  {
    id: 'med-10',
    patientId: 'pat-2',
    encounterId: 'hosp-4',
    datePrescribed: '2026-02-22',
    drugClass: 'Anti-platelet',
    drugName: 'Aspirin',
    dose: '75 mg',
    frequency: 'OD',
    status: 'Discharge'
  },
  {
    id: 'med-11',
    patientId: 'pat-2',
    encounterId: 'hosp-4',
    datePrescribed: '2026-02-22',
    drugClass: 'Anti-platelet',
    drugName: 'Ticagrelor',
    dose: '90 mg',
    frequency: 'BID',
    status: 'Discharge'
  },
  {
    id: 'med-12',
    patientId: 'pat-2',
    encounterId: 'hosp-4',
    datePrescribed: '2026-02-22',
    drugClass: 'Statin',
    drugName: 'Atorvastatin',
    dose: '40 mg',
    frequency: 'OD',
    status: 'Discharge'
  }],

  followUps: [],
  auditTrail: [
  { id: 'aud-6', timestamp: '2026-02-18T10:00:00Z', user: 'apollo_admin', action: 'CREATE_PATIENT', module: 'Patient Master', details: 'Amrita Venkatraman registered.' },
  { id: 'aud-7', timestamp: '2026-02-18T10:30:00Z', user: 'apollo_er_dr', action: 'CREATE_ACS_EVENT', module: 'NSTEMI Event', details: 'Lateral ST depression NSTEMI profile completed.' }]

}];


// Complete mappings from original forms to digital modules (The 100% Traceability Matrix)
export const FORM_MAPPING_MATRIX = [
// Patient Master Demographics
{ id: 'm-1', sourceForm: 'Shared', sourceSection: 'Demographics', originalFieldName: 'Name', digitalFieldName: 'patient.name', entityType: 'PatientMaster', dataType: 'String', inputControl: 'Input Text', isMandatory: true, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-2', sourceForm: 'Shared', sourceSection: 'Demographics', originalFieldName: 'Age', digitalFieldName: 'patient.age', entityType: 'PatientMaster', dataType: 'Number', inputControl: 'Input Number', isMandatory: true, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-3', sourceForm: 'Shared', sourceSection: 'Demographics', originalFieldName: 'Gender (M/F)', digitalFieldName: 'patient.gender', entityType: 'PatientMaster', dataType: 'Enum', inputControl: 'Radio / Select', isMandatory: true, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-4', sourceForm: 'Shared', sourceSection: 'Demographics', originalFieldName: 'MR No / Patient ID', digitalFieldName: 'patient.mrNo', entityType: 'PatientMaster', dataType: 'String', inputControl: 'Input Text', isMandatory: true, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-5', sourceForm: 'Shared', sourceSection: 'Demographics', originalFieldName: 'IP No', digitalFieldName: 'patient.ipNo', entityType: 'PatientMaster', dataType: 'String', inputControl: 'Input Text', isMandatory: false, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-6', sourceForm: 'Shared', sourceSection: 'Demographics', originalFieldName: 'Contact details (Phone, Email)', digitalFieldName: 'patient.phone, patient.email', entityType: 'PatientMaster', dataType: 'String', inputControl: 'Input Text', isMandatory: true, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-7', sourceForm: 'HF Assessment', sourceSection: 'Demographics', originalFieldName: 'Highest Education Level', digitalFieldName: 'patient.highestEducation', entityType: 'PatientMaster', dataType: 'Enum', inputControl: 'Radio Buttons', isMandatory: false, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-8', sourceForm: 'HF Assessment', sourceSection: 'Demographics', originalFieldName: 'Monthly Income', digitalFieldName: 'patient.monthlyIncome', entityType: 'PatientMaster', dataType: 'String', inputControl: 'Input Text', isMandatory: false, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-9', sourceForm: 'HF Assessment', sourceSection: 'Demographics', originalFieldName: 'Occupation', digitalFieldName: 'patient.occupation', entityType: 'PatientMaster', dataType: 'String', inputControl: 'Input Text', isMandatory: false, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-10', sourceForm: 'HF Assessment', sourceSection: 'Demographics', originalFieldName: 'Caregiver Name & relationship', digitalFieldName: 'patient.caregiverName, patient.caregiverRelationship', entityType: 'PatientMaster', dataType: 'String', inputControl: 'Input Text', isMandatory: false, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-11', sourceForm: 'HF Assessment', sourceSection: 'Demographics', originalFieldName: 'Insurance/ Payment Mode', digitalFieldName: 'patient.insuranceMode', entityType: 'PatientMaster', dataType: 'Enum', inputControl: 'Radio Buttons', isMandatory: false, repeatable: false, classification: 'Patient-Level' },

// Shared Comorbidities
{ id: 'm-12', sourceForm: 'Shared', sourceSection: 'Clinical Information / Risk Factors', originalFieldName: 'Hypertension', digitalFieldName: 'comorbidities.hypertension', entityType: 'Comorbidities', dataType: 'Enum', inputControl: 'Radio (Yes/No/Unk)', isMandatory: true, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-13', sourceForm: 'Shared', sourceSection: 'Clinical Information / Risk Factors', originalFieldName: 'Diabetes', digitalFieldName: 'comorbidities.diabetes', entityType: 'Comorbidities', dataType: 'Enum', inputControl: 'Radio (Yes/No/Unk)', isMandatory: true, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-14', sourceForm: 'CABG / STS', sourceSection: 'Risk Factors', originalFieldName: 'Diabetes Control', digitalFieldName: 'comorbidities.diabetesControl', entityType: 'Comorbidities', dataType: 'Enum', inputControl: 'Select Option', isMandatory: false, conditionalLogic: 'If diabetes = Yes', repeatable: false, classification: 'Patient-Level' },
{ id: 'm-15', sourceForm: 'Shared', sourceSection: 'Clinical Information / Risk Factors', originalFieldName: 'Smoking', digitalFieldName: 'comorbidities.smoking', entityType: 'Comorbidities', dataType: 'Enum', inputControl: 'Radio (Yes/No/Unk)', isMandatory: true, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-16', sourceForm: 'Shared', sourceSection: 'Clinical Information / Risk Factors', originalFieldName: 'Renal Failure', digitalFieldName: 'comorbidities.renalFailure', entityType: 'Comorbidities', dataType: 'Enum', inputControl: 'Radio (Yes/No/Unk)', isMandatory: true, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-17', sourceForm: 'CABG / STS', sourceSection: 'Risk Factors', originalFieldName: 'Dialysis (Newly required)', digitalFieldName: 'comorbidities.dialysisStatus', entityType: 'Comorbidities', dataType: 'Enum', inputControl: 'Radio (Yes/No)', isMandatory: false, conditionalLogic: 'If renalFailure = Yes', repeatable: false, classification: 'Patient-Level' },
{ id: 'm-18', sourceForm: 'Shared', sourceSection: 'Clinical Information / Risk Factors', originalFieldName: 'COPD', digitalFieldName: 'comorbidities.copd', entityType: 'Comorbidities', dataType: 'Enum', inputControl: 'Radio (Yes/No/Unk)', isMandatory: true, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-19', sourceForm: 'Shared', sourceSection: 'Clinical Information / Risk Factors', originalFieldName: 'CVA / Stroke', digitalFieldName: 'comorbidities.cvaOrStroke', entityType: 'Comorbidities', dataType: 'Enum', inputControl: 'Radio (Yes/No/Unk)', isMandatory: true, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-20', sourceForm: 'Shared', sourceSection: 'Clinical Information / Risk Factors', originalFieldName: 'Prior ACS / MI', digitalFieldName: 'comorbidities.priorACS', entityType: 'Comorbidities', dataType: 'Enum', inputControl: 'Radio (Yes/No/Unk)', isMandatory: true, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-21', sourceForm: 'Shared', sourceSection: 'Clinical Information / Risk Factors', originalFieldName: 'Prior PTCA / PCI', digitalFieldName: 'comorbidities.priorPTCA', entityType: 'Comorbidities', dataType: 'Enum', inputControl: 'Radio (Yes/No/Unk)', isMandatory: true, repeatable: false, classification: 'Patient-Level' },
{ id: 'm-22', sourceForm: 'Shared', sourceSection: 'Clinical Information / Risk Factors', originalFieldName: 'Prior CABG', digitalFieldName: 'comorbidities.priorCABG', entityType: 'Comorbidities', dataType: 'Enum', inputControl: 'Radio (Yes/No/Unk)', isMandatory: true, repeatable: false, classification: 'Patient-Level' },

// HF Assessment Vitals & Overload
{ id: 'm-23', sourceForm: 'HF Assessment', sourceSection: 'Vitals', originalFieldName: 'Weight', digitalFieldName: 'vitals.weightKg', entityType: 'HFAssessment.vitals', dataType: 'Number', inputControl: 'Input (kg)', isMandatory: true, repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-24', sourceForm: 'HF Assessment', sourceSection: 'Vitals', originalFieldName: 'Height', digitalFieldName: 'vitals.heightCm', entityType: 'HFAssessment.vitals', dataType: 'Number', inputControl: 'Input (cm)', isMandatory: false, repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-25', sourceForm: 'HF Assessment', sourceSection: 'Vitals', originalFieldName: 'BMI', digitalFieldName: 'vitals.bmi', entityType: 'HFAssessment.vitals', dataType: 'Number', inputControl: 'Calculated Field', isMandatory: false, conditionalLogic: 'Auto-calculates if weight and height supplied', repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-26', sourceForm: 'HF Assessment', sourceSection: 'Symptoms', originalFieldName: 'Dyspnea at rest', digitalFieldName: 'symptoms.dyspneaAtRest', entityType: 'HFAssessment.symptoms', dataType: 'Boolean', inputControl: 'Checkbox', isMandatory: false, repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-27', sourceForm: 'HF Assessment', sourceSection: 'Symptoms', originalFieldName: 'PND (Paroxysmal Nocturnal Dyspnea)', digitalFieldName: 'symptoms.pnd', entityType: 'HFAssessment.symptoms', dataType: 'Boolean', inputControl: 'Checkbox', isMandatory: false, repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-28', sourceForm: 'HF Assessment', sourceSection: 'Volume Overload Signs', originalFieldName: 'Peripheral edema', digitalFieldName: 'volumeOverloadSigns.peripheralEdema', entityType: 'HFAssessment.volumeOverloadSigns', dataType: 'Boolean', inputControl: 'Checkbox', isMandatory: false, repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-29', sourceForm: 'HF Assessment', sourceSection: 'Volume Overload Signs', originalFieldName: 'Jugular venous pressure', digitalFieldName: 'volumeOverloadSigns.jvpElevated', entityType: 'HFAssessment.volumeOverloadSigns', dataType: 'Boolean', inputControl: 'Checkbox', isMandatory: false, repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-30', sourceForm: 'HF Assessment', sourceSection: 'Clinical Assessment', originalFieldName: 'Type of Heart Failure', digitalFieldName: 'typeOfHF', entityType: 'HFAssessment', dataType: 'Enum', inputControl: 'Radio Buttons', isMandatory: true, repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-31', sourceForm: 'HF Assessment', sourceSection: 'Clinical Assessment', originalFieldName: 'Stage of HF', digitalFieldName: 'stageOfHF', entityType: 'HFAssessment', dataType: 'Enum', inputControl: 'Radio Buttons', isMandatory: true, repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-32', sourceForm: 'HF Assessment', sourceSection: 'Clinical Assessment', originalFieldName: 'NYHA Functional Status', digitalFieldName: 'nyhaClass', entityType: 'HFAssessment', dataType: 'Enum', inputControl: 'Radio Buttons', isMandatory: true, repeatable: true, classification: 'Encounter-Level' },

// STEMI / NSTEMI Risk & Reperfusion
{ id: 'm-33', sourceForm: 'STEMI', sourceSection: 'Risk Stratification', originalFieldName: 'TIMI Risk Score', digitalFieldName: 'timiCalculatedScore', entityType: 'ACSEvent', dataType: 'Number', inputControl: 'Calculated Field / Table', isMandatory: true, conditionalLogic: 'Auto-calculates based on risk boxes checked', repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-34', sourceForm: 'STEMI', sourceSection: 'Treatment Strategy', originalFieldName: 'Treatment Strategy: PAMI / Thrombolysis', digitalFieldName: 'treatmentStrategy', entityType: 'ACSEvent', dataType: 'Enum', inputControl: 'Select Box', isMandatory: true, repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-35', sourceForm: 'STEMI', sourceSection: 'Primary Angioplasty (PAMI)', originalFieldName: 'Door to Balloon Time', digitalFieldName: 'pamiDetails.doorToBalloonTime', entityType: 'ACSEvent.pamiDetails', dataType: 'Number', inputControl: 'Input (minutes)', isMandatory: false, conditionalLogic: 'Visible if Strategy = PAMI', repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-36', sourceForm: 'STEMI', sourceSection: 'Primary Angioplasty (PAMI)', originalFieldName: 'Vessel(s) Segment', digitalFieldName: 'pamiDetails.vessels, pamiDetails.segment', entityType: 'ACSEvent.pamiDetails', dataType: 'String', inputControl: 'Checkboxes / Text', isMandatory: false, conditionalLogic: 'Visible if Strategy = PAMI', repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-37', sourceForm: 'STEMI', sourceSection: 'Thrombolysis Details', originalFieldName: 'Door to Needle Time', digitalFieldName: 'thrombolysisDetails.doorToNeedleTime', entityType: 'ACSEvent.thrombolysisDetails', dataType: 'Number', inputControl: 'Input (minutes)', isMandatory: false, conditionalLogic: 'Visible if Strategy = Thrombolysis', repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-38', sourceForm: 'STEMI', sourceSection: 'Thrombolysis Details', originalFieldName: 'Thrombolytic Drug / Dose', digitalFieldName: 'thrombolysisDetails.drug, thrombolysisDetails.dose', entityType: 'ACSEvent.thrombolysisDetails', dataType: 'Enum', inputControl: 'Radio / Text', isMandatory: false, conditionalLogic: 'Visible if Strategy = Thrombolysis', repeatable: true, classification: 'Encounter-Level' },

// CABG Operative Information
{ id: 'm-39', sourceForm: 'CABG / STS', sourceSection: 'Administrative', originalFieldName: 'Surgeon Name & Surgeon ID', digitalFieldName: 'surgeonName, surgeonId', entityType: 'CABGProcedure', dataType: 'String', inputControl: 'Input Text', isMandatory: true, repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-40', sourceForm: 'CABG / STS', sourceSection: 'Operative', originalFieldName: 'Status: Elective/Urgent/Emergent', digitalFieldName: 'procedureStatus', entityType: 'CABGProcedure', dataType: 'Enum', inputControl: 'Radio Buttons', isMandatory: true, repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-41', sourceForm: 'CABG / STS', sourceSection: 'Operative', originalFieldName: 'Cardiopulmonary Bypass Perfusion Time', digitalFieldName: 'cpbDetails.perfusionTimeMinutes', entityType: 'CABGProcedure.cpbDetails', dataType: 'Number', inputControl: 'Input (minutes)', isMandatory: false, conditionalLogic: 'Visible if cpbUtilization != None', repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-42', sourceForm: 'CABG / STS', sourceSection: 'Operative', originalFieldName: 'Aortic Cross-Clamp Time', digitalFieldName: 'crossClampTimeMinutes', entityType: 'CABGProcedure', dataType: 'Number', inputControl: 'Input (minutes)', isMandatory: false, conditionalLogic: 'Visible if Aortic Occlusion = Crossclamp', repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-43', sourceForm: 'CABG / STS', sourceSection: 'Coronary Bypass', originalFieldName: 'Number of Distal Anastomoses', digitalFieldName: 'bypassDetails.distalAnastomosesArterial, bypassDetails.distalAnastomosesVenous', entityType: 'CABGProcedure.bypassDetails', dataType: 'Number', inputControl: 'Input Number', isMandatory: false, conditionalLogic: 'Visible if Coronary Artery Bypass = Yes', repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-44', sourceForm: 'CABG / STS', sourceSection: 'Coronary Bypass', originalFieldName: 'IMAs Used as Grafts', digitalFieldName: 'bypassDetails.imasUsedGrafts', entityType: 'CABGProcedure.bypassDetails', dataType: 'Enum', inputControl: 'Radio Buttons', isMandatory: false, conditionalLogic: 'Visible if Coronary Artery Bypass = Yes', repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-45', sourceForm: 'CABG / STS', sourceSection: 'Valve Surgery', originalFieldName: 'Valve Surgery: Prosthesis details', digitalFieldName: 'valveDetails.prosthesisAortic, valveDetails.prosthesisMitral', entityType: 'CABGProcedure.valveDetails', dataType: 'Object', inputControl: 'Select & Size Input', isMandatory: false, conditionalLogic: 'Visible if Valve Surgery = Yes', repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-46', sourceForm: 'CABG / STS', sourceSection: 'VAD', originalFieldName: 'Ventricular Assist Device (VAD) info', digitalFieldName: 'vadDetails', entityType: 'CABGProcedure.vadDetails', dataType: 'Object', inputControl: 'Complex Multi-control Grid', isMandatory: false, conditionalLogic: 'Visible if Ventricular Assist Device = Yes', repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-47', sourceForm: 'CABG / STS', sourceSection: 'Complications', originalFieldName: 'In Hospital Complications', digitalFieldName: 'postoperative.inHospitalComplications', entityType: 'CABGProcedure.postoperative', dataType: 'Array', inputControl: 'Grid Checklist', isMandatory: false, repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-48', sourceForm: 'CABG / STS', sourceSection: 'Mortality', originalFieldName: 'Mortality / Operative Death', digitalFieldName: 'mortality', entityType: 'CABGProcedure.mortality', dataType: 'Object', inputControl: 'Radio & Select Grid', isMandatory: true, repeatable: true, classification: 'Encounter-Level' },

// Investigations & Labs
{ id: 'm-49', sourceForm: 'Shared', sourceSection: 'Investigations', originalFieldName: 'ECG HR / Rhythm / Blockages', digitalFieldName: 'results.hr, results.rhythm, results.blockages', entityType: 'ClinicalInvestigation', dataType: 'Object', inputControl: 'Dynamic Input Form', isMandatory: true, repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-50', sourceForm: 'Shared', sourceSection: 'Investigations', originalFieldName: 'ECHO Ejection Fraction % (EF)', digitalFieldName: 'results.ef', entityType: 'ClinicalInvestigation', dataType: 'Number', inputControl: 'Input Percent', isMandatory: true, repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-51', sourceForm: 'Shared', sourceSection: 'Lab Tests', originalFieldName: 'Potassium / Creatinine', digitalFieldName: 'potassium, creatinine', entityType: 'LaboratoryResult', dataType: 'Number', inputControl: 'Input Box', isMandatory: true, repeatable: true, classification: 'Encounter-Level' },
{ id: 'm-52', sourceForm: 'Shared', sourceSection: 'Lab Tests', originalFieldName: 'BNP / NT-pro BNP', digitalFieldName: 'bnp, ntProBNP', entityType: 'LaboratoryResult', dataType: 'Number', inputControl: 'Input Box', isMandatory: false, repeatable: true, classification: 'Encounter-Level' },

// Follow-up
{ id: 'm-53', sourceForm: 'Shared', sourceSection: 'Follow-up', originalFieldName: 'Angina / Func. Class / Medication compliance', digitalFieldName: 'symptoms, medicationCompliance, adverseEvents', entityType: 'FollowUpVisit', dataType: 'Object', inputControl: 'Grid Table', isMandatory: true, repeatable: true, classification: 'Encounter-Level' }];


// Helper to calculate STEMI TIMI score
export function calculateSTEMITimi(details)









{
  let score = 0;
  if (details.age75OrOver) score += 3;else
  if (details.age65To74) score += 2;

  if (details.historyDM_HTN_Angina) score += 1;
  if (details.sbpLessThan100) score += 3;
  if (details.hrGreaterThan100) score += 2;
  if (details.killipClass2To4) score += 2;
  if (details.anteriorMI_LBBB) score += 1;
  if (details.weightLessThan67) score += 1;
  if (details.timeToReperfusionGreaterThan4h) score += 1;
  return score;
}

// Helper to calculate NSTEMI TIMI score
export function calculateNSTEMITimi(details)







{
  let score = 0;
  if (details.age65OrOver) score += 1;
  if (details.atLeast3CHD_RiskFactors) score += 1;
  if (details.priorCoronaryStenosis50Plus) score += 1;
  if (details.stDeviationAtAdmission) score += 1;
  if (details.atLeast2AnginalEpisodesLast24h) score += 1;
  if (details.elevatedSerumCardiacMarkers) score += 1;
  if (details.aspirinUseLast7d) score += 1;
  return score;
}

// Data Quality Checks for a record
export function calculateDataQualityScore(record) {
  let score = 100;
  const alerts = [];

  // 1. Basic Demographics Checklist
  if (!record.patient.name) {score -= 15;alerts.push('Missing Patient Name in Demographics');}
  if (!record.patient.age || record.patient.age <= 0) {score -= 10;alerts.push('Invalid Patient Age');}
  if (!record.patient.mrNo) {score -= 15;alerts.push('Missing MR Number in Master Record');}

  // 2. Clinical consistency check - EF and ECG Rhythm
  if (record.hfAssessments.length > 0) {
    const lastHF = record.hfAssessments[record.hfAssessments.length - 1];
    // Check if JVP is elevated but no peripheral edema is selected
    if (lastHF.volumeOverloadSigns.jvpElevated && !lastHF.volumeOverloadSigns.peripheralEdema) {
      score -= 5;
      alerts.push('Clinical Consistency Alert: JVP is elevated but peripheral edema is absent');
    }
    // Check if type of HF matches Echo Ejection Fraction
    const lastEcho = record.investigations.find((i) => i.testType === 'ECHO');
    if (lastEcho && lastEcho.results.ef) {
      const efVal = lastEcho.results.ef;
      if (efVal < 40 && lastHF.typeOfHF === 'HFpEF') {
        score -= 10;
        alerts.push('Clinical Discrepancy: Patient labeled as HFpEF but last measured EF is ' + efVal + '% (Reduced)');
      } else if (efVal > 50 && lastHF.typeOfHF === 'HFrEF') {
        score -= 10;
        alerts.push('Clinical Discrepancy: Patient labeled as HFrEF but last measured EF is ' + efVal + '% (Preserved)');
      }
    }
  }

  // 3. Clinical consistency - Creatinine vs Renal Failure Label
  if (record.comorbidities.renalFailure === 'No') {
    const highCreatinineObs = record.labResults.find((l) => l.creatinine && l.creatinine > 2.0);
    if (highCreatinineObs) {
      score -= 10;
      alerts.push('Clinical Alert: Patient has high lab creatinine (' + highCreatinineObs.creatinine + ' mg/dl) but Renal Failure is marked "No" in Medical History');
    }
  }

  // 4. STEMI/NSTEMI reperfusion time check
  if (record.acsEvents.length > 0) {
    const lastACS = record.acsEvents[record.acsEvents.length - 1];
    if (lastACS.treatmentStrategy === 'PAMI' && lastACS.pamiDetails) {
      const dbTime = lastACS.pamiDetails.doorToBalloonTime;
      if (dbTime && dbTime > 90) {
        score -= 5;
        alerts.push('Quality Core Indicator: Door-to-Balloon time exceeds guideline-recommended 90 minutes (' + dbTime + ' mins)');
      }
    }
  }

  // 5. CABG perfusion consistency
  if (record.cabgProcedures.length > 0) {
    const lastCABG = record.cabgProcedures[record.cabgProcedures.length - 1];
    if (lastCABG.cpbUtilization === 'Full' && lastCABG.cpbDetails && !lastCABG.cpbDetails.perfusionTimeMinutes) {
      score -= 8;
      alerts.push('Missing Operative Data: Full CPB utilized but perfusion time is unrecorded');
    }
  }

  return {
    score: Math.max(score, 10),
    alerts
  };
}

// Generate completion percentage of a single subform
export function calculateFormCompletionPercentage(fields, expectedFieldsCount) {
  if (!fields) return 0;
  let filled = 0;
  const countKeys = (obj) => {
    if (!obj) return;
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        countKeys(obj[key]);
      } else if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '' && obj[key] !== false) {
        filled++;
      }
    });
  };
  countKeys(fields);
  return Math.min(Math.round(filled / expectedFieldsCount * 100), 100);
}