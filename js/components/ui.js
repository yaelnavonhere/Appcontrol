// Shared DS3 building blocks (stage 2). Applications (stage 3) reuses all of them.
import { html, useState, useEffect, useRef, iconStyle } from '../lib.js';
import { c } from '../data/copy.js';
import { getState } from '../store.js';

export const Icon = ({ name, color = 'var(--icon-icon_default)', size = 16, label }) =>
  html`<span class="ico" role=${label ? 'img' : undefined} aria-label=${label} aria-hidden=${label ? undefined : 'true'} style=${iconStyle(name, color, size)}></span>`;

export const Img = ({ name, size = 16, alt = '' }) =>
  html`<img class="ico" src=${`assets/icons/${name}.svg`} width=${size} height=${size} alt=${alt} />`;

export const Fav = ({ app, size = 16 }) =>
  html`<img class="fav16" src=${`assets/favicons/${(app && app.icon) || 'app'}.svg`} width=${size} height=${size} alt="" style=${`width:${size}px;height:${size}px`}
    onError=${e => { if (!e.currentTarget.src.endsWith('/app.svg')) e.currentTarget.src = 'assets/favicons/app.svg'; }} />`;

/** Favicon <img> that never shows a broken image: an unknown or failing icon falls back to the generic DS3 App icon. */
const favSrc = app => `assets/favicons/${(app && app.icon) || 'app'}.svg`;
const onFavError = e => { if (!e.currentTarget.src.endsWith('/app.svg')) e.currentTarget.src = 'assets/favicons/app.svg'; };
export const Wrapped = ({ app, big }) =>
  html`<span class=${'wrapped' + (big ? ' wrapped-32' : '')} title=${app.name}><img src=${favSrc(app)} alt=${app.name} onError=${onFavError} /></span>`;

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export function fmtDate(iso) {
  const d = new Date(iso);
  const p = n => String(n).padStart(2, '0');
  return { date: `${p(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`, time: `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}` };
}
/** DS3 Date&Time: "30 SEP 2025 12:35:12 UTC". vertical = two lines (tables). */
export function DateTime({ iso, vertical, utc = true }) {
  const { date, time } = fmtDate(iso);
  return html`<span class=${'dt' + (vertical ? ' dt-v' : '')}><span class="dt-date">${date}</span><span class="dt-time">${time}${utc ? ' UTC' : ''}</span></span>`;
}

export const Counter = ({ n }) => html`<span class="counter">${n}</span>`;

const TYPE_CLASS = { System: 'tag-system', Inherited: 'tag-inherited', Local: 'tag-local' };
const TYPE_TEXT = { System: 'var(--color-blue-primary-100)', Inherited: 'var(--color-turkiz-blue-200)', Local: 'var(--color-pink-100)' };
/** The type as the current level sees it: a policy created at Site Manager level is stored as Inherited (what its sites see),
 *  but at Site Manager level it's that level's own policy, so it shows as Local (Yael, 2026-11-25). */
export const shownType = type => (type === 'Inherited' && getState().scope.level === 'msp' ? 'Local' : type);
export const TypeTag = ({ type: stored, small }) => { const type = shownType(stored); return html`<span class=${`tag ${TYPE_CLASS[type]}${small ? ' tag-sm' : ''}`}>
  ${type !== 'Local' && html`<${Icon} name="lock-16" color=${TYPE_TEXT[type]} />`}${type}</span>`; };
export const CategoryTag = ({ label }) => html`<span class="tag tag-sm tag-category">${label}</span>`;

const VERDICT = {
  Track: { icon: 'status-warning-16', color: 'var(--text-text_primary)' },
  Block: { icon: 'status-block-16', color: 'var(--text-text_primary)' },
  Allowed: { icon: 'log-allowed-16' },
  Tracked: { icon: 'log-warning-16' },
  Blocked: { icon: 'log-block-16' },
  'Under review': { icon: 'log-warning-16' },
};
/** "Track ⚠" (icon after, as in the policies table) or "⚠ Track" (lead = icon first). */
export function Verdict({ v, lead, small }) {
  const ic = VERDICT[v].dot ? html`<span class="status-dot" style=${`background:${VERDICT[v].dot}`}></span>` : html`<${Img} name=${VERDICT[v].icon} />`;
  return html`<span class=${'status' + (lead ? ' status-lead' : '')} style=${small ? 'font-size:12px;line-height:18px;gap:4px' : ''}>${lead && ic}${v}${!lead && ic}</span>`;
}

export function Checkbox({ on, mixed, onChange, label }) {
  return html`<span class=${'cb' + (on ? ' is-on' : mixed ? ' is-mixed' : '')} role="checkbox" aria-checked=${mixed ? 'mixed' : String(!!on)} aria-label=${label}
    onClick=${onChange && (e => { e.stopPropagation(); onChange(!on); })}></span>`;
}

/** Close on outside click / Escape. */
export function useDismiss(open, onClose, refs) {
  useEffect(() => {
    if (!open) return;
    const down = e => { if (!refs.some(r => r.current && r.current.contains(e.target))) onClose(); };
    const key = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [open]);
}

/** Floating menus: position:fixed under (or above) the trigger, so no scrolling container can clip them.
 *  Returns a style string; the menu scrolls inside when the viewport is short. width: fixed px or the trigger's width. */
export function useFloating(open, ref, { width, minSpace = 220, gap = 8, cap = 300 } = {}) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!open) return;
    const on = () => tick(n => n + 1);
    window.addEventListener('resize', on);
    document.addEventListener('scroll', on, true);
    return () => { window.removeEventListener('resize', on); document.removeEventListener('scroll', on, true); };
  }, [open]);
  if (!open || !ref.current) return '';
  const r = ref.current.getBoundingClientRect();
  const vh = window.innerHeight, vw = window.innerWidth;
  const below = vh - r.bottom - gap - 16, above = r.top - gap - 16;
  const up = below < minSpace && above > below;
  const w = width || r.width;
  const left = Math.max(16, Math.min(r.left, vw - w - 16));
  const maxH = Math.min(cap, Math.max(120, up ? above : below));
  return `position:fixed;left:${left}px;width:${w}px;right:auto;${up ? `bottom:${vh - r.top + gap}px;top:auto` : `top:${r.bottom + gap}px`};max-height:${maxH}px;z-index:95`;
}

/** DS3 Single Select. options: [{value,label,icon?,color?,disabled?,sub?}] */
export function Select({ value, options, placeholder, onChange, width, disabled, valueColor, lockIcon, small, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(open, () => setOpen(false), [ref]);
  const cur = options.find(o => o.value === value);
  const fl = useFloating(open, ref);
  return html`<div class="select" ref=${ref} style=${width ? `width:${width}px` : ''}>
    <button type="button" class=${'select-field' + (cur ? ' is-filled' : '')} aria-haspopup="listbox" aria-expanded=${String(open)} aria-label=${ariaLabel}
      disabled=${disabled} style=${small ? 'height:32px;background:var(--bg-bg_stage)' : ''} onClick=${() => !lockIcon && setOpen(!open)}>
      <span class="sv" style=${cur && (cur.color || valueColor) ? `color:${cur.color || valueColor}` : ''}>${cur && cur.icon}${cur ? cur.label : placeholder}</span>
      ${lockIcon ? html`<${Icon} name="lock-16" />` : html`<${Icon} name="chevron-down-16" color=${disabled ? 'var(--icon-icon_disabled)' : 'var(--icon-icon_default)'} />`}
    </button>
    ${open && html`<div class="select-menu" role="listbox" style=${fl}>
      ${options.map(o => html`<button type="button" role="option" class="select-opt" aria-selected=${String(o.value === value)} disabled=${o.disabled}
        onClick=${() => { onChange(o.value); setOpen(false); }}>${o.icon}<span style=${o.color ? `color:${o.color}` : ''}>${o.label}</span>${o.sub && html`<span class="sub">${o.sub}</span>`}</button>`)}
    </div>`}
  </div>`;
}

/** Toolbar search (DS3 Text Input with search icon). */
export function SearchField({ value, onInput, placeholder, width = 348, label }) {
  return html`<label class="field" style=${`width:${width}px`}>
    <${Icon} name="search-24" />
    <input type="search" value=${value} placeholder=${placeholder} aria-label=${label || placeholder} onInput=${e => onInput(e.target.value)} />
  </label>`;
}

/** DS3 Filter Panel: categories on the left, checkable values on the right. */
export function FilterPanel({ cats, applied, onApply, onClose, style }) {
  const [active, setActive] = useState(cats[0].id);
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(applied)));
  const [q, setQ] = useState('');
  const cat = cats.find(c => c.id === active);
  const sel = draft[active] || [];
  const opts = cat.options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));
  const toggle = v => setDraft({ ...draft, [active]: sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v] });
  return html`<div class="filter-panel" role="dialog" aria-label="Filters" style=${style}>
    <div class="fp-body">
      <div class="fp-cats" role="tablist">
        ${cats.map(c => html`<button role="tab" aria-selected=${String(c.id === active)} class=${'fp-cat' + (c.id === active ? ' is-active' : '')}
          onClick=${() => { setActive(c.id); setQ(''); }}>${(draft[c.id] || []).length > 0 && html`<span class="dot"></span>`}${c.label}
          ${(draft[c.id] || []).length > 0 && html`<span class="cnt"><${Counter} n=${draft[c.id].length} /></span>`}</button>`)}
      </div>
      <div class="fp-values">
        ${cat.search !== false && html`<${SearchField} value=${q} onInput=${setQ} placeholder=${cat.placeholder} width=${null} />`}
        <div class="fp-list">
          ${opts.length === 0 && html`<div class="fp-empty">${c('filter.noMatches')}</div>`}
          ${opts.map(o => html`<button type="button" class=${'fp-opt' + (sel.includes(o.value) ? ' is-on' : '')} onClick=${() => toggle(o.value)}>
            <${Checkbox} on=${sel.includes(o.value)} />${o.icon}${o.label}</button>`)}
        </div>
      </div>
    </div>
    <div class="fp-footer">
      <button class="btn btn-outline" onClick=${() => setDraft({})}>Clear all</button>
      <button class="btn btn-primary" onClick=${() => { onApply(draft); onClose(); }}>Apply</button>
    </div>
  </div>`;
}

/** Applied filters as removable chips. */
export function Chips({ cats, applied, onChange }) {
  const items = cats.flatMap(c => (applied[c.id] || []).map(v => ({ c, v, label: (c.options.find(o => o.value === v) || { label: v }).label })));
  if (!items.length) return null;
  return html`<div class="chips">${items.map(({ c, v, label }) => html`<span class="chip"><b>${c.label}:</b> ${label}
    <button aria-label=${`Remove ${label}`} onClick=${() => onChange({ ...applied, [c.id]: applied[c.id].filter(x => x !== v) })}><${Icon} name="close-16" size=${12} /></button></span>`)}
    <button class="btn-text-xs" onClick=${() => onChange({})}>Clear all</button></div>`;
}

/** Table footer: Refresh + Last synced + pagination. */
export function TableFooter({ from, to, total, synced, onRefresh, onPage, page = 0, pages = 1 }) {
  const dis = c => c ? 'var(--icon-icon_disabled)' : 'var(--icon-icon_strong)';
  const first = page === 0, last = page >= pages - 1;
  return html`<div class="tbl-footer">
    <div class="refresh">
      <button class="btn-text-xs" onClick=${onRefresh}><${Icon} name="reload-16" color="var(--buttons-btn_outline_default)" />Refresh</button>
      <span class="synced">Last Synced: <${DateTime} iso=${synced} /></span>
    </div>
    <div class="pager">
      <button aria-label="First page" disabled=${first} onClick=${() => onPage && onPage(0)}><${Icon} name="page-first-20" size=${20} color=${dis(first)} /></button>
      <button aria-label="Previous page" disabled=${first} onClick=${() => onPage && onPage(page - 1)}><span style="display:inline-flex;transform:scaleX(-1)"><${Icon} name="page-next-20" size=${20} color=${dis(first)} /></span></button>
      <span class="pg">${total ? `${from}-${to} of ${total}` : '0 of 0'}</span>
      <button aria-label="Next page" disabled=${last} onClick=${() => onPage && onPage(page + 1)}><${Icon} name="page-next-20" size=${20} color=${dis(last)} /></button>
      <button aria-label="Last page" disabled=${last} onClick=${() => onPage && onPage(pages - 1)}><span style="display:inline-flex;transform:scaleX(-1)"><${Icon} name="page-first-20" size=${20} color=${dis(last)} /></span></button>
    </div>
  </div>`;
}

/** DS3 Drawer. blanket=false for the non-modal log drawer. */
export function Drawer({ title, onClose, children, footer, blanket = true, headLeft, headRight }) {
  useEffect(() => {
    const key = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  return html`${blanket && html`<div class="blanket" onClick=${onClose}></div>`}
    <aside class=${'drawer' + (blanket ? '' : ' is-plain')} role="dialog" aria-modal=${String(blanket)} aria-label=${title}>
      <div class="drawer-head">${headLeft || html`<span class="ttl">${title}</span>`}
        <div style="display:flex;align-items:center;gap:8px">${headRight}<button class="close" aria-label="Close" onClick=${onClose}><${Icon} name="close-16" color="var(--icon-icon_strong)" /></button></div></div>
      <div class="drawer-scroll">${children}</div>
      ${footer && html`<div class="drawer-foot">${footer}</div>`}
    </aside>`;
}

/** DS3 Modal (title bar, slot, footer). */
export function Modal({ title, width = 668, onClose, children, footer, bodyStyle }) {
  useEffect(() => {
    const key = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  return html`<div class="modal-wrap"><div class="blanket" onClick=${onClose}></div>
    <div class="modal" role="dialog" aria-modal="true" aria-label=${title} style=${`width:${width}px`}>
      <div class="modal-title"><h2>${title}</h2><button class="modal-close" aria-label="Close" onClick=${onClose}><${Icon} name="close-24" size=${24} color="var(--icon-icon_strong)" /></button></div>
      <div style=${bodyStyle}>${children}</div>
      ${footer && html`<div class="modal-foot">${footer}</div>`}
    </div></div>`;
}

/** DS3 Confirmation Modal. kind: error | info. */
export function Confirm({ kind = 'error', title, children, cancel, confirm, danger, onCancel, onConfirm }) {
  useEffect(() => {
    const key = e => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  return html`<div class="modal-wrap"><div class="blanket" onClick=${onCancel}></div>
    <div class="modal confirm" role="alertdialog" aria-modal="true" aria-label=${title}>
      <button class="x" aria-label="Close" onClick=${onCancel}><${Icon} name="close-24" size=${24} color="var(--icon-icon_default)" /></button>
      <div class="ct">
        <${Img} name=${kind === 'info' ? 'status-info-24' : 'status-error-24'} size=${24} />
        <h2>${title}</h2>
        <div class="cbody">${children}</div>
      </div>
      <div class="acts">
        <button class="btn btn-secondary" onClick=${onCancel}>${cancel}</button>
        <button class=${'btn ' + (danger ? 'btn-danger' : 'btn-primary')} onClick=${onConfirm}>${confirm}</button>
      </div>
    </div></div>`;
}

export function EmptyState({ title, body, action, onAction }) {
  return html`<div class="empty">
    <div class="img"><span><img src="assets/icons/empty-policies.svg" width="29" height="32" alt="" /></span></div>
    <div class="tx"><div><h2>${title}</h2><p>${body}</p></div>
      ${action && html`<div><button class="btn btn-primary" onClick=${onAction}>${action}</button></div>`}</div>
  </div>`;
}

/** "No data found" inside a filtered table. */
export const NoResults = () => html`<div class="empty" style="margin-top:56px">
  <div class="img"><span><${Icon} name="search-24" size=${32} color="var(--icon-icon_tertiary)" /></span></div>
  <div class="tx"><div><h2>No data found</h2><p>Try broadening or adjusting your filters.</p></div></div>
</div>`;
