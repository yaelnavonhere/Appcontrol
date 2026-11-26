// One in-memory run per page load. Navigation keeps the participant's changes;
// opening or reloading the prototype always starts a clean test.
import * as seed from './data/seed.js';

const KEY = 'cynet-appcontrol-proto-v4';
const clone = o => JSON.parse(JSON.stringify(o));

/** Two starting points. 'oob' (default, for the user test, Yael 2026-11-24): out of the box, so RMM has only the
 * System policy (every group in it, in Track) and Applications has no policies (every app Under review).
 * 'sample': demo data available only through the explicit Load sample data action. */
export function initialState(mode = 'oob') {
  if (mode === 'sample') return {
    mode, scope: { level: 'site', siteId: seed.demoSiteId },
    groups: clone(seed.groups), rmmPolicies: clone(seed.rmmPolicies), aiPolicies: clone(seed.aiPolicies), toasts: [],
  };
  return {
    mode, scope: { level: 'site', siteId: seed.demoSiteId },
    groups: clone(seed.groups).map(g => ({ ...g, rmm: ['system-policy', 'Track'], ai: [null, 'Track'], aiOff: true })), // Applications is off out of the box (Yael, 2026-11-25)
    rmmPolicies: clone(seed.rmmPolicies.filter(p => p.type === 'System')),
    aiPolicies: [],
    toasts: [],
  };
}

// Discard data retained by earlier prototype versions, including copied tabs.
try { window.sessionStorage.removeItem(KEY); } catch (e) { /* storage unavailable */ }
let state = initialState();
const subs = new Set();

export const getState = () => state;
export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }

export function setState(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  subs.forEach(fn => fn(state));
}

export function resetDemo(mode = 'oob') {
  try { window.sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  state = initialState(mode);
  subs.forEach(fn => fn(state));
}

// Returning from another page may restore this document from the browser's
// back/forward cache rather than load its modules again. Treat that as a new run.
if (typeof window !== 'undefined') {
  window.addEventListener('pageshow', event => { if (event.persisted) resetDemo(); });
}

let toastSeq = 0;
const TOAST_MS = 4000;   // visible time (Yael, stage-3 feedback)
const TOAST_OUT_MS = 300; // slide-out duration, matches .toast.is-leaving in components.css
/** Success toasts only (Yael, Q7). Slides in from the right, stays 4 s, slides out. */
export function toast(title, body) {
  const id = ++toastSeq;
  setState(s => ({ toasts: [...s.toasts, { id, title, body }] }));
  setTimeout(() => dismissToast(id), TOAST_MS);
}
export function dismissToast(id) {
  if (!state.toasts.some(t => t.id === id && !t.leaving)) return;
  setState(s => ({ toasts: s.toasts.map(t => t.id === id ? { ...t, leaving: true } : t) }));
  setTimeout(() => setState(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), TOAST_OUT_MS);
}

export { seed };
