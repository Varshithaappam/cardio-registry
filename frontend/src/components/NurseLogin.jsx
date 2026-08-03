/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, ShieldAlert, User, Lock, Activity, RefreshCw } from 'lucide-react';
import api from '../api/axiosInstance';

export default function NurseLogin({ onLogin, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const targetUsername = username.trim();
    const targetPassword = password;

    if (!targetUsername || !targetPassword) {
      setError('Please provide valid clinical credentials.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Send POST request to /api/auth/login via central Axios instance
      const response = await api.post('/auth/login', {
        username: targetUsername,
        password: targetPassword
      });

      const data = response.data;
      if (data && data.token) {
        // Save token and user details to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Call parent callbacks
        if (typeof onLoginSuccess === 'function') {
          onLoginSuccess(data.user);
        }
        if (typeof onLogin === 'function') {
          onLogin(data.user.username, data.user.role, data.user);
        }
      } else {
        setError('Invalid clinical credentials or inactive account.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Invalid clinical credentials or inactive account.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium flex gap-2 items-center">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Username / Email</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Username or email (e.g. dr_smith, nurse@cardio.org)"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authorizing Shift Session...</span>
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                <span>Initialize EHR & View Registry</span>
              </>
            )}
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
    </div>
  );
}
