// Hash router. Routes: #/rmm/policies, #/rmm/logs, #/ai/policies, #/ai/logs, #/ai-security/inventory,
// #/ai-security/users-hosts, #/settings/groups, #/frames, #/f/<frame-id>. Query: ?scope=msp, &state=<ui state>.
import { frameById } from './data/frames.js';

export function parseHash(hash = window.location.hash) {
  let h = (hash || '').replace(/^#/, '') || '/ai/logs';
  let frame = null;
  const fm = h.match(/^\/f\/([\d]+[-:][\d]+)/);
  if (fm) {
    frame = frameById[fm[1].replace(':', '-')] || null;
    h = frame ? frame.route + (frame.route.includes('?') ? '&' : '?') + 'state=' + encodeURIComponent(frame.state) : '/rmm/logs';
  }
  const [path, qs] = h.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  return { path, query, frame, raw: h };
}

export const go = (path) => { window.location.hash = path; };

/** Which side-nav entry is selected for a path. */
export function navFor(path) {
  if (path.startsWith('/rmm')) return { group: 'app-control', item: 'rmm' };
  if (path.startsWith('/ai-security')) return { group: 'ai-security', item: null };
  if (path.startsWith('/ai')) return { group: 'app-control', item: 'ai' };
  if (path.startsWith('/settings')) return { group: 'settings', item: 'groups' };
  return { group: null, item: null };
}
