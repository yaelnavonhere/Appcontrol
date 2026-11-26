// Duplicate modal (R:20868:101630 / A:22094:213466), delete confirmation, can't-delete blocker, unsaved changes.
import { html, useState } from '../../lib.js';
import { getState } from '../../store.js';
import { go } from '../../router.js';
import { Modal, Confirm } from '../../components/ui.js';
import { copyName, duplicatePolicy, deletePolicy, assign, policies, isMsp, policySites } from '../../data/policy.js';
import { c } from '../../data/copy.js';

export function NameFields({ name, setName, desc, setDesc, error, gap = 16 }) {
  return html`<div style=${`display:flex;flex-direction:column;gap:${gap}px`}>
    <div class="field-wrap">
      <label class="field-label" for="pol-name"><span class="req">*</span>Policy name</label>
      <div class=${'field' + (error ? ' is-error' : '')}><input id="pol-name" value=${name} maxlength="80" placeholder="Enter policy name"
        aria-invalid=${String(!!error)} onInput=${e => setName(e.target.value)} /></div>
      ${error && html`<div class="helper is-error" role="alert">${error}</div>`}
    </div>
    <div class="field-wrap">
      <label class="field-label" for="pol-desc">Description</label>
      <div class="field textarea"><textarea id="pol-desc" placeholder="Enter description" maxlength="300" onInput=${e => setDesc(e.target.value)}>${desc}</textarea></div>
    </div>
  </div>`;
}

export function nameError(mod, name, selfId) {
  const n = name.trim();
  if (!n) return c('name.empty');
  if (policies(mod).some(p => p.id !== selfId && p.name.toLowerCase() === n.toLowerCase())) return c('name.duplicate');
  return null;
}

export function DuplicateModal({ mod, id, onClose, onDone }) {
  const src = policies(mod).find(p => p.id === id);
  const [name, setName] = useState(copyName(mod, src.name));
  const [desc, setDesc] = useState(src.description || '');
  const [tried, setTried] = useState(false);
  const err = tried ? nameError(mod, name) : null;
  const submit = () => { setTried(true); if (nameError(mod, name)) return; onDone(duplicatePolicy(mod, id, name.trim(), desc.trim())); };
  return html`<${Modal} title="Duplicate policy" onClose=${onClose} bodyStyle="padding:32px 40px 16px"
    footer=${html`<div class="right"><button class="btn btn-secondary" onClick=${onClose}>Cancel</button><button class="btn btn-primary" onClick=${submit}>Duplicate</button></div>`}>
    <${NameFields} name=${name} setName=${setName} desc=${desc} setDesc=${setDesc} error=${err} />
  <//>`;
}

/** Delete: blocked while groups use the policy (Info blocker), otherwise a danger confirmation. */
export function DeleteFlow({ mod, id, force, onClose, onDeleted }) {
  const st = getState();
  const p = policies(mod).find(x => x.id === id);
  if (isMsp() && !force) {
    const ns = policySites(mod, st, p).length;
    if (ns > 0) return html`<${Confirm} kind="info" title="Can't delete policy" cancel="Close" confirm="Close" onCancel=${onClose} onConfirm=${onClose}>
      <p>${c(ns === 1 ? 'container.cantDelete.one' : 'container.cantDelete.many', { name: p.name, n: ns })}</p><//>`;
  }
  const n = isMsp() ? 0 : assign(mod, st, id).groups.length;
  if (n > 0 && !force) return html`<${Confirm} kind="info" title="Can't delete policy" cancel="Close" confirm="Edit assigned groups"
    onCancel=${onClose} onConfirm=${() => { onClose(); go(`${mod.base}/edit/${id}?focus=groups`); }}>
    <p>The policy “${p.name}” is assigned to ${n} ${n === 1 ? 'group' : 'groups'}. You can delete it only when no groups use it. Remove its groups and save, then try again.</p>
  <//>`;
  return html`<${Confirm} title="Delete policy" cancel="Keep policy" confirm="Delete policy" danger onCancel=${onClose}
    onConfirm=${() => { deletePolicy(mod, id); onDeleted(); }}>
    <p>Are you sure you want to delete the policy “${p.name}”?</p><p>Once deleted, it can't be restored.</p>
  <//>`;
}

/** where: 'edit' (leaving the edit page) or 'wizard' (closing the wizard). */
export const UnsavedModal = ({ where = 'edit', onKeep, onLeave }) => html`<${Confirm} title=${c('unsaved.title')} cancel=${c('unsaved.cancel')}
  confirm=${c('unsaved.confirm.' + where)} danger onCancel=${onKeep} onConfirm=${onLeave}><p>${c('unsaved.body.' + where)}</p><//>`;
