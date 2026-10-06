import React, { useState, useEffect } from 'react';
import { User, MapPin, Briefcase, GraduationCap, X, Check, Phone, Mail, Shield, CreditCard, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { buildPatientPayload } from '../utils/patientMapper';
import { validateField } from '../utils/validation';
import { formatDateForDisplay, getLocalDateString } from '../utils/dateUtils';
import { sanitizePhone, sanitizePincode, sanitizeAlphaOnly, sanitizeMRNo, sanitizeUHID, handlePrefixedKeyDown, handlePrefixedFocus, sanitizeABHA, sanitizeAadhaar, validateABHAAddress } from '../utils/formSanitizers';
import { createPatient, updatePatient, verifyPatient, confirmPatientMatch, rejectPatientMatch, resolveStagingPatient } from '../../api/patientApi';
import PatientVerificationModal from './PatientVerificationModal';
import useUniqueCheck from '../hooks/useUniqueCheck';
import { useAlert } from '../context/AlertContext';

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
  const [mrNo, setMrNo] = useState('DDH.');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [uhid, setUhid] = useState('DDCH.');
  const [nationalIdType, setNationalIdType] = useState('ABHA');
  const [abhaNumber, setAbhaNumber] = useState('');
  const [abhaAddress, setAbhaAddress] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');

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

  const currentPatientId = initialData?.patient?.id || initialData?.patient?.reg_patient_id || initialData?.reg_patient_id || initialData?.id || null;
  const { showAlert } = useAlert();

  const {
    errors: uniqueErrors,
    loading: uniqueLoading,
    isChecking: isUniqueChecking,
    hasUniquenessErrors,
    verifyFieldUnique,
    showDuplicateModal,
    clearFieldError: clearUniqueError
  } = useUniqueCheck();

  // Pre-fill state when initialData / patient record changes (Data Hydration)
  useEffect(() => {
    if (initialData) {
      const p = initialData.patient || initialData;
      setName(p.name || p.patient_name || '');
      const rawMr = p.mrNo || p.mr_no || '';
      if (!rawMr || rawMr === 'DDH.0000' || rawMr === '0000' || !rawMr.toUpperCase().startsWith('DDH.')) {
        setMrNo('DDH.');
      } else {
        const sanitized = sanitizeMRNo(rawMr);
        setMrNo(sanitized === 'DDH.0000' ? 'DDH.' : sanitized);
      }
      setDob(formatDateForInput(p.dob || p.date_of_birth));
      setGender(p.gender || '');
      setPatientStatus(p.patient_status || p.status || 'ACTIVE');
      setDateOfDeath(formatDateForInput(p.date_of_death || p.dateOfDeath));
      setBloodGroup(p.bloodGroup || p.blood_group || '');
      setPhone(p.phone || p.phone_no || '');
      setEmail(p.email || '');
      const rawUhid = p.uhi || p.uhid || '';
      if (!rawUhid || rawUhid === 'DDCH.00000' || rawUhid === '00000' || !rawUhid.toUpperCase().startsWith('DDCH.')) {
        setUhid('DDCH.');
      } else {
        const sanitizedUhid = sanitizeUHID(rawUhid);
        setUhid(sanitizedUhid === 'DDCH.00000' ? 'DDCH.' : sanitizedUhid);
      }
      const idType = p.national_id_type || p.nationalIdType || (p.aadhaar_number || p.aadhaarNumber ? 'Aadhaar' : 'ABHA');
      setNationalIdType(idType);
      setAbhaNumber(p.abha_number || p.abhaNumber ? sanitizeABHA(p.abha_number || p.abhaNumber) : '');
      setAbhaAddress(p.abha_address || p.abhaAddress || '');
      setAadhaarNumber(p.aadhaar_number || p.aadhaarNumber ? sanitizeAadhaar(p.aadhaar_number || p.aadhaarNumber) : '');
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
    setMrNo(`DDH.${randomSuffix}`);
    setName('Patient XYZ');
    setDob('1966-01-01');
    setGender('Male');
    setBloodGroup('A+');
    setPhone('9878950020');
    setEmail('PatientXYZ@gmail.com');
    setUhid('DDCH.14250');
    setNationalIdType('ABHA');
    setAbhaNumber('12-3456-7890-1234');
    setAbhaAddress('patient.xyz@abdm');
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
      await showAlert({
        type: 'info',
        title: 'Existing Patient Record',
        message: `Existing patient file selected: ${candidate.full_name} (MR: ${candidate.mr_no || candidate.patient_id}).`,
        confirmText: 'OK'
      });
      if (onSuccess) {
        onSuccess(candidate);
      }
    } catch (err) {
      console.error('Error confirming match:', err);
      await showAlert({
        type: 'danger',
        title: 'Selection Failed',
        message: 'Failed to select existing patient.'
      });
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
        await showAlert({
          type: 'success',
          title: 'Patient Registered Successfully',
          message: '',
          confirmText: 'OK'
        });
        if (onSuccess) {
          onSuccess(response.data || response.patient);
        }
      } else {
        await showAlert({
          type: 'danger',
          title: 'Registration Failed',
          message: response?.message || 'Registration failed.'
        });
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Registration failed.';
      await showAlert({
        type: 'danger',
        title: 'Registration Error',
        message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isUniqueChecking) {
      if (showAlert) {
        await showAlert({
          type: 'info',
          title: 'Verifying Identifier',
          message: 'Please wait while identifier uniqueness is being verified.',
          confirmText: 'OK'
        });
      }
      return;
    }

    if (hasUniquenessErrors) {
      const firstDupField = Object.keys(uniqueErrors).find(k => !!uniqueErrors[k]) || 'mr_no';
      showDuplicateModal(firstDupField);
      return;
    }

    const cleanMrDigits = (mrNo || '').replace(/^DDH\./i, '').trim();
    if (!cleanMrDigits) {
      await showAlert({
        type: 'warning',
        title: 'Required Field',
        message: 'MR No (Medical Record Number) is required. Please enter 4 digits after DDH. (e.g. DDH.0001).',
        targetField: 'mr_no'
      });
      return;
    }

    if (cleanMrDigits.length !== 4) {
      await showAlert({
        type: 'warning',
        title: 'Invalid MR No',
        message: 'MR No must contain exactly 4 digits after DDH. (Format: DDH.0001 to DDH.9999).',
        targetField: 'mr_no'
      });
      return;
    }

    if (cleanMrDigits === '0000') {
      await showAlert({
        type: 'warning',
        title: 'Invalid MR No',
        message: 'MR No cannot be DDH.0000. Please enter a valid 4-digit number (DDH.0001 to DDH.9999).',
        targetField: 'mr_no'
      });
      return;
    }

    const cleanUhidDigits = (uhid || '').replace(/^DDCH\./i, '').trim();
    if (!cleanUhidDigits) {
      await showAlert({
        type: 'warning',
        title: 'Required Field',
        message: 'UHID is required. Please enter 5 digits after DDCH. (e.g. DDCH.14250).',
        targetField: 'uhid'
      });
      return;
    }

    if (cleanUhidDigits.length !== 5) {
      await showAlert({
        type: 'warning',
        title: 'Invalid UHID',
        message: 'UHID must contain exactly 5 digits after DDCH. (e.g. DDCH.14250).',
        targetField: 'uhid'
      });
      return;
    }

    if (!name.trim()) {
      await showAlert({
        type: 'warning',
        title: 'Required Field',
        message: 'Patient Full Name is required.',
        targetField: 'name'
      });
      return;
    }
    const nameValRes = validateField('name', name);
    if (!nameValRes.isValid) {
      await showAlert({
        type: 'warning',
        title: 'Invalid Name',
        message: nameValRes.error,
        targetField: 'name'
      });
      return;
    }

    if (!dob) {
      await showAlert({
        type: 'warning',
        title: 'Required Field',
        message: 'Date of Birth is required.',
        targetField: 'dob'
      });
      return;
    }

    if (!gender) {
      await showAlert({
        type: 'warning',
        title: 'Required Field',
        message: 'Gender is required.',
        targetField: 'gender'
      });
      return;
    }

    const fullAddressCombined = [houseFlatNo, streetLocality, villageTown, mandal, district, state, pincode].filter(Boolean).join(', ');
    if (!fullAddressCombined.trim() && !address.trim()) {
      await showAlert({
        type: 'warning',
        title: 'Required Field',
        message: 'Residential address details are required.',
        targetField: 'house_flat_no'
      });
      return;
    }

    if (!phone.trim()) {
      await showAlert({
        type: 'warning',
        title: 'Required Field',
        message: 'Contact Phone is required.',
        targetField: 'phone'
      });
      return;
    }
    const phoneValRes = validateField('phone', phone);
    if (!phoneValRes.isValid) {
      await showAlert({
        type: 'warning',
        title: 'Invalid Phone Number',
        message: phoneValRes.error,
        targetField: 'phone'
      });
      return;
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        await showAlert({
          type: 'warning',
          title: 'Invalid Email',
          message: 'Please enter a valid email address.',
          targetField: 'email'
        });
        return;
      }
    }

    if (!bloodGroup) {
      await showAlert({
        type: 'warning',
        title: 'Required Field',
        message: 'Blood Group is required.',
        targetField: 'blood_group'
      });
      return;
    }

    if (occupation.length > 255) {
      await showAlert({
        type: 'warning',
        title: 'Length Exceeded',
        message: 'Occupation cannot exceed 255 characters.',
        targetField: 'occupation'
      });
      return;
    }

    if (!HIGHER_EDUCATION_OPTIONS.includes(higherEducation)) {
      await showAlert({
        type: 'warning',
        title: 'Invalid Selection',
        message: 'Please select a valid Higher Education option.'
      });
      return;
    }

    if (patientStatus === 'DECEASED') {
      if (!dateOfDeath) {
        await showAlert({
          type: 'warning',
          title: 'Required Field',
          message: 'Date of Death is required when Patient Status is DECEASED.',
          targetField: 'date_of_death'
        });
        return;
      }
      if (dob && new Date(dateOfDeath) < new Date(dob)) {
        await showAlert({
          type: 'warning',
          title: 'Invalid Date',
          message: 'Date of Death cannot be earlier than Date of Birth.',
          targetField: 'date_of_death'
        });
        return;
      }
      if (new Date(dateOfDeath) > new Date()) {
        await showAlert({
          type: 'warning',
          title: 'Invalid Date',
          message: 'Date of Death cannot be in the future.',
          targetField: 'date_of_death'
        });
        return;
      }
    }

    if (nationalIdType === 'Aadhaar' && aadhaarNumber) {
      const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
      if (cleanAadhaar.length !== 12) {
        await showAlert({
          type: 'warning',
          title: 'Invalid Aadhaar',
          message: 'Aadhaar Number must be exactly 12 numeric digits.',
          targetField: 'aadhaar'
        });
        return;
      }
    }

    if (nationalIdType === 'ABHA') {
      if (abhaNumber) {
        const cleanAbha = abhaNumber.replace(/\D/g, '');
        if (cleanAbha.length !== 14) {
          await showAlert({
            type: 'warning',
            title: 'Invalid ABHA',
            message: 'ABHA Number must be exactly 14 numeric digits.',
            targetField: 'abha_number'
          });
          return;
        }
      }
      if (abhaAddress) {
        const addrCheck = validateABHAAddress(abhaAddress);
        if (!addrCheck.valid) {
          await showAlert({
            type: 'warning',
            title: 'Invalid ABHA Address',
            message: `Invalid ABHA Address: ${addrCheck.message}`,
            targetField: 'abha_address'
          });
          return;
        }
      }
    }

    // Proactively verify uniqueness of MR No, UHID, and ABHA Number before submitting
    if (mrNo && mrNo.trim() && cleanMrDigits) {
      const isMrUnique = await verifyFieldUnique('mr_no', {
        table: 'patient_registry',
        column: 'mr_no',
        value: mrNo.trim(),
        excludeId: currentPatientId,
        label: 'MR Number',
        showModal: true
      });
      if (!isMrUnique) {
        return;
      }
    }

    if (uhid && uhid.trim() && cleanUhidDigits) {
      const isUhidUnique = await verifyFieldUnique('uhid', {
        table: 'patient_registry',
        column: 'uhid',
        value: uhid.trim(),
        excludeId: currentPatientId,
        label: 'UHID',
        showModal: true
      });
      if (!isUhidUnique) {
        return;
      }
    }

    const cleanAbhaDigits = abhaNumber ? abhaNumber.replace(/\D/g, '') : '';
    if (nationalIdType === 'ABHA' && cleanAbhaDigits && cleanAbhaDigits.length === 14) {
      const isAbhaUnique = await verifyFieldUnique('abha_number', {
        table: 'patient_registry',
        column: 'abha_number',
        value: cleanAbhaDigits,
        excludeId: currentPatientId,
        label: 'ABHA Number',
        showModal: true
      });
      if (!isAbhaUnique) {
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
      nationalIdType,
      national_id_type: nationalIdType,
      aadhaarNumber: nationalIdType === 'Aadhaar' && aadhaarNumber ? aadhaarNumber.replace(/\D/g, '') : null,
      aadhaar_number: nationalIdType === 'Aadhaar' && aadhaarNumber ? aadhaarNumber.replace(/\D/g, '') : null,
      abhaNumber: nationalIdType === 'ABHA' && abhaNumber ? abhaNumber.replace(/\D/g, '') : null,
      abha_number: nationalIdType === 'ABHA' && abhaNumber ? abhaNumber.replace(/\D/g, '') : null,
      abhaAddress: nationalIdType === 'ABHA' ? abhaAddress : null,
      abha_address: nationalIdType === 'ABHA' ? abhaAddress : null,
      patientStatus: patientStatus || 'ACTIVE',
      dateOfDeath: patientStatus === 'DECEASED' ? dateOfDeath : null
    });

    setLoading(true);

    try {
      if (isEditMode && (initialData?.patient?.id || initialData?.id)) {
        const regPatientId = initialData?.patient?.id || initialData?.id;
        const response = await updatePatient(regPatientId, payload);
        if (response?.success) {
          await showAlert({
            type: 'success',
            title: 'Patient Updated Successfully',
            message: '',
            confirmText: 'OK'
          });
          if (onSuccess) {
            onSuccess(response.data);
          }
        } else {
          await showAlert({
            type: 'danger',
            title: 'Update Failed',
            message: response?.message || 'Patient update failed.'
          });
        }
      } else {
        // Direct Unified Staging Intercept Call (POST /api/patients)
        // Guarantees exactly ONE staging row per submission lifecycle
        try {
          const response = await createPatient(payload);
          if (response?.success) {
            await showAlert({
              type: 'success',
              title: 'Patient Registered Successfully',
              message: '',
              confirmText: 'OK'
            });
            if (onSuccess) {
              onSuccess(response.data);
            }
          } else {
            await showAlert({
              type: 'danger',
              title: 'Registration Failed',
              message: response?.message || 'Patient registration failed.'
            });
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
      console.error('Registration error:', error);
      await showAlert({
        type: 'danger',
        title: 'Registration Failed',
        message: error?.response?.data?.message || error?.message || 'Operation failed.'
      });
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

      {/* Main 3-Column Content Body (Balanced, No scrolling required for core fields) */}
      <div className="flex-1 overflow-y-auto py-2.5 px-3.5 grid grid-cols-1 md:grid-cols-3 gap-3.5 items-start">
        
        {/* COLUMN 1: Demographics & Profile (Primary Core Demographics first) */}
        <div className="space-y-2.5 bg-slate-50/70 py-2.5 px-3 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Demographics & Profile</h4>
            </div>
            <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Primary Info</span>
          </div>

          {/* 1. Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-0.5">
              Full Name <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <input
              id="reg-name"
              type="text"
              required
              className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-900 shadow-2xs"
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
              <span className="text-red-500 text-[10px] block mt-0.5 font-bold">{nameError}</span>
            )}
          </div>

          {/* 2. Gender, Date of Birth & Age (Inline 3-column row) */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                Gender <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <select
                id="reg-gender"
                required
                className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                Date of Birth <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <input
                id="reg-dob"
                type="date"
                required
                className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-0.5">Age</label>
              <input
                id="reg-age"
                type="text"
                readOnly
                disabled
                className="w-full p-1.5 text-xs bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold focus:outline-none cursor-not-allowed text-center"
                value={calculateAge(dob) !== null ? `${calculateAge(dob)} Yrs` : '—'}
              />
            </div>
          </div>

          {/* 3. Blood Group & Patient Status (Inline 2-column row) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                Blood Group <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <select
                id="reg-bloodgroup"
                required
                className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
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

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label htmlFor="reg-patient-status" className="block text-xs font-semibold text-slate-700">
                  Patient Status <span className="text-red-500 font-bold">*</span>
                </label>
                <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded uppercase tracking-wider ${
                  patientStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                  patientStatus === 'DECEASED' ? 'bg-rose-100 text-rose-800' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {patientStatus}
                </span>
              </div>
              <select
                id="reg-patient-status"
                value={patientStatus}
                onChange={(e) => setPatientStatus(e.target.value)}
                className="w-full p-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 cursor-pointer"
              >
                {PATIENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Date of Death Field (when status is DECEASED) */}
          {patientStatus === 'DECEASED' && (
            <div className="bg-rose-50/90 p-2 rounded-lg border border-rose-200 space-y-1 animate-fadeIn">
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
                max={getLocalDateString()}
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

          {/* 4. Contact Phone & Email Address */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                Contact Phone <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
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
                <span className="text-red-500 text-[10px] block mt-0.5 font-bold">{phoneError}</span>
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

          {/* 5. Occupation & Higher Education */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-0.5">Occupation</label>
              <input
                id="reg-occupation"
                type="text"
                maxLength={255}
                className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="E.g. Engineer, Teacher"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-0.5">Higher Education</label>
              <select
                id="reg-education"
                className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={higherEducation}
                onChange={(e) => setHigherEducation(e.target.value)}
              >
                {HIGHER_EDUCATION_OPTIONS.map((eduOption) => (
                  <option key={eduOption} value={eduOption}>
                    {eduOption}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Hospital & National Identifiers + Residential Address */}
        <div className="space-y-2.5">
          {/* Card A: Hospital & National Identifiers */}
          <div className="space-y-2 bg-slate-50/70 py-2.5 px-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-1">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hospital & National ID</h4>
              </div>
            </div>

            {/* MR No & UHID */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                  MR No. <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reg-mr-no"
                    name="mr_no"
                    data-field="mr_no"
                    type="text"
                    required
                    maxLength={8}
                    className={`w-full p-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 font-mono text-slate-900 pr-7 ${
                      uniqueErrors.mr_no
                        ? 'border-red-500 bg-red-50/50 focus:ring-red-400'
                        : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                    value={mrNo}
                    onChange={(e) => {
                      setMrNo(sanitizeMRNo(e.target.value));
                      clearUniqueError('mr_no');
                    }}
                    onKeyDown={(e) => handlePrefixedKeyDown(e, 'DDH.', 4)}
                    onFocus={(e) => handlePrefixedFocus(e, 'DDH.')}
                    onClick={(e) => handlePrefixedFocus(e, 'DDH.')}
                    onBlur={() => {
                      const digits = mrNo.replace(/^DDH\./i, '').trim();
                      if (digits.length === 4 && digits !== '0000') {
                        verifyFieldUnique('mr_no', {
                          table: 'patient_registry',
                          column: 'mr_no',
                          value: mrNo,
                          excludeId: currentPatientId,
                          label: 'MR Number'
                        });
                      }
                    }}
                    placeholder="DDH.0001"
                  />
                  {uniqueLoading.mr_no && (
                    <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-2 top-2" />
                  )}
                </div>
                {uniqueErrors.mr_no ? (
                  <span className="text-red-500 text-[10px] block mt-0.5 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {uniqueErrors.mr_no}
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-400 block mt-0.5">Format: DDH.0001 to DDH.9999 (4 digits)</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                  UHID (Triotree) <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reg-uhid"
                    name="uhid"
                    data-field="uhid"
                    type="text"
                    required
                    maxLength={10}
                    placeholder="DDCH.14250"
                    className={`w-full p-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 font-mono pr-7 ${
                      uniqueErrors.uhid
                        ? 'border-red-500 bg-red-50/50 focus:ring-red-400'
                        : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                    value={uhid}
                    onChange={(e) => {
                      setUhid(sanitizeUHID(e.target.value));
                      clearUniqueError('uhid');
                    }}
                    onKeyDown={(e) => handlePrefixedKeyDown(e, 'DDCH.', 5)}
                    onFocus={(e) => handlePrefixedFocus(e, 'DDCH.')}
                    onClick={(e) => handlePrefixedFocus(e, 'DDCH.')}
                    onBlur={() => {
                      const digits = uhid.replace(/^DDCH\./i, '').trim();
                      if (digits.length === 5 && digits !== '00000') {
                        verifyFieldUnique('uhid', {
                          table: 'patient_registry',
                          column: 'uhid',
                          value: uhid,
                          excludeId: currentPatientId,
                          label: 'UHID'
                        });
                      }
                    }}
                  />
                  {uniqueLoading.uhid && (
                    <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-2 top-2" />
                  )}
                </div>
                {uniqueErrors.uhid ? (
                  <span className="text-red-500 text-[10px] block mt-0.5 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {uniqueErrors.uhid}
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-400 block mt-0.5">IAC Code (e.g. DDCH.14250 - 5 digits)</span>
                )}
              </div>
            </div>

            {/* National ID Section */}
            <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  National ID
                </span>
                <div className="flex items-center gap-3 bg-slate-50 px-2 py-0.5 border border-slate-200 rounded-md">
                  <label className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="nationalIdType"
                      value="ABHA"
                      checked={nationalIdType === 'ABHA'}
                      onChange={() => setNationalIdType('ABHA')}
                      className="w-3 h-3 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>ABHA</span>
                  </label>
                  <label className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="nationalIdType"
                      value="Aadhaar"
                      checked={nationalIdType === 'Aadhaar'}
                      onChange={() => setNationalIdType('Aadhaar')}
                      className="w-3 h-3 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Aadhaar</span>
                  </label>
                </div>
              </div>

              {nationalIdType === 'ABHA' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] font-bold text-slate-700">
                        ABHA Number
                      </label>
                      <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-semibold ${
                        abhaNumber.replace(/\D/g, '').length === 14
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : abhaNumber.replace(/\D/g, '').length > 0
                            ? 'bg-amber-100 text-amber-700 border border-amber-300'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {abhaNumber.replace(/\D/g, '').length}/14{abhaNumber.replace(/\D/g, '').length === 14 ? ' ✓' : ''}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        id="reg-abha"
                        name="abha_number"
                        data-field="abha_number"
                        type="text"
                        maxLength={25}
                        placeholder="XX-XXXX-XXXX-XXXX"
                        className={`w-full p-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 font-mono pr-7 ${
                          uniqueErrors.abha_number
                            ? 'border-red-500 bg-red-50/50 focus:ring-red-400'
                            : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                        value={abhaNumber}
                        onChange={(e) => {
                          setAbhaNumber(sanitizeABHA(e.target.value, abhaNumber));
                          clearUniqueError('abha_number');
                        }}
                        onBlur={() => {
                          const cleanDigits = abhaNumber.replace(/\D/g, '');
                          if (cleanDigits.length === 14) {
                            verifyFieldUnique('abha_number', {
                              table: 'patient_registry',
                              column: 'abha_number',
                              value: cleanDigits,
                              excludeId: currentPatientId,
                              label: 'ABHA Number'
                            });
                          }
                        }}
                      />
                      {uniqueLoading.abha_number && (
                        <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-2 top-2" />
                      )}
                    </div>
                    {uniqueErrors.abha_number ? (
                      <span className="text-red-500 text-[10px] block mt-0.5 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {uniqueErrors.abha_number}
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400 block mt-0.5">14-digit NHA Health ID</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      ABHA Address
                    </label>
                    <input
                      id="reg-abha-address"
                      type="text"
                      maxLength={35}
                      placeholder="username@abdm"
                      className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                      value={abhaAddress}
                      onChange={(e) => setAbhaAddress(e.target.value.toLowerCase().trim())}
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">8-18 chars @abdm</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-[10px] font-bold text-slate-700">
                      Aadhaar Number
                    </label>
                    <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-semibold ${
                      aadhaarNumber.replace(/\D/g, '').length === 12
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : aadhaarNumber.replace(/\D/g, '').length > 0
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {aadhaarNumber.replace(/\D/g, '').length}/12{aadhaarNumber.replace(/\D/g, '').length === 12 ? ' ✓' : ''}
                    </span>
                  </div>
                  <input
                    id="reg-aadhaar"
                    type="text"
                    maxLength={25}
                    placeholder="XXXX XXXX XXXX"
                    className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(sanitizeAadhaar(e.target.value, aadhaarNumber))}
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">12-digit UIDAI unique ID</span>
                </div>
              )}
            </div>
          </div>

          {/* Card B: Residential Address */}
          <div className="space-y-2 bg-slate-50/70 py-2.5 px-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Residential Address</h4>
            </div>

            {/* Row 1: House/Flat No + Street/Locality */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">House / Flat No</label>
                <input
                  id="reg-house-flat-no"
                  type="text"
                  maxLength={100}
                  placeholder="E.g. Flat 402"
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
                  placeholder="E.g. Banjara Hills"
                  className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={streetLocality}
                  onChange={(e) => setStreetLocality(e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Village/Town/City + Mandal */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">City / Town</label>
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
                  placeholder="Hyderabad"
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
                  placeholder="Telangana"
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
          disabled={loading || isUniqueChecking || hasUniquenessErrors}
          title={hasUniquenessErrors ? 'Cannot submit with duplicate identifiers' : ''}
          className={`px-6 py-2 rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
            loading || isUniqueChecking || hasUniquenessErrors
              ? 'bg-slate-400 text-white cursor-not-allowed opacity-60'
              : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95'
          }`}
        >
          {isUniqueChecking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Identifiers...</span>
            </>
          ) : loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>{isEditMode ? 'Update Patient Record' : 'Verify & Register Patient'}</span>
            </>
          )}
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
