// Policies tab for both modules: toolbar, filter panel, Customize columns, table, "+N" popover, row actions,
// and every overlay the list opens (drawer, duplicate, delete, can't-delete, wizard).
import { html, useState, useRef, useMemo, useEffect } from '../../lib.js';
import { getState } from '../../store.js';
import { go } from '../../router.js';
import { Icon, Wrapped, DateTime, Counter, TypeTag, shownType, Verdict, FilterPanel, Chips, SearchField, TableFooter, EmptyState, NoResults, useDismiss } from '../../components/ui.js';
import { idsIn, cellStates, stateOf, assign, appById, catalog, policies, rules, isMsp, policySites } from '../../data/policy.js';
import { c } from '../../data/copy.js';
import { CustomizeColumns } from './Logs.js';
import { PolicyDrawer } from './PolicyDrawer.js';
import { DuplicateModal, DeleteFlow } from './Dialogs.js';
import { Wizard } from './Wizard.js';

const cols = (mod, msp) => [
  { id: 'name', label: 'Name', style: 'flex:1 1 0;min-width:180px', fixed: true },
  { id: 'apps', label: mod.colApps, style: 'width:223px;flex:none' },
  msp ? { id: 'groups', label: 'Assigned sites', style: 'width:191px;flex:none' } : { id: 'groups', label: mod.colGroups, style: 'width:191px;flex:none' },
  { id: 'modified', label: 'Last modified', style: 'width:131px;flex:none' },
  { id: 'type', label: 'Type', style: 'width:145px;flex:none' },
];
const TYPE_ORDER = { System: 0, Inherited: 1, Local: 2 };

/** Which overlay a deep link (#/f/<frame>) opens, and on which policy. */
function initialUi(mod, state) {
  const [s, arg, flag] = (state || '').split(':');
  const d = mod.deep;
  switch (s) {
    case 'list+more-popover': return { popover: d.popover };
    case 'list+filter-panel': return { filter: true };
    case 'list+row-actions': return { menu: d.menu };
    case 'drawer': return { drawer: arg || d.drawer };
    case 'duplicate': return { drawer: d.dup, dup: d.dup };
    case 'delete': return { drawer: d.del, del: d.del, force: true };
    case 'cant-delete': return { drawer: d.del, del: d.del };
    case 'wizard': return { wizard: true, step: +arg || 0, pickerOpen: flag === 'open' };
    case 'edit-page': return { edit: arg || d.edit };
    default: return {};
  }
}

/** Apps column (2026-11-24): two labelled rows — RMM "Approved" + "Under review", Applications "Not approved" + "Under review".
 *  "All apps" when every app is in the first state, "None" when both rows are empty. */
function AppsCell({ mod, p, onHoverMore }) {
  const [first, second] = cellStates(mod);
  const total = catalog(mod).length;
  const a = idsIn(mod, p, first), b = idsIn(mod, p, second);
  if (a.length === total) return html`<span class="main">All apps</span>`;
  if (!a.length && !b.length) return html`<span class="main muted-i">None</span>`;
  const row = (label, ids) => { const shown = ids.slice(0, 4), more = ids.length - shown.length;
    return html`<div class="ac-row"><span class="ac-lbl">${label}</span>
      ${shown.map(id => html`<${Wrapped} app=${appById(mod, id)} />`)}
      ${more > 0 && html`<span class="tag tag-plain" tabindex="0" aria-label=${`${more} more ${label} apps`}
        onMouseEnter=${e => onHoverMore(p.id, label, e.currentTarget)} onFocus=${e => onHoverMore(p.id, label, e.currentTarget)}
        onMouseLeave=${() => onHoverMore(null)} onBlur=${() => onHoverMore(null)}>+${more}</span>`}</div>`; };
  return html`<div class="ac">${a.length > 0 && row(first, a)}${b.length > 0 && row(second, b)}</div>`;
}

function SitesCell({ mod, st, p }) {
  const ss = policySites(mod, st, p);
  if (!ss.length) return html`<span class="t-caption02 muted">${c('container.noSites.cell')}</span>`;
  return html`<div class="sites-cell">${ss.slice(0, 2).map((x, i) => html`<div class="sc-line"><span class="tag tag-grey">${x.site.name}</span>${i === 1 && ss.length > 2 && html`<span class="gc-more">+${ss.length - 2}</span>`}</div>`)}</div>`;
}

function GroupsCell({ mod, st, p, onAssign }) {
  const a = assign(mod, st, p.id);
  if (!a.groups.length) return html`<button class="btn-link" onClick=${e => { e.stopPropagation(); onAssign(p); }}>
    <${Icon} name="plus-16" color="var(--text-text_link)" />Assign groups</button>`;
  const line = (n, v) => html`<div style="display:flex;align-items:center;gap:8px;height:22px"><${Counter} n=${n} /><${Verdict} v=${v} /></div>`;
  return html`${a.block > 0 && line(a.block, 'Block')}${a.track > 0 && line(a.track, 'Track')}`;
}

function MorePopover({ mod, p, state, anchor }) {
  if (!p || !anchor) return null;
  const r = anchor.getBoundingClientRect();
  const rest = idsIn(mod, p, state).slice(4);
  return html`<div class="popover" role="tooltip" style=${`left:${r.left + r.width / 2 - 117}px;top:${r.bottom - 8}px;width:235px`}>
    <div class="popover-arrow"></div>
    <div class="popover-body" style="width:235px">
      <div class="t-capital-title" style="color:var(--text-text_secondary)">${state}</div>
      ${rest.map(id => { const a = appById(mod, id); return html`<div class="pop-item"><${Wrapped} app=${a} />
        <div><div class="n">${a.name}</div><div class="v">${a.vendor}</div></div></div>`; })}
    </div>
  </div>`;
}

function RowMenu({ mod, p, anchor, onClose, onAction }) {
  const ref = useRef(null);
  useDismiss(true, onClose, [ref, { current: anchor }]);
  const r = anchor.getBoundingClientRect();
  const { editOff, delOff, editTip, deleteTip } = rules(p, mod);
  return html`<div class="tree-list" role="menu" ref=${ref} style=${`position:fixed;width:160px;left:${r.right - 158}px;top:${r.bottom + 4}px`}>
    <button role="menuitem" class="tree-item" disabled=${editOff} onClick=${() => onAction('edit')} title=${editTip || ''}>
      <${Icon} name="edit-16" color=${editOff ? 'var(--icon-icon_disabled)' : 'var(--icon-icon_default)'} />Edit</button>
    <button role="menuitem" class="tree-item" onClick=${() => onAction('duplicate')}><${Icon} name="duplicate-16" />Duplicate</button>
    <span class="policy-delete-tip policy-delete-tip-menu" data-tip=${deleteTip} tabindex=${deleteTip ? 0 : undefined} aria-label=${deleteTip || undefined}>
    <button role="menuitem" class=${'tree-item' + (delOff ? '' : ' is-danger')} disabled=${delOff} onClick=${() => onAction('delete')}
      title=${deleteTip || ''}>
      <${Icon} name="delete-16" color=${delOff ? 'var(--icon-icon_disabled)' : 'var(--text-text_error)'} />Delete</button></span>
  </div>`;
}

export function PoliciesTab({ mod, query }) {
  const st = getState();
  const init = useMemo(() => initialUi(mod, query.state), [query.state]);
  const msp = query.scope === 'msp';
  // Site Manager level doesn't see its sites' own (Local) policies (Yael, 2026-11-25).
  const visible = policies(mod).filter(p => !(msp && p.type === 'Local'));
  const COLS = cols(mod, msp);
  const qs = msp ? '?scope=msp' : '';
  const [hidden, setHidden] = useState([]);
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState({});
  const [filterOpen, setFilterOpen] = useState(!!init.filter);
  const [sort, setSort] = useState({ col: 'modified', dir: 'asc' });
  const [pop, setPop] = useState(null); // {id, state, el}
  const [menu, setMenu] = useState(null); // {id, el}
  const [drawer, setDrawer] = useState(init.drawer || null);
  const [dup, setDup] = useState(init.dup || null);
  const [del, setDel] = useState(init.del ? { id: init.del, force: init.force } : null);
  const [wizard, setWizard] = useState(!!init.wizard);
  const [wizStep, setWizStep] = useState(init.step || 0);
    const filterRef = useRef(null);
  const moreRefs = useRef({});
  const menuRefs = useRef({});

  useEffect(() => { // open the deep-linked popover / menu once the row is on screen
    if (init.edit) { go(`${mod.base}/edit/${init.edit}${query.scope === 'msp' ? '?scope=msp' : ''}`); return; }
    if (init.popover && moreRefs.current[init.popover]) setPop({ id: init.popover, state: cellStates(mod)[0], el: moreRefs.current[init.popover] });
    if (init.menu && menuRefs.current[init.menu]) setMenu({ id: init.menu, el: menuRefs.current[init.menu] });
  }, []);
  useDismiss(filterOpen, () => setFilterOpen(false), [filterRef]);

  const cats = [
    { id: 'policy', label: 'Policy name', placeholder: 'Search policy names', options: visible.map(p => ({ value: p.id, label: p.name })) },
    { id: 'app', label: c('filter.cat.app', {}, mod.key), placeholder: mod.searchApps, options: catalog(mod).map(a => ({ value: a.id, label: a.name })) },
    { id: 'group', label: 'Groups', placeholder: 'Search groups', options: st.groups.map(g => ({ value: g.id, label: g.name })) },
    { id: 'type', label: 'Type', search: false, options: (mod.key === 'rmm' ? ['System', 'Inherited', 'Local'] : ['Inherited', 'Local']).filter(t => !(msp && t === 'Inherited')).map(t => ({ value: t, label: t })) }, // no System policy in Applications
  ];
  const nFilters = Object.values(applied).reduce((s, v) => s + v.length, 0);

  let rows = visible.filter(p => {
    const ql = q.trim().toLowerCase();
    if (ql && !(p.name.toLowerCase().includes(ql) || (p.description || '').toLowerCase().includes(ql))) return false;
    if ((applied.policy || []).length && !applied.policy.includes(p.id)) return false;
    if ((applied.app || []).length && !applied.app.some(a => stateOf(p, a) === cellStates(mod)[0])) return false; // policies where the app is Approved (RMM) / Not approved (Applications)
    if ((applied.group || []).length && !st.groups.some(g => applied.group.includes(g.id) && g[mod.key][0] === p.id)) return false;
    if ((applied.type || []).length && !applied.type.includes(shownType(p.type))) return false;
    return true;
  });
  const key = {
    name: p => p.name.toLowerCase(), apps: p => idsIn(mod, p, cellStates(mod)[0]).length, groups: p => (msp ? policySites(mod, st, p).length : assign(mod, st, p.id).groups.length),
    modified: p => p.modified, type: p => TYPE_ORDER[shownType(p.type)],
  }[sort.col];
  rows = rows.map((p, i) => [p, i]).sort((a, b) => {
    const x = key(a[0]), y = key(b[0]);
    return (x < y ? -1 : x > y ? 1 : a[1] - b[1]) * (sort.dir === 'asc' ? 1 : -1) || a[1] - b[1];
  }).map(([p]) => p);

  const isEmpty = query.state === 'empty' || visible.length === 0;
  const openEdit = p => go(`${mod.base}/edit/${p.id}${qs}`);
  const onAssign = p => go(`${mod.base}/edit/${p.id}?focus=groups`);
  const shownCols = COLS.filter(c2 => !hidden.includes(c2.id));
  const [eTitle, eBody, eAction] = c('empty.policies', {}, mod.key);
  const wiz = html`${wizard && html`<${Wizard} mod=${mod} container=${msp} startStep=${wizStep} pickerOpen=${!!init.pickerOpen && wizStep === init.step} onClose=${() => { setWizard(false); setWizStep(0); }} />`}`;
  const act = (p, a) => {
    setMenu(null);
    if (a === 'edit') openEdit(p);
    if (a === 'duplicate') setDup(p.id);
    if (a === 'delete') setDel({ id: p.id });
  };
  const sortBy = col => setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));

  if (isEmpty) return html`<${EmptyState} title=${eTitle} body=${eBody} action=${eAction} onAction=${() => setWizard(true)} />${wiz}`;

  return html`
    <div class="toolbar">
      <div class="toolbar-row">
        <div style="position:relative" ref=${filterRef}>
          <button class=${'filter-btn' + (nFilters ? ' is-active' : '')} aria-label="Filters" aria-expanded=${String(filterOpen)} onClick=${() => setFilterOpen(!filterOpen)}>
            <${Icon} name="filter-16" color="var(--icon-icon_strong)" />${nFilters > 0 && html`<span class="badge">${nFilters}</span>`}</button>
          ${filterOpen && html`<${FilterPanel} cats=${cats} applied=${applied} onApply=${setApplied} onClose=${() => setFilterOpen(false)} style="left:-3px;top:48px" />`}
        </div>
        <span class="v-divider"></span>
        <${SearchField} value=${q} onInput=${setQ} placeholder="Search name or description" />
      </div>
      <div class="helper-ph"></div>
    </div>
    <div class="actions-bar">
      <${CustomizeColumns} cols=${COLS} hidden=${hidden} setHidden=${setHidden} />
      <div style="flex:1 1 0;min-width:0;display:flex;justify-content:flex-end"><${Chips} cats=${cats} applied=${applied} onChange=${setApplied} /></div>
      <button class="btn btn-primary" onClick=${() => setWizard(true)}><${Icon} name="plus-16" color="var(--text-text_button_light)" />New policy</button>
    </div>
    <div class="tbl" role="table" aria-label=${mod.tableLabel}>
      <div class="tbl-head" role="row">
        <span class="th th-first"></span>
        ${shownCols.map(c => html`<button role="columnheader" aria-sort=${sort.col === c.id ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
          class=${'th is-sortable' + (sort.col === c.id ? ' is-sorted' : '')} style=${c.id === 'type' && hidden.length ? 'flex:1 1 0;min-width:145px' : c.style} onClick=${() => sortBy(c.id)}>
          <span class="lbl">${c.label}</span>
          <span class="sort-ic" style=${sort.col === c.id && sort.dir === 'desc' ? 'transform:rotate(180deg)' : ''}>
            <${Icon} name=${sort.col === c.id ? 'sort-16' : 'chevron-down-16'} color="var(--icon-icon_strong)" /></span></button>`)}
        <span class="th" style="width:88px;flex:none"></span>
      </div>
      <div class="tbl-rows">
        ${rows.length === 0 && html`<${NoResults} />`}
        ${rows.map(p => html`<div role="row" class=${'tr' + (drawer === p.id ? ' is-active' : '')} tabindex="0"
            onClick=${() => setDrawer(p.id)} onKeyDown=${e => e.key === 'Enter' && e.target === e.currentTarget && setDrawer(p.id)}>
          <span class="td td-first"></span>
          ${shownCols.map(col => html`<div class="td" role="cell" style=${(col.id === 'type' && hidden.length ? 'flex:1 1 0;min-width:145px' : col.style) + (col.id === 'groups' ? ';gap:0' : col.id === 'type' ? ';align-items:flex-start' : '')}
            ref=${col.id === 'apps' ? (el => { if (el) moreRefs.current[p.id] = el.querySelector('.tag-plain'); }) : undefined}>
            ${col.id === 'name' && html`<span class="main">${p.name}</span>${p.description && (mod.showDesc || p.id === 'lab-workstations') && html`<span class="sub">${p.description}</span>`}`}
            ${col.id === 'apps' && html`<${AppsCell} mod=${mod} p=${p} onHoverMore=${(id, state, el) => setPop(id ? { id, state, el } : null)} />`}
            ${col.id === 'groups' && (msp ? html`<${SitesCell} mod=${mod} st=${st} p=${p} />` : html`<${GroupsCell} mod=${mod} st=${st} p=${p} onAssign=${onAssign} />`)}
            ${col.id === 'modified' && html`<${DateTime} iso=${p.modified} vertical />`}
            ${col.id === 'type' && html`<${TypeTag} type=${p.type} />`}
          </div>`)}
          <div class="td td-actions" role="cell" style="width:88px;flex:none">
            <button class="icon-btn" aria-label=${`Actions for ${p.name}`} aria-haspopup="menu" aria-expanded=${String(!!menu && menu.id === p.id)}
              ref=${el => { if (el) menuRefs.current[p.id] = el; }}
              onClick=${e => { e.stopPropagation(); setMenu(menu && menu.id === p.id ? null : { id: p.id, el: e.currentTarget }); }}>
              <${Icon} name="more-16" color="var(--icon-icon_strong)" /></button>
            <button class="icon-btn" aria-label=${`Open ${p.name}`} onClick=${e => { e.stopPropagation(); setDrawer(p.id); }}>
              <${Icon} name="chevron-right-16" color="var(--icon-icon_strong)" /></button>
          </div>
        </div>`)}
      </div>
      <${TableFooter} from=${rows.length ? 1 : 0} to=${rows.length} total=${rows.length} synced=${st.lastSynced || '2025-09-30T12:35:12Z'} onRefresh=${() => {}} />
    </div>
    ${pop && html`<${MorePopover} mod=${mod} p=${policies(mod).find(x => x.id === pop.id)} state=${pop.state} anchor=${pop.el} />`}
    ${menu && html`<${RowMenu} mod=${mod} p=${policies(mod).find(x => x.id === menu.id)} anchor=${menu.el} onClose=${() => setMenu(null)}
      onAction=${a => act(policies(mod).find(x => x.id === menu.id), a)} />`}
    ${drawer && policies(mod).some(x => x.id === drawer) && html`<${PolicyDrawer} mod=${mod} id=${drawer} order=${rows.map(r => r.id)} onNav=${setDrawer} onClose=${() => setDrawer(null)}
      onEdit=${p => openEdit(p)} onDuplicate=${p => setDup(p.id)} onDelete=${p => setDel({ id: p.id })} />`}
    ${dup && html`<${DuplicateModal} mod=${mod} id=${dup} onClose=${() => setDup(null)} onDone=${newId => { setDup(null); setDrawer(null); go(`${mod.base}/edit/${newId}${qs}`); }} />`}
    ${del && html`<${DeleteFlow} mod=${mod} id=${del.id} force=${del.force} onClose=${() => setDel(null)} onDeleted=${() => { setDel(null); setDrawer(null); }} />`}
    ${wiz}
  `;
}
