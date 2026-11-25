import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  RefreshCw,
  Copy,
  Check,
  Send,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  ChevronRight,
  X,
  FileText,
  Activity,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

/**
 * Executive AI Clinical Intelligence Summary Component
 * Provides:
 * 1. One prominent Summary Button
 * 2. Question Asking Area (Input & Quick Prompts)
 * 3. Pop-up Container for full summary or answered question
 */
export default function ExecutiveAiSummary({
  metrics = {},
  totalRecords = 246,
  hfRecords = 138,
  stemiRecords = 62,
  nstemiRecords = 46
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState('summary'); // 'summary' | 'qa'
  const [activePersonaTab, setActivePersonaTab] = useState('executive'); // 'executive' | 'clinical' | 'financial'
  const [isCopied, setIsCopied] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [chatPrompt, setChatPrompt] = useState('');
  const [modalChatPrompt, setModalChatPrompt] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [customResponse, setCustomResponse] = useState(null);

  // Dynamic values with fallbacks
  const overallMortality = metrics.displayOverallMortality ?? '7.7';
  const inHospMortality = metrics.displayOverallInHospMortality ?? '3.3';
  const readmissionRate = metrics.displayOverallReadmissionRate ?? '12.3';
  const hfReadmission = metrics.displayHfReadmissionRate ?? '15.2';
  const d2bMet = metrics.d2bMetRate ?? '97.1';
  const cathMet = metrics.cathNstemiRate ?? '100.0';
  const gdmtAdherence = metrics.hfGdmtAdherence ?? '15.8';
  const revenueDisplay = metrics.costStats?.combinedDisplay ?? '₹ 0.84 Cr';
  const combinedAlos = metrics.stayStats?.combinedAvg ?? '6.8 days';
  const stemiAlos = metrics.stayStats?.stemiAvg ?? '5.8 d';
  const nstemiAlos = metrics.stayStats?.nstemiAvg ?? '13.9 d';

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Suggested Prompts
  const suggestedPrompts = [
    'Why is HF readmission 15.2%?',
    'Compare STEMI vs NSTEMI ALOS',
    'Cath-Lab Stent & Package Cost',
    'In-Hospital Mortality Determinants'
  ];

  // Handle Open Summary Popup
  const handleOpenSummary = (tab = 'executive') => {
    setActivePersonaTab(tab);
    setModalView('summary');
    setIsModalOpen(true);
  };

  // Answer Generator logic (Pre-configured for future Gemini / backend API)
  const generateAnswer = (q) => {
    if (/readmi/i.test(q)) {
      return {
        title: '30-Day Readmission Root Cause Analysis',
        text: `Heart Failure 30-day readmissions stand at ${hfReadmission}% (overall cohort: ${readmissionRate}%). Key drivers identified from clinical records: 43.5% of decompensated patients have concomitant cardiorenal CKD, and only ${gdmtAdherence}% are maintained on complete 4-pillar GDMT at discharge. Recommended clinical action: Implement dedicated Day-7 and Day-14 post-discharge telephone navigation and prioritize heart failure outpatient titration clinic appointments.`
      };
    } else if (/alos|stay|length/i.test(q)) {
      return {
        title: 'Length of Stay Variance (STEMI vs NSTEMI Analysis)',
        text: `STEMI average length of stay is well-controlled at ${stemiAlos} driven by rapid primary PCI (mean door-to-balloon 54 min; compliance ${d2bMet}%). In contrast, NSTEMI averages ${nstemiAlos} due to prolonged stepdown telemetry observation (avg 24h) and complex elderly comorbidities (70.6% age ≥ 60). Recommended clinical action: Standardize early risk-stratified invasive catheterization (<24h) to discharge pathway to compress NSTEMI stay by ~1.5 to 2.0 days.`
      };
    } else if (/cost|financial|revenue|stent|package/i.test(q)) {
      return {
        title: 'Financial & Resource Utilization Synthesis',
        text: `Combined ACS realized expenditure is ${revenueDisplay}. Cath-Lab packages & coronary stents represent 39.4% of total realized spend (₹67.8L), followed by inpatient drugs & disposables at 21.4% (₹36.8L). Recommended administrative action: Consolidate cath-lab vendor contracts and standardize dual antiplatelet formulary to achieve an estimated 10-12% procurement optimization.`
      };
    } else if (/mortal|death|surviv/i.test(q)) {
      return {
        title: 'Mortality Determinants & Benchmark Analysis',
        text: `In-hospital mortality is currently ${inHospMortality}% (below the national quality ceiling of <5.0%). Overall all-cause mortality is ${overallMortality}%. Deceased patients in the registry show a high concentration of severe left ventricular dysfunction (EF < 40%: 92.3%) and advanced CKD (69.2% vs 43.2% in survivors). Major in-hospital safety events (bleeding 2.2%, stroke ≤2.2%) remain strictly within benchmark safety envelopes.`
      };
    } else {
      return {
        title: `Clinical Registry Intelligence for "${q}"`,
        text: `Synthesizing across ${totalRecords} audited records (HF: ${hfRecords}, STEMI: ${stemiRecords}, NSTEMI: ${nstemiRecords}): Procedural quality benchmarks are well maintained (D2B compliance ${d2bMet}%, NSTEMI early cath ${cathMet}%, TIMI-3 normal flow >74%). High-leverage operational targets include expanding GDMT 4-pillar initiation (${gdmtAdherence}%) and strengthening post-discharge 30-day nurse touchpoints.`
      };
    }
  };

  // Handle Question Submission from Main Dashboard Card
  const handleAskQuestion = (questionText) => {
    const q = (questionText || chatPrompt).trim();
    if (!q) return;

    setCurrentQuestion(q);
    setChatPrompt('');
    setIsSynthesizing(true);
    setModalView('qa');
    setIsModalOpen(true);

    setTimeout(() => {
      setCustomResponse(generateAnswer(q));
      setIsSynthesizing(false);
    }, 600);
  };

  // Handle Question Submission from Inside Modal
  const handleModalAskQuestion = (e) => {
    e?.preventDefault();
    const q = modalChatPrompt.trim();
    if (!q) return;

    setCurrentQuestion(q);
    setModalChatPrompt('');
    setIsSynthesizing(true);
    setModalView('qa');

    setTimeout(() => {
      setCustomResponse(generateAnswer(q));
      setIsSynthesizing(false);
    }, 500);
  };

  // Handle Copy Briefing
  const handleCopy = () => {
    const textToCopy = `CARE Hospitals Executive Clinical Intelligence Briefing
Audit Scope: N=${totalRecords} (HF: ${hfRecords}, STEMI: ${stemiRecords}, NSTEMI: ${nstemiRecords})
• In-Hospital Mortality: ${inHospMortality}% (Target: < 5.0% - Met)
• Overall All-Cause Mortality: ${overallMortality}%
• Reperfusion Quality: STEMI D2B ≤ 90m compliance at ${d2bMet}%; NSTEMI Cath < 24h at ${cathMet}%
• 30-Day Readmission: ${readmissionRate}% overall (HF: ${hfReadmission}%)
• HF GDMT 4-Pillar Adherence: ${gdmtAdherence}%
• Combined ACS Realized Spend: ${revenueDisplay} (ALOS: ${combinedAlos}; STEMI: ${stemiAlos}, NSTEMI: ${nstemiAlos})`;

    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Re-Synthesize Simulation
  const handleRegenerate = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      if (modalView === 'qa' && currentQuestion) {
        setCustomResponse(generateAnswer(currentQuestion));
      }
      setIsSynthesizing(false);
    }, 600);
  };

  return (
    <>
      {/* =========================================================================
          MAIN DASHBOARD CARD: SUMMARY BUTTON & QUESTION ASKING AREA
         ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group">
        {/* Decorative ambient gradient backdrop */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-purple-600/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl pointer-events-none"></div>

        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-xs shrink-0">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1">
                    AI Clinical Assistant
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    Gemini Clinical
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Live Engine • N={totalRecords} Cases</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenSummary('executive')}
              className="text-[10px] text-purple-300 hover:text-white bg-purple-500/20 hover:bg-purple-500/30 px-2 py-1 rounded-lg border border-purple-400/30 transition flex items-center gap-1 cursor-pointer"
              title="Open full AI summary"
            >
              <span>View Brief</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* 1. Summary Button (Prominent Action) */}
          <div className="mt-3">
            <button
              onClick={() => handleOpenSummary('executive')}
              className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-between group cursor-pointer border border-purple-400/40"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-extrabold flex items-center gap-1.5">
                    <span>AI Executive Clinical Summary</span>
                    <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                  </div>
                  <div className="text-[9.5px] text-purple-100 font-normal">
                    Click to pop up 60-second multi-registry briefing
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-200 group-hover:translate-x-1 transition" />
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-2.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[9px] uppercase font-bold text-slate-500">
              <span className="bg-slate-900 px-2 tracking-wider">or ask a question</span>
            </div>
          </div>

          {/* 2. Question Asking Area */}
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskQuestion();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                placeholder="Ask AI about mortality, stay, readmission, costs..."
                className="w-full bg-slate-950/90 border border-slate-700 hover:border-slate-600 rounded-xl pl-3 pr-9 py-2 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition shadow-inner"
              />
              <button
                type="submit"
                disabled={!chatPrompt.trim()}
                className="absolute right-1.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-purple-600 transition cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                title="Send Question"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Suggestion Chips */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[9px] text-slate-400">
                <span className="font-semibold text-slate-500">Suggested Prompts:</span>
                <span className="text-[8.5px] text-purple-400">Pops up answer</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {suggestedPrompts.slice(0, 3).map((promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAskQuestion(promptText)}
                    className="text-[9px] px-2 py-0.5 rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 hover:border-purple-400/50 transition cursor-pointer truncate max-w-full"
                  >
                    💬 {promptText}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-500">
          <span className="flex items-center gap-1">
            <Bot className="w-3 h-3 text-purple-400" />
            <span>Answers pop up in container</span>
          </span>
          <button
            onClick={() => handleOpenSummary('financial')}
            className="text-slate-400 hover:text-purple-300 cursor-pointer transition"
          >
            Financial ALOS →
          </button>
        </div>
      </div>

      {/* =========================================================================
          3. POP-UP CONTAINER (Modal Dialog for Summary or Question Answer)
         ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          {/* Backdrop click to close */}
          <div
            className="absolute inset-0"
            onClick={() => setIsModalOpen(false)}
          ></div>

          <div
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl text-white relative z-10 max-h-[92vh] flex flex-col justify-between overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Lighting Blurs */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex-1 min-h-0 flex flex-col">
              {/* Pop-up Container Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        CARE Clinical AI Intelligence Container
                      </h3>
                      <span className="text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30 hidden sm:inline-block">
                        Gemini Executive
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                      Multi-Registry Clinical Synthesis • HF ({hfRecords}), STEMI ({stemiRecords}), NSTEMI ({nstemiRecords}) • Total N={totalRecords} Cases
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
                    title="Copy briefing to clipboard"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy Brief'}</span>
                  </button>

                  <button
                    onClick={handleRegenerate}
                    disabled={isSynthesizing}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer disabled:opacity-50"
                    title="Re-synthesize intelligence"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSynthesizing ? 'animate-spin text-purple-400' : ''}`} />
                  </button>

                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title="Close container (ESC)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* View Switcher: Summary View vs Q&A Answer View */}
              <div className="flex items-center justify-between gap-2 mt-3 mb-2 shrink-0">
                <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60 text-xs font-semibold">
                  <button
                    onClick={() => setModalView('summary')}
                    className={`flex items-center gap-1.5 py-1 px-3 rounded-lg transition cursor-pointer ${
                      modalView === 'summary'
                        ? 'bg-purple-600 text-white shadow-xs font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Executive Summary</span>
                  </button>
                  <button
                    onClick={() => setModalView('qa')}
                    className={`flex items-center gap-1.5 py-1 px-3 rounded-lg transition cursor-pointer ${
                      modalView === 'qa'
                        ? 'bg-purple-600 text-white shadow-xs font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>AI Question Answer</span>
                    {customResponse && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    )}
                  </button>
                </div>

                {modalView === 'summary' && (
                  <div className="flex items-center gap-1 bg-slate-800/60 p-0.5 rounded-xl border border-slate-700/40 text-[10.5px] font-semibold">
                    <button
                      onClick={() => setActivePersonaTab('executive')}
                      className={`py-1 px-2.5 rounded-lg transition cursor-pointer ${
                        activePersonaTab === 'executive'
                          ? 'bg-slate-700 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Executive Scan
                    </button>
                    <button
                      onClick={() => setActivePersonaTab('clinical')}
                      className={`py-1 px-2.5 rounded-lg transition cursor-pointer ${
                        activePersonaTab === 'clinical'
                          ? 'bg-slate-700 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Clinical Quality
                    </button>
                    <button
                      onClick={() => setActivePersonaTab('financial')}
                      className={`py-1 px-2.5 rounded-lg transition cursor-pointer ${
                        activePersonaTab === 'financial'
                          ? 'bg-slate-700 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Financial &amp; ALOS
                    </button>
                  </div>
                )}
              </div>

              {/* Scrollable Container Content Body */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-1">
                {isSynthesizing ? (
                  <div className="py-16 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                    <div className="text-sm font-semibold text-white">Synthesizing Clinical Registry Data...</div>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Cross-analyzing Heart Failure, STEMI, and NSTEMI clinical outcome metrics across {totalRecords} records.
                    </p>
                  </div>
                ) : modalView === 'qa' ? (
                  /* =========================================================================
                     Q&A ANSWER VIEW CONTAINER
                     ========================================================================= */
                  <div className="space-y-4 animate-fade-in">
                    {/* The Active Question */}
                    <div className="bg-slate-800/90 border border-purple-500/40 rounded-2xl p-4">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                        <MessageSquare className="w-4 h-4 text-purple-400" />
                        <span>Query Submitted:</span>
                      </div>
                      <div className="text-sm sm:text-base font-bold text-white">
                        "{currentQuestion || 'General Registry Intelligence Overview'}"
                      </div>
                    </div>

                    {/* The AI Answer Container */}
                    <div className="bg-gradient-to-br from-slate-800/90 via-slate-850 to-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                        <Bot className="w-4 h-4" />
                        <span>{customResponse?.title || 'AI Clinical Analysis & Recommendation'}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {customResponse?.text || `Registry analysis of ${totalRecords} audited records indicates strong reperfusion timeliness (D2B compliance ${d2bMet}%) with favorable in-hospital mortality at ${inHospMortality}%. Strategic focus should prioritize heart failure 30-day readmissions and outpatient GDMT titration.`}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400">
                          Analysis source: CARE Registry Audit Engine &amp; MSSQL Database
                        </span>
                        <button
                          onClick={() => setModalView('summary')}
                          className="text-xs text-purple-300 hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition"
                        >
                          <span>View Full Executive Summary</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Follow-up Prompts */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-slate-400 block">Ask a follow-up query:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedPrompts.map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAskQuestion(p)}
                            className="text-xs px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                          >
                            💬 {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* =========================================================================
                     FULL EXECUTIVE SUMMARY VIEW CONTAINER
                     ========================================================================= */
                  <div className="space-y-4 animate-fade-in">
                    {/* 3 Metric Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Card 1: Clinical Outcomes */}
                      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Executive Outcomes</span>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-300">
                          <div className="flex justify-between pb-1 border-b border-slate-700/50">
                            <span className="text-slate-400">In-Hosp Mortality:</span>
                            <strong className="text-emerald-300">{inHospMortality}% (Target &lt;5%)</strong>
                          </div>
                          <div className="flex justify-between pb-1 border-b border-slate-700/50">
                            <span className="text-slate-400">All-Cause Mortality:</span>
                            <strong className="text-white">{overallMortality}%</strong>
                          </div>
                          <div className="flex justify-between pb-1 border-b border-slate-700/50">
                            <span className="text-slate-400">30-Day Readmission:</span>
                            <strong className="text-amber-300">{readmissionRate}% (HF: {hfReadmission}%)</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">HF 4-Pillar GDMT:</span>
                            <strong className="text-rose-300">{gdmtAdherence}%</strong>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Reperfusion Timeliness */}
                      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
                          <Zap className="w-4 h-4" />
                          <span>Reperfusion Adherence</span>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-300">
                          <div className="flex justify-between pb-1 border-b border-slate-700/50">
                            <span className="text-slate-400">STEMI D2B (&le;90m):</span>
                            <strong className="text-emerald-300">{d2bMet}% (Mean 54m)</strong>
                          </div>
                          <div className="flex justify-between pb-1 border-b border-slate-700/50">
                            <span className="text-slate-400">NSTEMI Cath (&lt;24h):</span>
                            <strong className="text-emerald-300">{cathMet}%</strong>
                          </div>
                          <div className="flex justify-between pb-1 border-b border-slate-700/50">
                            <span className="text-slate-400">TIMI-3 Flow Rate:</span>
                            <strong className="text-white">&gt;74%</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Radial Access:</span>
                            <strong className="text-white">&gt;85%</strong>
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Financial & ALOS */}
                      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5">
                        <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-2">
                          <DollarSign className="w-4 h-4" />
                          <span>Economics &amp; Stay</span>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-300">
                          <div className="flex justify-between pb-1 border-b border-slate-700/50">
                            <span className="text-slate-400">Realized Spend:</span>
                            <strong className="text-white">{revenueDisplay}</strong>
                          </div>
                          <div className="flex justify-between pb-1 border-b border-slate-700/50">
                            <span className="text-slate-400">Combined ALOS:</span>
                            <strong className="text-white">{combinedAlos}</strong>
                          </div>
                          <div className="flex justify-between pb-1 border-b border-slate-700/50">
                            <span className="text-slate-400">STEMI ALOS:</span>
                            <strong className="text-emerald-300">{stemiAlos}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">NSTEMI ALOS:</span>
                            <strong className="text-amber-300">{nstemiAlos}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Narrative Section Based on Selected Persona Tab */}
                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center justify-between">
                        <span>
                          {activePersonaTab === 'executive'
                            ? 'Executive Scan Narrative'
                            : activePersonaTab === 'clinical'
                            ? 'Clinical Quality & Procedural Narrative'
                            : 'Financial & Resource Utilization Narrative'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Live Synthesis for C-Suite &amp; Audit Committees
                        </span>
                      </div>

                      {activePersonaTab === 'executive' ? (
                        <>
                          <div className="flex items-start gap-2 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/50 text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-slate-200 leading-relaxed">
                              <strong className="text-emerald-300">In-Hospital Mortality ({inHospMortality}%):</strong> Met executive target (&lt;5.0%). Primary PCI door-to-balloon timeliness is exemplary at <strong className="text-white">{d2bMet}%</strong> (mean 54 min), effectively controlling cardiogenic shock escalation.
                            </p>
                          </div>

                          <div className="flex items-start gap-2 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/50 text-xs">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-slate-200 leading-relaxed">
                              <strong className="text-amber-300">Actionable 30-Day Readmission Risk:</strong> Readmissions stand at <strong className="text-white">{readmissionRate}%</strong> overall, with Heart Failure highest at <strong className="text-amber-200">{hfReadmission}%</strong>, correlating with sub-target GDMT 4-pillar coverage ({gdmtAdherence}%).
                            </p>
                          </div>

                          <div className="flex items-start gap-2 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/50 text-xs">
                            <TrendingUp className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-slate-200 leading-relaxed">
                              <strong className="text-blue-300">Resource Stewardship:</strong> Combined ACS realized expenditure is <strong className="text-white">{revenueDisplay}</strong>. ALOS is well-controlled for STEMI ({stemiAlos}), while NSTEMI ({nstemiAlos}) presents an opportunity for stepdown observation compression.
                            </p>
                          </div>
                        </>
                      ) : activePersonaTab === 'clinical' ? (
                        <>
                          <div className="flex items-start gap-2 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/50 text-xs">
                            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-slate-200 leading-relaxed">
                              <strong className="text-amber-300">Reperfusion Benchmark:</strong> STEMI PAMI compliance is <strong className="text-white">{d2bMet}%</strong> (&le;90 min). Early Catheterization for NSTEMI (&lt;24h) is <strong className="text-white">{cathMet}%</strong>. Post-procedure TIMI-3 normal epicardial flow achieved in &gt;74% of coronary interventions.
                            </p>
                          </div>

                          <div className="flex items-start gap-2 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/50 text-xs">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <p className="text-slate-200 leading-relaxed">
                              <strong className="text-rose-300">Mortality Determinants:</strong> Deceased HF cohort exhibits marked concentration of HFrEF (&lt;40% EF: 92.3%) and Cardiorenal CKD (69.2% vs 43.2% in alive cohort).
                            </p>
                          </div>

                          <div className="flex items-start gap-2 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/50 text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-slate-200 leading-relaxed">
                              <strong className="text-emerald-300">Procedural Safety Index:</strong> Major in-hospital bleeding (2.2%-3.3%) and stroke rates (&le;2.2%) remain favorable, reflecting effective transradial vascular access pathways.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start gap-2 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/50 text-xs">
                            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-slate-200 leading-relaxed">
                              <strong className="text-emerald-300">Spend Concentration:</strong> Cath-Lab packages &amp; coronary stents comprise 39.4% of total realized spend, followed by drugs &amp; disposables at 21.4%.
                            </p>
                          </div>

                          <div className="flex items-start gap-2 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/50 text-xs">
                            <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <p className="text-slate-200 leading-relaxed">
                              <strong className="text-indigo-300">Payer Realization:</strong> Private Insurance / TPA represents 39.1% of patients, Government schemes 16.7%, and Arogyasree 29.7%.
                            </p>
                          </div>

                          <div className="flex items-start gap-2 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/50 text-xs">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-slate-200 leading-relaxed">
                              <strong className="text-amber-300">ICCU Bed Days:</strong> NSTEMI average stay ({nstemiAlos}) is elevated due to prolonged telemetry observation. Accelerating discharge pathways can save ~1.5 bed days per patient.
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Strategic C-Suite Action Plan */}
                    <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/30 rounded-2xl p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-purple-400" />
                        <span>Recommended Executive Action Plan</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                          <strong className="text-white block mb-1">1. Post-Discharge Navigation</strong>
                          <p className="text-[11px] text-slate-400">Deploy dedicated nurse telephone navigation at Day 7 &amp; 14 to reduce HF 30-day readmissions towards &lt;10% benchmark.</p>
                        </div>
                        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                          <strong className="text-white block mb-1">2. Accelerated NSTEMI Pathway</strong>
                          <p className="text-[11px] text-slate-400">Standardize early invasive cath (&lt;24h) and early stepdown discharge to compress NSTEMI ALOS from 13.9 days down to ~7-8 days.</p>
                        </div>
                        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                          <strong className="text-white block mb-1">3. Stent &amp; Package Optimization</strong>
                          <p className="text-[11px] text-slate-400">Consolidate preferred coronary stent vendor contracts to realize an estimated 10-12% cath-lab cost efficiency.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pop-up Container Bottom: Question Asking Console */}
              <div className="mt-3.5 pt-3 border-t border-slate-800 shrink-0">
                <form onSubmit={handleModalAskQuestion} className="relative flex items-center">
                  <input
                    type="text"
                    value={modalChatPrompt}
                    onChange={(e) => setModalChatPrompt(e.target.value)}
                    placeholder="Ask another question about mortality, ALOS, reperfusion, or registry trends..."
                    className="w-full bg-slate-950/90 border border-slate-700 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition"
                  />
                  <button
                    type="submit"
                    disabled={!modalChatPrompt.trim() || isSynthesizing}
                    className="absolute right-1.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-purple-600 transition cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    title="Send Question"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                  <span>Press ESC or click outside to close container</span>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer transition"
                  >
                    Close Container
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
