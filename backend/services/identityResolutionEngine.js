const fuzzball = require('fuzzball');
const db = require('../config/db');
const mpiConfigService = require('./mpiConfigService');
const {
  normalizeName,
  getPhonetic,
  normalizePhone,
  normalizeEmail,
  normalizeIdentifier,
  extractPincode,
  normalizeAddress,
  sha256,
  maskPhone,
  maskEmail
} = require('./normalizationService');

/**
 * Normalizes input patient intake payload into standard comparison attributes
 */
function normalizeIntake(payload = {}) {
  const name = payload.full_name || payload.patient_name || payload.name || '';
  const normName = normalizeName(name);
  const namePhonetic = getPhonetic(name);

  const phone = payload.contact_phone || payload.phone_no || payload.phone || payload.contactPhone || '';
  const normPhone = normalizePhone(phone);
  const phoneHash = sha256(normPhone);

  const email = payload.email_address || payload.email || payload.email_id || payload.emailAddress || null;
  const normEmail = normalizeEmail(email);
  const emailHash = sha256(normEmail);

  const uhid = payload.uhid || payload.uhi || null;
  const normUhid = normalizeIdentifier(uhid);
  const uhidHash = sha256(normUhid);

  const abha = payload.abha_number || payload.abha || payload.abhaNumber || null;
  const normAbha = normalizeIdentifier(abha);
  const abhaHash = sha256(normAbha);

  const rawDob = payload.date_of_birth || payload.dob || payload.dateOfBirth || null;
  let dobStr = null;
  let dobYear = null;
  if (rawDob) {
    const d = new Date(rawDob);
    if (!isNaN(d.getTime())) {
      dobStr = d.toISOString().split('T')[0];
      dobYear = d.getFullYear();
    }
  }

  const rawGender = (payload.gender || '').toLowerCase().trim();
  let normGender = null;
  if (rawGender.startsWith('m')) normGender = 'Male';
  else if (rawGender.startsWith('f')) normGender = 'Female';
  else if (rawGender) normGender = 'Other';

  const explicitPincode = payload.pincode || null;
  const rawAddress = payload.address || '';
  const pincode = extractPincode(rawAddress, explicitPincode);
  const normAddress = normalizeAddress(rawAddress, {
    house_flat_no: payload.house_flat_no || payload.houseFlatNo,
    street_locality: payload.street_locality || payload.streetLocality,
    village_town: payload.village_town || payload.villageTown,
    mandal: payload.mandal,
    district: payload.district,
    state: payload.state,
    pincode: pincode
  });

  const mr_no = payload.mr_no || payload.mrNo ? String(payload.mr_no || payload.mrNo).trim().toUpperCase() : null;

  return {
    raw: payload,
    mr_no,
    name,
    normName,
    namePhonetic,
    phone,
    normPhone,
    phoneHash: phoneHash === sha256('') ? null : phoneHash,
    email,
    normEmail,
    emailHash: emailHash === sha256('') ? null : emailHash,
    uhid,
    normUhid,
    uhidHash: uhidHash === sha256('') ? null : uhidHash,
    abha,
    normAbha,
    abhaHash: abhaHash === sha256('') ? null : abhaHash,
    dobStr,
    dobYear,
    gender: normGender,
    pincode,
    address: rawAddress,
    normAddress
  };
}

/**
 * Calculates similarity, reasons, and conflict penalties between input intake and an index candidate
 */
function scoreCandidate(input, candidate, config = null) {
  const weights = config?.weights || mpiConfigService.DEFAULT_WEIGHTS;
  const penaltiesConfig = config?.penalties || mpiConfigService.DEFAULT_PENALTIES;

  // =========================================================================
  // Layer 1: Deterministic Matching (Strict All-Fields-Identical Rule)
  // An automatic 100% deterministic match ONLY triggers if ALL core patient
  // attributes match with 100% exact equality simultaneously with ZERO typos/conflicts.
  // =========================================================================
  const isExactMrNo = !input.mr_no || !candidate.mr_no || (input.mr_no === candidate.mr_no.trim().toUpperCase());
  const isExactAbha = !input.normAbha || !candidate.normalized_abha || (input.normAbha === candidate.normalized_abha);
  const isExactUhid = !input.normUhid || !candidate.normalized_uhid || (input.normUhid === candidate.normalized_uhid);
  const isExactPhone = !input.normPhone || !candidate.normalized_phone || (input.normPhone === candidate.normalized_phone);
  const isExactEmail = !input.normEmail || !candidate.normalized_email || (input.normEmail === candidate.normalized_email);

  const candDobStr = candidate.date_of_birth instanceof Date 
    ? candidate.date_of_birth.toISOString().split('T')[0] 
    : (candidate.date_of_birth ? String(candidate.date_of_birth).split('T')[0] : null);
  const isExactDob = !input.dobStr || !candDobStr || (input.dobStr === candDobStr);

  const nameRatio = (input.normName && candidate.normalized_name)
    ? Math.max(
        fuzzball.ratio(input.normName, candidate.normalized_name),
        fuzzball.WRatio(input.normName, candidate.normalized_name),
        fuzzball.token_sort_ratio(input.normName, candidate.normalized_name)
      ) / 100
    : 0;
  const isExactName = !input.normName || !candidate.normalized_name || (nameRatio >= 0.98 || input.normName === candidate.normalized_name);

  const candGenderNorm = (candidate.gender || '').toLowerCase().startsWith('m')
    ? 'Male'
    : (candidate.gender || '').toLowerCase().startsWith('f')
    ? 'Female'
    : 'Other';
  const isExactGender = !input.gender || !candidate.gender || (input.gender === candGenderNorm);

  const isExactPincode = !input.pincode || !candidate.pincode || (input.pincode.trim() === candidate.pincode.trim());

  // Has strong identifier anchors or full core demographic presence
  const hasIdentifiers = Boolean(
    (input.normAbha && candidate.normalized_abha) ||
    (input.normUhid && candidate.normalized_uhid) ||
    (input.normPhone && candidate.normalized_phone) ||
    (input.normEmail && candidate.normalized_email) ||
    (input.dobStr && candDobStr && input.normName && candidate.normalized_name)
  );

  // Strict All-Fields-Identical Evaluation:
  const isAllFieldsIdentical = hasIdentifiers &&
    isExactMrNo &&
    isExactAbha &&
    isExactUhid &&
    isExactPhone &&
    isExactEmail &&
    isExactDob &&
    isExactName &&
    isExactGender &&
    isExactPincode;

  if (isAllFieldsIdentical) {
    return {
      finalScore: 100.0,
      baseScore: 100.0,
      layer: 'Layer 1: Deterministic Exact Match (All Fields Identical)',
      fieldScores: {
        abha: (input.normAbha && candidate.normalized_abha) ? 1.0 : null,
        uhid: (input.normUhid && candidate.normalized_uhid) ? 1.0 : null,
        phone: (input.normPhone && candidate.normalized_phone) ? 1.0 : null,
        dob: (input.dobStr && candDobStr) ? 1.0 : null,
        name: 1.0,
        email: (input.normEmail && candidate.normalized_email) ? 1.0 : null,
        gender: (input.gender && candidate.gender) ? 1.0 : null,
        pincode: (input.pincode && candidate.pincode) ? 1.0 : null
      },
      reasons: ['All core demographic and identifier fields match with 100% exact equality (Layer 1 Deterministic)']
    };
  }

  // =========================================================================
  // Layer 3: Dynamic Weighted Fuzzy Match Engine (Fall-through from Layer 1)
  // =========================================================================
  let weightedScoreSum = 0;
  let availableWeightSum = 0;
  let penalties = 0;

  const fieldScores = {};
  const reasons = [];
  const conflicts = [];

  // 1. ABHA Number
  if (input.normAbha && candidate.normalized_abha) {
    const w = weights.abha ?? mpiConfigService.DEFAULT_WEIGHTS.abha;
    availableWeightSum += w;
    const r1 = fuzzball.ratio(input.normAbha, candidate.normalized_abha);
    const r2 = fuzzball.token_sort_ratio(input.normAbha, candidate.normalized_abha);
    const abhaSim = Math.max(r1, r2) / 100;
    fieldScores.abha = parseFloat(abhaSim.toFixed(2));
    weightedScoreSum += w * abhaSim;

    if (abhaSim >= 0.85) {
      reasons.push(`ABHA number highly similar (${Math.round(abhaSim * 100)}%)`);
    } else if (abhaSim >= 0.60) {
      reasons.push(`ABHA number partially similar (${Math.round(abhaSim * 100)}%)`);
    } else {
      reasons.push(`ABHA number low similarity (${Math.round(abhaSim * 100)}%)`);
    }
  } else {
    fieldScores.abha = null;
  }

  // 2. UHID
  if (input.normUhid && candidate.normalized_uhid) {
    const w = weights.uhid ?? mpiConfigService.DEFAULT_WEIGHTS.uhid;
    availableWeightSum += w;
    const r1 = fuzzball.ratio(input.normUhid, candidate.normalized_uhid);
    const r2 = fuzzball.token_sort_ratio(input.normUhid, candidate.normalized_uhid);
    const uhidSim = Math.max(r1, r2) / 100;
    fieldScores.uhid = parseFloat(uhidSim.toFixed(2));
    weightedScoreSum += w * uhidSim;

    if (uhidSim >= 0.85) {
      reasons.push(`UHID highly similar (${Math.round(uhidSim * 100)}%)`);
    } else if (uhidSim >= 0.60) {
      reasons.push(`UHID partially similar (${Math.round(uhidSim * 100)}%)`);
    } else {
      reasons.push(`UHID low similarity (${Math.round(uhidSim * 100)}%)`);
    }
  } else {
    fieldScores.uhid = null;
  }

  // 3. Contact Phone
  if (input.normPhone && candidate.normalized_phone) {
    const w = weights.phone ?? mpiConfigService.DEFAULT_WEIGHTS.phone;
    availableWeightSum += w;
    const phoneSim = fuzzball.ratio(input.normPhone, candidate.normalized_phone) / 100;
    fieldScores.phone = parseFloat(phoneSim.toFixed(2));
    weightedScoreSum += w * phoneSim;

    if (phoneSim >= 0.80) {
      reasons.push(`Phone highly similar (${Math.round(phoneSim * 100)}%)`);
    } else {
      const p = penaltiesConfig.phoneConflict ?? mpiConfigService.DEFAULT_PENALTIES.phoneConflict;
      penalties += p;
      conflicts.push(`Phone mismatch (-${p} pts)`);
    }
  } else {
    fieldScores.phone = null;
  }

  // 4. Date of Birth
  if (input.dobStr && candidate.date_of_birth) {
    const w = weights.dob ?? mpiConfigService.DEFAULT_WEIGHTS.dob;
    availableWeightSum += w;
    if (input.dobStr === candDobStr) {
      fieldScores.dob = 1.0;
      weightedScoreSum += w * 1.0;
      reasons.push('Date of birth exact match');
    } else {
      const inputYear = input.dobYear;
      const candYear = candidate.dob_year;
      const yearDiff = Math.abs(inputYear - candYear);

      if (yearDiff === 0) {
        fieldScores.dob = 0.5;
        weightedScoreSum += w * 0.5;
        reasons.push('Birth year match');
      } else {
        fieldScores.dob = 0.0;
        const p = penaltiesConfig.dobConflict ?? mpiConfigService.DEFAULT_PENALTIES.dobConflict;
        penalties += p;
        conflicts.push(`Date of birth conflict (-${p} pts)`);
      }
    }
  } else {
    fieldScores.dob = null;
  }

  // 5. Full Name
  if (input.normName && candidate.normalized_name) {
    const w = weights.name ?? mpiConfigService.DEFAULT_WEIGHTS.name;
    availableWeightSum += w;
    const r1 = fuzzball.ratio(input.normName, candidate.normalized_name);
    const r2 = fuzzball.WRatio(input.normName, candidate.normalized_name);
    const r3 = fuzzball.token_sort_ratio(input.normName, candidate.normalized_name);
    const nameSim = Math.max(r1, r2, r3) / 100;
    fieldScores.name = parseFloat(nameSim.toFixed(2));
    weightedScoreSum += w * nameSim;

    if (nameSim >= 0.90) {
      reasons.push(`Name similarity > 0.90 (${Math.round(nameSim * 100)}%)`);
    } else if (nameSim >= 0.80) {
      reasons.push(`Name highly similar (${Math.round(nameSim * 100)}%)`);
    } else if (nameSim >= 0.60) {
      reasons.push(`Name moderately similar (${Math.round(nameSim * 100)}%)`);
    }
  } else {
    fieldScores.name = null;
  }

  // 6. Residential Address
  if (input.normAddress && candidate.normalized_address) {
    const w = weights.address ?? mpiConfigService.DEFAULT_WEIGHTS.address;
    availableWeightSum += w;
    const r1 = fuzzball.ratio(input.normAddress, candidate.normalized_address);
    const r2 = fuzzball.WRatio(input.normAddress, candidate.normalized_address);
    const r3 = fuzzball.token_set_ratio(input.normAddress, candidate.normalized_address);
    const addrSim = Math.max(r1, r2, r3) / 100;
    fieldScores.address = parseFloat(addrSim.toFixed(2));
    weightedScoreSum += w * addrSim;

    if (addrSim >= 0.85) {
      reasons.push(`Address similarity > 0.85 (${Math.round(addrSim * 100)}%)`);
    } else if (addrSim >= 0.70) {
      reasons.push(`Address similar (${Math.round(addrSim * 100)}%)`);
    }
  } else {
    fieldScores.address = null;
  }

  // 7. Email Address
  if (input.normEmail && candidate.normalized_email) {
    const w = weights.email ?? mpiConfigService.DEFAULT_WEIGHTS.email;
    availableWeightSum += w;
    if (input.normEmail === candidate.normalized_email) {
      fieldScores.email = 1.0;
      weightedScoreSum += w * 1.0;
      reasons.push('Email exact match');
    } else {
      const emailSim = fuzzball.ratio(input.normEmail, candidate.normalized_email) / 100;
      fieldScores.email = parseFloat(emailSim.toFixed(2));
      weightedScoreSum += w * emailSim;
    }
  } else {
    fieldScores.email = null;
  }

  // 8. Gender
  if (input.gender && candidate.gender) {
    const w = weights.gender ?? mpiConfigService.DEFAULT_WEIGHTS.gender;
    availableWeightSum += w;
    const candGenderNorm = (candidate.gender || '').toLowerCase().startsWith('m')
      ? 'Male'
      : (candidate.gender || '').toLowerCase().startsWith('f')
      ? 'Female'
      : 'Other';

    if (input.gender === candGenderNorm) {
      fieldScores.gender = 1.0;
      weightedScoreSum += w * 1.0;
      reasons.push('Gender exact match');
    } else {
      fieldScores.gender = 0.0;
      const p = penaltiesConfig.genderConflict ?? mpiConfigService.DEFAULT_PENALTIES.genderConflict;
      penalties += p;
      conflicts.push(`Gender conflict (-${p} pts)`);
    }
  } else {
    fieldScores.gender = null;
  }

  // Dynamic Neutral Missing Data Formula:
  // Base Score = Σ(weight × field_score × field_available) / Σ(weight × field_available) * 100
  let baseScore = 0;
  if (availableWeightSum > 0) {
    baseScore = (weightedScoreSum / availableWeightSum) * 100;
  }

  // Final Score Calculation: Final Score = Base Score - Conflict Penalties
  let finalScore = Math.max(0.0, Math.min(100.0, baseScore - penalties));
  finalScore = parseFloat(finalScore.toFixed(1));

  const allReasons = [...reasons, ...conflicts];

  return {
    finalScore,
    baseScore: parseFloat(baseScore.toFixed(1)),
    layer: 'Layer 3: Fuzzy Match Engine',
    penalties,
    fieldScores,
    reasons: allReasons
  };
}

/**
 * Resolves patient identity across Pass 1 (Exact Seek) & Pass 2 (Candidate Blocking)
 */
async function resolvePatientIdentity(intakePayload, customConfig = null) {
  const config = customConfig || await mpiConfigService.getScoringConfig();
  const input = normalizeIntake(intakePayload);
  const pool = await db.getPool();

  console.log('\n[Identity Resolution] === VERIFY PATIENT INTAKE ===');
  console.log('[Identity Resolution] Input Intake Normalized:', {
    name: input.normName,
    phonetic: input.namePhonetic,
    phone: input.normPhone,
    phoneHash: input.phoneHash ? input.phoneHash.substring(0, 16) + '...' : null,
    dob: input.dobStr,
    dobYear: input.dobYear,
    gender: input.gender,
    pincode: input.pincode,
    abha: input.normAbha,
    uhid: input.normUhid
  });

  const candidateMap = new Map();

  // =========================================================================
  // Execute Stored Procedure: dbo.usp_GeneratePatientCandidates (with Inline Fallback)
  // =========================================================================
  try {
    const spReq = pool.request();
    spReq.input('phoneHash', db.sql.Char(64), input.phoneHash || null);
    spReq.input('abhaHash', db.sql.Char(64), input.abhaHash || null);
    spReq.input('uhidHash', db.sql.Char(64), input.uhidHash || null);
    spReq.input('emailHash', db.sql.Char(64), input.emailHash || null);
    spReq.input('dob', db.sql.Date, input.dobStr || null);
    spReq.input('dobYear', db.sql.SmallInt, input.dobYear || null);
    spReq.input('gender', db.sql.NVarChar(30), input.gender || null);
    spReq.input('pincode', db.sql.VarChar(10), input.pincode || null);
    spReq.input('firstWord', db.sql.NVarChar(50), input.normName ? input.normName.split(' ')[0] : null);
    spReq.input('namePhonetic', db.sql.VarChar(50), input.namePhonetic ? `%${input.namePhonetic.split(' ')[0]}%` : null);
    spReq.input('nameSoundex', db.sql.VarChar(5), input.name ? require('./normalizationService').getSoundex(input.name) : null);

    const spRes = await spReq.execute('dbo.usp_GeneratePatientCandidates');
    for (const row of spRes.recordset) {
      candidateMap.set(row.reg_patient_id, row);
    }
    console.log(`[Identity Resolution] Candidates retrieved via usp_GeneratePatientCandidates: ${candidateMap.size}`);
  } catch (spErr) {
    console.warn('[Identity Resolution] SP execution failed, falling back to direct query:', spErr.message);

    // Fallback Pass 1: Deterministic Exact Matches (SHA-256)
    const exactReq = pool.request();
    exactReq.input('phoneHash', db.sql.Char(64), input.phoneHash || 'NONE');
    exactReq.input('abhaHash', db.sql.Char(64), input.abhaHash || 'NONE');
    exactReq.input('uhidHash', db.sql.Char(64), input.uhidHash || 'NONE');
    exactReq.input('emailHash', db.sql.Char(64), input.emailHash || 'NONE');

    const exactRes = await exactReq.query(`
      SELECT i.*, p.mr_no, p.ip_no, p.patient_name, p.phone_no, p.email, p.address
      FROM patient_identity_index i
      INNER JOIN patient_demographics p ON i.reg_patient_id = p.reg_patient_id
      WHERE (i.phone_hash = @phoneHash AND @phoneHash != 'NONE')
         OR (i.abha_hash = @abhaHash AND @abhaHash != 'NONE')
         OR (i.uhid_hash = @uhidHash AND @uhidHash != 'NONE')
         OR (i.email_hash = @emailHash AND @emailHash != 'NONE');
    `);

    for (const row of exactRes.recordset) {
      candidateMap.set(row.reg_patient_id, row);
    }

    // Fallback Pass 2: Multi-Factor Candidate Blocking
    const blockReq = pool.request();
    blockReq.input('dob', db.sql.Date, input.dobStr);
    blockReq.input('dobYear', db.sql.SmallInt, input.dobYear || 1900);
    blockReq.input('pincode', db.sql.VarChar(10), input.pincode || 'NONE');
    blockReq.input('firstWord', db.sql.NVarChar(50), input.normName.split(' ')[0] || '');
    blockReq.input('namePhonetic', db.sql.VarChar(50), input.namePhonetic ? `%${input.namePhonetic.split(' ')[0]}%` : 'NONE');

    const blockRes = await blockReq.query(`
      SELECT TOP 50 i.*, p.mr_no, p.ip_no, p.patient_name, p.phone_no, p.email, p.address
      FROM patient_identity_index i
      INNER JOIN patient_demographics p ON i.reg_patient_id = p.reg_patient_id
      WHERE i.date_of_birth = @dob
         OR i.dob_year = @dobYear
         OR (i.pincode = @pincode AND @pincode != 'NONE')
         OR (i.name_phonetic LIKE @namePhonetic AND @namePhonetic != 'NONE')
         OR (i.normalized_name LIKE @firstWord + '%' AND @firstWord != '');
    `);

    for (const row of blockRes.recordset) {
      if (!candidateMap.has(row.reg_patient_id)) {
        candidateMap.set(row.reg_patient_id, row);
      }
    }
  }

  // =========================================================================
  // Score all retrieved candidates using dynamic configuration
  // =========================================================================
  const scoredCandidates = [];

  for (const candidate of candidateMap.values()) {
    const scored = scoreCandidate(input, candidate, config);

    console.log(`[Identity Resolution] Scoring candidate ID #${candidate.reg_patient_id} (${candidate.patient_name}):`, {
      baseScore: scored.baseScore,
      penalties: scored.penalties,
      finalScore: scored.finalScore,
      reasons: scored.reasons,
      fieldScores: scored.fieldScores
    });

    scoredCandidates.push({
      patient_id: candidate.reg_patient_id,
      mr_no: candidate.mr_no,
      ip_no: candidate.ip_no,
      full_name: candidate.patient_name,
      date_of_birth: candidate.date_of_birth instanceof Date 
        ? candidate.date_of_birth.toISOString().split('T')[0] 
        : String(candidate.date_of_birth).split('T')[0],
      gender: candidate.gender,
      contact_phone_masked: maskPhone(candidate.phone_no || candidate.normalized_phone),
      email_masked: maskEmail(candidate.email || candidate.normalized_email),
      address: candidate.address || candidate.normalized_address,
      pincode: candidate.pincode,
      uhid: candidate.normalized_uhid,
      abha_number: candidate.normalized_abha,
      confidence: scored.finalScore,
      confidence_score: scored.finalScore,
      base_score: scored.baseScore,
      penalties: scored.penalties,
      field_scores: scored.fieldScores,
      reasons: scored.reasons
    });
  }

  // Sort descending by confidence score
  scoredCandidates.sort((a, b) => b.confidence - a.confidence);

  const topCandidates = scoredCandidates.slice(0, 5);
  const highestConfidence = topCandidates.length > 0 ? topCandidates[0].confidence : 0.0;

  // Determine system decision using dynamic thresholds
  const highConfThreshold = config?.thresholds?.high_confidence ?? 95.0;
  const reviewReqThreshold = config?.thresholds?.review_required ?? 80.0;

  let decision = 'NO_LIKELY_MATCH';
  let action_required = false;

  if (highestConfidence >= highConfThreshold) {
    decision = 'HIGH_CONFIDENCE_MATCH';
    action_required = true;
  } else if (highestConfidence >= reviewReqThreshold) {
    decision = 'REVIEW_REQUIRED';
    action_required = true;
  }

  console.log(`[Identity Resolution] Resolution Outcome -> Decision: ${decision} | Confidence: ${highestConfidence}% | Action Required: ${action_required}`);

  return {
    decision,
    action_required,
    confidence: highestConfidence,
    confidence_score: highestConfidence,
    candidates: topCandidates,
    total_candidates_analyzed: scoredCandidates.length,
    algorithm_version: 'v1.0.0',
    active_config: config
  };
}

module.exports = {
  scoreCandidate,
  resolvePatientIdentity,
  normalizeIntake,
  mpiConfigService
};
