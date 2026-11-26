// New-policy wizard for both modules (R:20150:27167 →, A:20204:154620 →), boards of 2026-11-24:
// site level 5 steps (Policy details, Apps, End-user notification, Group assignment (optional), Summary); Site Manager level 4 (no groups).
import { html, useState, useRef } from '../../lib.js';
import { getState, setState } from '../../store.js';
import { demoCreates, sites } from '../../data/seed.js';
import { go } from '../../router.js';
import { Icon, Img, Verdict, useDismiss, useFloating, Select, Modal } from '../../components/ui.js';
import { createPolicy, catalog, policies } from '../../data/policy.js';
import { AppStatesList, ApprovalSelect, Legend, NotifyBox } from './Approvals.js';
import { c } from '../../data/copy.js';
import { NameFields, nameError, UnsavedModal } from './Dialogs.js';
import { PolicyCard, PolicyTabs } from './PolicyDrawer.js';

// Site level: 5 steps. Site Manager level (container): no group step, because groups belong to the sites.
// RMM Guard: "New apps from Cynet Research" is its own step after the apps, so the app list gets the whole page (Yael, 2026-11-25).
const KEYS = (container, mod) => {
  const k = container ? ['details', 'apps', 'notify', 'summary'] : ['details', 'apps', 'notify', 'groups', 'summary'];
  return mod && mod.newApps ? [...k.slice(0, 2), 'newApps', ...k.slice(2)] : k;
};
const STEP = (mod, container) => ({
  details: ['Policy details', 'Enter a name and an optional description.'],
  apps: mod.step2,
  newApps: [c('newApps.step.title'), c('newApps.step.desc')],
  notify: [c('notify.title'), c('notify.step')],
  groups: ['Group assignment (optional)', 'Assign groups and choose Track or Block for each.'],
  summary: ['Summary', container ? c('container.wizardStep3') : 'Review app approvals, assigned groups and what will be blocked.'],
});
const HEADS = (mod, container) => ({
  details: ['Policy details', "Give the policy a name that's easy to recognize later. The description is optional."],
  apps: mod.head2,
  newApps: [c('newApps.step.title'), c('newApps.head')],
  notify: [c('notify.title'), c('notify.head')],
  groups: ['Group assignment', 'Assign groups and choose Track or Block for each.'],
  summary: ['Summary', container ? c('container.wizardStep3') : 'Review app approvals, assigned groups and what will be blocked.'],
});
export const APPROVAL_OPTS = [
  { value: 'Not approved', label: 'Not approved', color: 'var(--text-text_error)' },
  { value: 'Approved', label: 'Approved', color: 'var(--status-success_bold)' },
];
export const VERDICT_OPTS = [
  { value: 'Track', label: 'Track', icon: html`<${Img} name="status-warning-16" />` },
  { value: 'Block', label: 'Block', icon: html`<${Img} name="status-block-16" />` },
];

/** Completed steps are clickable, to go back (Yael, 2026-11-25). */
export function Stepper({ mod, step, container, onGo }) {
  return html`<ol class="stepper">${KEYS(container, mod).map(k => STEP(mod, container)[k]).map(([t, d], i) => {
    const s = i < step ? 'done' : i === step ? 'active' : 'todo';
    const back = s === 'done' && onGo;
    return html`<li class=${'stp stp-' + s + (back ? ' stp-link' : '')} aria-current=${i === step ? 'step' : undefined}
      role=${back ? 'button' : undefined} tabIndex=${back ? 0 : undefined} onClick=${back ? () => onGo(i) : undefined}
      onKeyDown=${back ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGo(i); } } : undefined}>
      <div class="stp-rail"><span class="stp-dot">${s === 'done' ? html`<${Icon} name="checkmark-24" size=${24} color="#fff" />` : i + 1}</span></div>
      <div class="stp-text"><div class="stp-t">${t}</div><div class="stp-d">${d}</div></div>
    </li>`;
  })}</ol>`;
}

/** Searchable single select for groups, showing each group's current policy. */
export function GroupPicker({ mod, value, onChange, exclude }) {
  const st = getState();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  useDismiss(open, () => setOpen(false), [ref]);
  const cur = st.groups.find(g => g.id === value);
  const list = st.groups.filter(g => !exclude.includes(g.id) && g.name.toLowerCase().includes(q.toLowerCase()));
  const pol = id => (policies(mod).find(p => p.id === id) || { name: c('groups.emptyPolicy') }).name;
  const fl = useFloating(open, ref, { width: 472, cap: 320 });
  return html`<div class="select" ref=${ref}>
    <button type="button" class=${'select-field' + (cur ? ' is-filled' : '')} aria-haspopup="listbox" aria-expanded=${String(open)} onClick=${() => setOpen(!open)}>
      <span class="sv">${cur ? cur.name : 'Select group'}</span>
      <span style=${open ? 'transform:rotate(180deg);display:inline-flex' : 'display:inline-flex'}><${Icon} name="chevron-down-16" color="var(--icon-icon_strong)" /></span>
    </button>
    ${open && html`<div class="select-menu ms-menu" role="listbox" style=${fl}>
      <label class="field" style="height:32px"><${Icon} name="search-16" /><input type="search" placeholder=${c('picker.group.search')} value=${q} onInput=${e => setQ(e.target.value)} aria-label="Search groups" /></label>
      <div class="ms-list">
        ${list.length === 0 && html`<div class="fp-empty">${c('picker.noGroups', { q })}</div>`}
        ${list.map(g => html`<button type="button" role="option" class="select-opt" onClick=${() => { onChange(g.id); setOpen(false); setQ(''); }}>
          ${g.name}<span class="sub">${pol(g[mod.key][0])}</span></button>`)}
      </div>
    </div>`}
  </div>`;
}

/** Group + Verdict + Add, then the assigned list. rows: [{groupId, verdict}] */
export function GroupAssign({ mod, rows, setRows, selfId }) {
  const st = getState();
  const [g, setG] = useState(null);
  const [v, setV] = useState(null);
  const add = () => { setRows([...rows, { groupId: g, verdict: v }]); setG(null); setV(null); };
  const from = gid => { const pid = st.groups.find(x => x.id === gid)[mod.key][0]; return !pid || pid === selfId ? null : (policies(mod).find(p => p.id === pid) || {}).name; }; // no line when the group has no policy
  return html`<div class="ga">
    <div class="ga-add">
      <div class="field-wrap" style="flex:1 1 0"><span class="field-label">Group</span><${GroupPicker} mod=${mod} value=${g} onChange=${setG} exclude=${rows.map(r => r.groupId)} /></div>
      <div class="field-wrap" style="flex:1 1 0"><span class="field-label">Verdict</span><${Select} value=${v} placeholder="Select verdict" options=${VERDICT_OPTS} onChange=${setV} ariaLabel="Verdict" /></div>
      <button class="btn btn-primary" style="align-self:flex-end" disabled=${!g || !v} onClick=${add}>Add</button>
    </div>
    ${rows.length === 0 ? html`<div class="ga-none">No groups selected yet</div>` : html`<div class="ga-list">
      ${rows.map((r, i) => { const grp = st.groups.find(x => x.id === r.groupId); const f = from(r.groupId); return html`<div class="ga-row">
        <div class="ga-name"><span>${grp.name}</span>${f && html`<span class="ga-from">Moves from “${f}”</span>`}</div>
        <div class="ga-verdict"><${InlineSelect} value=${r.verdict} options=${VERDICT_OPTS} render=${val => html`<${Verdict} v=${val} lead />`}
          onChange=${val => setRows(rows.map((x, j) => j === i ? { ...x, verdict: val } : x))} label=${`Verdict for ${grp.name}`} /></div>
        <button class="icon-btn" aria-label=${`Remove ${grp.name}`} onClick=${() => setRows(rows.filter((_, j) => j !== i))}><${Icon} name="delete-16" color="var(--icon-icon_default)" /></button>
      </div>`; })}
    </div>`}
  </div>`;
}

/** A list cell value that turns into a select on click (inline edit). */
export function InlineSelect({ value, options, onChange, render, label, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(open, () => setOpen(false), [ref]);
  const fl = useFloating(open, ref, { width: 180, minSpace: 100 });
  if (disabled) return render(value);
  return html`<div class="inline-sel" ref=${ref}>
    <button type="button" class="inline-btn" aria-haspopup="listbox" aria-expanded=${String(open)} aria-label=${label} onClick=${() => setOpen(!open)}>
      ${render(value)}<span class="inline-chev"><${Icon} name="chevron-down-16" /></span></button>
    ${open && html`<div class="select-menu" role="listbox" style=${fl}>
      ${options.map(o => html`<button type="button" role="option" aria-selected=${String(o.value === value)} class="select-opt"
        onClick=${() => { onChange(o.value); setOpen(false); }}>${o.icon}<span style=${o.color ? `color:${o.color}` : ''}>${o.label}</span></button>`)}
    </div>`}
  </div>`;
}

/** startStep > 0 (board deep links) prefills the demo policy. */
export function Wizard({ mod, onClose, startStep = 0, container = false }) {
  const st = getState();
  const keys = KEYS(container, mod);
  const last = keys.length - 1;
  const demo = startStep > 0 ? demoCreates[mod.key] : null;
  const fresh = () => Object.fromEntries(catalog(mod).map(a => [a.id, 'Under review'])); // every app starts Under review
  // Board frame links count steps without the RMM "New apps" step: shift them past it.
  const [step, setStep] = useState(Math.min(mod.newApps && startStep >= 2 ? startStep + 1 : startStep, last));
  const key = keys[step];
  const [name, setName] = useState(demo ? demo.name : '');
  const [desc, setDesc] = useState(demo ? demo.description : '');
  const [newApps, setNewApps] = useState('Not approved');
  const [states, setStates] = useState(() => ({ ...fresh(), ...(demo ? demo.states : {}) }));
  const [notify, setNotify] = useState(true);
  const [rows, setRows] = useState(demo && startStep > 3 ? [{ groupId: 'front-desk', verdict: mod.key === 'ai' ? 'Block' : 'Track' }] : []);
  const [tried, setTried] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [created, setCreated] = useState(null); // Site Manager level: id of the new policy, shows the "Policy created" modal
  const touched = JSON.stringify(states) !== JSON.stringify(fresh());
  const dirty = name || desc || touched || rows.length || !notify;
  const err = tried ? nameError(mod, name) : null;
  const canNext = key === 'details' ? !!name.trim() : true;
  const next = () => {
    if (key === 'details') { setTried(true); if (nameError(mod, name)) return; }
    if (step < last) setStep(step + 1);
    else {
      const id = createPolicy(mod, { name: name.trim(), description: desc.trim(), states, newApps, notify, assigned: container ? [] : rows, type: container ? 'Inherited' : 'Local', silent: container });
      if (container) setCreated(id); else onClose();
    }
  };
  const close = () => (dirty ? setLeaving(true) : onClose());
  if (created) return html`<${CreatedModal} mod=${mod} id=${created} name=${name.trim()} onClose=${onClose} />`;
  const draft = { name: name.trim(), description: desc.trim(), type: container ? 'Inherited' : 'Local', base: 'Under review', states, newApps, notify, modified: '2025-09-30T12:35:12Z', by: 'Cynet admin' };
  const draftGroups = rows.map(r => ({ ...st.groups.find(g => g.id === r.groupId), verdict: r.verdict }));
  const STEP_HEAD = HEADS(mod, container);

  return html`<div class="modal-wrap"><div class="blanket"></div>
    <div class="modal wizard" role="dialog" aria-modal="true" aria-label=${mod.wizardTitle}>
      <div class="modal-title"><h2>${mod.wizardTitle}</h2><button class="modal-close" aria-label="Close" onClick=${close}><${Icon} name="close-24" size=${24} color="var(--icon-icon_strong)" /></button></div>
      <div class="wz-body">
        <${Stepper} mod=${mod} step=${step} container=${container} onGo=${setStep} />
        <div class="wz-main">
          <div class="wz-head"><h3>${STEP_HEAD[key][0]}</h3><p>${STEP_HEAD[key][1]}</p></div>
          <div class="wz-slot">
            ${key === 'details' && html`<${NameFields} name=${name} setName=${setName} desc=${desc} setDesc=${setDesc} error=${err} gap=${24} />`}
            ${key === 'apps' && html`<div class="wz-apps">
              <${Legend} mod=${mod} short />
              <${AppStatesList} mod=${mod} states=${states} onChange=${setStates} mode="pick" />
            </div>`}
            ${key === 'newApps' && html`<${NewAppsRow} mod=${mod} value=${newApps} onChange=${setNewApps} helper />`}
            ${key === 'notify' && html`<${NotifyBox} value=${notify} onChange=${setNotify} />`}
            ${key === 'groups' && html`<${GroupAssign} mod=${mod} rows=${rows} setRows=${setRows} selfId=${null} />`}
            ${key === 'summary' && html`<div class="wz-sum"><${PolicyCard} mod=${mod} p=${draft} big draft /><${PolicyTabs} mod=${mod} p=${draft} groups=${draftGroups} container=${container} /></div>`}
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-secondary" disabled=${step === 0} onClick=${() => setStep(step - 1)}>Back</button>
        <div class="right"><button class="btn btn-primary" disabled=${!canNext} onClick=${next}>${step === last ? 'Create policy' : 'Next'}</button></div>
      </div>
    </div>
    ${leaving && html`<${UnsavedModal} where="wizard" onKeep=${() => setLeaving(false)} onLeave=${onClose} />`}
  </div>`;
}

/** Site Manager level: instead of a success toast, explain that the policy is created but does nothing until a site assigns it,
 *  and link to each site's copy of the policy (edit page, Group assignment) (Yael, 2026-11-25). */
function CreatedModal({ mod, id, name, onClose }) {
  const open = s => { onClose(); setState({ scope: { level: 'site', siteId: s.id } }); go(`${mod.base}/edit/${id}?focus=groups`); };
  return html`<${Modal} title=${c('created.title')} width=${560} onClose=${onClose} bodyStyle="padding:24px 32px 16px"
    footer=${html`<div class="right"><button class="btn btn-primary" onClick=${onClose}>${c('created.done')}</button></div>`}>
    <div class="cr-body">
      <p>${c('created.body', { name })}</p>
      <div class="cr-label">${c('created.sites', { n: sites.length })}</div>
      <div class="cr-sites">${sites.map(s => html`<button class="cr-site" onClick=${() => open(s)}>
        <span>${s.name}</span><span class="cr-go">${c('created.assign')}<${Icon} name="arrow-right-16" color="var(--text-text_link)" /></span></button>`)}</div>
    </div>
  <//>`;
}

/** RMM only: "New apps from Cynet Research", Under review / Not approved (Yael, 2026-11-22). */
export function NewAppsRow({ mod, value, onChange, disabled, helper }) {
  return html`<div class="sum-row"><div><div class="t-body2" style="color:var(--text-text_primary)">${mod.newAppsLabel}</div>
    ${helper && html`<div class="t-caption02 muted">${mod.newAppsHelp}</div>`}</div>
    <${ApprovalSelect} width=${160} value=${value} options=${mod.newAppsOptions} onChange=${onChange} disabled=${disabled} label=${mod.newAppsLabel} colorValue /></div>`;
}
