import React, { useState, useEffect } from 'react';
import { User, MapPin, Briefcase, GraduationCap, X, Check, Phone, Mail, Shield, CreditCard, Sparkles } from 'lucide-react';
import { buildPatientPayload } from '../utils/patientMapper';
import { validateField } from '../utils/validation';
import { formatDateForDisplay } from '../utils/dateUtils';
import { sanitizePhone, sanitizePincode, sanitizeAlphaOnly, sanitizeUHID, sanitizeABHA } from '../utils/formSanitizers';
import { createPatient, updatePatient, verifyPatient, confirmPatientMatch, rejectPatientMatch, resolveStagingPatient } from '../../api/patientApi';
import PatientVerificationModal from './PatientVerificationModal';

const HIGHER_EDUCATION_OPTIONS = [
  'Primary',
  'Secondary',
  'Graduate',
  'Post Graduate',
  'None'
];

export const PATIENT_STATUS_OPTIONS = [
  'ACTIVE',
  'INACTIVE',
  'DECEASED'
];

function formatDateForInput(dateVal) {
  if (!dateVal) return '';
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
    return dateVal.trim();
  }
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

function calculateAge(dobString) {
  if (!dobString) return null;
  try {
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const diffMs = Date.now() - dob.getTime();
    if (diffMs < 0) return 0;
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  } catch {
    return null;
  }
}

export default function RegisterNewPatient({
  initialData = null,
  onSuccess,
  onCancel,
  isEditMode = false
}) {
  // Core Demographic State
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(null);
  const [phoneError, setPhoneError] = useState(null);
  const [mrNo, setMrNo] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [uhid, setUhid] = useState('');
  const [abhaNumber, setAbhaNumber] = useState('');

  // Address, Higher Education, Occupation
  const [address, setAddress] = useState('');
  const [houseFlatNo, setHouseFlatNo] = useState('');
  const [streetLocality, setStreetLocality] = useState('');
  const [villageTown, setVillageTown] = useState('');
  const [mandal, setMandal] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Telangana');
  const [pincode, setPincode] = useState('');
  const [higherEducation, setHigherEducation] = useState('None');
  const [occupation, setOccupation] = useState('');

  // Co-morbidities State
  const [hypertension, setHypertension] = useState('No');
  const [diabetes, setDiabetes] = useState('No');
  const [diabetesControl, setDiabetesControl] = useState('None');
  const [smoking, setSmoking] = useState('No');
  const [renalFailure, setRenalFailure] = useState('No');
  const [dialysisStatus, setDialysisStatus] = useState('No');

  const [loading, setLoading] = useState(false);
  const [patientStatus, setPatientStatus] = useState('ACTIVE');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [pendingPayload, setPendingPayload] = useState(null);

  // Pre-fill state when initialData / patient record changes (Data Hydration)
  useEffect(() => {
    if (initialData) {
      const p = initialData.patient || initialData;
      setName(p.name || p.patient_name || '');
      setMrNo(p.mrNo || p.mr_no || '');
      setDob(formatDateForInput(p.dob || p.date_of_birth));
      setGender(p.gender || '');
      setPatientStatus(p.patient_status || p.status || 'ACTIVE');
      setDateOfDeath(formatDateForInput(p.date_of_death || p.dateOfDeath));
      setBloodGroup(p.bloodGroup || p.blood_group || '');
      setPhone(p.phone || p.phone_no || '');
      setEmail(p.email || '');
      setUhid(p.uhi || p.uhid || '');
      setAbhaNumber(p.abha_number || p.abhaNumber || '');
      setAddress(p.address || '');

      let hNo = p.houseFlatNo || p.house_flat_no || '';
      let sLoc = p.streetLocality || p.street_locality || '';
      let vTown = p.villageTown || p.village_town || '';
      let mnd = p.mandal || '';
      let dist = p.district || '';
      let st = p.state || 'Telangana';
      let pin = p.pincode || '';

      // Fallback: If structured fields are empty on existing record, parse legacy address string
      if (!hNo && !sLoc && !vTown && !mnd && !dist && !pin && p.address) {
        const rawParts = String(p.address).split(',').map(s => s.trim()).filter(Boolean);
        if (rawParts.length > 0) {
          const last = rawParts[rawParts.length - 1];
          if (/^\d{6}$/.test(last)) {
            pin = last;
            rawParts.pop();
          }
          if (rawParts.length >= 1) dist = rawParts.pop();
          if (rawParts.length >= 1) vTown = rawParts.pop();
          if (rawParts.length >= 1) sLoc = rawParts.pop();
          if (rawParts.length >= 1) hNo = rawParts.join(', ');
        }
      }

      setHouseFlatNo(hNo);
      setStreetLocality(sLoc);
      setVillageTown(vTown);
      setMandal(mnd);
      setDistrict(dist);
      setState(st || 'Telangana');
      setPincode(pin);

      setHigherEducation(p.higherEducation || p.higher_education || 'None');
      setOccupation(p.occupation || '');
      setHypertension(p.hypertension || initialData.comorbidities?.hypertension || 'No');
      setDiabetes(p.diabetes || initialData.comorbidities?.diabetes || 'No');
      setDiabetesControl(p.diabetesControl || initialData.comorbidities?.diabetesControl || 'None');
      setSmoking(p.smoking || initialData.comorbidities?.smoking || 'No');
      setRenalFailure(p.renalFailure || initialData.comorbidities?.renalFailure || 'No');
      setDialysisStatus(p.dialysisStatus || initialData.comorbidities?.dialysisStatus || 'No');
    }
  }, [initialData]);

  // Autofill test data matching existing Patient XYZ to trigger duplicate detection
  const handleAutofillDuplicate = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setMrNo(`MR${randomSuffix}`);
    setName('Patient XYZ');
    setDob('1966-01-01');
    setGender('Male');
    setBloodGroup('A+');
    setPhone('9878950020');
    setEmail('PatientXYZ@gmail.com');
    setUhid('UHID12321');
    setAbhaNumber('ABHA0987654321');
    setHouseFlatNo('Flat 402, Sai Residency');
    setStreetLocality('Road No 12, Banjara Hills');
    setVillageTown('Hyderabad');
    setMandal('Khairatabad');
    setDistrict('Hyderabad');
    setState('Telangana');
    setPincode('500034');
    setOccupation('Business Consultant');
    setHigherEducation('Graduate');
    setHypertension('Yes');
    setSmoking('Yes');
    setDiabetes('No');
    setDiabetesControl('None');
    setRenalFailure('No');
    setDialysisStatus('No');
  };

  const handleSelectExistingCandidate = async (candidate, verificationId) => {
    try {
      const activeStagingId = verificationResult?.staging_id || pendingPayload?.staging_id;
      if (activeStagingId) {
        await resolveStagingPatient({
          staging_id: activeStagingId,
          action: 'MERGE',
          target_patient_id: candidate.patient_id
        });
      } else {
        await confirmPatientMatch({
          reg_patient_id: candidate.patient_id,
          candidate_patient_id: activeStagingId,
          staging_id: activeStagingId,
          verification_id: verificationId,
          user_decision: 'USE_EXISTING_PATIENT'
        });
      }
      setVerificationModalOpen(false);
      alert(`Existing patient file selected: ${candidate.full_name} (MR: ${candidate.mr_no || candidate.patient_id}).`);
      if (onSuccess) {
        onSuccess(candidate);
      }
    } catch (err) {
      console.error('Error confirming match:', err);
      alert('Failed to select existing patient.');
    }
  };

  const handleForceCreateCandidate = async (verificationId, candidateId) => {
    try {
      const activeStagingId = verificationResult?.staging_id || pendingPayload?.staging_id;
      setVerificationModalOpen(false);
      setLoading(true);

      let response;
      if (activeStagingId) {
        response = await resolveStagingPatient({
          staging_id: activeStagingId,
          action: 'FORCE_CREATE',
          target_patient_id: candidateId
        });
      } else {
        response = await createPatient({
          ...pendingPayload,
          staging_id: activeStagingId,
          matched_patient_id: candidateId
        }, { confirm_no_existing_match: true });
      }

      if (response?.success || response?.action === 'MANUAL_CREATED' || response?.data) {
        alert('Patient registered successfully.');
        if (onSuccess) {
          onSuccess(response.data || response.patient);
        }
      } else {
        alert(response?.message || 'Registration failed.');
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Registration failed.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mrNo.trim()) {
      alert('MR No (Medical Record Number) is required.');
      return;
    }

    if (!uhid.trim()) {
      alert('UHID is required.');
      return;
    }

    if (!name.trim()) {
      alert('Patient Full Name is required.');
      return;
    }
    const nameValRes = validateField('name', name);
    if (!nameValRes.isValid) {
      alert(nameValRes.error);
      return;
    }

    if (!dob) {
      alert('Date of Birth is required.');
      return;
    }

    if (!gender) {
      alert('Gender is required.');
      return;
    }

    const fullAddressCombined = [houseFlatNo, streetLocality, villageTown, mandal, district, state, pincode].filter(Boolean).join(', ');
    if (!fullAddressCombined.trim() && !address.trim()) {
      alert('Residential address details are required.');
      return;
    }

    if (!phone.trim()) {
      alert('Contact Phone is required.');
      return;
    }
    const phoneValRes = validateField('phone', phone);
    if (!phoneValRes.isValid) {
      alert(phoneValRes.error);
      return;
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        alert('Please enter a valid email address.');
        return;
      }
    }

    if (!bloodGroup) {
      alert('Blood Group is required.');
      return;
    }

    if (occupation.length > 255) {
      alert('Occupation cannot exceed 255 characters.');
      return;
    }

    if (!HIGHER_EDUCATION_OPTIONS.includes(higherEducation)) {
      alert('Please select a valid Higher Education option.');
      return;
    }

    if (patientStatus === 'DECEASED') {
      if (!dateOfDeath) {
        alert('Date of Death is required when Patient Status is DECEASED.');
        return;
      }
      if (dob && new Date(dateOfDeath) < new Date(dob)) {
        alert('Date of Death cannot be earlier than Date of Birth.');
        return;
      }
      if (new Date(dateOfDeath) > new Date()) {
        alert('Date of Death cannot be in the future.');
        return;
      }
    }

    const payload = buildPatientPayload({
      name,
      mrNo,
      dob,
      gender,
      bloodGroup,
      phone,
      email,
      address: fullAddressCombined || address,
      houseFlatNo,
      streetLocality,
      villageTown,
      mandal,
      district,
      state,
      pincode,
      higherEducation,
      occupation,
      hypertension,
      smoking,
      diabetes,
      diabetesControl,
      renalFailure,
      dialysisStatus,
      uhid,
      abhaNumber,
      patientStatus: patientStatus || 'ACTIVE',
      dateOfDeath: patientStatus === 'DECEASED' ? dateOfDeath : null
    });

    setLoading(true);

    try {
      if (isEditMode && (initialData?.patient?.id || initialData?.id)) {
        const regPatientId = initialData?.patient?.id || initialData?.id;
        const response = await updatePatient(regPatientId, payload);
        if (response?.success) {
          alert('Patient updated successfully.');
          if (onSuccess) {
            onSuccess(response.data);
          }
        } else {
          alert(response?.message || 'Patient update failed.');
        }
      } else {
        // Direct Unified Staging Intercept Call (POST /api/patients)
        // Guarantees exactly ONE staging row per submission lifecycle
        try {
          const response = await createPatient(payload);
          if (response?.success) {
            alert('Patient registered successfully.');
            if (onSuccess) {
              onSuccess(response.data);
            }
          } else {
            alert(response?.message || 'Patient registration failed.');
          }
        } catch (postErr) {
          const errData = postErr?.response?.data;
          const isConflict = postErr?.response?.status === 409;

          if (isConflict && Array.isArray(errData?.candidates) && errData.candidates.length > 0) {
            console.log('[RegisterNewPatient] Duplicate match intercepted by backend staging engine:', errData);
            setVerificationResult(errData);
            setPendingPayload({
              ...payload,
              staging_id: errData.staging_id
            });
            setVerificationModalOpen(true);
            setLoading(false);
            return;
          }

          throw postErr;
        }
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Operation failed.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-blue-200 flex flex-col max-h-[90vh] h-auto w-full relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600 z-10"></div>

      {/* Fixed Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-100 shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-slate-800">
            {isEditMode ? 'Edit Patient Master Record' : 'Master Registry: Patient Registration'}
          </h3>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main 3-Column Content Body (Tight vertical padding, no scroll) */}
      <div className="flex-1 overflow-y-auto py-2 px-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        
        {/* COLUMN 1: Demographics & Profile */}
        <div className="space-y-2 bg-slate-50/70 py-2.5 px-3 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-1">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Demographics & Profile</h4>
            </div>
          </div>

          {/* Patient Status Dropdown */}
          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 p-2 rounded-xl border border-blue-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="reg-patient-status" className="block text-[11px] font-bold text-slate-700">
                Patient Status <span className="text-red-500 font-bold">*</span>
              </label>
              <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wider ${
                patientStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                patientStatus === 'DECEASED' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                'bg-slate-100 text-slate-700 border border-slate-300'
              }`}>
                {patientStatus}
              </span>
            </div>
            <select
              id="reg-patient-status"
              value={patientStatus}
              onChange={(e) => setPatientStatus(e.target.value)}
              className="w-full p-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 cursor-pointer shadow-2xs"
            >
              {PATIENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {/* Conditional Date of Death Field (when status is DECEASED) */}
            {patientStatus === 'DECEASED' && (
              <div className="bg-rose-50/90 p-2.5 rounded-lg border border-rose-200 mt-2 space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label htmlFor="reg-date-of-death" className="block text-[11px] font-bold text-rose-900">
                    Date of Death <span className="text-red-600 font-bold">*</span>
                  </label>
                  <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 uppercase">
                    DD-MM-YYYY
                  </span>
                </div>
                <input
                  id="reg-date-of-death"
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  min={dob || undefined}
                  className="w-full p-1.5 text-xs font-semibold bg-white border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-900 shadow-2xs cursor-pointer"
                  value={dateOfDeath}
                  onChange={(e) => setDateOfDeath(e.target.value)}
                />
                {dateOfDeath && (
                  <p className="text-[10px] text-rose-700 font-medium">
                    Formatted: <strong>{formatDateForDisplay(dateOfDeath)}</strong> (DD-MM-YYYY)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 1. MR No (Medical Record Number) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-0.5">
              MR No (Medical Record Number) <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <input
              id="reg-mr-no"
              type="text"
              required
              maxLength={10}
              className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-slate-900"
              value={mrNo}
              onChange={(e) => setMrNo(e.target.value)}
              placeholder="E.g. MR00001"
            />
          </div>

          {/* UHID & ABHA Number */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                UHID <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <input
                id="reg-uhid"
                type="text"
                required
                maxLength={10}
                placeholder="E.g. UHI12345"
                className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                value={uhid}
                onChange={(e) => setUhid(sanitizeUHID(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">ABHA Number</label>
              <input
                id="reg-abha"
                type="text"
                maxLength={14}
                placeholder="14-digit ABHA"
                className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                value={abhaNumber}
                onChange={(e) => setAbhaNumber(sanitizeABHA(e.target.value))}
              />
            </div>
          </div>

          {/* 2. Full Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-0.5">Full Name <span className="text-red-500 font-bold ml-0.5">*</span></label>
            <input
              id="reg-name"
              type="text"
              required
              className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={name}
              onChange={(e) => {
                const val = e.target.value;
                const res = validateField('name', val);
                setNameError(res.isValid ? null : res.error);
                setName(val);
              }}
              onBlur={(e) => {
                const res = validateField('name', e.target.value);
                setNameError(res.isValid ? null : res.error);
              }}
              placeholder="E.g. Ramesh Chandra Malhotra"
            />
            {nameError && (
              <span className="text-red-500 text-[10px] block mt-1 font-bold">{nameError}</span>
            )}
          </div>

          {/* 2. Date of Birth */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-0.5">Date of Birth <span className="text-red-500 font-bold ml-0.5">*</span></label>
            <input
              id="reg-dob"
              type="date"
              required
              className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          {/* 3. Gender */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-0.5">Gender <span className="text-red-500 font-bold ml-0.5">*</span></label>
            <select
              id="reg-gender"
              required
              className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* 4. Age (Calculated automatically) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-0.5">Age (Years)</label>
            <input
              id="reg-age"
              type="text"
              readOnly
              disabled
              className="w-full p-1.5 text-xs bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold focus:outline-none cursor-not-allowed"
              value={calculateAge(dob) !== null ? `${calculateAge(dob)} Years` : '—'}
            />
          </div>

          {/* 5. Occupation */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-0.5">Occupation</label>
            <input
              id="reg-occupation"
              type="text"
              maxLength={255}
              className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="E.g. Engineer, Teacher, Farmer"
            />
          </div>

          {/* 6. Higher Education (Radio Group) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Higher Education</label>
            <div className="grid grid-cols-2 gap-1 bg-white p-2 rounded-lg border border-slate-300">
              {HIGHER_EDUCATION_OPTIONS.map((eduOption) => (
                <label key={eduOption} className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer py-0.5">
                  <input
                    type="radio"
                    name="higherEducationRadio"
                    value={eduOption}
                    checked={higherEducation === eduOption}
                    onChange={(e) => setHigherEducation(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>{eduOption}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 2: Contact & Address + Distinct Medical Information */}
        <div className="space-y-3">
          {/* Card A: PATIENT CONTACT & RESIDENTIAL ADDRESS */}
          <div className="space-y-2.5 bg-slate-50/70 py-2.5 px-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Residential Address & Contact</h4>
            </div>

            {/* Row 1: House/Flat No + Street/Locality */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">House / Flat No</label>
                <input
                  id="reg-house-flat-no"
                  type="text"
                  maxLength={100}
                  placeholder="E.g. Flat 402, Sai Residency"
                  className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={houseFlatNo}
                  onChange={(e) => setHouseFlatNo(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">Street / Locality</label>
                <input
                  id="reg-street-locality"
                  type="text"
                  maxLength={255}
                  placeholder="E.g. Road No 12, Banjara Hills"
                  className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={streetLocality}
                  onChange={(e) => setStreetLocality(e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Village/Town/City + Mandal */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">Village / Town / City</label>
                <input
                  id="reg-village-town"
                  type="text"
                  maxLength={150}
                  placeholder="E.g. Hyderabad"
                  className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={villageTown}
                  onChange={(e) => setVillageTown(sanitizeAlphaOnly(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">Mandal</label>
                <input
                  id="reg-mandal"
                  type="text"
                  maxLength={100}
                  placeholder="E.g. Khairatabad"
                  className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={mandal}
                  onChange={(e) => setMandal(sanitizeAlphaOnly(e.target.value))}
                />
              </div>
            </div>

            {/* Row 3: District + State + PIN Code */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">District</label>
                <input
                  id="reg-district"
                  type="text"
                  maxLength={100}
                  placeholder="E.g. Hyderabad"
                  className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={district}
                  onChange={(e) => setDistrict(sanitizeAlphaOnly(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">State</label>
                <input
                  id="reg-state"
                  type="text"
                  maxLength={100}
                  placeholder="E.g. Telangana"
                  className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={state}
                  onChange={(e) => setState(sanitizeAlphaOnly(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">PIN Code</label>
                <input
                  id="reg-pincode"
                  type="text"
                  maxLength={10}
                  placeholder="500034"
                  className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  value={pincode}
                  onChange={(e) => setPincode(sanitizePincode(e.target.value))}
                />
              </div>
            </div>

            {/* Contact Phone & Email */}
            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200/80">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">Contact Phone <span className="text-red-500 font-bold ml-0.5">*</span></label>
                <input
                  id="reg-phone"
                  type="text"
                  required
                  maxLength={10}
                  placeholder="9848012345"
                  className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  value={phone}
                  onChange={(e) => {
                    const cleanPhone = sanitizePhone(e.target.value);
                    const res = validateField('phone', cleanPhone);
                    setPhoneError(res.isValid ? null : res.error);
                    setPhone(cleanPhone);
                  }}
                  onBlur={(e) => {
                    const res = validateField('phone', e.target.value);
                    setPhoneError(res.isValid ? null : res.error);
                  }}
                />
                {phoneError && (
                  <span className="text-red-500 text-[10px] block mt-1 font-bold">{phoneError}</span>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="patient@example.com"
                  className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Card B: MEDICAL INFORMATION */}
          <div className="space-y-2 bg-slate-50/70 py-2.5 px-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
              <User className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Medical Information</h4>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-0.5">Blood Group <span className="text-red-500 font-bold ml-0.5">*</span></label>
              <select
                id="reg-bloodgroup"
                required
                className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>
        </div>

        {/* COLUMN 3: Baseline Comorbidities */}
        <div className="space-y-2 bg-slate-50/70 py-2.5 px-3 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1.5">
            <Shield className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Baseline Comorbidities</h4>
          </div>

          {/* Hypertension */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Hypertension</label>
            <div className="flex gap-1">
              {['Yes', 'No', 'Unknown'].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setHypertension(opt)}
                  className={`flex-1 py-1 text-xs rounded-md border text-center transition-all ${
                    hypertension === opt
                      ? 'bg-blue-50/50 border-blue-500 text-blue-900 font-semibold shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Smoking */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Smoking</label>
            <div className="flex gap-1">
              {['Yes', 'No', 'Unknown'].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setSmoking(opt)}
                  className={`flex-1 py-1 text-xs rounded-md border text-center transition-all ${
                    smoking === opt
                      ? 'bg-blue-50/50 border-blue-500 text-blue-900 font-semibold shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Diabetes Mellitus */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Diabetes Mellitus</label>
            <div className="flex gap-1 mb-1.5">
              {['Yes', 'No', 'Unknown'].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setDiabetes(opt)}
                  className={`flex-1 py-1 text-xs rounded-md border text-center transition-all ${
                    diabetes === opt
                      ? 'bg-blue-50/50 border-blue-500 text-blue-900 font-semibold shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {diabetes === 'Yes' && (
              <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Diabetes Control Mode</label>
                <select
                  className="w-full p-1 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={diabetesControl}
                  onChange={(e) => setDiabetesControl(e.target.value)}
                >
                  <option value="None">None (Uncontrolled)</option>
                  <option value="Diet">Dietary Control Only</option>
                  <option value="Oral">Oral Hypoglycemics (OHA)</option>
                  <option value="Insulin">Insulin Therapy</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
            )}
          </div>

          {/* Renal Failure */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Renal Failure</label>
            <div className="flex gap-1 mb-1.5">
              {['Yes', 'No', 'Unknown'].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setRenalFailure(opt)}
                  className={`flex-1 py-1 text-xs rounded-md border text-center transition-all ${
                    renalFailure === opt
                      ? 'bg-blue-50/50 border-blue-500 text-blue-900 font-semibold shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {renalFailure === 'Yes' && (
              <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Active Dialysis Status</label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="dialysisRadio"
                      value="Yes"
                      checked={dialysisStatus === 'Yes'}
                      onChange={() => setDialysisStatus('Yes')}
                    />
                    <span>Under Dialysis</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="dialysisRadio"
                      value="No"
                      checked={dialysisStatus === 'No'}
                      onChange={() => setDialysisStatus('No')}
                    />
                    <span>No Dialysis</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pinned Footer Action Buttons */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0 mt-auto">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>{loading ? 'Saving...' : isEditMode ? 'Update Patient Record' : 'Verify & Register Patient'}</span>
        </button>
      </div>

      {/* Patient Identity Resolution & Deduplication Interceptor Modal */}
      <PatientVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        verificationData={verificationResult}
        incomingPatient={pendingPayload}
        onSelectExisting={handleSelectExistingCandidate}
        onForceCreate={handleForceCreateCandidate}
      />
    </form>
  );
}
