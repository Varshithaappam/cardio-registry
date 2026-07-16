import React, { useState, forwardRef, useImperativeHandle, useMemo, useEffect } from 'react';
import SectionCard from './common/SectionCard';
import TextInput from './common/TextInput';
import NumberInput from './common/NumberInput';
import DateInput from './common/DateInput';
import Select from './common/Select';

const CABGForm = forwardRef(function CABGForm(
  { patientRecord, editingRecord, onCompletionChange },
  ref
) {
  // States
  const [date, setDate] = useState(editingRecord?.procedureDate ?? new Date().toISOString().split('T')[0]);
  const [surgeon, setSurgeon] = useState(editingRecord?.surgeonName ?? '');
  const [surgeonId, setSurgeonId] = useState(editingRecord?.surgeonId ?? 'SURG-001');
  const [status, setStatus] = useState(editingRecord?.procedureStatus ?? 'Elective');
  const [cpb, setCpb] = useState(editingRecord?.cpbUtilization ?? 'Full');
  const [perf, setPerf] = useState(editingRecord?.cpbDetails?.perfusionTimeMinutes ?? 90);
  const [cann, setCann] = useState(editingRecord?.cpbDetails?.cannulationMethod ?? 'Aortic/Atrial');
  const [occl, setOccl] = useState(editingRecord?.aorticOcclusion ?? 'Aortic Crossclamp');
  const [xclamp, setXclamp] = useState(editingRecord?.crossClampTimeMinutes ?? 60);
  const [cardioplegia, setCardioplegia] = useState(editingRecord?.cardioplegiaUsed ?? 'Blood');

  const [hasBypass, setHasBypass] = useState(editingRecord?.hasCoronaryBypass ?? 'Yes');
  const [distArt, setDistArt] = useState(editingRecord?.bypassDetails?.distalAnastomosesArterial ?? 1);
  const [distVen, setDistVen] = useState(editingRecord?.bypassDetails?.distalAnastomosesVenous ?? 2);
  const [imas, setImas] = useState(editingRecord?.bypassDetails?.imasUsedGrafts ?? 'Left IMA');
  const [imaHarvest, setImaHarvest] = useState(editingRecord?.bypassDetails?.imaHarvestTechnique ?? 'Pedicled');
  const [imaAnastomoses, setImaAnastomoses] = useState(editingRecord?.bypassDetails?.imaDistalAnastomosesCount ?? 1);
  const [radial, setRadial] = useState(editingRecord?.bypassDetails?.radialArteryUsed ?? 'No Radial');
  const [radialAnastomoses, setRadialAnastomoses] = useState(editingRecord?.bypassDetails?.radialArteryDistalAnastomosesCount ?? 0);
  const [anastomoticDevices, setAnastomoticDevices] = useState(
    editingRecord?.bypassDetails?.anastomoticDeviceUsed === 'Yes'
      ? editingRecord?.bypassDetails?.anastomoticDevice ?? 'Sutureless Connector'
      : 'None'
  );

  // IABP and blood products
  const [hasIABP, setHasIABP] = useState(editingRecord?.iabpUsed === 'Yes');
  const [iABPTiming, setIABPTiming] = useState(
    editingRecord?.iabpDetails?.whenInserted === 'Preoperatively'
      ? 'Pre-operative'
      : editingRecord?.iabpDetails?.whenInserted === 'Intraoperatively'
      ? 'Intra-operative'
      : 'Post-operative'
  );

  const initBloodProducts = () => {
    const list = [];
    if (editingRecord?.intraopBloodProducts) {
      const p = editingRecord.intraopBloodProducts;
      if (p.rbcUnits > 0) list.push('RBC');
      if (p.ffpUnits > 0) list.push('FFP');
      if (p.plateletUnits > 0) list.push('Platelets');
      if (p.cryoUnits > 0) list.push('Cryoprecipitate');
    }
    return list;
  };
  const [bloodProducts, setBloodProducts] = useState(initBloodProducts());

  // Valve surgery
  const [hasValve, setHasValve] = useState(editingRecord?.hasValveSurgery === 'Yes');
  const [valveType, setValveType] = useState(
    editingRecord?.valveDetails?.aorticProcedure === 'Replacement'
      ? 'Aortic'
      : editingRecord?.valveDetails?.mitralProcedure === 'Replacement'
      ? 'Mitral'
      : editingRecord?.valveDetails?.tricuspidProcedure === 'Replacement'
      ? 'Tricuspid'
      : editingRecord?.valveDetails?.pulmonicProcedure === 'Replacement'
      ? 'Pulmonary'
      : 'Aortic'
  );
  const [valveImplantType, setValveImplantType] = useState(editingRecord?.valveDetails?.prosthesisAortic?.type ?? 'Mechanical');
  const [valveBrand, setValveBrand] = useState(editingRecord?.valveDetails?.prosthesisAortic?.name ?? '');
  const [valveSize, setValveSize] = useState(Number(editingRecord?.valveDetails?.prosthesisAortic?.size ?? 21));

  // VAD
  const [hasVAD, setHasVAD] = useState(editingRecord?.hasVAD === 'Yes');
  const [vadIndication, setVadIndication] = useState(editingRecord?.vadDetails?.indication ?? 'Bridge to Transplant');
  const [vadType, setVadType] = useState(editingRecord?.vadDetails?.deviceData?.implantType ?? 'LVAD');
  const [vadFlowRate, setVadFlowRate] = useState(editingRecord?.vadDetails?.flowRate ?? 4.5);

  // Outcomes
  const [reexploration, setReexploration] = useState(
    editingRecord?.postoperative?.inHospitalComplications?.includes('Reexploration') ?? false
  );
  const [surgicalMortality, setSurgicalMortality] = useState(editingRecord?.mortality?.operativeDeath === 'Yes');

  // Calculations & Completion
  const completionPercent = useMemo(() => {
    let filled = 0;
    const total = 4;
    if (date) filled++;
    if (surgeon) filled++;
    if (status) filled++;
    if (cpb) filled++;
    return Math.round((filled / total) * 100);
  }, [date, surgeon, status, cpb]);

  useEffect(() => {
    onCompletionChange?.(completionPercent);
  }, [completionPercent, onCompletionChange]);

  const getSubmissionData = () => ({
    id: editingRecord?.id ?? `cabg-${Date.now()}`,
    patientId: patientRecord.patient.id,
    procedureDate: date,
    surgeonName: surgeon,
    surgeonId,
    procedureStatus: status,
    urgentReason: status === 'Urgent' ? 'AMI or Unstable Angina' : undefined,
    emergentReason: status === 'Emergent' || status === 'Emergent Salvage' ? 'Refractory shock / Arrest' : undefined,
    roboticAssisted: editingRecord?.roboticAssisted ?? 'No',
    skinIncisionStart: '08:00',
    skinIncisionStop: '12:30',
    cpbUtilization: cpb,
    cpbDetails: cpb !== 'None' ? {
      combinationPlan: 'Planned',
      perfusionTimeMinutes: perf,
      cannulationMethod: cann
    } : undefined,
    aorticOcclusion: occl,
    crossClampTimeMinutes: occl === 'Aortic Crossclamp' ? xclamp : undefined,
    cardioplegiaUsed: cardioplegia,
    iabpUsed: hasIABP ? 'Yes' : 'No',
    iabpDetails: hasIABP ? {
      whenInserted: iABPTiming === 'Pre-operative' ? 'Preoperatively' : iABPTiming === 'Intra-operative' ? 'Intraoperatively' : 'Postoperatively',
      indication: 'Hemodynamic Instab'
    } : undefined,
    intraopBloodProducts: {
      used: bloodProducts.length > 0 ? 'Yes' : 'No',
      rbcUnits: bloodProducts.includes('RBC') ? 1 : 0,
      ffpUnits: bloodProducts.includes('FFP') ? 1 : 0,
      cryoUnits: bloodProducts.includes('Cryoprecipitate') ? 1 : 0,
      plateletUnits: bloodProducts.includes('Platelets') ? 1 : 0
    },
    hasCoronaryBypass: hasBypass,
    bypassDetails: hasBypass === 'Yes' ? {
      distalAnastomosesArterial: distArt,
      distalAnastomosesVenous: distVen,
      anastomoticDeviceUsed: anastomoticDevices !== 'None' ? 'Yes' : 'No',
      anastomoticDevice: anastomoticDevices !== 'None' ? anastomoticDevices : undefined,
      imasUsedGrafts: imas,
      imaHarvestTechnique: imaHarvest,
      imaDistalAnastomosesCount: imaAnastomoses,
      radialArteryUsed: radial,
      radialArteryDistalAnastomosesCount: radialAnastomoses
    } : undefined,
    hasValveSurgery: hasValve ? 'Yes' : 'No',
    valveDetails: hasValve ? {
      aorticProcedure: valveType === 'Aortic' ? 'Replacement' : 'No',
      mitralProcedure: valveType === 'Mitral' ? 'Replacement' : 'No',
      tricuspidProcedure: valveType === 'Tricuspid' ? 'Replacement' : 'No',
      pulmonicProcedure: valveType === 'Pulmonary' ? 'Replacement' : 'No',
      aorticAnnularEnlargement: 'No',
      prosthesisAortic: { type: valveImplantType, name: valveBrand, size: String(valveSize) }
    } : undefined,
    hasVAD: hasVAD ? 'Yes' : 'No',
    vadDetails: hasVAD ? {
      previousVAD: 'No',
      indication: vadIndication,
      intubatedPreVAD: 'No',
      hemodynamicsPreVAD: {
        pcwp: 0,
        cvp: 0,
        pvr: 0,
        ci: 0,
        rvFunction: 'Normal',
        rvFunctionMethod: 'Pre-op ECHO',
        vo2Measured: 'No'
      },
      deviceData: { implantType: vadType, productType: 'VAD' },
      flowRate: vadFlowRate,
      complications: [],
      dischargeStatus: 'with VAD'
    } : undefined,
    otherCardiacProcedures: [],
    otherNonCardiacProcedures: [],
    postoperative: {
      bloodProductsUsed: editingRecord?.postoperative?.bloodProductsUsed ?? 'No',
      rbcUnits: editingRecord?.postoperative?.rbcUnits ?? 0,
      ffpUnits: editingRecord?.postoperative?.ffpUnits ?? 0,
      cryoUnits: editingRecord?.postoperative?.cryoUnits ?? 0,
      plateletUnits: editingRecord?.postoperative?.plateletUnits ?? 0,
      extubatedInOR: editingRecord?.postoperative?.extubatedInOR ?? 'No',
      initialVentilationHours: editingRecord?.postoperative?.initialVentilationHours ?? 4,
      reintubatedDuringStay: editingRecord?.postoperative?.reintubatedDuringStay ?? 'No',
      additionalVentilationHours: editingRecord?.postoperative?.additionalVentilationHours ?? 0,
      inHospitalComplications: reexploration ? ['Reexploration'] : []
    },
    mortality: {
      mortalityStatus: surgicalMortality ? 'Yes' : 'No',
      dischargeStatus: surgicalMortality ? 'Deceased' : 'Alive',
      statusAt30Days: surgicalMortality ? 'Deceased' : 'Alive',
      operativeDeath: surgicalMortality ? 'Yes' : 'No',
      primaryCauseOfDeath: surgicalMortality ? 'Cardiac Arrest' : undefined
    }
  });

  useImperativeHandle(ref, () => ({
    getSubmissionData
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DateInput id="cabg-date" label="Date of Surgery" value={date} onChange={setDate} required />
        <TextInput id="cabg-surgeon" label="Operating Surgeon" value={surgeon} onChange={setSurgeon} required />
        <Select
          id="cabg-status"
          label="Procedure Status (Urgency)"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'Elective', label: 'Elective' },
            { value: 'Urgent', label: 'Urgent (E.g. AMI, unstable angina)' },
            { value: 'Emergent', label: 'Emergent' },
            { value: 'Emergent Salvage', label: 'Emergent Salvage' }
          ]}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          id="cabg-cpb"
          label="CPB Utilization"
          value={cpb}
          onChange={setCpb}
          options={[
            { value: 'Full', label: 'Full Cardiopulmonary Bypass' },
            { value: 'Combination', label: 'Combination' },
            { value: 'None', label: 'None (Off-pump CABG / OPCAB)' }
          ]}
          required
        />
        {cpb !== 'None' && (
          <NumberInput id="cabg-perf" label="Perfusion Time (minutes)" value={perf} onChange={setPerf} required />
        )}
        <Select
          id="cabg-occl"
          label="Aortic Occlusion Type"
          value={occl}
          onChange={setOccl}
          options={[
            { value: 'Aortic Crossclamp', label: 'Aortic Crossclamp' },
            { value: 'Balloon Occlusion', label: 'Balloon Occlusion' },
            { value: 'None', label: 'None' }
          ]}
          required
        />
      </div>

      {/* Section J: Coronary Bypass conduit details - Conditional */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-xs font-bold text-slate-700">Do Coronary Artery Bypass? (Section J)</label>
          <select
            id="cabg-hasbypass"
            className="p-1 text-xs border border-slate-200 rounded bg-white"
            value={hasBypass}
            onChange={(e) => setHasBypass(e.target.value)}
          >
            <option value="Yes">Yes (Display Section J)</option>
            <option value="No">No</option>
          </select>
        </div>

        {hasBypass === 'Yes' && (
          <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-4 animate-fadeIn">
            <h5 className="text-xs font-bold text-purple-800 uppercase tracking-wider">Coronary Bypass Graft details</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NumberInput id="graft-art" label="Arterial Distal Anastomoses" value={distArt} onChange={setDistArt} />
              <NumberInput id="graft-ven" label="Venous Distal Anastomoses" value={distVen} onChange={setDistVen} />
              <Select
                id="graft-imas"
                label="IMAs Used Grafts"
                value={imas}
                onChange={setImas}
                options={[
                  { value: 'Left IMA', label: 'Left IMA Only' },
                  { value: 'Right IMA', label: 'Right IMA Only' },
                  { value: 'Both IMAs', label: 'Both IMAs (LIMA + RIMA)' },
                  { value: 'No IMA', label: 'No IMA' }
                ]}
              />
              <Select
                id="graft-radial"
                label="Radial Artery Used"
                value={radial}
                onChange={setRadial}
                options={[
                  { value: 'No Radial', label: 'No Radial' },
                  { value: 'Left Radial', label: 'Left Radial' },
                  { value: 'Right Radial', label: 'Right Radial' },
                  { value: 'Both Radials', label: 'Both Radials' }
                ]}
              />
            </div>

            <Select
              label="Anastomotic Assistive Devices"
              value={anastomoticDevices}
              onChange={setAnastomoticDevices}
              options={[
                'None',
                'Sutureless Connector',
                'Magnetic Device',
                'Other Assistive Device'
              ]}
              required
            />
          </div>
        )}
      </div>

      {/* IABP and Intraoperative Blood Products */}
      <SectionCard title="Devices & Consumables (IABP / Blood Products)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Intra-Aortic Balloon Pump (IABP) Used?"
            value={hasIABP ? 'Yes' : 'No'}
            onChange={(e) => setHasIABP(e.target.value === 'Yes')}
            options={['No', 'Yes']}
            required
          />
          {hasIABP && (
            <Select
              label="IABP Insertion Timing"
              value={iABPTiming}
              onChange={setIABPTiming}
              options={['Pre-operative', 'Intra-operative', 'Post-operative']}
              required
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Intraoperative Blood Products Transfused *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {['RBC', 'FFP', 'Platelets', 'Cryoprecipitate'].map((prod) => (
              <label key={prod} className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                <input
                  type="checkbox"
                  checked={bloodProducts.includes(prod)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setBloodProducts([...bloodProducts, prod]);
                    } else {
                      setBloodProducts(bloodProducts.filter((x) => x !== prod));
                    }
                  }}
                />
                <span>{prod}</span>
              </label>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Valve Surgery Segment */}
      <SectionCard title="Concomitant Valve Operation">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-slate-500 font-medium">Was valve surgery performed?</span>
          <select
            className="p-1 text-xs border border-slate-200 rounded bg-white font-semibold"
            value={hasValve ? 'Yes' : 'No'}
            onChange={(e) => setHasValve(e.target.value === 'Yes')}
          >
            <option value="No">No Valve Op</option>
            <option value="Yes">Yes (Valve Op Performed)</option>
          </select>
        </div>

        {hasValve && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs animate-fadeIn">
            <Select
              label="Target Valve"
              value={valveType}
              onChange={setValveType}
              options={[
                { value: 'Aortic', label: 'Aortic Valve' },
                { value: 'Mitral', label: 'Mitral Valve' },
                { value: 'Tricuspid', label: 'Tricuspid Valve' },
                { value: 'Pulmonary', label: 'Pulmonary Valve' }
              ]}
            />
            <Select
              label="Implant Type"
              value={valveImplantType}
              onChange={setValveImplantType}
              options={[
                { value: 'Mechanical', label: 'Mechanical Valve' },
                { value: 'Bioprosthetic', label: 'Bioprosthetic (Tissue)' },
                { value: 'Repair (No Implant)', label: 'Repair (Ring/Sutures)' }
              ]}
            />
            <div className="md:col-span-2">
              <TextInput label="Valve Brand / Model" value={valveBrand} onChange={setValveBrand} placeholder="E.g. Carpentier-Edwards Magna" />
            </div>
            <NumberInput label="Valve Size (mm)" value={valveSize} onChange={setValveSize} />
          </div>
        )}
      </SectionCard>

      {/* Ventricular Assist Devices (VAD) */}
      <SectionCard title="Ventricular Assist Device (VAD) / Mechanical Support">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-slate-500 font-medium">Was VAD support used?</span>
          <select
            className="p-1 text-xs border border-slate-200 rounded bg-white font-semibold"
            value={hasVAD ? 'Yes' : 'No'}
            onChange={(e) => setHasVAD(e.target.value === 'Yes')}
          >
            <option value="No">No VAD Support</option>
            <option value="Yes">Yes (VAD Implemented)</option>
          </select>
        </div>

        {hasVAD && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs animate-fadeIn">
            <Select
              label="VAD Indication"
              value={vadIndication}
              onChange={setVadIndication}
              options={[
                'Bridge to Transplant',
                'Destination Therapy',
                'Bridge to Recovery'
              ]}
            />
            <Select
              label="VAD Device Type"
              value={vadType}
              onChange={setVadType}
              options={[
                { value: 'LVAD', label: 'LVAD (Left Ventricle)' },
                { value: 'RVAD', label: 'RVAD (Right Ventricle)' },
                { value: 'BiVAD', label: 'BiVAD (Bilateral Ventricles)' }
              ]}
            />
            <div className="md:col-span-2">
              <NumberInput label="Target Flow Rate (L/min)" step={0.1} value={vadFlowRate} onChange={setVadFlowRate} placeholder="E.g. 4.5" />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Surgical Outcomes and Mortality */}
      <SectionCard title="Post-Operative Complications & Quality Indicators">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2.5 p-3 bg-white rounded-lg border cursor-pointer">
            <input
              type="checkbox"
              checked={reexploration}
              onChange={(e) => setReexploration(e.target.checked)}
            />
            <div>
              <span className="block font-bold text-xs text-slate-700">Surgical Re-exploration Needed</span>
              <span className="block text-[10px] text-slate-500">For bleeding, cardiac tamponade, or graft dysfunction</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 bg-white rounded-lg border cursor-pointer">
            <input
              type="checkbox"
              checked={surgicalMortality}
              onChange={(e) => setSurgicalMortality(e.target.checked)}
            />
            <div>
              <span className="block font-bold text-xs text-red-700">Operative / 30-day Mortality Recorded</span>
              <span className="block text-[10px] text-slate-500">Includes deaths during index admission or within 30 days post-op</span>
            </div>
          </label>
        </div>
      </SectionCard>
    </div>
  );
});

export default CABGForm;
