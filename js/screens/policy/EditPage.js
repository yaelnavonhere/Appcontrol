// Edit policy inner page for both modules (R:20481:425310, A:22099:292975), boards of 2026-11-24: every app with its approval.
import { html, useState, useRef, useEffect } from '../../lib.js';
import { getState } from '../../store.js';
import { go } from '../../router.js';
import { Icon, Fav, TypeTag, CategoryTag, Select } from '../../components/ui.js';
import { AppStatesList, ApprovalSelect, Legend, NotifyBox } from './Approvals.js';
import { statesFor, assign, savePolicy, catalog, rules, isMsp, policies } from '../../data/policy.js';
import { c } from '../../data/copy.js';
import { DeleteFlow, UnsavedModal, nameError } from './Dialogs.js';
import { GroupAssign, NewAppsRow } from './Wizard.js';

/** Apps section: legend, RMM's new-apps setting, state tags, "App + Approval + Add" (sets an app's approval), every app with an inline approval select. */
function AppsSection({ mod, states, setStates, newApps, setNewApps, locked }) {
  const [app, setApp] = useState(null);
  const [appr, setAppr] = useState(null);
  const add = () => { setStates({ ...states, [app]: appr }); setApp(null); setAppr(null); };
  const head = !locked && html`<div class="ga-add">
    <div class="field-wrap" style="flex:1 1 0"><span class="field-label">${mod.editAppLabel}</span>
      <${Select} value=${app} placeholder=${mod.editAppPh} onChange=${setApp} ariaLabel=${mod.editAppLabel}
        options=${catalog(mod).map(a => ({ value: a.id, label: a.name, icon: html`<${Fav} app=${a} />` }))} /></div>
    <div class="field-wrap" style="flex:1 1 0"><span class="field-label">Approval</span>
      <${ApprovalSelect} value=${appr} onChange=${setAppr} label="Approval" /></div>
    <button class="btn btn-primary" style="align-self:flex-end" disabled=${!app || !appr} onClick=${add}>Add</button>
  </div>`;
  return html`<section class="ip-sec">
    <div class="ip-sec-head"><h2>${mod.appsTitle}</h2><div class="ip-sec-desc"><${Legend} mod=${mod} /></div></div>
    ${locked && html`<div class="ip-note"><${Icon} name="lock-16" />${locked}</div>`}
    ${mod.newApps && html`<${NewAppsRow} mod=${mod} value=${newApps} onChange=${setNewApps} disabled=${!!locked} helper />`}
    <${AppStatesList} mod=${mod} states=${states} onChange=${setStates} mode="edit" head=${head} locked=${!!locked} />
  </section>`;
}

export function EditPage({ mod, id, query }) {
  const p = policies(mod).find(x => x.id === id);
  if (!p) return html`<div class="stage-ph"><div class="t-subtitle1">This policy no longer exists</div>
    <button class="btn btn-secondary" onClick=${() => go(mod.base + '/policies')}>Back to policies</button></div>`;
  return html`<${EditInner} key=${id} mod=${mod} p=${p} id=${id} query=${query} />`;
}

function EditInner({ mod, p, id, query }) {
  const st = getState();
  const init = useRef(null);
  const R = rules(p, mod);
  const locked = R.contentLock;
  const [name, setName] = useState(p.name);
  const [desc, setDesc] = useState(p.description || '');
  const [editing, setEditing] = useState(false);
  const [states, setStates] = useState(() => statesFor(mod, p));
  const [notify, setNotify] = useState(p.notify !== false);
  const [newApps, setNewApps] = useState(p.newApps);
  const [groupRows, setGroupRows] = useState(() => assign(mod, st, id).groups.map(g => ({ groupId: g.id, verdict: g[mod.key][1] })));
  const [leaving, setLeaving] = useState(false);
  const [del, setDel] = useState(false);
  const groupsRef = useRef(null);
  const snap = JSON.stringify([name, desc, states, newApps, notify, groupRows]);
  if (init.current === null) init.current = snap;
  const dirty = snap !== init.current;
  const err = nameError(mod, name, id);
  const list = mod.base + '/policies' + (isMsp() ? '?scope=msp' : '');
  useEffect(() => { if (query.focus === 'groups' && groupsRef.current) groupsRef.current.scrollIntoView({ block: 'start' }); }, []);
  const back = () => (dirty ? setLeaving(true) : go(list));
  const save = () => { if (err) { setEditing(true); return; } savePolicy(mod, id, { name: name.trim(), description: desc.trim(), states, newApps, notify, groupRows }); go(list); };
  const removed = assign(mod, st, id).groups.filter(g => !groupRows.some(r => r.groupId === g.id)).length;
  const delOff = R.delOff;

  return html`<div class="ip">
    <div class="ip-scroll"><div class="ip-col">
      <header class="ip-head">
        <div class="ip-title">
          <button class="icon-btn" aria-label="Back to policies" onClick=${back}><${Icon} name="arrow-left-16" color="var(--icon-icon_strong)" /></button>
          ${editing ? html`<div class="field" style="width:420px"><input aria-label="Policy name" value=${name} maxlength="80" onInput=${e => setName(e.target.value)}
              onKeyDown=${e => e.key === 'Enter' && !err && setEditing(false)} /></div>`
            : html`<h1 class="ip-h">${name}</h1>`}
          ${!locked && html`<button class="icon-btn" aria-label=${editing ? 'Done editing name' : 'Edit name and description'} onClick=${() => !err && setEditing(!editing)}>
            <${Icon} name=${editing ? 'checkmark-24' : 'edit-16'} color="var(--icon-icon_strong)" /></button>`}
        </div>
        ${editing && err && html`<div class="helper is-error" role="alert" style="margin:-8px 0 0 40px">${err}</div>`}
        <div class="ip-meta">
          <div class="pc-tags"><${TypeTag} type=${p.type} small /><${CategoryTag} label=${mod.category} /></div>
          ${editing ? html`<div class="field" style="width:100%"><input aria-label="Description" placeholder="Enter description" value=${desc} maxlength="300" onInput=${e => setDesc(e.target.value)} /></div>`
            : desc && html`<p class="ip-desc">${desc}</p>`}
        </div>
      </header>
      <${AppsSection} mod=${mod} states=${states} setStates=${setStates} newApps=${newApps} setNewApps=${setNewApps} locked=${locked} />
      <section class="ip-sec"><div class="ip-sec-head"><h2>${c('notify.title')}</h2><div class="ip-sec-desc">${c('notify.head')}</div></div>
        <${NotifyBox} value=${notify} onChange=${setNotify} readOnly=${!!locked} /></section>
      ${!isMsp() && html`<section class="ip-sec" ref=${groupsRef}>
        <div class="ip-sec-head"><h2>Group assignment</h2><div class="ip-sec-desc" style="font-size:16px;line-height:24px">Assign groups and choose Track or Block for each.</div></div>
        <${GroupAssign} mod=${mod} rows=${groupRows} setRows=${setGroupRows} selfId=${id} />
        ${removed > 0 && html`<div class="ip-note">${removed === 1 ? c('groups.removedNote.one', {}, mod.key) : c('groups.removedNote.many', { n: removed }, mod.key)}</div>`}
      </section>`}
    </div></div>
    <footer class="ip-foot"><div class="ip-col ip-foot-in">
      <span class="policy-delete-tip" data-tip=${R.deleteTip} tabindex=${R.deleteTip ? 0 : undefined} aria-label=${R.deleteTip || undefined}><button class="btn btn-danger-ghost" disabled=${delOff} onClick=${() => setDel(true)}>
        <${Icon} name="delete-16" color=${delOff ? 'var(--icon-icon_disabled)' : 'var(--buttons-btn_error_default)'} />Delete policy</button></span>
      <div class="right"><button class="btn btn-secondary" onClick=${back}>Cancel</button><button class="btn btn-primary" disabled=${!dirty || !!err} onClick=${save}>Save</button></div>
    </div></footer>
    ${leaving && html`<${UnsavedModal} where="edit" onKeep=${() => setLeaving(false)} onLeave=${() => go(list)} />`}
    ${del && html`<${DeleteFlow} mod=${mod} id=${id} onClose=${() => setDel(false)} onDeleted=${() => go(list)} />`}
  </div>`;
}
