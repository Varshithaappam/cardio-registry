import React, { useState, useEffect } from 'react';
import { User, MapPin, Briefcase, GraduationCap, X, Check, Phone, Mail, Shield, CreditCard } from 'lucide-react';
import { buildPatientPayload } from '../utils/patientMapper';
import { createPatient, updatePatient } from '../../api/patientApi';

const HIGHER_EDUCATION_OPTIONS = [
  'Primary',
  'Secondary',
  'Graduate',
  'Post Graduate',
  'None'
];

function formatDateForInput(dateVal) {
  if (!dateVal) return '1966-01-01';
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
    return dateVal.trim();
  }
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '1966-01-01';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '1966-01-01';
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
  const [dob, setDob] = useState('1966-01-01');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('Unknown');
  const [insuranceMode, setInsuranceMode] = useState('Direct Cash / Self-Pay');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Address, Higher Education, Occupation
  const [address, setAddress] = useState('');
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

  // Pre-fill state when initialData / patient record changes (Data Hydration)
  useEffect(() => {
    if (initialData) {
      const p = initialData.patient || initialData;
      setName(p.name || p.patient_name || '');
      setDob(formatDateForInput(p.dob || p.date_of_birth));
      setGender(p.gender || 'Male');
      setBloodGroup(p.bloodGroup || p.blood_group || 'Unknown');
      setInsuranceMode(p.insuranceMode || p.insurance_mode || 'Direct Cash / Self-Pay');
      setPhone(p.phone || p.phone_no || '');
      setEmail(p.email || '');
      setAddress(p.address || '');
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Patient Full Name is required.');
      return;
    }

    if (!dob) {
      alert('Date of Birth is required.');
      return;
    }

    if (address.length > 500) {
      alert('Address cannot exceed 500 characters.');
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

    const payload = buildPatientPayload({
      name,
      dob,
      gender,
      bloodGroup,
      insuranceMode,
      phone,
      email,
      address,
      higherEducation,
      occupation,
      hypertension,
      smoking,
      diabetes,
      diabetesControl,
      renalFailure,
      dialysisStatus
    });

    setLoading(true);

    try {
      let response;
      if (isEditMode && (initialData?.patient?.id || initialData?.id)) {
        const patientId = initialData?.patient?.id || initialData?.id;
        response = await updatePatient(patientId, payload);
      } else {
        response = await createPatient(payload);
      }

      if (response?.success) {
        alert(`Patient ${isEditMode ? 'updated' : 'registered'} successfully.`);
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        alert(response?.message || `Patient ${isEditMode ? 'update' : 'registration'} failed.`);
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Operation failed.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-blue-200 flex flex-col max-h-[85vh] h-full w-full relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600 z-10"></div>

      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 bg-white">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            {isEditMode ? 'Edit Patient Master Record' : 'Master Registry: Patient Registration'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEditMode ? 'Update demographic, contact, and baseline clinical parameters.' : 'Initialize the Patient Master Record and Clinical Profile.'}
          </p>
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
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        
        {/* COLUMN 1: Demographics & Profile */}
        <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1.5">
            <User className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Demographics & Profile</h4>
          </div>

          {/* 1. Full Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-0.5">Full Name <span className="text-red-500 font-bold ml-0.5">*</span></label>
            <input
              id="reg-name"
              type="text"
              required
              className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. Ramesh Chandra Malhotra"
            />
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
              className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
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
            <label className="block text-sm font-semibold text-slate-700 mb-1">Higher Education</label>
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

        {/* COLUMN 2: Contact & Address + Distinct Bordered Insurance Section */}
        <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
          {/* Top Section: Contact & Address */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Patient Contact & Administrative</h4>
            </div>

            {/* Address Textarea */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-0.5">Address</label>
              <textarea
                id="reg-address"
                maxLength={500}
                rows={2}
                className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter full address..."
              />
              <div className="text-[10px] text-slate-400 text-right mt-0.5">{address.length}/500</div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-0.5">Contact Phone</label>
              <input
                id="reg-phone"
                type="text"
                placeholder="+91 98480 12345"
                className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-0.5">Email Address</label>
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

          {/* Bottom Section: Distinct Bordered Card for Blood Group & Insurance Mode */}
          <div className="border border-slate-300 bg-white p-3 rounded-lg space-y-2 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-700 pb-1 border-b border-slate-100">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Medical Coverage & Blood Group</span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-0.5">Blood Group</label>
              <select
                id="reg-bloodgroup"
                className="w-full p-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                <option value="Unknown">Unknown</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-0.5">Insurance Mode</label>
              <select
                id="reg-insurance"
                className="w-full p-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={insuranceMode}
                onChange={(e) => setInsuranceMode(e.target.value)}
              >
                <option value="Direct Cash / Self-Pay">Direct Cash / Self-Pay</option>
                <option value="Private Insurance">Private Insurance</option>
                <option value="Government Reimbursement">Government Reimbursement</option>
                <option value="Arogyasree Scheme">Arogyasree Scheme</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>
        </div>

        {/* COLUMN 3: Baseline Comorbidities */}
        <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1.5">
            <Shield className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Baseline Comorbidities</h4>
          </div>

          {/* Hypertension */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Hypertension</label>
            <div className="flex gap-1">
              {['Yes', 'No', 'Unknown'].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setHypertension(opt)}
                  className={`flex-1 py-1 text-xs font-bold rounded-md border text-center transition-all ${
                    hypertension === opt
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Smoking */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Smoking</label>
            <div className="flex gap-1">
              {['Yes', 'No', 'Unknown'].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setSmoking(opt)}
                  className={`flex-1 py-1 text-xs font-bold rounded-md border text-center transition-all ${
                    smoking === opt
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Diabetes Mellitus */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Diabetes Mellitus</label>
            <div className="flex gap-1 mb-1.5">
              {['Yes', 'No', 'Unknown'].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setDiabetes(opt)}
                  className={`flex-1 py-1 text-xs font-bold rounded-md border text-center transition-all ${
                    diabetes === opt
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {diabetes === 'Yes' && (
              <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">Diabetes Control Mode</label>
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
            <label className="block text-sm font-semibold text-slate-700 mb-1">Renal Failure</label>
            <div className="flex gap-1 mb-1.5">
              {['Yes', 'No', 'Unknown'].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setRenalFailure(opt)}
                  className={`flex-1 py-1 text-xs font-bold rounded-md border text-center transition-all ${
                    renalFailure === opt
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {renalFailure === 'Yes' && (
              <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">Active Dialysis Status</label>
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
    </form>
  );
}
