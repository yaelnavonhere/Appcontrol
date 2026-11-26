// Derived data: log events and numbers that must add up across screens.
import { aiApps, rmmApps, hosts, users, logDomains } from './seed.js';

// Small deterministic PRNG so every reload shows the same events.
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

const appById = list => Object.fromEntries(list.map(a => [a.id, a]));
export const AI = appById(aiApps);
export const RMM = appById(rmmApps);

/** Approval of an app in a policy (same rule as data/policy.js › stateOf). */
export const approvalOf = (policy, appId) => ((policy.states || {})[appId]) || policy.base || 'Under review';

/** Outcome of an app run, four log states (Yael, 2026-11-25): Approved runs (Allowed); Under review runs and is logged as Under review;
 *  Not approved is Tracked or Blocked by the group's verdict. */
export function outcome(module, policy, verdict, appId) {
  const a = approvalOf(policy, appId);
  if (a === 'Approved') return 'Allowed';
  if (a === 'Under review') return 'Under review';
  return verdict === 'Block' ? 'Blocked' : 'Tracked';
}

/** 147 events per module over 30 days, working hours, rules-based. */
export function generateLogs(module, state) {
  if (module === 'ai') return generateApplicationLogs(state);
  const r = rng(module === 'rmm' ? 7 : 11);
  const pols = module === 'rmm' ? state.rmmPolicies : state.aiPolicies;
  const appPool = module === 'rmm' ? ['datto-rmm', 'atera', 'n-central', 'teamviewer', 'ninjaone', 'splashtop', 'anydesk', 'screenconnect']
    : ['claude-desktop', 'claude-code', 'canva-ai', 'claude', 'chatgpt', 'codex', 'cursor', 'perplexity', 'google-gemini'];
  const out = [];
  const end = Date.parse('2025-09-30T12:35:12Z');
  for (let i = 0; i < 147; i++) {
    // Only groups with a policy in this module log events (Applications groups can have no policy).
    const eligible = hosts.filter(h => { const g = state.groups.find(x => x.id === h.groupId); return g && !g[module + 'Off'] && g[module][0] && pols.some(p => p.id === g[module][0]); }); // module off for a group = no enforcement, no events
    if (!eligible.length) break; // no group has a policy in this module (e.g. Applications out of the box): no events
    const pool = eligible;
    const host = pool[Math.floor(r() * pool.length)];
    const group = state.groups.find(g => g.id === host.groupId);
    const [pid, verdict] = group[module];
    const policy = pols.find(p => p.id === pid) || pols[0];
    const appId = appPool[Math.floor(r() * appPool.length)];
    const day = Math.floor(i / 5);
    const t = new Date(end - day * 86400000 - Math.floor(r() * 8 * 3600000));
    const domains = logDomains[module];
    out.push({
      id: `${module}-${i}`, time: t.toISOString(), appId, hostId: host.id, groupId: group.id,
      user: users[Math.floor(r() * users.length)].name, policyId: policy.id,
      action: outcome(module, policy, verdict, appId), approval: approvalOf(policy, appId), verdict,
      domain: domains[Math.floor(r() * domains.length)],
      ip: `203.0.113.${Math.floor(r() * 200) + 10}`, port: [443, 8041, 5938][Math.floor(r() * 3)],
    });
  }
  return out;
}

/** Stable sample executions for every Applications app/group pair. Policies change
 * outcomes, never which executions exist. Unassigned/off groups remain Under review. */
function generateApplicationLogs(state) {
  const r = rng(11);
  const apps = aiApps.filter(a => a.id !== 'unknown');
  const groups = state.groups.filter(g => hosts.some(h => h.groupId === g.id));
  const end = Date.parse('2025-09-30T12:35:12Z');
  return apps.flatMap((app, appIndex) => groups.map((group, groupIndex) => {
    // Interleave apps in time so the first page shows a varied set of applications.
    const i = groupIndex * apps.length + appIndex;
    const pool = hosts.filter(h => h.groupId === group.id);
    const host = pool[Math.floor(r() * pool.length)];
    const [pid, verdict] = group.ai;
    const policy = !group.aiOff && state.aiPolicies.find(p => p.id === pid);
    const approval = policy ? approvalOf(policy, app.id) : 'Under review';
    return {
      id: `ai-${i}`, time: new Date(end - Math.floor(i / 12) * 86400000 - Math.floor(r() * 8 * 3600000)).toISOString(),
      appId: app.id, hostId: host.id, groupId: group.id,
      user: users[Math.floor(r() * users.length)].name, policyId: policy ? policy.id : null,
      action: policy ? outcome('ai', policy, verdict, app.id) : 'Under review', approval, verdict: policy ? verdict : null,
      domain: logDomains.ai[Math.floor(r() * logDomains.ai.length)],
      ip: `203.0.113.${Math.floor(r() * 200) + 10}`, port: 443,
    };
  }));
}

/** Groups assigned to a policy at the demo site, with Block/Track counts. */
export function assignment(state, module, policyId) {
  const gs = state.groups.filter(g => g[module][0] === policyId);
  return { groups: gs, block: gs.filter(g => g[module][1] === 'Block').length, track: gs.filter(g => g[module][1] === 'Track').length, endpoints: gs.reduce((s, g) => s + g.endpoints, 0) };
}

