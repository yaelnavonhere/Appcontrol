// Policy rules and actions for both App Control modules (RMM Guard and Applications).
// A policy's `apps` holds the module's LISTED apps: Approved for RMM, Not approved for Applications.
import { getState, setState, toast } from '../store.js';
import { rmmApps, aiApps, NOW } from './seed.js';
import { assignment } from './derive.js';
import { c } from './copy.js';
import { msp, sites, demoSiteId } from './seed.js';

export const STATES = ['Under review', 'Not approved', 'Approved'];
/** App catalog of a module. */
export function catalog(mod) {
  if (mod.key === 'rmm') return rmmApps;
  return aiApps.filter(a => a.id !== 'unknown');
}
export function appById(mod, id) {
  const all = mod.key === 'rmm' ? rmmApps : aiApps;
  return all.find(a => a.id === id) || { id, name: id, vendor: 'Unknown', icon: 'app' };
}
/** Approval of one app in one policy: explicit state, else the policy's base (Under review for new policies). */
export const stateOf = (p, id) => ((p.states || {})[id]) || p.base || 'Under review';
/** Ids of the catalog apps in a given approval. */
export const idsIn = (mod, p, state) => catalog(mod).map(a => a.id).filter(id => stateOf(p, id) === state);
/** Full states map for every catalog app (wizard, edit page). */
export const statesFor = (mod, p) => Object.fromEntries(catalog(mod).map(a => [a.id, stateOf(p, a.id)]));
/** The approvals shown in the list's Apps column: RMM Approved + Under review; Applications Not approved + Under review. */
export const cellStates = mod => (mod.key === 'rmm' ? ['Approved', 'Under review'] : ['Not approved', 'Under review']);

export const assign = (mod, st, id) => assignment(st, mod.key, id);
export const policies = mod => getState()[mod.pk];
export const policyById = (mod, id) => policies(mod).find(p => p.id === id);
export const lockReason = p => p.type === 'System' ? c('tip.system.both') : c('tip.inherited.edit', { msp: msp.name });
/** Scope-aware rules. Site level: Local is fully editable; Inherited lets you assign groups only; System is locked.
 *  Site manager level (container): the MSP's Inherited policies are fully editable; Local ones belong to a site; System is locked. */
export const isMsp = () => getState().scope.level === 'msp';
const siteName = id => (sites.find(x => x.id === id) || { name: 'its site' }).name;
export function rules(p, mod) {
  if (p.type === 'System') return { editOff: true, delOff: true, contentLock: c('tip.system.both'), editTip: c('tip.system.edit'), deleteTip: c('tip.system.delete') };
  if (isMsp()) {
    if (p.type === 'Local') { const usedHere = getState().groups.some(g => g.rmm[0] === p.id || g.ai[0] === p.id); const site = siteName(usedHere ? demoSiteId : (p.sites || [])[0]); const t = c('tip.local.container', { site }); return { editOff: true, delOff: true, contentLock: t, editTip: t, deleteTip: c('tip.local.container.delete', { site }) }; }
    return { editOff: false, delOff: false, contentLock: null, editTip: null, deleteTip: null };
  }
  if (p.type === 'Inherited') return { editOff: false, delOff: true, contentLock: c('tip.inherited.edit', { msp: msp.name }), editTip: null, deleteTip: c('tip.inherited.delete', { msp: msp.name }) };
  const key = mod ? mod.key : (getState().rmmPolicies.includes(p) ? 'rmm' : 'ai');
  if (p.type === 'Local' && getState().groups.some(g => g[key][0] === p.id)) {
    return { editOff: false, delOff: true, contentLock: null, editTip: null, deleteTip: c('tip.local.assigned.delete') };
  }
  return { editOff: false, delOff: false, contentLock: null, editTip: null, deleteTip: null };
}
export const deleteTip = (p, mod) => rules(p, mod).deleteTip;
export const editTip = p => p.type === 'System' ? c('tip.system.edit') : null;

const slug = name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'policy';
function uniqueId(list, name) {
  const ids = list.map(p => p.id);
  let id = slug(name), n = 2;
  while (ids.includes(id)) id = `${slug(name)}-${n++}`;
  return id;
}
export function copyName(mod, name) {
  const names = policies(mod).map(p => p.name);
  let n = `${name} (Copy)`, i = 2;
  while (names.includes(n)) n = `${name} (Copy ${i++})`;
  return n;
}

/** Duplicate: same apps and description, Local, no groups. Returns the new id. */
export function duplicatePolicy(mod, srcId, name, description) {
  const src = policyById(mod, srcId);
  const id = uniqueId(policies(mod), name);
  const copy = { ...src, id, name, description, type: isMsp() ? 'Inherited' : 'Local', states: statesFor(mod, src), base: 'Under review', modified: NOW, by: 'Cynet admin', sites: [] };
  setState(s => ({ [mod.pk]: [...s[mod.pk], copy] }));
  toast('Successfully duplicated policy', `The policy “${src.name}” was successfully duplicated.`);
  return id;
}

/** Create from the wizard. states: {appId: approval}; assigned: [{groupId, verdict}] */
export function createPolicy(mod, { name, description, states, newApps, notify, assigned, type = 'Local', silent = false }) {
  const id = uniqueId(policies(mod), name);
  const p = { id, name, description, type, base: 'Under review', states: { ...states }, notify, ...(mod.newApps ? { newApps } : {}), modified: NOW, by: 'Cynet admin', sites: [] };
  setState(s => ({
    [mod.pk]: [...s[mod.pk], p],
    groups: s.groups.map(g => { const a = assigned.find(x => x.groupId === g.id); return a ? { ...g, [mod.key]: [id, a.verdict], [mod.key + 'Off']: false } : g; }), // assigning a policy turns the module on (Yael, 2026-11-25)
  }));
  if (!silent) toast('Successfully created policy', `The policy “${name}” was successfully created.`);
  return id;
}

/** Where a group goes when it leaves a policy: RMM Guard → System policy in Track; Applications → no policy (no default policy). */
export const fallback = mod => (mod.key === 'rmm' ? ['system-policy', 'Track'] : [null, 'Track']);

/** Save from the edit page. states: {appId: approval}, groupRows: [{groupId, verdict}] */
export function savePolicy(mod, id, { name, description, states, newApps, notify, groupRows }) {
  setState(s => ({
    [mod.pk]: s[mod.pk].map(p => p.id === id ? { ...p, name, description, states: { ...states }, notify, ...(mod.newApps ? { newApps } : {}), modified: NOW, by: 'Cynet admin' } : p),
    groups: isMsp() ? s.groups : s.groups.map(g => { // container edits never touch a site's groups
      const row = groupRows.find(r => r.groupId === g.id);
      if (row) return { ...g, [mod.key]: [id, row.verdict], [mod.key + 'Off']: false };
      if (g[mod.key][0] === id) return { ...g, [mod.key]: fallback(mod) }; // removed from the policy
      return g;
    }),
  }));
  toast(...c('toast.saved', { name }));
}

export function deletePolicy(mod, id) {
  const p = policyById(mod, id);
  if (rules(p, mod).delOff) return false;
  setState(s => ({
    [mod.pk]: s[mod.pk].filter(x => x.id !== id),
    // only reachable from the board's delete deep link; the UI blocks deleting a policy that groups use
    groups: s.groups.map(g => g[mod.key][0] === id ? { ...g, [mod.key]: fallback(mod) } : g),
  }));
  toast('Successfully deleted policy', `The policy “${p.name}” was successfully deleted.`);
}

/** Container view: the sites that use a policy, each with its groups. Harbor Dental Group shows its real groups;
 *  the other sites get a fixed sample so the drawer reads like a real MSP. */
const SAMPLE_GROUPS = ['Production Servers', 'Development Servers', 'Windows Workstations', 'Front Desk', 'Finance', 'Remote Staff', 'Executives', 'Shared Workstations'];
const hash = str => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
export function policySites(mod, st, p) {
  const hdg = assign(mod, st, p.id).groups;
  const ids = [...new Set([...(hdg.length ? [demoSiteId] : []), ...(p.sites || [])])];
  return ids.map(id => {
    const site = sites.find(x => x.id === id);
    if (id === demoSiteId) return { site, groups: hdg.map(g => ({ name: g.name, verdict: g[mod.key][1], endpoints: g.endpoints })) };
    const h = hash(p.id + id), n = 2 + (h % 4);
    return { site, groups: SAMPLE_GROUPS.slice(h % 3, (h % 3) + n).map((name, i) => ({ name, verdict: (h >> i) % 3 === 0 ? 'Block' : 'Track', endpoints: 3 + ((h >> (i + 2)) % 40) })) };
  });
}
