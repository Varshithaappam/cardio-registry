/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Custom Lightweight Logger
 * Strips logs in production environments and avoids DevTools memory leaks.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args) => {
    if (isDev) console.log('[DEV LOG]', ...args);
  },
  info: (...args) => {
    if (isDev) console.info('[DEV INFO]', ...args);
  },
  warn: (...args) => {
    if (isDev) console.warn('[DEV WARN]', ...args);
  },
  error: (...args) => {
    // Preserve console.error for critical crash logs in all environments
    console.error('[ERROR]', ...args);
  },
  table: (tabularData) => {
    if (isDev) console.table(tabularData);
  },
  time: (label) => {
    if (isDev) console.time(label);
  },
  timeEnd: (label) => {
    if (isDev) console.timeEnd(label);
  }
};

export default logger;
