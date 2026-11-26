// Settings › Groups (site level): the groups list, group details with the RMM Guard and Applications rows,
// the policy-picker modal, and the filtered view used by "View N groups" on the Can't-delete blocker.
// Frames: A:22085:190467 (list), A:22085:190213 / R:20636:140196 (details), A:22085:190379 (policy modal).
import { html, useState, useRef } from '../../lib.js';
import { getState, setState, toast } from '../../store.js';
import { go } from '../../router.js';
import { hosts } from '../../data/seed.js';
import { Icon, Img, Counter, Verdict, SearchField, TableFooter, NoResults, Modal, Confirm, Select, TypeTag, useDismiss } from '../../components/ui.js';
import { MODULES } from '../../data/modules.js';
import { c } from '../../data/copy.js';

const NAME = { rmm: 'RMM Guard', ai: 'Applications' };

/** DS3 Toggle (on/off). On by default; Off = the module doesn't enforce anything on this group's endpoints. */
const Toggle = ({ on, onChange, label }) => html`<button type="button" role="switch" aria-checked=${String(on)} aria-label=${label}
  class=${'switch' + (on ? '' : ' is-off')} onClick=${() => onChange(!on)}></button>`;

function PolicyCell({ st, g, mod }) {
  const p = st[mod.pk].find(x => x.id === g[mod.key][0]);
  // Applications has no default policy: a group with none shows "None" and no verdict.
  return html`<div style="display:flex;flex-direction:column;gap:2px;min-width:0"><span class=${p ? 'main' : 'main muted-i'}>${p ? p.name : c('groups.emptyPolicy')}</span>
    ${g[mod.key + 'Off'] ? html`<span class="t-caption02 muted">${c('groups.off')}</span>` : p && html`<${Verdict} v=${g[mod.key][1]} lead small />`}</div>`;
}

/** Groups list, optionally filtered to one policy (?module=rmm|ai&policy=<id>). */
function GroupsList({ query }) {
  const st = getState();
  const [q, setQ] = useState('');
  const mod = MODULES[query.module] || MODULES.rmm;
  const pid = query.policy || query.rmmPolicy;
  const p = pid && st[mod.pk].find(x => x.id === pid);
  const rows = st.groups.filter(g => (!p || g[mod.key][0] === p.id) && g.name.toLowerCase().includes(q.trim().toLowerCase()));
  const COLS = [
    ['name', 'Name', 'flex:1 1 0;min-width:180px'], ['os', 'Operating system', 'width:170px;flex:none'], ['endpoints', 'Endpoints', 'width:110px;flex:none'],
    ['rmm', 'RMM Guard policy', 'width:220px;flex:none'], ['ai', 'Applications policy', 'width:220px;flex:none'],
  ];
  return html`
    <div class="toolbar"><div class="toolbar-row"><${SearchField} value=${q} onInput=${setQ} placeholder="Search groups" /></div><div class="helper-ph"></div></div>
    <div class="actions-bar" style="justify-content:flex-start">
      ${p && html`<div class="chips"><span class="chip"><b>${c('groups.chip', {}, mod.key)}</b> ${p.name}
        <button aria-label="Remove filter" onClick=${() => go('/settings/groups')}><${Icon} name="close-16" size=${12} /></button></span>
        <span class="t-body2 muted" style="margin-left:8px">${c('groups.helper', { name: p.name }, mod.key)}</span></div>`}
      ${p && html`<button class="btn btn-secondary" style="margin-left:auto" onClick=${() => go(mod.base + '/policies')}>${c('groups.back', {}, mod.key)}</button>`}
    </div>
    <div class="tbl" role="table" aria-label="Groups">
      <div class="tbl-head" role="row"><span class="th th-first"></span>${COLS.map(([id, l, s]) => html`<span role="columnheader" class="th" style=${s}><span class="lbl">${l}</span></span>`)}
        <span class="th" style="width:48px;flex:none"></span></div>
      <div class="tbl-rows">
        ${rows.length === 0 && html`<${NoResults} />`}
        ${rows.map(g => html`<div role="row" tabindex="0" class="tr" onClick=${() => go(`/settings/groups/${g.id}`)} onKeyDown=${e => e.key === 'Enter' && go(`/settings/groups/${g.id}`)}>
          <span class="td td-first"></span>
          <div class="td" role="cell" style=${COLS[0][2]}><span class="main">${g.name}</span></div>
          <div class="td" role="cell" style=${COLS[1][2]}>${g.os}</div>
          <div class="td" role="cell" style=${COLS[2][2] + ';flex-direction:row;align-items:center;justify-content:flex-start'}><${Counter} n=${g.endpoints} /></div>
          <div class="td" role="cell" style=${COLS[3][2]}><${PolicyCell} st=${st} g=${g} mod=${MODULES.rmm} /></div>
          <div class="td" role="cell" style=${COLS[4][2]}><${PolicyCell} st=${st} g=${g} mod=${MODULES.ai} /></div>
          <div class="td td-actions" style="width:48px;flex:none"><${Icon} name="chevron-right-16" color="var(--icon-icon_strong)" /></div>
        </div>`)}
      </div>
      <${TableFooter} from=${rows.length ? 1 : 0} to=${rows.length} total=${rows.length} synced="2025-09-30T12:35:12Z" onRefresh=${() => {}} />
    </div>`;
}

const Seg = ({ value, options, onChange, label, isStatic, tip }) => html`<div class=${'segbtn' + (isStatic ? ' is-static' : '')} role="radiogroup" aria-label=${label}
  title=${tip || (isStatic ? c('groups.notInPrototype') : '')}>${options.map(o => html`<button role="radio" aria-checked=${String(o === value)} class=${o === value ? 'is-on' : ''}
  onClick=${() => !isStatic && onChange(o)}>${o}</button>`)}</div>`;

/** Policy picker modal (R:20774:92053, A:22309:177346): "Policy" select only, Cancel / Save. Track / Block stays on the page.
 *  Applications adds "None" (no default policy, Yael 2026-11-24). */
function PolicyModal({ mod, draft, onClose, onSave }) {
  const st = getState();
  const [pid, setPid] = useState(draft[0] || NONE);
  const opts = [...(mod.key === 'ai' ? [{ value: NONE, label: c('groups.emptyPolicy') }] : []), ...st[mod.pk].map(p => ({ value: p.id, label: p.name, sub: p.type }))];
  return html`<${Modal} title=${`${NAME[mod.key]} policy`} width=${668} onClose=${onClose} bodyStyle="padding:32px 48px 24px"
    footer=${html`<div class="right"><button class="btn btn-secondary" onClick=${onClose}>Cancel</button><button class="btn btn-primary" onClick=${() => onSave([pid === NONE ? null : pid, draft[1]])}>Save</button></div>`}>
    <p class="ma-body">${c('groups.policyModal.body', { module: NAME[mod.key] })}</p>
    <div class="field-wrap"><span class="field-label">Policy</span>
      <${Select} value=${pid} options=${opts} onChange=${setPid} placeholder="Select policy" ariaLabel="Policy" /></div>
  <//>`;
}
const NONE = '__none__';

/** Group details (A:22085:190213): RMM Guard and Applications rows are live; the other modules are shown as on the board. */
function GroupDetails({ id, query }) {
  const st = getState();
  const g = st.groups.find(x => x.id === id);
  const pick = x => ({ rmm: x.rmm, ai: x.ai, rmmOff: !!x.rmmOff, aiOff: !!x.aiOff });
  const [draft, setDraft] = useState(pick(g));
  const [tab, setTab] = useState('settings');
  const [noPolicy, setNoPolicy] = useState(false); // turning on Applications with no Applications policy (frame A:23083:137947)
  const [modal, setModal] = useState((query.state || '').startsWith('policy-modal') ? (query.state.split(':')[1] || 'ai') : null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(pick(g));
  const save = () => {
    setState(s => ({ groups: s.groups.map(x => x.id === id ? { ...x, ...draft } : x) }));
    toast(...c('groups.saved', { name: g.name }));
  };
  const staticRow = (t, mode) => html`<div class="gd-row"><div><div class="t">${t}<${Icon} name="status-info-24" size=${14} color="var(--icon-icon_default)" /></div><div class="s" title=${c('groups.notInPrototype')}>Advanced settings</div></div>
    <div class="gd-right">${mode && html`<${Seg} value=${mode} options=${['Detect', 'Prevent']} isStatic label=${t} />`}<span class="switch" title=${c('groups.notInPrototype')}></span></div></div>`;
  const modRow = key => { const mod = MODULES[key]; const p = st[mod.pk].find(x => x.id === draft[key][0]);
    return html`<div class="gd-row"><div><div class="t">${NAME[key]}</div>
      <button class="s" onClick=${() => setModal(key)}>Configure policy</button>
      <div class="pol">${p ? p.name : c('groups.emptyPolicy')} ${p && html`<${TypeTag} type=${p.type} small />`}</div></div>
      <div class="gd-right">${draft[key + 'Off'] ? html`<${Seg} value=${null} options=${['Track', 'Block']} isStatic tip=${c('groups.moduleOff', { module: NAME[key] })} label=${`${NAME[key]} verdict`} />`
        : p ? html`<${Seg} value=${draft[key][1]} options=${['Track', 'Block']} onChange=${v => setDraft({ ...draft, [key]: [draft[key][0], v] })} label=${`${NAME[key]} verdict`} />`
        : html`<${Seg} value=${null} options=${['Track', 'Block']} isStatic tip=${c('groups.noPolicyVerdict')} label=${`${NAME[key]} verdict`} />`}
        ${key === 'ai' ? html`<${Toggle} on=${!draft[key + 'Off']} label=${NAME[key]} onChange=${on => { if (on && !st[MODULES[key].pk].length) { setNoPolicy(true); return; } setDraft({ ...draft, [key + 'Off']: !on }); }} />`
          : html`<span class="gd-toggle-space" aria-hidden="true"></span>`}</div></div>`; }; // RMM Guard has no On/Off toggle, only Track/Block (Yael, 2026-11-25)
  const groupHosts = hosts.filter(h => h.groupId === id);
  return html`<div class="gd">
    <div class="gd-top">
      <div class="tab-group" role="tablist">${[['settings', 'Settings'], ['endpoints', 'Endpoints']].map(([k, l]) => html`<button role="tab" aria-selected=${String(tab === k)} class=${'tab' + (tab === k ? ' is-active' : '')} onClick=${() => setTab(k)}>${l}</button>`)}</div>
      <div class="gd-top-right"><span>${g.os}</span><button class="btn btn-secondary" disabled title=${c('groups.notInPrototype')}>Download Agent</button></div>
    </div>
    <div class="gd-scroll">
      ${tab === 'settings' ? html`
        <div class="field gd-name"><input aria-label="Group name" value=${g.name} readOnly /></div>
        ${staticRow('Endpoint Protection (EPP)', 'Prevent')}${staticRow('Endpoint Detection & Response (EDR)', 'Detect')}${staticRow('Network Detection & Response (NDR)', 'Prevent')}
        ${modRow('rmm')}${modRow('ai')}
        ${staticRow('Deception')}${staticRow('IT Hygiene')}` : html`
        <div class="ld-list">${groupHosts.map(h => html`<div class="ld-item"><span class="wrapped"><${Icon} name="hosts-16" /></span><div class="ld-det"><div class="d">${h.id}</div><div class="s">${h.os} · ${h.ip}</div></div></div>`)}</div>`}
    </div>
    <div class="gd-foot">
      <button class="btn btn-secondary" disabled title=${c('groups.notInPrototype')}><${Icon} name="reload-16" color="var(--icon-icon_disabled)" />Reset to Best Practice</button>
      <div class="right"><button class="btn btn-secondary" disabled=${!dirty} onClick=${() => setDraft(pick(g))}>Reset</button>
        <button class="btn btn-primary" disabled=${!dirty} onClick=${save}>Save</button></div>
    </div>
    ${noPolicy && html`<${Confirm} kind="info" title=${c('groups.noPolicy.title')} cancel="Close" confirm=${c('groups.noPolicy.action')}
      onCancel=${() => setNoPolicy(false)} onConfirm=${() => { setNoPolicy(false); go('/ai/policies'); }}><p>${c('groups.noPolicy.body')}</p><//>`}
    ${modal && html`<${PolicyModal} key=${modal} mod=${MODULES[modal]} draft=${draft[modal]} onClose=${() => setModal(null)} onSave=${val => { setDraft({ ...draft, [modal]: val, ...(val[0] ? { [modal + 'Off']: false } : {}) }); setModal(null); }} />`}
  </div>`;
}

export function GroupsScreen({ path, query }) {
  const id = (path || '').split('/')[3];
  if (id && getState().groups.some(g => g.id === id)) return html`<${GroupDetails} key=${id} id=${id} query=${query} />`;
  return html`<${GroupsList} query=${query} />`;
}
export const groupTitle = path => { const id = (path || '').split('/')[3]; const g = id && getState().groups.find(x => x.id === id); return g ? g.name : null; };
