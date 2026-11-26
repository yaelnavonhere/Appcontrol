// AI Security (site level): KPIs, Insights, AI Inventory (AI apps / GenAI services) with the State select,
// the Manage approval modal (every state change), the app drawer, and the Users & Hosts tab with its user drawer.
// Frames: A:22068:51387 (inventory), A:22134:319740 (approve), A:22068:64413 (manage), A:22355:113775 (app drawer), A:22310:181200 (user drawer).
import { html, useState, useRef, useMemo } from '../../lib.js';
import { getState } from '../../store.js';
import { go } from '../../router.js';
import { msp, hosts as allHosts } from '../../data/seed.js';
import { Icon, Img, Fav, Wrapped, DateTime, Counter, TypeTag, Verdict, FilterPanel, Chips, SearchField, TableFooter, EmptyState, NoResults,
  Drawer, Modal, Confirm, Checkbox, useDismiss, useFloating } from '../../components/ui.js';
import { CustomizeColumns } from '../policy/Logs.js';
import { c } from '../../data/copy.js';
import { items, aiUsers, appMeta, appState, policyState, usedPolicies, itemGroups, kpis, applyApproval, setPolicyState, AI_BY_ID } from '../../data/aisec.js';
import { ApprovalSelect, ApprovalDot } from '../policy/Approvals.js';

const STATE_COLOR = { Approved: 'var(--status-success_bold)', 'Under review': 'var(--text-text_warning)', 'Not approved': 'var(--text-text_error)', Mixed: 'var(--text-text_secondary)' };
const RANGES = [[30, 'Last 30 days'], [7, 'Last 7 days'], [1, 'Last 24 hours']];
const USAGE = { High: ['arrow-up-16', '#ff7475'], Medium: ['arrow-up-16', 'var(--text-text_warning)'], Low: ['arrow-down-16', '#ffec71'] };
const userById = id => aiUsers.find(u => u.id === id);

/** Which overlay a deep link opens. */
function initialUi(state) {
  switch (state) {
    case 'approve': return { manage: { appId: 'cursor', target: 'Approved' } };
    case 'not-approve': case 'not-approve-one': return { manage: { appId: 'cursor', target: 'Not approved' } };
    case 'under-review': return { manage: { appId: 'cursor', target: 'Under review' } };
    case 'app-drawer': return { drawer: 'openclaw' };
    case 'user-drawer': return { user: aiUsers[0].id };
    default: return {};
  }
}

function StateDot({ s, caps }) {
  return html`<span class=${'st-label' + (caps ? ' st-caps' : '')} style=${`color:${STATE_COLOR[s]}`}><span class="st-dot" style=${`background:${STATE_COLOR[s]}`}></span>${s}</span>`;
}

/** DS3 Single Select styled as the State control (A:22068:59791). */
export function StateSelect({ appId, onPick, width = 158 }) {
  const st = getState();
  const s = appState(st, appId);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(open, () => setOpen(false), [ref]);
  const fl = useFloating(open, ref, { width: 158, minSpace: 140 });
  const name = appMeta(appId).name;
  const opts = [
    { v: 'Approved' },
    { v: 'Under review' },
    { v: 'Not approved', hint: c('aisec.state.notApprovedHint') },
  ];
  return html`<div class="select" ref=${ref} style=${`width:${width}px`} onClick=${e => e.stopPropagation()}>
    <button type="button" class="select-field st-field" aria-haspopup="listbox" aria-expanded=${String(open)} aria-label=${`State of ${name}: ${s}`} onClick=${() => setOpen(!open)}>
      <span class="sv"><${StateDot} s=${s} /></span>
      <span style=${open ? 'transform:rotate(180deg);display:inline-flex' : 'display:inline-flex'}><${Icon} name="chevron-down-16" color="var(--icon-icon_strong)" /></span>
    </button>
    ${open && html`<div class="select-menu" role="listbox" style=${fl}>
      ${opts.map(o => html`<button type="button" role="option" class=${'select-opt st-opt' + (o.v === s ? ' is-active' : '')} aria-selected=${String(o.v === s)}
        disabled=${o.disabled} title=${o.disabled ? o.tip : ''} onClick=${() => { setOpen(false); onPick(o.v); }}>
        <span><${StateDot} s=${o.v} />${o.hint && html`<span class="st-hint">${o.hint}</span>`}</span></button>`)}
    </div>`}
  </div>`;
}

/** Manage approval (A:22068:64413). Every state change opens it (Yael, 2026-11-24), for the state the user picked (`target`).
 *  Rows = the Applications policies the site's groups use. Checked Local rows get `target` on Save; unchecked rows keep their approval.
 *  Rows already in `target` are checked and disabled ("Already …"); inherited rows are disabled with "Inherited from “{msp}” Site Manager".
 *  No policy in use (out of the box): an empty state with "New policy", because there is nothing to change. */
function ManageModal({ appId, target, onClose }) {
  const st = getState();
  const meta = appMeta(appId);
  const used = usedPolicies(st);
  const editable = used.filter(p => p.type === 'Local' && policyState(st, p, appId) !== target);
  const [sel, setSel] = useState(editable.map(p => p.id));
  const save = () => { applyApproval(appId, sel, target); onClose(); };
  // No Applications policy yet: the approval can't change, so send the user to the Applications empty state (Yael, 2026-11-25).
  if (!used.length) return html`<${Confirm} kind="info" title=${c('aisec.noPolicy.title')} cancel="Cancel" confirm=${c('aisec.noPolicy.action')}
    onCancel=${onClose} onConfirm=${() => { onClose(); go('/ai/policies'); }}>
    <p>${c('aisec.noPolicy.body', { app: meta.name })}</p>
  <//>`;
  return html`<${Modal} title=${c('aisec.manage.title')} width=${654} onClose=${onClose} bodyStyle="padding:32px 48px 16px 48px;max-height:460px;overflow:auto"
    footer=${html`<div class="right"><button class="btn btn-secondary" onClick=${onClose}>Cancel</button>
      <button class="btn btn-primary" disabled=${!sel.length} onClick=${save}>Save</button></div>`}>
    <p class="ma-body">${c('aisec.manage.body.' + target, { app: meta.name })}</p>
    <div class="ma-app"><${Wrapped} app=${meta} /><span>${meta.name}</span></div>
    <div class="ma-list">${used.map(p => {
      const inherited = p.type !== 'Local';
      const already = policyState(st, p, appId) === target;
      const off = inherited || already;
      const on = off ? already : sel.includes(p.id);
      const sub = inherited ? c('aisec.drawer.inherited', { msp: msp.name }) : already ? c('aisec.manage.already', { state: target }) : null;
      return html`<label class=${'ma-row' + (off ? ' is-locked' : '')} aria-disabled=${String(off)}
        onClick=${e => { e.preventDefault(); if (!off) setSel(on ? sel.filter(x => x !== p.id) : [...sel, p.id]); }}>
        <${Checkbox} on=${on} label=${p.name} /><span class="ma-txt"><span>${p.name}</span>${sub && html`<span class="ma-sub">${sub}</span>`}</span>
        <span class="ma-cur"><${ApprovalDot} v=${policyState(st, p, appId)} small /></span></label>`;
    })}</div>
  <//>`;
}

function KpiTiles({ k, onInsight }) {
  const tile = (icon, label, value, sub) => html`<div class="kpi">
    <div class="kpi-head"><span class="kpi-ic"><${Icon} name=${icon} color="var(--icon-icon_default)" /></span><span class="kpi-label">${label}</span></div>
    <div class="kpi-val">${value}</div>${sub}</div>`;
  return html`<div class="kpis">
    ${tile('user-16', 'Users using AI', k.users, html`<div class="kpi-sub">on ${k.endpoints} endpoints</div>`)}
    ${tile('browser-16', 'GenAI services', k.services, null)}
    ${tile('app-16', 'AI apps', k.apps, k.pending > 0 && html`<div class="kpi-sub" style="color:var(--text-text_warning)">${k.pending} Under review</div>`)}
    <div class="kpi"><div class="kpi-head"><span class="kpi-ic"><${Icon} name="groups-16" color="var(--icon-icon_default)" /></span><span class="kpi-label">Enforcement</span></div>
      ${getState().aiPolicies.length === 0 ? html`<div class="kpi-enf-empty">${c('aisec.kpi.enf.empty')} <button class="lnk" onClick=${() => go('/ai/policies?state=wizard')}>${c('aisec.manage.empty.action')}</button></div>`
      : html`<div class="kpi-enf"><span><${Img} name="status-block-16" />Block <b>${k.block}</b> <i>Groups</i></span><span><${Img} name="status-warning-16" />Track <b>${k.track}</b> <i>Groups</i></span></div>`}</div>
    <div class="kpi kpi-insights"><div class="kpi-label">Insights</div>
      <div class="ins"><${Icon} name="app-16" /><b>${k.notApprovedApps}</b> not approved ${k.notApprovedApps === 1 ? 'agent' : 'agents'} (${k.apps} total) <button class="lnk" onClick=${() => onInsight('apps')}>Manage apps</button></div>
      <div class="ins"><${Icon} name="browser-16" /><b>${k.notApprovedServices}</b> not approved GenAI ${k.notApprovedServices === 1 ? 'service' : 'services'} (${k.services} total) <button class="lnk" onClick=${() => onInsight('services')}>Manage GenAI services</button></div>
      <div class="ins"><${Icon} name="app-16" /><b>${appMeta(k.topApp.appId).name}</b> is top app (${k.topAppPct}% Endpoints) <button class="lnk" onClick=${() => onInsight('top-app')}>View details</button></div>
      <div class="ins"><${Icon} name="browser-16" /><b>${appMeta(k.topService.appId).name}</b> is top GenAI service (${k.topServicePct}% Endpoints) <button class="lnk" onClick=${() => onInsight('top-service')}>View details</button></div>
    </div>
  </div>`;
}

function GroupsCell({ groups }) {
  if (!groups.some(g => g.verdict)) return html`<span class="t-caption-small muted"><i>No groups</i></span>`;
  const line = v => { const gs = groups.filter(g => g.verdict === v); if (!gs.length) return null;
    return html`<div class="gc-line"><span class="gc-v">${v} (${gs.length})</span><span class="tag tag-grey gc-tag">${gs[0].name}</span>${gs.length > 1 && html`<span class="gc-more">+${gs.length - 1}</span>`}</div>`; };
  return html`<div class="gcell">${line('Block')}${line('Track')}</div>`;
}

function Related({ ids, max = 2 }) {
  const shown = ids.slice(0, max), more = ids.length - shown.length;
  return html`<div style="display:flex;align-items:center;gap:4px">${shown.map(id => html`<${Wrapped} app=${AI_BY_ID[id] || appMeta(id)} />`)}${more > 0 && html`<span class="gc-more">+${more}</span>`}</div>`;
}

const COLS = kind => [
  { id: 'name', label: 'Name', style: 'flex:1 1 0;min-width:160px', fixed: true },
  { id: 'category', label: 'Category', style: 'width:104px;flex:none' },
  { id: 'related', label: kind === 'app' ? 'GenAI services' : 'Used by apps', style: 'width:96px;flex:none' },
  { id: 'domains', label: 'Domains', style: 'width:72px;flex:none' },
  { id: 'groups', label: 'Groups', style: 'width:170px;flex:none' },
  { id: 'hosts', label: 'Hosts', style: 'width:60px;flex:none' },
  { id: 'users', label: 'Users', style: 'width:60px;flex:none' },
  { id: 'usage', label: 'Usage', style: 'width:84px;flex:none' },
  { id: 'lastSeen', label: 'Last seen', style: 'width:96px;flex:none' },
  { id: 'state', label: 'State', style: 'width:170px;flex:none', fixed: true },
];

function Inventory({ init, kind, setKind, onPick, openDrawer, drawerId, presetFilter }) {
  const st = getState();
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState(presetFilter || {});
  const [filterOpen, setFilterOpen] = useState(false);
  const [hidden, setHidden] = useState([]);
  const [sort, setSort] = useState({ col: 'lastSeen', dir: 'desc' });
  const fRef = useRef(null);
  useDismiss(filterOpen, () => setFilterOpen(false), [fRef]);
  const list = items.filter(i => i.kind === kind);
  const cats = [
    { id: 'state', label: 'State', search: false, options: ['Approved', 'Under review', 'Not approved', 'Mixed'].map(v => ({ value: v, label: v })) },
    { id: 'category', label: 'Category', search: false, options: [...new Set(list.map(i => appMeta(i.appId).category))].map(v => ({ value: v, label: v })) },
    { id: 'usage', label: 'Usage', search: false, options: ['High', 'Medium', 'Low'].map(v => ({ value: v, label: v })) },
    { id: 'group', label: 'Groups', placeholder: 'Search groups', options: st.groups.map(g => ({ value: g.id, label: g.name })) },
  ];
  const nFilters = Object.values(applied).reduce((s, v) => s + v.length, 0);
  let rows = list.filter(i => {
    const m = appMeta(i.appId);
    if (q.trim() && !m.name.toLowerCase().includes(q.trim().toLowerCase())) return false;
    if ((applied.state || []).length && !applied.state.includes(appState(st, i.appId))) return false;
    if ((applied.category || []).length && !applied.category.includes(m.category)) return false;
    if ((applied.usage || []).length && !applied.usage.includes(i.usage)) return false;
    if ((applied.group || []).length && !itemGroups(st, i).some(g => applied.group.includes(g.id))) return false;
    return true;
  });
  const key = { name: i => appMeta(i.appId).name, category: i => appMeta(i.appId).category, related: i => i.related.length, domains: i => i.domains, groups: i => itemGroups(st, i).length,
    hosts: i => i.hostIds.length, users: i => i.userIds.length, usage: i => ({ High: 3, Medium: 2, Low: 1 })[i.usage], lastSeen: i => i.lastSeen, state: i => appState(st, i.appId) }[sort.col];
  rows = rows.slice().sort((a, b) => ((key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0) * (sort.dir === 'asc' ? 1 : -1)) || b.userIds.length - a.userIds.length);
  const cols = COLS(kind).filter(x => !hidden.includes(x.id));
  const nApps = items.filter(i => i.kind === 'app').length, nSvc = items.filter(i => i.kind === 'service').length;

  return html`
    <div class="toolbar"><div class="toolbar-row">
      <div class="seg" role="tablist">
        <button role="tab" aria-selected=${String(kind === 'app')} class=${kind === 'app' ? 'is-on' : ''} onClick=${() => setKind('app')}>AI apps (${nApps})</button>
        <button role="tab" aria-selected=${String(kind === 'service')} class=${kind === 'service' ? 'is-on' : ''} onClick=${() => setKind('service')}>GenAI services (${nSvc})</button>
      </div>
      <div style="position:relative" ref=${fRef}>
        <button class=${'filter-btn' + (nFilters ? ' is-active' : '')} aria-label="Filters" aria-expanded=${String(filterOpen)} onClick=${() => setFilterOpen(!filterOpen)}>
          <${Icon} name="filter-16" color="var(--icon-icon_strong)" />${nFilters > 0 && html`<span class="badge">${nFilters}</span>`}</button>
        ${filterOpen && html`<${FilterPanel} cats=${cats} applied=${applied} onApply=${setApplied} onClose=${() => setFilterOpen(false)} style="left:0;top:48px" />`}
      </div>
      <span class="v-divider"></span>
      <${SearchField} value=${q} onInput=${setQ} placeholder=${kind === 'app' ? 'Search AI apps' : 'Search GenAI services'} width=${340} />
    </div><div class="helper-ph"></div></div>
    <div class="actions-bar" style="justify-content:flex-start">
      <${CustomizeColumns} cols=${COLS(kind)} hidden=${hidden} setHidden=${setHidden} />
      <div style="flex:1 1 0;min-width:0;display:flex;justify-content:flex-end"><${Chips} cats=${cats} applied=${applied} onChange=${setApplied} /></div>
      <span data-tip=${c('aisec.export.tip')} data-tip-pos="left"><button class="btn btn-secondary btn-sq" aria-label="Export" disabled><${Icon} name="export-16" color="var(--icon-icon_strong)" /></button></span>
    </div>
    <div class="tbl" role="table" aria-label=${kind === 'app' ? 'AI apps' : 'GenAI services'}>
      <div class="tbl-head" role="row"><span class="th th-first"></span>
        ${cols.map(col => html`<button role="columnheader" class=${'th is-sortable' + (sort.col === col.id ? ' is-sorted' : '')} style=${col.style}
          aria-sort=${sort.col === col.id ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
          onClick=${() => setSort(s => ({ col: col.id, dir: s.col === col.id && s.dir === 'desc' ? 'asc' : 'desc' }))}>
          <span class="lbl">${col.label}</span><span class="sort-ic" style=${sort.col === col.id && sort.dir === 'asc' ? 'transform:rotate(180deg)' : ''}>
            <${Icon} name=${sort.col === col.id ? 'sort-16' : 'chevron-down-16'} color="var(--icon-icon_strong)" /></span></button>`)}
        <span class="th" style="width:40px;flex:none"></span></div>
      <div class="tbl-rows">
        ${rows.length === 0 && html`<${NoResults} />`}
        ${rows.map(i => { const m = appMeta(i.appId); const gs = itemGroups(st, i); return html`<div role="row" tabindex="0" class=${'tr' + (drawerId === i.appId ? ' is-active' : '')}
          onClick=${() => openDrawer(i.appId)} onKeyDown=${e => e.key === 'Enter' && e.target === e.currentTarget && openDrawer(i.appId)}>
          <span class="td td-first"></span>
          ${cols.map(col => html`<div class="td" role="cell" style=${col.style + (col.id === 'name' ? ';flex-direction:row;align-items:center;justify-content:flex-start;gap:8px' : '')}>
            ${col.id === 'name' && html`<${Wrapped} app=${m} big /><span class="main">${m.name}</span>`}
            ${col.id === 'category' && html`<span class="tag tag-grey" style="max-width:100%;overflow:hidden;text-overflow:ellipsis">${m.category}</span>`}
            ${col.id === 'related' && html`<${Related} ids=${i.related} />`}
            ${col.id === 'domains' && html`<div><${Counter} n=${i.domains} /></div>`}
            ${col.id === 'groups' && html`<${GroupsCell} groups=${gs} />`}
            ${col.id === 'hosts' && html`<div><${Counter} n=${i.hostIds.length} /></div>`}
            ${col.id === 'users' && html`<div><${Counter} n=${i.userIds.length} /></div>`}
            ${col.id === 'usage' && html`<span class="usage" style=${`color:${USAGE[i.usage][1]}`}><${Icon} name=${USAGE[i.usage][0]} color=${USAGE[i.usage][1]} />${i.usage}</span>`}
            ${col.id === 'lastSeen' && html`<${DateTime} iso=${i.lastSeen} vertical />`}
            ${col.id === 'state' && html`<${StateSelect} appId=${i.appId} onPick=${v => onPick(i.appId, v)} />`}
          </div>`)}
          <div class="td td-actions" style="width:40px;flex:none;padding-right:8px"><${Icon} name="chevron-right-16" color="var(--icon-icon_strong)" /></div>
        </div>`; })}
      </div>
      <${TableFooter} from=${rows.length ? 1 : 0} to=${rows.length} total=${rows.length} synced="2025-09-30T12:35:12Z" onRefresh=${() => {}} />
    </div>`;
}

function Tabs({ tabs, active, onChange, size }) {
  return html`<div class=${'tab-group' + (size === 'sm' ? ' tab-sm' : '')} role="tablist">${tabs.map(([id, label, n]) => html`<button role="tab" aria-selected=${String(active === id)}
    class=${'tab' + (active === id ? ' is-active' : '')} onClick=${() => onChange(id)}>${label}${n !== undefined && html` <${Counter} n=${n} />`}</button>`)}</div>`;
}

function ConnectionsList({ domains, item }) {
  return html`<div class="ld-list">${domains.map((d, k) => html`<div class="ld-item">
    <span class="wrapped"><${Icon} name="domain-16" /></span>
    <div class="ld-det"><div class="d">${d}</div><div class="s">Last seen <${DateTime} iso=${item.lastSeen} /></div><div class="s">203.0.113.${20 + k * 7}:443</div></div></div>`)}</div>`;
}

function DetailsPanel({ st, item }) {
  const [q, setQ] = useState('');
  // The policy of the first group that uses the item; groups can have no Applications policy (no default policy).
  const g = itemGroups(st, item).find(x => x.policyId);
  const pol = g ? st.aiPolicies.find(p => p.id === g.policyId) : null;
  const mcp = item.mcp.filter(m => m.includes(q.toLowerCase()));
  return html`<div class="det">
    <div class="det-lv"><span class="lv-label">Daily use</span><span class="usage" style=${`color:${USAGE[item.usage][1]}`}><${Icon} name=${USAGE[item.usage][0]} color=${USAGE[item.usage][1]} />${item.usage}</span></div>
    <div class="det-lv"><span class="lv-label">Policy</span><span>${pol ? pol.name : c('groups.emptyPolicy')}</span>${pol && html`<${StateDot} s=${policyState(st, pol, item.appId)} caps />`}</div>
    <div class="det-lv"><span class="lv-label">Publisher</span><span>${item.publisher}</span></div>
    <div class="det-lv"><span class="lv-label">Version</span><span>${item.version}</span></div>
    ${item.mcp.length > 0 && html`<label class="field"><${Icon} name="search-16" /><input type="search" placeholder="Search details" aria-label="Search details" value=${q} onInput=${e => setQ(e.target.value)} /></label>
      <div class="ld-list-t"><span class="t-capital-title" style="color:var(--text-text_secondary)">MCP</span><${Counter} n=${mcp.length} /></div>
      ${mcp.map(m => html`<div class="ld-item"><span class="wrapped"><${Icon} name="mcp-16" /></span><div class="ld-det"><div class="d">${m}</div><div class="s">Last seen <${DateTime} iso=${item.lastSeen} utc=${false} /></div></div></div>`)}`}
  </div>`;
}

function AppDrawer({ appId, onClose, onPick }) {
  const st = getState();
  const item = items.find(i => i.appId === appId);
  const m = appMeta(appId);
  const [tab, setTab] = useState('users'); // always opens on the first tab (Yael)
  const [q, setQ] = useState('');
  const gs = itemGroups(st, item);
  const used = usedPolicies(st);
  const users = item.userIds.map(userById);
  return html`<${Drawer} title="" onClose=${onClose} blanket=${false}
    footer=${html`<span class="right" data-tip=${c('aisec.forensics.tip')} data-tip-pos="left"><button class="btn btn-secondary" disabled><${Icon} name="forensic-16" color="var(--icon-icon_strong)" />Forensics</button></span>`}>
    <div class="ad-head">
      <div class="ad-title"><${Wrapped} app=${m} big /><h2>${m.name}</h2><span class="tag tag-sm ad-cat">${m.category}</span>
        <div style="margin-left:auto"><${StateSelect} appId=${appId} onPick=${v => onPick(appId, v)} width=${158} /></div></div>
      <div class="ld-line"><span class="lv-label">Groups</span>${gs.slice(0, 3).map(g => html`<span class="tag tag-grey">${g.name}</span>`)}${gs.length > 3 && html`<span class="gc-more">+${gs.length - 3}</span>`}</div>
      <div class="ld-line"><span class="lv-label">First seen</span><${DateTime} iso=${item.firstSeen} /><span class="lv-label" style="margin-left:16px">Last seen</span><${DateTime} iso=${item.lastSeen} /></div>
    </div>
    <${Tabs} active=${tab} onChange=${setTab} tabs=${[['users', 'Users & Hosts', users.length], ['connections', 'Connections', item.domainList.length], ['details', 'Details'], ['policies', 'Policies', used.length]]} />
    <div class="ad-body">
      ${tab === 'policies' && html`<label class="field"><${Icon} name="search-16" /><input type="search" placeholder="Search policies" aria-label="Search policies" value=${q} onInput=${e => setQ(e.target.value)} /></label>
        ${used.filter(p => p.name.toLowerCase().includes(q.toLowerCase())).map(p => html`<div class="ad-pol">
          <div class="ad-pol-main"><span class="ad-pol-name">${p.name}</span>
            ${p.type === 'Inherited' && html`<span class="ad-pol-sub">${c('aisec.drawer.inherited', { msp: msp.name })}</span>`}
            <span class="ad-pol-date" data-tip="Last modified policy"><${DateTime} iso=${p.modified} /></span></div>
          <span data-tip=${p.type === 'Inherited' ? c('tip.inherited.edit', { msp: msp.name }) : null} data-tip-pos="left">
            <${ApprovalSelect} compact colorValue width=${136} label=${'Approval in ' + p.name} value=${policyState(st, p, appId)}
              disabled=${p.type === 'Inherited'} onChange=${v => setPolicyState(appId, p.id, v)} /></span></div>`)}`}
      ${tab === 'users' && users.map(u => html`<div class="ad-user"><span class="avatar">${u.name.split(' ').map(x => x[0]).join('')}</span>
        <div><div class="d">${u.name}</div><div class="s">${u.hostIds.join(', ')}</div></div><span style="margin-left:auto"><${DateTime} iso=${u.lastSeen} /></span></div>`)}
      ${tab === 'connections' && html`<${ConnectionsList} domains=${item.domainList} item=${item} />`}
      ${tab === 'details' && html`<${DetailsPanel} st=${st} item=${item} />`}
    </div>
  <//>`;
}

function UserDrawer({ userId, onClose }) {
  const st = getState();
  const u = userById(userId);
  const used = items.filter(i => i.userIds.includes(userId));
  const [sel, setSel] = useState(used[0] && used[0].appId);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('connections'); // always opens on the first tab (Yael)
  const groups = [...new Set(u.hostIds.map(h => allHosts.find(x => x.id === h).groupId))].map(id => st.groups.find(g => g.id === id));
  const item = used.find(i => i.appId === sel);
  return html`<div class="blanket" onClick=${onClose}></div>
  <aside class="drawer ud" role="dialog" aria-modal="true" aria-label=${u.name}>
    <div class="drawer-head" style="justify-content:flex-end"><button class="close" aria-label="Close" onClick=${onClose}><${Icon} name="close-16" color="var(--icon-icon_strong)" /></button></div>
    <div class="drawer-scroll">
      <div class="ud-head"><div class="ad-title"><span class="avatar avatar-lg">${u.name.split(' ').map(x => x[0]).join('')}</span><h2>${u.name}</h2></div>
        <div class="ld-line"><span class="lv-label">Hosts</span>${u.hostIds.map(h => html`<span class="tag tag-grey">${h}</span>`)}
          <span class="lv-label" style="margin-left:16px">Groups</span>${groups.map(g => html`<span class="tag ud-grp">${g.name}</span>`)}</div>
        <div class="ld-line"><span class="lv-label">First seen</span><${DateTime} iso=${u.firstSeen} /><span class="lv-label" style="margin-left:16px">Last seen</span><${DateTime} iso=${u.lastSeen} /></div></div>
      <div class="tab-group" style="padding:0 24px"><span class="tab is-active">AI apps</span></div>
      <div class="ud-body">
        <div class="ud-left"><label class="field"><${Icon} name="search-16" /><input type="search" placeholder="Search AI apps" aria-label="Search AI apps" value=${q} onInput=${e => setQ(e.target.value)} /></label>
          <div class="ud-list">${used.filter(i => appMeta(i.appId).name.toLowerCase().includes(q.toLowerCase())).map(i => html`<button class=${'ud-app' + (i.appId === sel ? ' is-on' : '')} onClick=${() => setSel(i.appId)}>
            <${Wrapped} app=${appMeta(i.appId)} /><div><div class="n">${appMeta(i.appId).name}</div><div class="s">Last seen <${DateTime} iso=${u.lastSeen} utc=${false} /> · <span class="tag tag-grey">${i.domainList[0]}</span></div></div>
            <${Icon} name="chevron-right-16" color="var(--icon-icon_strong)" /></button>`)}</div></div>
        <div class="ud-right">${item && html`<${Tabs} active=${tab} onChange=${setTab} tabs=${[['connections', 'Connections', item.domainList.length], ['details', 'Details']]} />
          <div style="padding:16px">${tab === 'details' ? html`<${DetailsPanel} st=${st} item=${item} />` : html`<${ConnectionsList} domains=${item.domainList} item=${item} />`}</div>`}</div>
      </div>
    </div>
    <div class="drawer-foot"><span class="right" data-tip=${c('aisec.forensics.tip')} data-tip-pos="left"><button class="btn btn-secondary" disabled><${Icon} name="forensic-16" color="var(--icon-icon_strong)" />Forensics</button></span></div>
  </aside>`;
}

function UsersHosts({ init }) {
  const st = getState();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(init.user || null);
  const rows = aiUsers.filter(u => !q.trim() || [u.name, u.email, ...u.hostIds].some(s => s.toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : -1));
  const appsOf = u => items.filter(i => i.userIds.includes(u.id));
  return html`
    <div class="toolbar"><div class="toolbar-row"><${SearchField} value=${q} onInput=${setQ} placeholder="Search users or hosts" /></div><div class="helper-ph"></div></div>
    <div class="tbl" role="table" aria-label="Users and hosts">
      <div class="tbl-head" role="row"><span class="th th-first"></span>
        ${[['User', 'flex:1 1 0;min-width:220px'], ['Hosts', 'width:260px;flex:none'], ['Groups', 'width:220px;flex:none'], ['AI apps', 'width:180px;flex:none'], ['Last seen', 'width:120px;flex:none']]
          .map(([l, s]) => html`<span role="columnheader" class="th" style=${s}><span class="lbl">${l}</span></span>`)}
        <span class="th" style="width:40px;flex:none"></span></div>
      <div class="tbl-rows">
        ${rows.length === 0 && html`<${NoResults} />`}
        ${rows.map(u => { const gs = [...new Set(u.hostIds.map(h => allHosts.find(x => x.id === h).groupId))].map(id => st.groups.find(g => g.id === id)); const ap = appsOf(u);
          return html`<div role="row" tabindex="0" class=${'tr' + (open === u.id ? ' is-active' : '')} onClick=${() => setOpen(u.id)} onKeyDown=${e => e.key === 'Enter' && setOpen(u.id)}>
          <span class="td td-first"></span>
          <div class="td" style="flex:1 1 0;min-width:220px;flex-direction:row;align-items:center;justify-content:flex-start;gap:8px"><span class="avatar">${u.name.split(' ').map(x => x[0]).join('')}</span>
            <div style="min-width:0"><div class="main">${u.name}</div><div class="sub">${u.email}</div></div></div>
          <div class="td" style="width:260px;flex:none;flex-direction:row;align-items:center;justify-content:flex-start;gap:4px">${u.hostIds.map(h => html`<span class="tag tag-grey">${h}</span>`)}</div>
          <div class="td" style="width:220px;flex:none"><span class="main">${gs.map(g => g.name).join(', ')}</span></div>
          <div class="td" style="width:180px;flex:none"><${Related} ids=${ap.map(i => i.appId)} max=${4} /></div>
          <div class="td" style="width:120px;flex:none"><${DateTime} iso=${u.lastSeen} vertical /></div>
          <div class="td td-actions" style="width:40px;flex:none;padding-right:8px"><${Icon} name="chevron-right-16" color="var(--icon-icon_strong)" /></div>
        </div>`; })}
      </div>
      <${TableFooter} from=${rows.length ? 1 : 0} to=${rows.length} total=${rows.length} synced="2025-09-30T12:35:12Z" onRefresh=${() => {}} />
    </div>
    ${open && html`<${UserDrawer} key=${open} userId=${open} onClose=${() => setOpen(null)} />`}`;
}

export function AiSecurity({ path, query }) {
  const st = getState();
  const init = useMemo(() => initialUi(query.state), [query.state]);
  const tab = path.endsWith('users-hosts') ? 'users' : 'inventory';
  const [days, setDays] = useState(30);
  const [kind, setKind] = useState('app');
  const [drawer, setDrawer] = useState(init.drawer || null);
  const [manage, setManage] = useState(init.manage || null); // {appId, target}
  const [preset, setPreset] = useState({ key: 0, f: null });
  const k = kpis(st, days);
  const onPick = (appId, v) => {
    setManage({ appId, target: v }); // every state change opens Manage approval (Yael, 2026-11-24)
  };
  const onInsight = what => {
    if (what === 'apps' || what === 'services') { setKind(what === 'apps' ? 'app' : 'service'); setPreset({ key: preset.key + 1, f: { state: ['Not approved', 'Mixed'] } }); go('/ai-security/inventory'); }
    if (what === 'top-app') setDrawer(k.topApp.appId);
    if (what === 'top-service') setDrawer(k.topService.appId);
  };
  const empty = query.state === 'empty';
  const [eTitle, eBody] = c(tab === 'users' ? 'aisec.empty.users' : 'aisec.empty.inventory');
  return html`
    <div class="range-tabs" role="tablist">${RANGES.map(([d, l]) => html`<button role="tab" aria-selected=${String(days === d)} class=${days === d ? 'is-on' : ''} onClick=${() => setDays(d)}>${l}</button>`)}</div>
    <${KpiTiles} k=${k} onInsight=${onInsight} />
    <${Tabs} active=${tab} onChange=${id => go(id === 'users' ? '/ai-security/users-hosts' : '/ai-security/inventory')} tabs=${[['inventory', 'AI Inventory'], ['users', 'Users & Hosts']]} />
    ${empty ? html`<${EmptyState} title=${eTitle} body=${eBody} />`
      : tab === 'users' ? html`<${UsersHosts} init=${init} />`
      : html`<${Inventory} key=${kind + preset.key} init=${init} kind=${kind} setKind=${setKind} onPick=${onPick} openDrawer=${setDrawer} drawerId=${drawer} presetFilter=${preset.f} />`}
    ${drawer && html`<${AppDrawer} key=${drawer} appId=${drawer} onClose=${() => setDrawer(null)} onPick=${onPick} />`}
    ${manage && html`<${ManageModal} key=${manage.appId + manage.target} appId=${manage.appId} target=${manage.target} onClose=${() => setManage(null)} />`}`;
}
