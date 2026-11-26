// Policy drawer (R:20467:370523, A:22097:279204): policy card, then tabs Details / Assigned groups (boards 2026-11-24).
// Details: every app with its approval (Under review / Approved / Not approved), RMM's new-apps setting, End-user notification.
import { html, useState } from '../../lib.js';
import { getState } from '../../store.js';
import { Drawer, Icon, DateTime, Counter, TypeTag, CategoryTag, Verdict } from '../../components/ui.js';
import { statesFor, assign, rules, isMsp, policies, policySites } from '../../data/policy.js';
import { AppStatesList, ApprovalDot, NotifyBox } from './Approvals.js';
import { go } from '../../router.js';
import { c } from '../../data/copy.js';

export function PolicyCard({ mod, p, big, draft, usage, onDuplicate }) {
  return html`<div class=${'pol-card' + (mod.key === 'ai' ? ' pol-card-ai' : '')}>
    <div class="pc-name">
      <div class="pc-title-row"><div class=${big ? 'pc-title-lg' : 'pc-title'}>${p.name}</div>
        ${onDuplicate && html`<button class="btn-ghost-sm" onClick=${() => onDuplicate(p)}><${Icon} name="duplicate-16" />Duplicate</button>`}</div>
      <div class="pc-tags"><${TypeTag} type=${p.type} small /><${CategoryTag} label=${mod.category} /></div>
      ${p.description && html`<div class="pc-desc">${p.description}</div>`}
      ${usage && html`<div class="pc-usage">${usage}</div>`}
    </div>
    ${!draft && html`<div class="pc-meta">
      <div class="lv-label">Last modified</div>
      <div class="pc-by">by ${p.by} <${DateTime} iso=${p.modified} /></div>
    </div>`}
  </div>`;
}

function ShowMore({ more, setMore }) {
  return html`<button class="btn-text-xs" aria-expanded=${String(more)} onClick=${() => setMore(!more)}>${more ? 'Show less' : 'Show more'}
    <span style=${more ? 'transform:rotate(180deg);display:inline-flex' : 'display:inline-flex'}><${Icon} name="chevron-down-16" color="var(--buttons-btn_outline_default)" /></span></button>`;
}

export function AppsSummary({ mod, p }) {
  const states = statesFor(mod, p);
  return html`<section class="sum-box">
    <div class="sum-head"><${Icon} name="app-24" size=${24} color="var(--icon-icon_strong)" /><span>${mod.appsTitle}</span></div>
    <div class="sum-body" style="gap:8px">
      <${AppStatesList} mod=${mod} states=${states} onChange=${() => {}} mode="view" searchPh=${c('apps.searchDrawer')} />
      ${mod.newApps && html`<div class="divider-h"></div><div class="sum-row"><span>${mod.newAppsLabel}</span><${ApprovalDot} v=${p.newApps || 'Not approved'} small /></div>`}
    </div>
  </section>`;
}

export function NotifySummary({ p }) {
  return html`<section class="sum-box">
    <div class="sum-head"><${Icon} name="status-info-24" size=${24} color="var(--icon-icon_strong)" /><span>${c('notify.title')}</span></div>
    <div class="sum-body" style="justify-content:center"><${NotifyBox} value=${p.notify !== false} readOnly /></div>
  </section>`;
}

/** Details / Assigned groups tabs (drawer and wizard Summary). groups = draft rows in the wizard. container = no groups tab. */
export function PolicyTabs({ mod, p, groups, container }) {
  const st = getState();
  const [tab, setTab] = useState('details');
  const n = groups ? groups.length : assign(mod, st, p.id).groups.length;
  return html`<div class="ptabs">
    ${!container && html`<div class="tab-group ptabs-bar" role="tablist">
      <button role="tab" aria-selected=${String(tab === 'details')} class=${'tab' + (tab === 'details' ? ' is-active' : '')} onClick=${() => setTab('details')}>${c('drawer.tab.details')}</button>
      <button role="tab" aria-selected=${String(tab === 'groups')} class=${'tab' + (tab === 'groups' ? ' is-active' : '')} onClick=${() => setTab('groups')}>${c('drawer.tab.groups')} <${Counter} n=${n} /></button>
    </div>`}
    ${tab === 'details' || container ? html`<div class="ptabs-body"><${AppsSummary} mod=${mod} p=${p} /><${NotifySummary} p=${p} /></div>`
      : html`<${GroupsSummary} mod=${mod} p=${p} groups=${groups} />`}
  </div>`;
}

export function GroupsSummary({ mod, p, groups }) {
  const st = getState();
  const [q, setQ] = useState('');
  const all = groups || assign(mod, st, p.id).groups.map(g => ({ ...g, verdict: g[mod.key][1] }));
  const gs = all.filter(g => g.name.toLowerCase().includes(q.toLowerCase()));
  return html`<div class="grp-tab">
    <label class="field"><${Icon} name="search-16" /><input type="search" placeholder="Search groups" aria-label="Search groups" value=${q} onInput=${e => setQ(e.target.value)} /></label>
    ${all.length === 0 ? html`<div class="sum-none">No groups assigned</div>`
      : gs.length === 0 ? html`<div class="sum-none">${c('picker.noGroups', { q })}</div>`
      : html`<div class="grp-rows">${gs.map(g => html`<div class="grp-row"><${Icon} name="groups-16" color="var(--icon-icon_default)" />
          <span class="gr-name">${g.name}</span><span class="gr-sub">${g.endpoints} endpoints</span><${Verdict} v=${g.verdict} lead small /></div>`)}</div>`}
  </div>`;
}

/** Container drawer: the sites that use the policy, each with its groups (R:20549:226979). */
export function SitesSummary({ mod, p }) {
  const st = getState();
  const [q, setQ] = useState('');
  const [more, setMore] = useState({});
  const all = policySites(mod, st, p);
  const ql = q.trim().toLowerCase();
  const list = all.map(x => ({ ...x, groups: x.groups.filter(g => !ql || g.name.toLowerCase().includes(ql) || x.site.name.toLowerCase().includes(ql)) })).filter(x => x.groups.length);
  return html`<section class="sum-box">
    <div class="sum-head"><${Icon} name="audit-24" size=${24} color="var(--icon-icon_strong)" /><span>Assigned sites</span></div>
    <div class="sum-body" style="gap:8px">
      <div class="sum-label">Sites <${Counter} n=${all.length} /></div>
      <label class="field"><${Icon} name="search-16" /><input type="search" placeholder="Search sites or groups" aria-label="Search sites or groups" value=${q} onInput=${e => setQ(e.target.value)} /></label>
      ${all.length === 0 ? html`<div class="sum-none">${c('container.noSites.drawer')}</div>` : list.length === 0 ? html`<div class="sum-none">${c('picker.noGroups', { q })}</div>`
        : list.map(x => { const open = more[x.site.id]; const gs = open ? x.groups : x.groups.slice(0, 3); return html`<div class="site-block">
          <div class="site-title">${x.site.name} (${x.groups.length} ${x.groups.length === 1 ? 'group' : 'groups'})</div>
          ${gs.map(g => html`<div class="site-grp"><span>${g.name}</span><${Verdict} v=${g.verdict} lead small /></div>`)}
          ${x.groups.length > 3 && html`<${ShowMore} more=${open} setMore=${v => setMore({ ...more, [x.site.id]: v })} />`}
        </div>`; })}
    </div>
  </section>`;
}

export function PolicyDrawer({ mod, id, order = [], onNav, onClose, onEdit, onDuplicate, onDelete }) {
  const p = policies(mod).find(x => x.id === id);
  const msp = isMsp();
  const st = getState();
  const i = order.indexOf(id);
  const ss = msp ? policySites(mod, st, p) : [];
  const nGroups = ss.reduce((n, x) => n + x.groups.length, 0);
  const usage = msp ? (ss.length ? c('container.usage', { sites: ss.length, siteWord: ss.length === 1 ? 'site' : 'sites', groups: nGroups, groupWord: nGroups === 1 ? 'group' : 'groups' }) : c('container.usage.none')) : null;
  const headLeft = msp ? html`<button class="btn-ghost-sm" disabled=${i <= 0} onClick=${() => onNav(order[i - 1])}><${Icon} name="arrow-left-16" color="var(--icon-icon_strong)" />Previous policy</button>` : null;
  const headRight = msp ? html`<button class="btn-ghost-sm" onClick=${() => go(`${mod.base}/edit/${p.id}?scope=msp`)}><${Icon} name="export-16" color="var(--icon-icon_strong)" />Open details</button>
    <button class="btn-ghost-sm" disabled=${i < 0 || i >= order.length - 1} onClick=${() => onNav(order[i + 1])}>Next policy<${Icon} name="arrow-right-16" color="var(--icon-icon_strong)" /></button>` : null;
  const { editOff, delOff, editTip, deleteTip } = rules(p, mod);
  const footer = html`
    <span class="policy-delete-tip" data-tip=${deleteTip} tabindex=${deleteTip ? 0 : undefined} aria-label=${deleteTip || undefined}><button class="btn btn-danger-ghost" disabled=${delOff} onClick=${() => onDelete(p)}>
      <${Icon} name="delete-16" color=${delOff ? 'var(--icon-icon_disabled)' : 'var(--buttons-btn_error_default)'} />Delete policy</button></span>
    <span class="right" data-tip=${editTip} data-tip-pos="left"><button class="btn btn-outline" disabled=${editOff} onClick=${() => onEdit(p)}>
      <${Icon} name="edit-16" color=${editOff ? 'var(--buttons-btn_outline_disabled)' : 'var(--buttons-btn_outline_default)'} />Edit</button></span>`;
  return html`<${Drawer} title="Policy details" onClose=${onClose} footer=${footer} headLeft=${headLeft} headRight=${headRight}>
    <div class="dr-content">
      <${PolicyCard} mod=${mod} p=${p} big=${mod.key === 'ai'} usage=${usage} onDuplicate=${onDuplicate} />
      ${msp ? html`<${AppsSummary} mod=${mod} p=${p} /><${NotifySummary} p=${p} /><${SitesSummary} mod=${mod} p=${p} />` : html`<${PolicyTabs} key=${p.id} mod=${mod} p=${p} />`}
    </div>
  <//>`;
}
