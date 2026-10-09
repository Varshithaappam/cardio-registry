/**
 * Global Unified Input & Option Card Style Constants (Single Source of Truth)
 */

export const THEME_FOCUS_STYLES = {
  hf: "focus:border-teal-600 focus:ring-teal-600 focus:outline-none",
  stemi: "focus:border-red-600 focus:ring-red-600 focus:outline-none",
  nstemi: "focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
};

export const getInputBaseStyles = (theme = 'hf') => {
  const focus = THEME_FOCUS_STYLES[theme] || THEME_FOCUS_STYLES.hf;
  return `w-full border border-slate-300 rounded-md px-3 py-2 text-xs font-medium text-slate-900 bg-white placeholder:text-slate-400 placeholder:font-normal transition-all hover:border-slate-400 ${focus}`;
};

export const FORM_STYLES = {
  // --- TYPOGRAPHY ---
  
  // E.g., "1. PATIENT PROFILE" (ONLY Level 1 Main Section Headings use uppercase)
  mainHeading: "text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-1",
  
  // E.g., "Master registry demographics and baseline comorbidities"
  sectionDescription: "text-xs text-slate-500 mb-4",
  
  // E.g., "Vitals Metrics" or "Medical History"
  subHeading: "text-sm font-bold text-slate-700 capitalize border-b border-slate-200 pb-2 mb-3 mt-4",
  
  // E.g., "Visit Type", "Patient Name"
  label: "form-field-label",
  
  // --- FORM INPUTS ---
  
  // Standard text box for typing and dates
  inputBase: "w-full border border-slate-300 rounded-md px-3 py-2 text-xs font-medium text-slate-900 bg-white placeholder:text-slate-400 placeholder:font-normal transition-all hover:border-slate-400 focus:border-teal-600 focus:ring-teal-600 focus:outline-none",
  
  // Error state for missing/invalid data
  inputError: "w-full border border-red-500 rounded-md px-3 py-2 text-xs font-medium text-red-900 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500",
  
  // Disabled or read-only text box
  inputDisabled: "w-full border border-slate-200 rounded-md px-3 py-2 text-xs font-medium text-slate-500 bg-slate-50 cursor-not-allowed",
  
  // --- OPTIONS & CARDS ---
  
  // The wrapper card for a selectable option (inactive)
  optionCardBase: "flex items-center gap-2 p-2.5 border border-slate-200 print:border-slate-200 bg-white text-slate-700 rounded-md cursor-pointer transition-colors hover:border-slate-300 text-xs font-normal select-none",
  
  // The wrapper card for a selectable option (active/checked) - neutral border, no colored rings
  optionCardActive: "flex items-center gap-2 p-2.5 border border-slate-200 print:border-slate-200 bg-white text-slate-800 rounded-md cursor-pointer transition-colors text-xs font-normal select-none",
  
  // The actual radio/checkbox circle or square - no focus rings
  checkRadioBase: "w-4 h-4 text-teal-600 bg-white border-slate-300 focus:ring-0 focus:outline-none cursor-pointer"
};

export const THEME_OPTION_ACTIVE_STYLES = {
  hf: "flex items-center gap-2 p-2.5 border border-slate-200 print:border-slate-200 bg-white text-slate-800 rounded-md cursor-pointer transition-colors text-xs font-normal select-none option-card-active",
  stemi: "flex items-center gap-2 p-2.5 border border-slate-200 print:border-slate-200 bg-white text-slate-800 rounded-md cursor-pointer transition-colors text-xs font-normal select-none option-card-active",
  nstemi: "flex items-center gap-2 p-2.5 border border-slate-200 print:border-slate-200 bg-white text-slate-800 rounded-md cursor-pointer transition-colors text-xs font-normal select-none option-card-active"
};

export const THEME_CHECK_RADIO_STYLES = {
  hf: "w-4 h-4 text-teal-600 bg-white border-slate-300 focus:ring-0 focus:outline-none cursor-pointer accent-teal-600 disabled:opacity-100 disabled:accent-teal-700",
  stemi: "w-4 h-4 text-red-600 bg-white border-slate-300 focus:ring-0 focus:outline-none cursor-pointer accent-red-600 disabled:opacity-100 disabled:accent-red-700",
  nstemi: "w-4 h-4 text-orange-500 bg-white border-slate-300 focus:ring-0 focus:outline-none cursor-pointer accent-orange-500 disabled:accent-orange-600"
};

export const getOptionCardActiveStyles = (theme = 'hf') => {
  return THEME_OPTION_ACTIVE_STYLES[theme] || THEME_OPTION_ACTIVE_STYLES.hf;
};

export const getCheckRadioStyles = (theme = 'hf') => {
  return THEME_CHECK_RADIO_STYLES[theme] || THEME_CHECK_RADIO_STYLES.hf;
};

// Aliases for backwards compatibility
export const LABEL_STYLES = FORM_STYLES.label;
export const SUBSECTION_HEADER_STYLES = FORM_STYLES.subHeading;
export const INPUT_NORMAL_STYLES = FORM_STYLES.inputBase;
export const INPUT_ERROR_STYLES = FORM_STYLES.inputError;
export const INPUT_DISABLED_STYLES = FORM_STYLES.inputDisabled;
export const OPTION_CARD_BASE_CLASSES = FORM_STYLES.optionCardBase;
export const OPTION_CARD_SELECTED_STYLES = FORM_STYLES.optionCardActive;
export const OPTION_CARD_NORMAL_STYLES = FORM_STYLES.optionCardBase;
export const OPTION_CARD_ERROR_STYLES = "flex items-center gap-2 p-2.5 border border-red-500 bg-red-50 text-red-900 rounded-md cursor-pointer text-xs font-normal select-none";
export const OPTION_CARD_DISABLED_STYLES = "flex items-center gap-2 p-2.5 border border-slate-200 print:border-slate-200 bg-white text-slate-800 rounded-md text-xs font-normal select-none";
export const CHECKBOX_STYLES = `${FORM_STYLES.checkRadioBase} rounded shrink-0`;
export const RADIO_STYLES = `${FORM_STYLES.checkRadioBase} rounded-full shrink-0`;

