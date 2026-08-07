/**
 * Global Unified Input & Option Card Style Constants (Single Source of Truth)
 */

export const FORM_STYLES = {
  // --- TYPOGRAPHY ---
  
  // E.g., "1. PATIENT PROFILE" (ONLY Level 1 Main Section Headings use uppercase)
  mainHeading: "text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-1",
  
  // E.g., "Master registry demographics and baseline comorbidities"
  sectionDescription: "text-xs text-slate-500 mb-4",
  
  // E.g., "Vitals Metrics" or "Medical History"
  subHeading: "text-sm font-bold text-slate-700 capitalize border-b border-slate-200 pb-2 mb-3 mt-4",
  
  // E.g., "Visit Type", "Patient Name"
  label: "block text-xs font-semibold text-slate-600 capitalize mb-1.5",
  
  // --- FORM INPUTS ---
  
  // Standard text box for typing and dates
  inputBase: "w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 placeholder:font-normal transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500",
  
  // Error state for missing/invalid data
  inputError: "w-full border border-red-500 rounded-md px-3 py-2 text-sm font-medium text-red-900 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500",
  
  // Disabled or read-only text box
  inputDisabled: "w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-medium text-slate-500 bg-slate-50 cursor-not-allowed",
  
  // --- OPTIONS & CARDS ---
  
  // The wrapper card for a selectable option (inactive)
  optionCardBase: "flex items-center gap-2 p-2.5 border border-slate-200 bg-white text-slate-700 rounded-md cursor-pointer transition-colors hover:border-slate-300 text-xs font-semibold select-none",
  
  // The wrapper card for a selectable option (active/checked)
  optionCardActive: "flex items-center gap-2 p-2.5 border border-teal-600 bg-white text-teal-900 rounded-md ring-1 ring-teal-600 cursor-pointer transition-colors text-xs font-semibold select-none shadow-sm",
  
  // The actual radio/checkbox circle or square
  checkRadioBase: "w-4 h-4 text-teal-600 bg-white border-slate-300 focus:ring-2 focus:ring-teal-500 cursor-pointer"
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
export const OPTION_CARD_ERROR_STYLES = "flex items-center gap-2 p-2.5 border border-red-500 bg-red-50 text-red-900 rounded-md cursor-pointer text-xs font-semibold select-none";
export const OPTION_CARD_DISABLED_STYLES = "flex items-center gap-2 p-2.5 border border-slate-200 bg-slate-50 text-slate-500 rounded-md cursor-not-allowed text-xs font-semibold select-none opacity-85";
export const CHECKBOX_STYLES = `${FORM_STYLES.checkRadioBase} rounded shrink-0`;
export const RADIO_STYLES = `${FORM_STYLES.checkRadioBase} rounded-full shrink-0`;
