import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, Trash2, X } from 'lucide-react';
import { getFriendlyErrorMessage } from '../utils/errorMapper';
import { scrollToAndHighlightField } from '../utils/fieldScrollHelper';

// Create React Context for Global Alerts & Confirmation Modals
const AlertContext = createContext(null);

/**
 * AlertProvider Component
 * Wraps the main application to provide a custom, styled modal UI for alerts and confirmations.
 */
export function AlertProvider({ children }) {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'info', // 'success' | 'danger' | 'delete' | 'warning' | 'info'
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    targetField: null,
    onConfirm: null,
    onCancel: null,
  });

  const closeModal = (targetField = null) => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
    const fieldToScroll = targetField || modalConfig.targetField;
    if (fieldToScroll) {
      setTimeout(() => {
        scrollToAndHighlightField(fieldToScroll);
      }, 100);
    }
  };

  /**
   * Triggers an informative or success alert modal.
   * Supports both async/await and optional onConfirm callback.
   */
  const showAlert = ({
    type = 'info',
    title = 'Notice',
    message = '',
    confirmText = 'OK',
    targetField = null,
    onConfirm = null,
  }) => {
    // Sanitize any raw error or technical message passed directly to showAlert
    let finalTitle = title;
    let finalMessage = message;
    let finalType = type;
    let finalTargetField = targetField;

    const friendly = getFriendlyErrorMessage(message);
    if (friendly.targetField && !finalTargetField) {
      finalTargetField = friendly.targetField;
    }

    if (type === 'danger' || type === 'error' || type === 'warning' || typeof message !== 'string' || message.includes('SQL') || message.includes('dbo.') || message.includes('duplicate key') || message.includes('2627') || message.includes('2601')) {
      finalMessage = friendly.message;
      if (title === 'Notice' || title === 'Error' || title === 'Save Failed') {
        finalTitle = friendly.title;
      }
      if (type === 'danger' || type === 'error') {
        finalType = friendly.type;
      }
    }

    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        type: finalType,
        title: finalTitle,
        message: finalMessage,
        confirmText,
        cancelText: 'Cancel',
        showCancel: false,
        targetField: finalTargetField,
        onConfirm: async () => {
          closeModal(finalTargetField);
          if (onConfirm) await onConfirm();
          resolve(true);
        },
        onCancel: () => {
          closeModal(finalTargetField);
          resolve(false);
        },
      });
    });
  };

  /**
   * Triggers a confirm dialogue modal for delete/edit actions.
   * Supports both async/await (returns true/false) and optional callbacks.
   */
  const showConfirm = ({
    type = 'danger',
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm = null,
    onCancel = null,
  }) => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        type,
        title,
        message,
        confirmText,
        cancelText,
        showCancel: true,
        onConfirm: async () => {
          closeModal();
          if (onConfirm) await onConfirm();
          resolve(true);
        },
        onCancel: async () => {
          closeModal();
          if (onCancel) await onCancel();
          resolve(false);
        },
      });
    });
  };

  // Helper to render type-specific circular icon indicators
  const renderIcon = () => {
    const t = String(modalConfig.type).toLowerCase();
    if (t === 'success') {
      return (
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border-4 border-emerald-50 shrink-0">
          <CheckCircle2 className="w-8 h-8" />
        </div>
      );
    }
    if (t === 'danger' || t === 'delete' || t === 'warning') {
      return (
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center border-4 border-rose-50 shrink-0">
          {t === 'delete' ? <Trash2 className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
        </div>
      );
    }
    // Default 'info'
    return (
      <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border-4 border-blue-50 shrink-0">
        <Info className="w-8 h-8" />
      </div>
    );
  };

  // Dynamic button styles based on type
  const getConfirmBtnClass = () => {
    const t = String(modalConfig.type).toLowerCase();
    if (t === 'success') {
      return 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-2 focus:ring-emerald-500/50';
    }
    if (t === 'danger' || t === 'delete' || t === 'warning') {
      return 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-2 focus:ring-rose-500/50';
    }
    return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500/50';
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Global Custom Modal Dialogue Overlay */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          
          {/* Modal Box */}
          <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center font-sans space-y-4 animate-scaleUp">
            
            {/* Top Right 'X' Dismiss Button */}
            <button
              onClick={modalConfig.onCancel}
              className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Top Center Circular Icon Indicator */}
            {renderIcon()}

            {/* Middle Bold Title */}
            <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-tight px-4">
              {modalConfig.title || 'Notification'}
            </h3>

            {/* Centered Gray Message Text */}
            {modalConfig.message && (
              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed px-2">
                {modalConfig.message}
              </p>
            )}

            {/* Bottom Action Buttons */}
            <div className="w-full pt-2">
              {modalConfig.showCancel ? (
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={modalConfig.onCancel}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                  >
                    {modalConfig.cancelText || 'Cancel'}
                  </button>
                  <button
                    onClick={modalConfig.onConfirm}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${getConfirmBtnClass()}`}
                  >
                    {modalConfig.confirmText || 'Confirm'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={modalConfig.onConfirm}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer uppercase tracking-wider ${getConfirmBtnClass()}`}
                >
                  {modalConfig.confirmText || 'CONTINUE'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

/**
 * Custom hook to access showAlert and showConfirm from any component.
 */
export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an <AlertProvider>');
  }
  return context;
}

export default AlertContext;
