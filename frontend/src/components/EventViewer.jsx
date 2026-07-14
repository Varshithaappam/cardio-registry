/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowLeft, Stethoscope, Heart, Activity, Award, Layers, ShieldCheck, Printer } from 'lucide-react';







export default function EventViewer({ event, type, onBack }) {
  // Simple print command
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
      
      {/* Viewer Header */}
      <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-viewer-back"
            onClick={onBack}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-800">
            
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
              type === 'HF Assessment' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' :
              type.includes('MI') || type === 'STEMI' || type === 'NSTEMI' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              type === 'CABG' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`
              }>
                {type}
              </span>
              {event.isDraft &&
              <span className="px-2 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold uppercase">
                  Draft Record
                </span>
              }
            </div>
            <h3 className="text-base font-bold mt-1">Registry Clinical Audit Sheet</h3>
            <span className="text-xs text-slate-400">Date recorded: {event.assessmentDate || event.eventDate || event.procedureDate || event.admissionDate || event.dateOfVisit || event.resultDate || event.investigationDate || 'N/A'}</span>
          </div>
        </div>

        <button
          id="btn-print-record"
          onClick={handlePrint}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 text-slate-200 border border-slate-700">
          
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Export Audit PDF</span>
        </button>
      </div>

      {/* Main Parameters Display */}
      <div className="p-6 space-y-6">
        
        {/* Render Hospitalization Detail */}
        {type === 'Admission' &&
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border rounded-xl">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Admission Date</span>
                <span className="text-sm font-bold text-slate-800 block mt-1">{event.admissionDate}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Discharge Date</span>
                <span className="text-sm font-bold text-slate-800 block mt-1">{event.dischargeDate || 'Active stay'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Treating Consultant</span>
                <span className="text-sm font-bold text-slate-800 block mt-1">{event.treatingCardiologist}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Admitting Facility</span>
                <span className="text-sm font-bold text-slate-800 block mt-1">{event.hospitalName}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Admission Profile</span>
              <p className="p-3.5 bg-white border rounded-xl text-sm text-slate-700 leading-relaxed font-semibold">
                Reason for Encounter: {event.reasonForAdmission}
              </p>
            </div>

            {event.costTotal > 0 &&
          <div className="p-4 border rounded-xl space-y-3.5 bg-slate-50">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Financial Audit / Cost Metrics</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Bed charges:</span>
                    <span className="text-slate-700 font-bold block font-mono mt-0.5">₹{(event.costBedCharges ?? 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Drugs & Disposables:</span>
                    <span className="text-slate-700 font-bold block font-mono mt-0.5">₹{(event.costDrugsDisposables ?? 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Packages Charges:</span>
                    <span className="text-slate-700 font-bold block font-mono mt-0.5">₹{(event.costPackages ?? 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Diagnostics/Labs:</span>
                    <span className="text-slate-700 font-bold block font-mono mt-0.5">₹{(event.costLabInvestigations ?? 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="border-t pt-2 flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-700">Calculated Encounter Cost Total:</span>
                  <span className="text-blue-600 font-mono">₹{event.costTotal.toLocaleString()}</span>
                </div>
              </div>
          }
          </div>
        }

        {/* Render HF Assessment */}
        {type === 'HF Assessment' &&
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Clinical Presentation & Vitals */}
              <div className="p-4 border rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-teal-500" /> Vitals & Physical Exams
                </h4>
                <table className="w-full text-xs text-left divide-y divide-slate-100">
                  <tbody>
                    <tr className="py-2 block"><td className="text-slate-400 w-32 inline-block">Sitting BP:</td><td className="text-slate-800 font-bold font-mono">{event.vitals?.bpSittingSystolic}/{event.vitals?.bpSittingDiastolic} mmHg</td></tr>
                    <tr className="py-2 block"><td className="text-slate-400 w-32 inline-block">Resting HR:</td><td className="text-slate-800 font-bold font-mono">{event.vitals?.heartRate} bpm ({event.vitals?.hrVariability})</td></tr>
                    <tr className="py-2 block"><td className="text-slate-400 w-32 inline-block">O2 Saturation:</td><td className="text-slate-800 font-bold font-mono">{event.vitals?.o2Saturation}%</td></tr>
                    <tr className="py-2 block"><td className="text-slate-400 w-32 inline-block">Weight:</td><td className="text-slate-800 font-bold font-mono">{event.vitals?.unableToWeigh ? 'Unable to weigh' : `${event.vitals?.weightKg} kg`}</td></tr>
                    <tr className="py-2 block"><td className="text-slate-400 w-32 inline-block">Height:</td><td className="text-slate-800 font-bold font-mono">{event.vitals?.heightCm} cm</td></tr>
                    {event.vitals?.bmi &&
                  <tr className="py-2 block"><td className="text-slate-400 w-32 inline-block">Calculated BMI:</td><td className="text-slate-800 font-bold font-mono">{event.vitals?.bmi}</td></tr>
                  }
                  </tbody>
                </table>
              </div>

              {/* Physical Symptoms */}
              <div className="p-4 border rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-red-500" /> Symptoms & Signs Profile
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(event.symptoms || {}).map(([key, val]) => {
                  if (val === true) {
                    return (
                      <span key={key} className="px-2 py-0.5 bg-red-50 text-red-800 rounded font-semibold text-[10px] border border-red-100 uppercase tracking-wide">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>);

                  }
                  return null;
                })}
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Volume Overload Criteria</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(event.volumeOverloadSigns || {}).map(([key, val]) => {
                    if (val === true) {
                      return (
                        <span key={key} className="px-2 py-0.5 bg-teal-50 text-teal-800 rounded font-semibold text-[10px] border border-teal-100 uppercase tracking-wide">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>);

                    }
                    return null;
                  })}
                  </div>
                </div>
              </div>

              {/* HF Cohorts Classification */}
              <div className="p-4 border rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-500" /> Final Cohort Class
                </h4>
                <table className="w-full text-xs text-left divide-y divide-slate-100">
                  <tbody>
                    <tr className="py-2 block"><td className="text-slate-400 w-32 inline-block">Type of HF:</td><td className="text-blue-700 font-bold">{event.typeOfHF}</td></tr>
                    <tr className="py-2 block"><td className="text-slate-400 w-32 inline-block">Stage (ACC/AHA):</td><td className="text-teal-700 font-bold">{event.stageOfHF}</td></tr>
                    <tr className="py-2 block"><td className="text-slate-400 w-32 inline-block">NYHA Class:</td><td className="text-purple-700 font-bold">{event.nyhaClass}</td></tr>
                    <tr className="py-2 block"><td className="text-slate-400 w-32 inline-block">AF status:</td><td className="text-slate-700 font-bold">{event.afStatus}</td></tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* Recommendations */}
            {event.recommendations && Object.keys(event.recommendations).length > 0 &&
          <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Recommended Guideline Consultations & Medications</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {Object.entries(event.recommendations).map(([key, val]) =>
              <div key={key} className="p-3 bg-white border border-slate-100 rounded-lg">
                      <span className="font-bold text-slate-700 uppercase block tracking-wider text-[10px] mb-1">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <p className="text-slate-600 font-semibold">{val}</p>
                    </div>
              )}
                </div>
              </div>
          }
          </div>
        }

        {/* Render ACS event STEMI / NSTEMI */}
        {(type === 'STEMI' || type === 'NSTEMI') &&
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border rounded-xl">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Reperfusion Strategy</span>
                <span className="text-sm font-bold text-slate-800 block mt-1">{event.treatmentStrategy}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">TIMI Calculated Score</span>
                <span className="text-sm font-extrabold text-red-600 block mt-1">{event.timiCalculatedScore} Points</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">ACS ID Number</span>
                <span className="text-sm font-bold text-slate-800 block mt-1 font-mono">{event.acsNo}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Event Date</span>
                <span className="text-sm font-bold text-slate-800 block mt-1 font-mono">{event.eventDate}</span>
              </div>
            </div>

            {/* PAMI DETAILS */}
            {event.treatmentStrategy === 'PAMI' && event.pamiDetails &&
          <div className="p-4 border border-teal-100 rounded-xl space-y-4 bg-teal-50/20">
                <span className="text-teal-800 text-xs font-bold uppercase tracking-wider block flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-teal-600" /> Primary Percutaneous Coronary Intervention (PCI / PAMI) Details
                </span>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Door-to-Balloon Time:</span>
                    <span className="text-slate-800 font-black font-mono block mt-1 text-sm">{event.pamiDetails.doorToBalloonTime} Minutes</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Vessel Treated Segment:</span>
                    <span className="text-slate-800 font-bold block mt-1">{event.pamiDetails.segment || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Thrombosuction:</span>
                    <span className="text-slate-800 font-semibold block mt-1">{event.pamiDetails.thrombosuction}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Stent Type & Size:</span>
                    <span className="text-slate-800 font-bold block mt-1">{event.pamiDetails.stentType === 'None' ? 'No Stent' : `${event.pamiDetails.stentType} (${event.pamiDetails.stentDiameter} x ${event.pamiDetails.stentLength}mm)`}</span>
                  </div>
                </div>
              </div>
          }

            {/* Thrombolysis details */}
            {event.treatmentStrategy === 'Thrombolysis' && event.thrombolysisDetails &&
          <div className="p-4 border border-red-100 rounded-xl space-y-4 bg-red-50/20">
                <span className="text-red-800 text-xs font-bold uppercase tracking-wider block flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-red-600" /> Thrombolysis Reperfusion Details
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Door-to-Needle Time:</span>
                    <span className="text-slate-800 font-black font-mono block mt-1 text-sm">{event.thrombolysisDetails.doorToNeedleTime} Minutes</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Thrombolytic Agent:</span>
                    <span className="text-slate-800 font-bold block mt-1">{event.thrombolysisDetails.drug}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Dose:</span>
                    <span className="text-slate-800 font-bold block mt-1 font-mono">{event.thrombolysisDetails.dose || 'Unspecified'}</span>
                  </div>
                </div>
              </div>
          }

            {/* Anticoagulation & Adjunctive Therapy */}
            <div className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50">
              <span className="text-slate-700 text-xs font-bold uppercase tracking-wider block flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-500" /> Anticoagulation & Adjunctive Therapy
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Heparin Strategy:</span>
                  <span className="text-slate-800 font-bold block mt-1 font-mono">{event.heparinStrategy || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">GP IIb/IIIa Inhibitor:</span>
                  <span className="text-slate-800 font-bold block mt-1 font-mono">{event.gp2b3a || 'No'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Bivalirudin Administered:</span>
                  <span className="text-slate-800 font-bold block mt-1 font-mono">{event.bivalirudin || 'No'}</span>
                </div>
              </div>
            </div>

            {/* Other Risk Factors / High-Risk clinical features */}
            {event.otherRiskFactors &&
          <div className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50">
                <span className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Associated Clinical High-Risk Markers</span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {event.otherRiskFactors.lvf && <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded font-bold uppercase tracking-wide">LV Dysfunction / Failure</span>}
                  {event.otherRiskFactors.vt_vf && <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded font-bold uppercase tracking-wide">Documented VT / VF</span>}
                  {event.otherRiskFactors.bbb_chb && <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded font-bold uppercase tracking-wide">BBB / Complete Heart Block</span>}
                  {event.otherRiskFactors.elevatedBNP && <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded font-bold uppercase tracking-wide">Elevated NT-proBNP / BNP</span>}
                  {event.otherRiskFactors.elevatedCRP && <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded font-bold uppercase tracking-wide">Elevated High-Sensitivity CRP</span>}
                  {!event.otherRiskFactors.lvf && !event.otherRiskFactors.vt_vf && !event.otherRiskFactors.bbb_chb && !event.otherRiskFactors.elevatedBNP && !event.otherRiskFactors.elevatedCRP &&
              <span className="text-slate-500 italic font-semibold">No high-risk marker flags checked</span>
              }
                </div>
              </div>
          }
          </div>
        }

        {/* Render CABG Adult Cardiac Surgery */}
        {type === 'CABG' &&
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border rounded-xl text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase block">Cardiothoracic Surgeon</span>
                <span className="text-slate-800 font-bold block mt-1">{event.surgeonName} ({event.surgeonId})</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase block">Procedure Status / Urgency</span>
                <span className="text-slate-800 font-bold block mt-1">{event.procedureStatus}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase block">CPB Utilization</span>
                <span className="text-slate-800 font-bold block mt-1">{event.cpbUtilization}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase block">Incision Start</span>
                <span className="text-slate-800 font-bold block mt-1 font-mono">{event.skinIncisionStart} AM</span>
              </div>
            </div>

            {/* CPB & Occlusion Details */}
            {event.cpbUtilization !== 'None' &&
          <div className="p-4 border rounded-xl bg-slate-50 text-xs grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-slate-400 block">Perfusion Time:</span>
                  <span className="text-slate-800 font-bold block font-mono mt-0.5">{event.cpbDetails?.perfusionTimeMinutes} minutes</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Aortic Clamping Occlusion:</span>
                  <span className="text-slate-800 font-bold block mt-0.5">{event.aorticOcclusion}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Aortic Cross-clamp time:</span>
                  <span className="text-slate-800 font-bold block font-mono mt-0.5">{event.crossClampTimeMinutes ? `${event.crossClampTimeMinutes} minutes` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Cardioplegia utilized:</span>
                  <span className="text-slate-800 font-bold block mt-0.5">{event.cardioplegiaUsed}</span>
                </div>
              </div>
          }

            {/* Section J: Conduits detail */}
            {event.hasCoronaryBypass === 'Yes' && event.bypassDetails &&
          <div className="p-4 border border-purple-100 bg-purple-50/20 rounded-xl space-y-4 text-xs">
                <span className="text-purple-950 font-bold uppercase block flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-600" /> Section J: Coronary Bypass Anastomoses & Conduits Audits
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-slate-400 block">Arterial Conduits:</span>
                    <span className="text-slate-800 font-black block mt-1">{event.bypassDetails.distalAnastomosesArterial} Distal Conduits</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Venous Conduits:</span>
                    <span className="text-slate-800 font-black block mt-1">{event.bypassDetails.distalAnastomosesVenous} Distal Conduits</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">IMAs Grafts:</span>
                    <span className="text-slate-800 font-bold block mt-1">{event.bypassDetails.imasUsedGrafts}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Assistive Devices:</span>
                    <span className="text-slate-800 font-bold block mt-1">{event.bypassDetails.anastomoticDevice || 'None'}</span>
                  </div>
                </div>
              </div>
          }

            {/* Devices & Consumables (IABP & Blood Transfusions) */}
            <div className="p-4 border rounded-xl bg-slate-50 text-xs space-y-4">
              <span className="text-slate-700 font-bold uppercase block">Devices & Consumables (IABP / Blood Products)</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-400 block">IABP Used:</span>
                  <span className="text-slate-800 font-bold block mt-1">{event.iabpUsed || 'No'}</span>
                </div>
                {event.iabpUsed === 'Yes' && event.iabpDetails &&
              <div>
                    <span className="text-slate-400 block">IABP Timing:</span>
                    <span className="text-slate-800 font-bold block mt-1">{event.iabpDetails.whenInserted}</span>
                  </div>
              }
                <div>
                  <span className="text-slate-400 block">Blood Products Transfused:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {event.intraopBloodProducts?.used === 'Yes' ?
                  <>
                        {event.intraopBloodProducts.rbcUnits > 0 && <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded font-bold uppercase text-[9px]">RBC</span>}
                        {event.intraopBloodProducts.ffpUnits > 0 && <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded font-bold uppercase text-[9px]">FFP</span>}
                        {event.intraopBloodProducts.plateletUnits > 0 && <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded font-bold uppercase text-[9px]">Platelets</span>}
                        {event.intraopBloodProducts.cryoUnits > 0 && <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded font-bold uppercase text-[9px]">Cryoprecipitate</span>}
                      </> :

                  <span className="text-slate-500 italic">None</span>
                  }
                  </div>
                </div>
              </div>
            </div>

            {/* Concomitant Valve Details */}
            {event.hasValveSurgery === 'Yes' && event.valveDetails &&
          <div className="p-4 border border-blue-100 bg-blue-50/20 rounded-xl space-y-4 text-xs">
                <span className="text-blue-950 font-bold uppercase block flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-600" /> Concomitant Valve Surgery Detail
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-slate-400 block">Target Valve Procedure:</span>
                    <span className="text-slate-800 font-bold block mt-1">
                      {event.valveDetails.aorticProcedure !== 'No' ? 'Aortic Valve' :
                  event.valveDetails.mitralProcedure !== 'No' ? 'Mitral Valve' :
                  event.valveDetails.tricuspidProcedure !== 'No' ? 'Tricuspid Valve' :
                  event.valveDetails.pulmonicProcedure !== 'No' ? 'Pulmonic Valve' : 'Valve Surgery'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Implant Type:</span>
                    <span className="text-slate-800 font-bold block mt-1">{event.valveDetails.prosthesisAortic?.type || 'Repair'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Brand / Model:</span>
                    <span className="text-slate-800 font-bold block mt-1">{event.valveDetails.prosthesisAortic?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Valve Size (mm):</span>
                    <span className="text-slate-800 font-bold block mt-1 font-mono">{event.valveDetails.prosthesisAortic?.size || 'N/A'}</span>
                  </div>
                </div>
              </div>
          }

            {/* VAD details */}
            {event.hasVAD === 'Yes' && event.vadDetails &&
          <div className="p-4 border border-teal-100 bg-teal-50/20 rounded-xl space-y-4 text-xs">
                <span className="text-teal-950 font-bold uppercase block flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-600" /> Ventricular Assist Device (VAD) Implementation
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-slate-400 block">VAD Indication:</span>
                    <span className="text-slate-800 font-bold block mt-1">{event.vadDetails.indication}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Device Type:</span>
                    <span className="text-slate-800 font-bold block mt-1">{event.vadDetails.deviceData?.implantType || 'LVAD'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Target Flow Rate:</span>
                    <span className="text-slate-800 font-bold block mt-1 font-mono">{event.vadDetails.deviceData?.productType === 'VAD' ? '4.5 L/min' : 'N/A'}</span>
                  </div>
                </div>
              </div>
          }

            {/* Quality Indicators & Outcomes */}
            <div className="p-4 border rounded-xl bg-slate-50 text-xs space-y-4">
              <span className="text-slate-700 font-bold uppercase block">Quality Indicators & Clinical Outcomes</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="block font-bold text-slate-700">Surgical Re-exploration Needed:</span>
                    <span className="block text-[10px] text-slate-500">Bleeding, tamponade, or graft checks</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${event.postoperative?.inHospitalComplications?.includes('Reexploration') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {event.postoperative?.inHospitalComplications?.includes('Reexploration') ? 'YES' : 'NO'}
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="block font-bold text-slate-700">Operative / 30-day Mortality:</span>
                    <span className="block text-[10px] text-slate-500">Surgical mortality record status</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${event.mortality?.operativeDeath === 'Yes' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {event.mortality?.operativeDeath === 'Yes' ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        }

        {/* Render Lab Result */}
        {type === 'Lab' &&
        <div className="p-4 bg-slate-50 border rounded-xl">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-4">Laboratory Observations Parameters</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-center">
              <div className="p-3 bg-white border border-slate-100 rounded-lg">
                <span className="text-slate-400 block">Serum Potassium</span>
                <span className="text-lg font-black text-slate-800 mt-1 block font-mono">{event.potassium || 'N/A'} <span className="text-xs font-normal">mEq/L</span></span>
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded-lg">
                <span className="text-slate-400 block">Serum Creatinine</span>
                <span className="text-lg font-black text-slate-800 mt-1 block font-mono">{event.creatinine || 'N/A'} <span className="text-xs font-normal">mg/dL</span></span>
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded-lg">
                <span className="text-slate-400 block">Brain Natriuretic Peptide (BNP)</span>
                <span className="text-lg font-black text-slate-800 mt-1 block font-mono">{event.bnp || 'N/A'} <span className="text-xs font-normal">pg/mL</span></span>
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded-lg">
                <span className="text-slate-400 block">Troponin-I Level</span>
                <span className="text-lg font-black text-slate-800 mt-1 block font-mono">{event.tropI || 'N/A'} <span className="text-xs font-normal">ng/mL</span></span>
              </div>
            </div>
          </div>
        }

        {/* Render Investigation */}
        {type === 'Investigation' &&
        <div className="p-4 bg-slate-50 border rounded-xl">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-3">{event.testType} Diagnostic Report details</span>
            
            {event.testType === 'ECG' &&
          <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
                <p className="bg-white p-3 border rounded-xl text-slate-700">Heart Rate: {event.results?.hr || 'N/A'} bpm</p>
                <p className="bg-white p-3 border rounded-xl text-slate-700">Rhythm: {event.results?.rhythm || 'N/A'}</p>
              </div>
          }

            {event.testType === 'ECHO' &&
          <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
                <p className="bg-white p-3 border rounded-xl text-slate-700 text-teal-800">Ejection Fraction (EF%): {event.results?.ef || 'N/A'}%</p>
                <p className="bg-white p-3 border rounded-xl text-slate-700">Regional Wall Motion (RWMA): {event.results?.rwma || 'None'}</p>
              </div>
          }
          </div>
        }

        {/* Render Follow-up detail */}
        {type === 'Follow-up' &&
        <div className="p-4 bg-slate-50 border rounded-xl space-y-4 text-xs">
            <span className="text-slate-500 text-xs font-bold uppercase block">Structured Follow-up visit clinical symptoms</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-semibold text-slate-700">
              <div className="bg-white p-3 border rounded-xl">Recurrent Angina Present? <span className="text-blue-600 block text-base font-extrabold mt-1">{event.symptoms?.angina}</span></div>
              <div className="bg-white p-3 border rounded-xl">Heart Failure NYHA Functional Status: <span className="text-purple-600 block text-base font-extrabold mt-1">{event.symptoms?.breathlessnessClass || 'N/A'}</span></div>
            </div>
          </div>
        }

      </div>

    </div>);

}