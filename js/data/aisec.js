// AI Security data (site level) and the approval actions that sync with the Applications policies.
// State of an app or GenAI service at the site, from the Applications policies the site's groups use:
//   the same approval in every used policy → that approval; different approvals → Mixed; no policy in use → Under review.
// There is no default Applications policy (Yael, 2026-11-24): groups with no policy don't count.
import { getState, setState, toast } from '../store.js';
import { aiApps, aiInventory, genAiServices, hosts, NOW, demoSiteId } from './seed.js';
import { c } from './copy.js';

const rng = seed => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
const DAY = 86400000;
const end = Date.parse(NOW);
const iso = t => new Date(t).toISOString();
export const AI_BY_ID = Object.fromEntries(aiApps.map(a => [a.id, a]));

// 31 people at Harbor Dental Group who used AI in the last 30 days. Each owns 1-2 hosts.
const FIRST = ['Alex', 'Jamie', 'Taylor', 'Jordan', 'Casey', 'Sam', 'Robin', 'Avery', 'Morgan', 'Riley', 'Quinn', 'Drew', 'Parker', 'Reese', 'Skyler', 'Cameron',
  'Dana', 'Elliot', 'Finley', 'Harper', 'Jesse', 'Kendall', 'Logan', 'Micah', 'Noel', 'Oakley', 'Peyton', 'Rowan', 'Sage', 'Tatum', 'Blake'];
const LAST = ['Morgan', 'Chen', 'Reed', 'Lee', 'Patel', 'Rivera', 'Kim', 'Brooks', 'Shah', 'Nguyen', 'Cohen', 'Garcia', 'Levi', 'Ortiz', 'Ward', 'Price',
  'Hayes', 'Bennett', 'Foster', 'Gray', 'Hughes', 'Jensen', 'Keller', 'Lowe', 'Mills', 'Novak', 'Owens', 'Perry', 'Ross', 'Stone', 'Tran'];
export const aiUsers = (() => {
  const r = rng(23);
  return FIRST.map((f, i) => {
    const name = `${f} ${LAST[i]}`;
    const own = [hosts[(i * 7) % hosts.length].id];
    if (r() > 0.6) own.push(hosts[(i * 7 + 19) % hosts.length].id);
    const lastDays = Math.floor(r() * (i < 12 ? 2 : 29)); // the first 12 are daily users
    return { id: `u${i}`, name, email: `${f.toLowerCase()}.${LAST[i].toLowerCase()}@harbordental.com`, hostIds: own,
      lastSeen: iso(end - lastDays * DAY - Math.floor(r() * 6) * 3600000), firstSeen: iso(end - (30 + Math.floor(r() * 60)) * DAY) };
  });
})();

const PUBLISHER = { openclaw: 'OpenClaw Labs', cursor: 'Anysphere Inc.', claude: 'Anthropic PBC', unknown: '—', chatgpt: 'OpenAI', 'google-gemini': 'Google LLC', 'microsoft-copilot': 'Microsoft Corporation', perplexity: 'Perplexity AI' };
const VERSION = { openclaw: '0.12.4', cursor: '1.6.42', claude: '0.13.19', unknown: '—', chatgpt: 'Web', 'google-gemini': 'Web', 'microsoft-copilot': 'Web', perplexity: 'Web' };
const DOMAINS = {
  openclaw: ['api.openclaw.ai', 'claude.ai', 'api.anthropic.com', 'ollama.local', 'gemini.google.com'],
  cursor: ['api2.cursor.sh', 'copilot.microsoft.com', 'chat.openai.com', 'api.anthropic.com'],
  claude: ['claude.ai', 'api.anthropic.com', 'statsig.anthropic.com'],
  unknown: ['claude.ai', 'copilot.microsoft.com', 'gemini.google.com'],
  chatgpt: ['chat.openai.com', 'api.openai.com', 'cdn.oaistatic.com'],
  'google-gemini': ['gemini.google.com', 'generativelanguage.googleapis.com'],
  'microsoft-copilot': ['copilot.microsoft.com', 'sydney.bing.com'],
  perplexity: ['www.perplexity.ai', 'api.perplexity.ai'],
};
const MCP = ['salesforce', 'drive.google', 'slack', 'github', 'jira', 'notion'];
const SERVICE_USAGE = { chatgpt: ['High', 13, 16, 7], 'google-gemini': ['Medium', 8, 9, 4], 'microsoft-copilot': ['Medium', 9, 11, 5], perplexity: ['Low', 3, 3, 3] };

/** Inventory items: AI apps (from the board) and GenAI services. */
export const items = (() => {
  const r = rng(41);
  const make = (kind, appId, usage, nUsers, nHosts, domains, related, idx) => {
    const users = aiUsers.slice().sort((a, b) => ((a.id.charCodeAt(1) * 31 + idx * 7) % 17) - ((b.id.charCodeAt(1) * 31 + idx * 7) % 17)).slice(0, nUsers);
    const hostIds = [...new Set(users.flatMap(u => u.hostIds))].slice(0, nHosts);
    const firstSeen = iso(end - (20 + Math.floor(r() * 40)) * DAY);
    return { id: appId, kind, appId, usage, userIds: users.map(u => u.id), hostIds, domains, related, firstSeen, lastSeen: NOW,
      publisher: PUBLISHER[appId], version: VERSION[appId], domainList: DOMAINS[appId] || [],
      mcp: kind === 'app' && appId !== 'unknown' ? MCP.slice(0, 2 + (idx % 4)) : [] };
  };
  const apps = aiInventory.map((a, i) => make('app', a.appId, a.usage, a.users, a.hosts, a.domains, a.services, i));
  const svc = genAiServices.map((id, i) => {
    const [usage, u, h, d] = SERVICE_USAGE[id];
    return make('service', id, usage, u, h, d, aiInventory.filter(a => a.services.includes(id)).map(a => a.appId), i + 5);
  });
  const all = [...apps, ...svc];
  // Everyone counted in "Users using AI" uses at least one item: people with no app so far use ChatGPT in the browser.
  const chat = all.find(i => i.appId === 'chatgpt');
  aiUsers.filter(u => !all.some(i => i.userIds.includes(u.id))).forEach(u => {
    chat.userIds.push(u.id); u.hostIds.forEach(h => { if (!chat.hostIds.includes(h)) chat.hostIds.push(h); });
  });
  return all;
})();
export const appMeta = id => {
  if (id === 'openclaw') return { ...AI_BY_ID.openclaw, name: 'OpenClaw Agent', category: 'GenAI Chatbot' };
  if (id === 'claude') return { ...AI_BY_ID.claude, name: 'Claude', category: 'Desktop AI Assistant' };
  return AI_BY_ID[id] || { id, name: id, icon: 'app', category: 'Unknown' };
};

/** Applications policies used by the site's groups. No default policy: groups with no Applications policy add nothing. */
export function usedPolicies(st = getState()) {
  const ids = new Set(st.groups.filter(g => !g.aiOff).map(g => g.ai[0]).filter(Boolean)); // Applications off for a group = not enforced
  return st.aiPolicies.filter(p => ids.has(p.id));
}
export const policyState = (st, p, appId) => ((p.states || {})[appId]) || p.base || 'Under review';
export const isListed = (p, appId) => policyState(null, p, appId) === 'Not approved';
export function appState(st, appId) {
  const states = [...new Set(usedPolicies(st).map(p => policyState(st, p, appId)))];
  if (!states.length) return 'Under review';
  return states.length === 1 ? states[0] : 'Mixed';
}

/** Groups that use an item (through their hosts), with the verdict of each group's Applications policy. */
export function itemGroups(st, item) {
  const gids = [...new Set(item.hostIds.map(h => hosts.find(x => x.id === h).groupId))];
  return gids.map(id => st.groups.find(g => g.id === id)).filter(Boolean).map(g => ({ ...g, verdict: g.ai[0] && !g.aiOff ? g.ai[1] : null, policyId: g.aiOff ? null : g.ai[0] }));
}

/** Site KPIs for a time range: 30, 7 or 1 days. */
export function kpis(st, days = 30) {
  const since = end - days * DAY;
  const active = aiUsers.filter(u => Date.parse(u.lastSeen) >= since);
  const endpoints = new Set(active.flatMap(u => u.hostIds)).size;
  const apps = items.filter(i => i.kind === 'app');
  const svcs = items.filter(i => i.kind === 'service');
  const groupsUsing = st.groups.filter(g => g.ai[0] && !g.aiOff); // groups with no Applications policy aren't enforced
  const top = (list) => list.slice().sort((a, b) => b.hostIds.length - a.hostIds.length)[0];
  const totalHosts = hosts.length;
  const ta = top(apps), ts = top(svcs);
  return {
    users: active.length, endpoints,
    services: svcs.length, apps: apps.length,
    pending: apps.filter(i => appState(st, i.appId) === 'Under review').length,
    block: groupsUsing.filter(g => g.ai[1] === 'Block').length, track: groupsUsing.filter(g => g.ai[1] === 'Track').length,
    notApprovedApps: apps.filter(i => ['Not approved', 'Mixed'].includes(appState(st, i.appId))).length,
    notApprovedServices: svcs.filter(i => ['Not approved', 'Mixed'].includes(appState(st, i.appId))).length,
    topApp: ta, topAppPct: Math.round((ta.hostIds.length / totalHosts) * 100),
    topService: ts, topServicePct: Math.round((ts.hostIds.length / totalHosts) * 100),
  };
}

const statusToast = appId => toast(...c('toast.statusUpdated', { app: appMeta(appId).name }));
const localUsed = () => usedPolicies().filter(p => p.type === 'Local').map(p => p.id);
const setIn = (ids, appId, value) => setState(s => ({
  aiPolicies: s.aiPolicies.map(p => ids.includes(p.id) && policyState(s, p, appId) !== value
    ? { ...p, states: { ...(p.states || {}), [appId]: value }, modified: NOW, by: 'Cynet admin' } : p),
}));

/** Set the approval of one app in one Local policy (app drawer › Policies tab, A:22355:113775). */
export function setPolicyState(appId, policyId, value) { setIn([policyId], appId, value); statusToast(appId); }
/** Approve: Approved in every Local policy the site uses. Inherited policies are read-only at site level. */
export function approveApp(appId) { setIn(localUsed(), appId, 'Approved'); statusToast(appId); }
/** Under review in every Local policy the site uses. */
export function markUnderReview(appId) { setIn(localUsed(), appId, 'Under review'); statusToast(appId); }
/** Not approved in the selected Local policies (Manage approval). Local policies cleared in the modal go back to Under review. */
export function setNotApproved(appId, selectedIds) {
  const local = localUsed();
  setState(s => ({
    aiPolicies: s.aiPolicies.map(p => {
      if (!local.includes(p.id)) return p;
      const cur = policyState(s, p, appId), want = selectedIds.includes(p.id);
      const next = want ? 'Not approved' : cur === 'Not approved' ? 'Under review' : cur;
      return next === cur ? p : { ...p, states: { ...(p.states || {}), [appId]: next }, modified: NOW, by: 'Cynet admin' };
    }),
  }));
  statusToast(appId);
}
export { demoSiteId };
/** Manage approval (every state change in AI Security, Yael 2026-11-24): set `target` in the selected Local policies.
 *  Policies left unselected keep their approval. Inherited policies can't change at site level. */
export function applyApproval(appId, policyIds, target) { setIn(policyIds, appId, target); statusToast(appId); }
