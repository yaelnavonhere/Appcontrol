// Logs tab for both modules (R:20150:28461, A:20204:154782), filters, date picker (R:20774:93615),
// event drawer (R:20178:144861 Execution details, A:20204:154784 Connections).
import { html, useState, useRef, useMemo } from '../../lib.js';
import { getState } from '../../store.js';
import { go } from '../../router.js';
import { NOW, users } from '../../data/seed.js';
import { generateLogs } from '../../data/derive.js';
import { appById, catalog, policies } from '../../data/policy.js';
import { c } from '../../data/copy.js';
import { useFloating, Icon, Img, Wrapped, DateTime, Counter, TypeTag, Verdict, FilterPanel, Chips, SearchField, TableFooter, EmptyState, NoResults, Drawer, Checkbox, useDismiss, fmtDate } from '../../components/ui.js';

const PAGE = 11;
const DAY = 86400000;
const COLS = [
  { id: 'time', label: 'Date', grow: 116, fixed: true },
  { id: 'app', label: 'App', grow: 209 },
  { id: 'action', label: 'Action', grow: 119 },
  { id: 'user', label: 'User', grow: 209 },
  { id: 'host', label: 'Host', grow: 210 },
  { id: 'group', label: 'Group', grow: 180, hidden: true },
  { id: 'policy', label: 'Policy', grow: 209 },
];
const PRESETS = [['all', 'All time'], ['today', 'Today'], ['3d', 'Last 3 days'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['quarter', 'Last quarter'], ['range', 'Date range']];
const presetFrom = { today: 1, '3d': 3, '7d': 7, '30d': 30, quarter: 91 };

// Execution facts per app: the domain it talks to and the process that ran.
const EXEC = {
  'datto-rmm': ['concord.centrastage.net', 'AEMAgent.exe'], anydesk: ['relay-7f2a.net.anydesk.com', 'AnyDesk.exe'],
  screenconnect: ['instance-k4m2pq-relay.screenconnect.com', 'ScreenConnect.ClientService.exe'], teamviewer: ['router14.teamviewer.com', 'TeamViewer_Service.exe'],
  ninjaone: ['app.ninjarmm.com', 'NinjaRMMAgent.exe'], atera: ['agent.atera.com', 'AteraAgent.exe'], 'n-central': ['ncod.n-able.com', 'agent.exe'],
  splashtop: ['st2-relay.splashtop.com', 'SRService.exe'], 'kaseya-vsa': ['vsa.kaseya.net', 'AgentMon.exe'],
  // Applications: the AI service each app connects to
  'claude-desktop': ['claude.ai', 'Claude.exe'], claude: ['claude.ai', 'Claude.exe'], 'claude-code': ['api.anthropic.com', 'claude.exe'],
  chatgpt: ['chat.openai.com', 'ChatGPT.exe'], codex: ['api.openai.com', 'codex.exe'], 'canva-ai': ['www.canva.com', 'Canva.exe'],
  cursor: ['api2.cursor.sh', 'Cursor.exe'], perplexity: ['api.perplexity.ai', 'Perplexity.exe'], 'google-gemini': ['gemini.google.com', 'msedge.exe'],
};
const AI_SUBS = { 'claude.ai': ['api.anthropic.com', 'console.anthropic.com', 'statsig.anthropic.com', 'docs.anthropic.com'] };
function execRows(ev) {
  const [dom, proc] = EXEC[ev.appId] || ['relay.example.net', 'agent.exe'];
  const n = 2 + (parseInt(ev.id.split('-')[1], 10) % 4);
  const base = Date.parse(ev.time);
  const subs = ['', 'api.', 'update.', 'files.', 'telemetry.'];
  const extra = AI_SUBS[dom];
  return Array.from({ length: n }, (_, i) => ({
    domain: i === 0 ? dom : extra ? extra[i - 1] : subs[i] + dom.split('.').slice(-2).join('.'),
    time: new Date(base + i * 7000).toISOString(), proc, ip: `${ev.ip}:${i === 0 ? ev.port : 443}`,
    size: `${(2.1 + ((i * 37 + n * 11) % 140) / 10).toFixed(1)} MB`,
  }));
}

const why = (mod, ev, p, g) => {
  if (!p.id) return c('why.deletedPolicy', { action: ev.action });
  const k = ev.action === 'Under review' ? 'why.underReview' : 'why.' + ev.action.toLowerCase();
  return c(k, { app: appById(mod, ev.appId).name, policy: p.name, group: g.name });
};

function LogDrawer({ mod, ev, onClose }) {
  const st = getState();
  const p = policies(mod).find(x => x.id === ev.policyId) || { name: c('policy.deleted'), type: 'Local' };
  const g = st.groups.find(x => x.id === ev.groupId);
  const app = appById(mod, ev.appId);
  const rows = execRows(ev);
  const dot = html`<span class="ld-dot">·</span>`;
  return html`<${Drawer} title="Event details" onClose=${onClose} blanket=${false}>
    <div class="ld-head">
      <div class="ld-app"><${Wrapped} app=${app} big /><div><div class="ld-name">${app.name}</div><div class="ld-by">by ${app.vendor}</div></div>
        <${Icon} name="arrow-right-16" color="var(--icon-icon_strong)" /><${Verdict} v=${ev.action} lead /></div>
      <div class="ld-line">
        <span class="lv-label">Policy</span>
        <button class=${`tag tag-${p.type.toLowerCase()} ld-link`} title=${c('ld-link')} onClick=${() => p.id && go(`${mod.base}/policies?state=drawer:${p.id}`)}>
          ${p.type !== 'Local' && html`<${Icon} name="lock-16" color="currentColor" />`}${p.name}</button>
        ${dot}<span class="lv-label">Group</span><span class="tag tag-grey">${g.name}</span>
      </div>
      <div class="ld-line">
        <span class="lv-label">Host</span><span class="tag tag-grey">${ev.hostId}</span>${dot}
        <span class="lv-label">User</span><span class="ld-user"><${Icon} name="user-16" />${ev.user}</span>${dot}<${DateTime} iso=${ev.time} />
      </div>
    </div>
    <div class="ld-body">
      <div class="why"><div class="t">Why this happened</div><div class="b">${why(mod, ev, p, g)}</div></div>
      <div class="ld-list">
        <div class="ld-list-t"><span class="t-capital-title" style="color:var(--text-text_secondary)">${mod.logListTitle}</span><${Counter} n=${rows.length} /></div>
        ${rows.map(r => html`<div class="ld-item">
          <span class="wrapped"><${Icon} name="domain-16" /></span>
          <div class="ld-det"><div class="d">${r.domain}</div>
            <div class="s">${fmtDate(r.time).time} · ${r.proc}</div><div class="s">${r.ip} · ${r.size}</div></div>
          <span class="ld-st"><${Verdict} v=${ev.action} lead /></span>
        </div>`)}
      </div>
    </div>
  <//>`;
}

function DatePicker({ value, onChange, onClose }) {
  const [preset, setPreset] = useState(value.preset);
  const [month, setMonth] = useState(8); // September 2025
  const [range, setRange] = useState(value.range || []);
  const year = 2025;
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const iso = d => new Date(Date.UTC(year, month, d)).toISOString();
  const inRange = d => range.length === 2 && iso(d) >= range[0] && iso(d) <= range[1];
  const pick = d => { if (Date.parse(iso(d)) > Date.parse(NOW)) return; const v = iso(d); setPreset('range'); setRange(range.length === 1 ? [range[0], v].sort() : [v]); };
  const apply = () => { onChange({ preset, range: preset === 'range' ? (range.length === 2 ? range : [range[0], range[0]]) : null }); onClose(); };
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return html`<div class="datepicker" role="dialog" aria-label="Date picker">
    <div class="dp-presets"><div class="dp-title">Date picker</div><div class="divider-h"></div>
      <div class="dp-list">${PRESETS.map(([k, l]) => html`<button class=${'tree-item' + (preset === k ? ' is-selected' : '')} onClick=${() => { setPreset(k); if (k !== 'range') setRange([]); }}>${l}</button>`)}</div></div>
    <div class="dp-cal">
      <div class="dp-sel">${range[0] ? html`<${DateTime} iso=${range[0]} />` : html`<span class="muted t-caption02">Start</span>`} <span>-</span>
        ${range[1] ? html`<${DateTime} iso=${new Date(Date.parse(range[1]) + DAY - 1000).toISOString()} />` : html`<span class="muted t-caption02">End</span>`}</div>
      <div class="divider-h"></div>
      <div class="dp-month">
        <div class="dp-nav"><button class="icon-btn" aria-label="Previous month" onClick=${() => setMonth(Math.max(0, month - 1))}><span style="transform:rotate(90deg);display:inline-flex"><${Icon} name="chevron-down-16" /></span></button>
          <span class="dp-mb">${MONTHS[month]}</span><span class="dp-mb">${year}</span>
          <button class="icon-btn" aria-label="Next month" disabled=${month >= 8} onClick=${() => setMonth(Math.min(8, month + 1))}><span style="transform:rotate(-90deg);display:inline-flex"><${Icon} name="chevron-down-16" /></span></button></div>
        <div class="dp-grid">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => html`<span class="dp-wd">${d}</span>`)}
          ${cells.map(d => d === null ? html`<span></span>` : html`<button class=${'dp-day' + (range.includes(iso(d)) ? ' is-edge' : inRange(d) ? ' is-in' : '')}
            disabled=${Date.parse(iso(d)) > Date.parse(NOW)} onClick=${() => pick(d)}>${d}</button>`)}</div>
      </div>
      <div class="dp-foot"><button class="btn btn-secondary" onClick=${onClose}>Cancel</button><button class="btn btn-primary" disabled=${preset === 'range' && !range.length} onClick=${apply}>Apply</button></div>
    </div>
  </div>`;
}

export function CustomizeColumns({ cols, hidden, setHidden }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(open, () => setOpen(false), [ref]);
  const fl = useFloating(open, ref, { width: 240, minSpace: 160 });
  return html`<div class="select" ref=${ref} style="width:auto">
    <button class="cc-btn" aria-haspopup="true" aria-expanded=${String(open)} onClick=${() => setOpen(!open)}>Customize columns
      <span style=${open ? 'transform:rotate(180deg);display:inline-flex' : 'display:inline-flex'}><${Icon} name="chevron-down-16" color="var(--icon-icon_strong)" /></span></button>
    ${open && html`<div class="select-menu" style=${fl}>
      ${cols.map(c => html`<button class="select-opt" disabled=${c.fixed} onClick=${() => setHidden(hidden.includes(c.id) ? hidden.filter(x => x !== c.id) : [...hidden, c.id])}>
        <${Checkbox} on=${!hidden.includes(c.id)} />${c.label}</button>`)}
    </div>`}
  </div>`;
}

export function LogsTab({ mod, query }) {
  const st = getState();
  const columnDefs = mod.key === 'ai'
    ? ['time', 'app', 'action', 'group', 'user', 'host', 'policy'].map(id => ({ ...COLS.find(c => c.id === id), hidden: false, ...(id !== 'time' ? { grow: id === 'action' ? 157 : 160 } : {}) }))
    : COLS;
  const all = useMemo(() => generateLogs(mod.key, st), [st.groups, st[mod.pk]]);
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState({});
  const [filterOpen, setFilterOpen] = useState(query.state === 'logs+filter');
  const [date, setDate] = useState({ preset: 'all', range: null });
  const [dpOpen, setDpOpen] = useState(false);
  const [sort, setSort] = useState({ col: 'time', dir: 'desc' });
  const [page, setPage] = useState(0);
  const [hidden, setHidden] = useState(columnDefs.filter(c => c.hidden).map(c => c.id));
  const [open, setOpen] = useState(query.state === 'log-drawer' ? 'first' : null);
  const fRef = useRef(null), dRef = useRef(null);
  useDismiss(filterOpen, () => setFilterOpen(false), [fRef]);
  useDismiss(dpOpen, () => setDpOpen(false), [dRef]);

  const [eTitle, eBody, eAction] = c('empty.logs', {}, mod.key);
  if (query.state === 'empty' || all.length === 0) return html`<${EmptyState} title=${eTitle} body=${eBody} action=${eAction} onAction=${() => go(mod.base + '/policies')} />`;

  const pol = id => id ? (policies(mod).find(p => p.id === id) || { name: c('policy.deleted') }).name : '—';
  const grp = id => st.groups.find(g => g.id === id).name;
  const used = [...new Set(all.map(e => e.appId))];
  const cats = [
    { id: 'app', label: c('filter.cat.app', {}, mod.key), placeholder: mod.searchApps, options: catalog(mod).filter(a => used.includes(a.id)).map(a => ({ value: a.id, label: a.name })) },
    { id: 'action', label: 'Action', search: false, options: ['Allowed', 'Under review', 'Tracked', 'Blocked'].map(v => ({ value: v, label: v })) },
    { id: 'user', label: 'User', placeholder: 'Search users', options: users.map(u => ({ value: u.name, label: u.name })) },
    { id: 'host', label: 'Host', placeholder: 'Search hosts', options: [...new Set(all.map(e => e.hostId))].sort().map(h => ({ value: h, label: h })) },
    { id: 'policy', label: 'Policy name', placeholder: 'Search policy names', options: policies(mod).map(p => ({ value: p.id, label: p.name })) },
  ];
  const nFilters = Object.values(applied).reduce((s, v) => s + v.length, 0);
  const end = Date.parse(NOW);
  let rows = all.filter(e => {
    const t = Date.parse(e.time);
    if (date.preset in presetFrom && t < end - presetFrom[date.preset] * DAY) return false;
    if (date.preset === 'range' && date.range && (e.time < date.range[0] || t >= Date.parse(date.range[1]) + DAY)) return false;
    const ql = q.trim().toLowerCase();
    if (ql && ![e.user, e.hostId, appById(mod, e.appId).name, e.domain, ...(mod.key === 'ai' ? [e.action] : [])].some(s => s.toLowerCase().includes(ql))) return false;
    if ((applied.app || []).length && !applied.app.includes(e.appId)) return false;
    if ((applied.action || []).length && !applied.action.includes(e.action)) return false;
    if ((applied.user || []).length && !applied.user.includes(e.user)) return false;
    if ((applied.host || []).length && !applied.host.includes(e.hostId)) return false;
    if ((applied.policy || []).length && !applied.policy.includes(e.policyId)) return false;
    return true;
  });
  const key = { time: e => e.time, app: e => appById(mod, e.appId).name, action: e => e.action, user: e => e.user, host: e => e.hostId, group: e => grp(e.groupId), policy: e => pol(e.policyId) }[sort.col];
  rows = rows.slice().sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0) * (sort.dir === 'asc' ? 1 : -1));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const pg = Math.min(page, pages - 1);
  const view = rows.slice(pg * PAGE, pg * PAGE + PAGE);
  const cols = columnDefs.map(x => x.id === 'app' ? { ...x, label: mod.logAppCol } : x).filter(x => !hidden.includes(x.id));
  const openEv = open === 'first' ? view[0] : all.find(e => e.id === open);
  const dateLabel = date.preset === 'range' && date.range ? `${fmtDate(date.range[0]).date.slice(0, 6)} – ${fmtDate(date.range[1]).date.slice(0, 6)}` : PRESETS.find(p => p[0] === date.preset)[1];
  const reset = f => (...a) => { f(...a); setPage(0); };

  const cell = (col, e) => {
    const a = appById(mod, e.appId);
    if (col.id === 'time') return html`<${DateTime} iso=${e.time} vertical utc=${false} />`;
    if (col.id === 'app') return html`<div class="lg-app"><${Wrapped} app=${a} big /><div><div class="n">${a.name}</div><div class="v">by ${a.vendor}</div></div></div>`;
    if (col.id === 'action') return html`<${Verdict} v=${e.action} lead />`;
    if (col.id === 'user') return html`<span class="lg-ic"><${Icon} name="user-16" />${e.user}</span>`;
    if (col.id === 'host') return html`<span class="lg-ic"><${Icon} name="hosts-16" />${e.hostId}</span>`;
    if (col.id === 'group') return html`<span class="lg-ic"><${Icon} name="groups-16" />${grp(e.groupId)}</span>`;
    return html`<span class="main">${pol(e.policyId)}</span>`;
  };

  return html`
    <div class="toolbar">
      <div class="toolbar-row">
        <div style="position:relative" ref=${fRef}>
          <button class=${'filter-btn' + (nFilters ? ' is-active' : '')} aria-label="Filters" aria-expanded=${String(filterOpen)} onClick=${() => setFilterOpen(!filterOpen)}>
            <${Icon} name="filter-16" color="var(--icon-icon_strong)" />${nFilters > 0 && html`<span class="badge">${nFilters}</span>`}</button>
          ${filterOpen && html`<${FilterPanel} cats=${cats} applied=${applied} onApply=${reset(setApplied)} onClose=${() => setFilterOpen(false)} style="left:0;top:45px;height:455px" />`}
        </div>
        <div style="position:relative;margin-left:-8px" ref=${dRef}>
          <button class="date-btn" aria-haspopup="dialog" aria-expanded=${String(dpOpen)} onClick=${() => setDpOpen(!dpOpen)}>
            <${Icon} name="calendar-16" color="var(--icon-icon_strong)" /><span>${dateLabel}</span><${Icon} name="chevron-down-16" color="var(--icon-icon_strong)" /></button>
          ${dpOpen && html`<${DatePicker} value=${date} onChange=${reset(setDate)} onClose=${() => setDpOpen(false)} />`}
        </div>
        <span class="v-divider"></span>
        <${SearchField} value=${q} onInput=${reset(setQ)} placeholder=${mod.logSearch} />
      </div>
      <div class="helper-ph"></div>
    </div>
    <div class="actions-bar" style="justify-content:flex-start">
      <${CustomizeColumns} cols=${columnDefs} hidden=${hidden} setHidden=${setHidden} />
      <div style="flex:1 1 0;min-width:0;display:flex;justify-content:flex-end"><${Chips} cats=${cats} applied=${applied} onChange=${reset(setApplied)} /></div>
    </div>
    <div class="tbl" role="table" aria-label=${mod.category + ' events'}>
      <div class="tbl-head" role="row">
        <span class="th th-first"></span>
        ${cols.map(c => html`<button role="columnheader" class=${'th is-sortable' + (sort.col === c.id ? ' is-sorted' : '')} style=${c.fixed ? 'width:116px;flex:none' : `flex:${c.grow} 1 0;min-width:0`}
          aria-sort=${sort.col === c.id ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
          onClick=${() => { setSort(s => ({ col: c.id, dir: s.col === c.id && s.dir === 'desc' ? 'asc' : 'desc' })); setPage(0); }}>
          <span class="lbl">${c.label}</span><span class="sort-ic" style=${sort.col === c.id && sort.dir === 'asc' ? 'transform:rotate(180deg)' : ''}>
            <${Icon} name=${sort.col === c.id ? 'sort-16' : 'chevron-down-16'} color="var(--icon-icon_strong)" /></span></button>`)}
      </div>
      <div class="tbl-rows">
        ${view.length === 0 && html`<${NoResults} />`}
        ${view.map(e => html`<div role="row" class="tr tr-static">
          <span class="td td-first"></span>
          ${cols.map(c => html`<div class="td" role="cell" style=${c.fixed ? 'width:116px;flex:none' : `flex:${c.grow} 1 0;min-width:0`}>${cell(c, e)}</div>`)}
        </div>`)}
      </div>
      <${TableFooter} from=${rows.length ? pg * PAGE + 1 : 0} to=${Math.min(rows.length, pg * PAGE + PAGE)} total=${rows.length} synced=${NOW}
        page=${pg} pages=${pages} onPage=${setPage} onRefresh=${() => {}} />
    </div>

  `;
}
