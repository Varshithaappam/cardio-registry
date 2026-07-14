/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, ShieldAlert, KeyRound, User, Lock, Activity, RefreshCw } from 'lucide-react';





export default function NurseLogin({ onLogin }) {
  const [username, setUsername] = useState('nurse@cardio.org');
  const [password, setPassword] = useState('password');
  const [pin, setPin] = useState('');
  const [selectedNurse, setSelectedNurse] = useState('sarah');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const PRESET_NURSES = [
  {
    id: 'sarah',
    name: 'Nurse Sarah Jenkins, RN',
    role: 'Chief Cardiac Care Nurse',
    email: 'nurse@cardio.org',
    pin: '1234',
    badge: 'CC-0941'
  },
  {
    id: 'david',
    name: 'Nurse David Miller, RN',
    role: 'Cardiac ICU Registrar',
    email: 'david.miller@cardio.org',
    pin: '5678',
    badge: 'ICU-8840'
  }];


  const handlePresetSelect = (id) => {
    setSelectedNurse(id);
    const nurse = PRESET_NURSES.find((n) => n.id === id);
    if (nurse) {
      setUsername(nurse.email);
      setPassword('password');
      setPin(nurse.pin);
      setError('');
    }
  };

  const handleCustomSelect = () => {
    setSelectedNurse('custom');
    setUsername('');
    setPassword('');
    setPin('');
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Simulate HIPAA & registry check delay
    setTimeout(() => {
      if (selectedNurse === 'custom') {
        if (!username || !password) {
          setError('Please provide valid clinical credentials.');
          setIsSubmitting(false);
          return;
        }
        onLogin(username.split('@')[0].toUpperCase() + ' (Staff RN)', 'Staff Registered Nurse');
      } else {
        const nurse = PRESET_NURSES.find((n) => n.id === selectedNurse);
        if (nurse) {
          if (pin !== nurse.pin) {
            setError('Incorrect security PIN. Please try again.');
            setIsSubmitting(false);
            return;
          }
          onLogin(nurse.name, nurse.role);
        }
      }
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans">
      {/* Top hospital banner */}
      <div className="max-w-md w-full mx-auto text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white">
            <Heart className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-xs font-black tracking-widest text-slate-500 uppercase">CARE HEALTH SYSTEM</span>
        </div>
        <h2 className="text-sm font-semibold text-slate-600">Cardiovascular Registry & Clinical Audit Network</h2>
      </div>

      {/* Main card */}
      <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-auto">
        {/* Secure badge header */}
        <div className="bg-slate-900 px-6 py-5 text-white relative">
          <div className="absolute top-0 right-0 p-3 text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 bg-emerald-500/10 rounded-bl-xl border-l border-b border-emerald-500/20">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            SECURE LINK
          </div>
          <h3 className="text-lg font-extrabold tracking-tight">Clinician Access Portal</h3>
          <p className="text-[11px] text-slate-400 mt-1">Authorized nurse and investigator login for patient audit tracking</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error &&
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium flex gap-2 items-center">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          }

          {/* Nurse selection switcher */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Select Nurse On Shift</label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_NURSES.map((nurse) =>
              <button
                key={nurse.id}
                type="button"
                onClick={() => handlePresetSelect(nurse.id)}
                className={`p-3 text-left rounded-xl border text-xs transition-all relative ${
                selectedNurse === nurse.id ?
                'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/10' :
                'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`
                }>
                
                  <span className="font-extrabold text-slate-800 block truncate">{nurse.id === 'sarah' ? 'Sarah Jenkins' : 'David Miller'}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{nurse.role}</span>
                  <span className="text-[9px] font-mono mt-1 px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded inline-block">Badge: {nurse.badge}</span>
                  {selectedNurse === nurse.id &&
                <span className="absolute top-2 right-2 text-blue-600 text-xs font-bold">✔</span>
                }
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleCustomSelect}
              className={`w-full py-2.5 px-3 border rounded-xl text-xs font-semibold text-center transition-all ${
              selectedNurse === 'custom' ?
              'bg-blue-50/70 border-blue-500 text-blue-700 font-bold' :
              'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`
              }>
              
              🔑 Login with custom clinical account ID
            </button>
          </div>

          {/* Form fields based on selection */}
          {selectedNurse === 'custom' ?
          <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Clinical ID / Email Address</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                  type="email"
                  required
                  placeholder="e.g. nurse@hospital.org"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)} />
                
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">EHR Secure Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} />
                
                </div>
              </div>
            </div> :

          <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-600">Enter Security PIN for Shift</label>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono">Preset PIN: {selectedNurse === 'sarah' ? '1234' : '5678'}</span>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                <input
                type="password"
                maxLength={4}
                required
                placeholder="Enter 4-digit PIN..."
                className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-center font-mono tracking-widest bg-white"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
              
              </div>
            </div>
          }

          {/* Action button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
            
            {isSubmitting ?
            <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authorizing Shift Session...</span>
              </> :

            <>
                <Activity className="w-4 h-4" />
                <span>Initialize EHR & View Registry</span>
              </>
            }
          </button>
        </form>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 text-[10px] text-slate-400 text-center">
          ⚠️ <strong>Strict Security Mandate:</strong> Unauthorized access or failure to report shift handoffs triggers auto-auditing under national clinical safety guidelines.
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-md w-full mx-auto text-center py-4 text-[11px] text-slate-400 font-medium">
        <span>CARE National Cardiovascular Database System • Certified Secure Endpoint</span>
      </div>
    </div>);

}