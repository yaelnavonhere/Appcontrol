// Under review model (boards 2026-11-24): every app has one approval per policy — Under review / Approved / Not approved.
// Shared by the drawer, the wizard (step 2 and Summary) and the edit page of both modules.
// State tags: All = Tag Blue, Under review = Colored warning/medium, Not approved = Colored Negative, Approved = Colored positive.
import { html, useState, useRef } from '../../lib.js';
import { Icon, Fav, Checkbox, useDismiss, useFloating } from '../../components/ui.js';
import { catalog, appById, STATES } from '../../data/policy.js';
import { c } from '../../data/copy.js';

export const APPROVAL_COLOR = { 'Under review': 'var(--text-text_warning)', 'Not approved': 'var(--text-text_error)', Approved: 'var(--status-success_bold)' };
const TAG_CLASS = { all: 'stag-all', 'Under review': 'stag-review', 'Not approved': 'stag-neg', Approved: 'stag-pos' };
const ORDER = ['all', 'Under review', 'Not approved', 'Approved'];

/** "● Under review" — coloured dot, primary text (edit rows, drawer rows). */
export const ApprovalDot = ({ v, small }) => html`<span class=${'appr' + (small ? ' appr-sm' : '')}><span class="appr-dot" style=${`background:${APPROVAL_COLOR[v]}`}></span>${v}</span>`;

/** Filter tags with counts: All (n) · Under review (n) · Not approved (n) · Approved (n). */
export function StateTags({ counts, active, onChange }) {
  return html`<div class="stags" role="tablist" aria-label="Filter by approval">${ORDER.map(k => html`<button type="button" role="tab" aria-selected=${String(active === k)}
    class=${'stag ' + TAG_CLASS[k] + (active === k ? ' is-on' : '')} onClick=${() => onChange(k)}>${k === 'all' ? c('approval.all') : k} (${counts[k] || 0})</button>`)}</div>`;
}

/** Legend. short = wizard step 2 (Option A, no lead line); full = edit page. */
export function Legend({ mod, short }) {
  return html`<div class="legend">${!short && html`<div>${c('legend.lead')}</div>`}
    <div><b>Under review:</b> ${c('legend.underReview', {}, mod.key)}</div>
    <div><b>Not approved:</b> ${c('legend.notApproved')}</div></div>`;
}

/** Approval single select. Options carry the sub-line from the board ("Runs normally" …). */
export function ApprovalSelect({ value, onChange, options = ['Approved', 'Under review', 'Not approved'], placeholder = 'Select approval', label, compact, width, colorValue, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(open, () => setOpen(false), [ref]);
  const fl = useFloating(open, ref, { width: Math.max(width || 0, 260), minSpace: 150 });
  return html`<div class="select" ref=${ref} style=${width ? `width:${width}px` : ''}>
    <button type="button" class=${'select-field' + (value ? ' is-filled' : '') + (compact ? ' appr-field-sm' : '')} aria-haspopup="listbox" aria-expanded=${String(open)}
      aria-label=${label} disabled=${disabled} onClick=${() => setOpen(!open)}>
      <span class="sv" style=${colorValue && value ? `color:${APPROVAL_COLOR[value]}` : ''}>${value ? (colorValue ? value : html`<${ApprovalDot} v=${value} />`) : placeholder}</span>
      <span style=${open ? 'transform:rotate(180deg);display:inline-flex' : 'display:inline-flex'}><${Icon} name="chevron-down-16" color=${disabled ? 'var(--icon-icon_disabled)' : 'var(--icon-icon_strong)'} /></span>
    </button>
    ${open && html`<div class="select-menu appr-menu" role="listbox" style=${fl}>
      ${options.map(o => html`<button type="button" role="option" aria-selected=${String(o === value)} class=${'select-opt appr-opt' + (o === value ? ' is-cur' : '')}
        onClick=${() => { onChange(o); setOpen(false); }}>
        <span class="appr-dot" style=${`background:${APPROVAL_COLOR[o]}`}></span>
        <span><span class="t">${o}</span><span class="s">${c('approval.sub.' + o)}</span></span></button>`)}
    </div>`}
  </div>`;
}

export const countStates = (ids, states) => {
  const n = { all: ids.length };
  STATES.forEach(s => { n[s] = ids.filter(id => states[id] === s).length; });
  return n;
};

/** One list of every catalog app with its approval.
 *  mode 'view' (drawer, Summary): dot + text, "Show more" after `page` rows.
 *  mode 'pick' (wizard step 2): checkbox + approval select per row, Select all, bulk "Set approval".
 *  mode 'edit' (edit page): approval select per row (inline), optional `head` slot above the rows. */
export function AppStatesList({ mod, states, onChange, mode = 'view', page = 9, searchPh, head, locked }) {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [more, setMore] = useState(false);
  const [sel, setSel] = useState([]);
  const ids = catalog(mod).map(a => a.id);
  const counts = countStates(ids, states);
  const ql = q.trim().toLowerCase();
  const list = ids.filter(id => (tab === 'all' || states[id] === tab) && (!ql || appById(mod, id).name.toLowerCase().includes(ql)));
  const shown = mode === 'view' && !more ? list.slice(0, page) : list;
  const set = (id, v) => onChange({ ...states, [id]: v });
  const allOn = list.length > 0 && list.every(id => sel.includes(id));
  const someOn = list.some(id => sel.includes(id));
  const bulk = v => { const next = { ...states }; sel.forEach(id => { next[id] = v; }); onChange(next); setSel([]); };
  const search = html`<label class="field asl-search"><${Icon} name="search-16" /><input type="search" placeholder=${searchPh || c('apps.search')} aria-label=${searchPh || c('apps.search')} value=${q} onInput=${e => setQ(e.target.value)} /></label>`;
  const tags = html`<${StateTags} counts=${counts} active=${tab} onChange=${t => { setTab(t); setMore(false); }} />`;
  return html`<div class=${'asl asl-' + mode}>
    ${mode === 'pick' ? html`${search}${tags}` : html`${tags}${head}${search}`}
    ${mode === 'pick' && html`<div class="asl-all">
      <label class="asl-cb" onClick=${() => setSel(allOn ? sel.filter(id => !list.includes(id)) : [...new Set([...sel, ...list])])}>
        <${Checkbox} on=${allOn} mixed=${!allOn && someOn} label="Select all" />${!allOn && someOn ? c('approval.selectAll.some', { k: list.filter(id => sel.includes(id)).length, n: list.length }) : c('approval.selectAll', { n: list.length })}</label>
      ${sel.length > 0 && html`<div class="asl-bulk"><${BulkButton} onPick=${bulk} /></div>`}
    </div>`}
    <div class="asl-rows" role="list">
      ${shown.length === 0 && html`<div class="sum-none">${ql ? c('apps.noMatch', { q }) : c('apps.emptyState')}</div>`}
      ${shown.map(id => { const a = appById(mod, id); return html`<div class="asl-row" role="listitem">
        ${mode === 'pick' && html`<span onClick=${() => setSel(sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id])}><${Checkbox} on=${sel.includes(id)} label=${`Select ${a.name}`} /></span>`}
        <span class="asl-name"><${Fav} app=${a} /><span>${a.name}</span></span>
        ${mode === 'view' && html`<${ApprovalDot} v=${states[id]} small />`}
        ${mode === 'pick' && html`<${ApprovalSelect} value=${states[id]} onChange=${v => set(id, v)} compact width=${148} label=${`Approval for ${a.name}`} />`}
        ${mode === 'edit' && (locked ? html`<span class="asl-val"><${ApprovalDot} v=${states[id]} /></span>`
          : html`<span class="asl-val"><${InlineApproval} value=${states[id]} onChange=${v => set(id, v)} label=${`Approval for ${a.name}`} /></span>`)}
      </div>`; })}
    </div>
    ${mode === 'view' && list.length > page && html`<button class="btn-text-xs" aria-expanded=${String(more)} onClick=${() => setMore(!more)}>${more ? 'Show less' : 'Show more'}
      <span style=${more ? 'transform:rotate(180deg);display:inline-flex' : 'display:inline-flex'}><${Icon} name="chevron-down-16" color="var(--buttons-btn_outline_default)" /></span></button>`}
  </div>`;
}

/** Bulk "Set approval" (wizard step 2, R:21276:223007, A:22611:157931). */
function BulkButton({ onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(open, () => setOpen(false), [ref]);
  const fl = useFloating(open, ref, { width: 272, minSpace: 150 });
  return html`<div class="select" ref=${ref}>
    <button type="button" class="btn btn-secondary btn-sm" aria-haspopup="listbox" aria-expanded=${String(open)} onClick=${() => setOpen(!open)}>${c('approval.bulk')}
      <${Icon} name="chevron-down-16" color="var(--icon-icon_strong)" /></button>
    ${open && html`<div class="select-menu appr-menu" role="listbox" style=${fl}>
      ${['Approved', 'Under review', 'Not approved'].map(o => html`<button type="button" role="option" class="select-opt appr-opt" onClick=${() => { onPick(o); setOpen(false); }}>
        <span class="appr-dot" style=${`background:${APPROVAL_COLOR[o]}`}></span><span><span class="t">${o}</span><span class="s">${c('approval.sub.' + o)}</span></span></button>`)}
    </div>`}
  </div>`;
}

/** Row value that turns into the approval select on click (edit page inline edit). */
function InlineApproval({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(open, () => setOpen(false), [ref]);
  const fl = useFloating(open, ref, { width: 280, minSpace: 150 });
  return html`<div class="inline-sel" ref=${ref}>
    <button type="button" class="inline-btn" aria-haspopup="listbox" aria-expanded=${String(open)} aria-label=${label} onClick=${() => setOpen(!open)}>
      <${ApprovalDot} v=${value} /><span class="inline-chev"><${Icon} name="chevron-down-16" /></span></button>
    ${open && html`<div class="select-menu appr-menu" role="listbox" style=${fl}>
      ${['Approved', 'Under review', 'Not approved'].map(o => html`<button type="button" role="option" aria-selected=${String(o === value)} class=${'select-opt appr-opt' + (o === value ? ' is-cur' : '')}
        onClick=${() => { onChange(o); setOpen(false); }}><span class="appr-dot" style=${`background:${APPROVAL_COLOR[o]}`}></span>
        <span><span class="t">${o}</span><span class="s">${c('approval.sub.' + o)}</span></span></button>`)}
    </div>`}
  </div>`;
}

/** End-user notification: checkbox (wizard step 3, edit page) or read-only (drawer, Summary). */
export function NotifyBox({ value, onChange, readOnly }) {
  return html`<label class=${'notify' + (readOnly ? ' is-ro' : '')} onClick=${e => { e.preventDefault(); if (!readOnly) onChange(!value); }}>
    <${Checkbox} on=${value} label=${c('notify.check')} /><span>${c('notify.check')}</span></label>`;
}
