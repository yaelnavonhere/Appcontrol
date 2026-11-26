// App shell: Layout Frame (side nav + page body), router, tabs, overlay hosts.
import { html, render, useState, useEffect, iconStyle } from './lib.js';
import { getState, subscribe, setState, dismissToast } from './store.js';
import { parseHash, navFor, go } from './router.js';
import { Sidemenu } from './components/Sidemenu.js';
import { PageHeader } from './components/PageHeader.js';
import { frames, figmaUrl } from './data/frames.js';
import { sites, msp } from './data/seed.js';
import { PoliciesTab } from './screens/policy/Policies.js';
import { LogsTab } from './screens/policy/Logs.js';
import { EditPage } from './screens/policy/EditPage.js';
import { MODULES } from './data/modules.js';
import { c } from './data/copy.js';
import { GroupsScreen, groupTitle } from './screens/settings/Groups.js';
import { AiSecurity } from './screens/aisec/AiSecurity.js';
import { Icon, Img } from './components/ui.js';

// Page meta per route (title/breadcrumb exactly as on the boards).
const PAGES = {
  '/rmm': { crumb: 'App Control', title: 'RMM Guard', tabs: [['logs', 'Logs'], ['policies', 'Policies']] },
  '/ai': { crumb: 'App Control', title: 'Applications', tabs: [['logs', 'Logs'], ['policies', 'Policies']] },
  '/ai-security': { crumb: null, title: 'AI Security', siteOnly: true },
  '/settings': { crumb: 'Settings', title: 'Groups', siteOnly: true },
};
const pageFor = path => PAGES[Object.keys(PAGES).sort((a, b) => b.length - a.length).find(k => path.startsWith(k))];

function Tabs({ base, tabs, active, scope }) {
  return html`<div class="tab-group" role="tablist">
    ${tabs.map(([id, label]) => html`<button role="tab" aria-selected=${String(active === id)} class=${'tab' + (active === id ? ' is-active' : '')}
      onClick=${() => go(`${base}/${id}${scope === 'msp' ? '?scope=msp' : ''}`)}>${label}</button>`)}
  </div>`;
}

// Fallback for any address the prototype doesn't cover (all board screens are built).
function StagePlaceholder() {
  return html`<div class="stage-ph">
    <div class="t-subtitle1">${c('tip.navNotInPrototype', { label: 'This page' })}</div>
    <button class="btn btn-secondary" onClick=${() => go('/rmm/logs')}>Go to RMM Guard</button>
  </div>`;
}

function FramesIndex() {
  const groups = {};
  frames.forEach(f => { const k = `${f.board === 'R' ? 'RMM board' : 'AI board'} · ${f.route}`; (groups[k] = groups[k] || []).push(f); });
  return html`<div class="frames-index">
    <p class="t-body2 muted">Each link opens the prototype in the state of that Figma frame. "Figma" opens the frame itself.</p>
    ${Object.entries(groups).map(([k, list]) => html`<section>
      <h2 class="t-subtitle2">${k}</h2>
      <ul>${list.map(f => html`<li><a href=${'#/f/' + f.id.replace(':', '-')}>${f.id}</a> <span class="muted">${f.state}</span> · <a href=${figmaUrl(f)} target="_blank" rel="noopener">Figma</a></li>`)}</ul>
    </section>`)}
  </div>`;
}

function Toasts() {
  const { toasts } = getState();
  return html`<div class="toast-host" aria-live="polite">
    ${toasts.map(t => html`<div class=${'toast' + (t.leaving ? ' is-leaving' : '')} key=${t.id} role="status">
      <span class="bar"></span>
      <div class="msg"><${Img} name="status-success-24" size=${24} />
        <div style="flex:1 1 0;min-width:0"><div class="ttl"><p>${t.title}</p>
          <button aria-label="Close" style="display:inline-flex" onClick=${() => dismissToast(t.id)}><${Icon} name="close-24" size=${24} color="var(--icon-icon_strong)" /></button></div>
          ${t.body && html`<p class="bd">${t.body}</p>`}</div>
      </div>
    </div>`)}
  </div>`;
}

/** Which screen renders the body. Container scope (stage 5) and other modules (stages 3-4) keep the placeholder. */
function Screen({ route }) {
  const { path, query } = route;
  const msp = query.scope === 'msp';
  if (path === '/frames') return html`<${FramesIndex} />`;
  const m = path.match(/^\/(rmm|ai)\/(policies|logs|edit)(?:\/([\w-]+))?/);
  if (m) {
    const mod = MODULES[m[1]];
    if (m[2] === 'policies') return html`<${PoliciesTab} key=${route.raw} mod=${mod} query=${query} />`;
    if (m[2] === 'logs') return html`<${LogsTab} key=${route.raw} mod=${mod} query=${query} />`;
    return html`<${EditPage} key=${route.raw} mod=${mod} id=${m[3]} query=${query} />`;
  }
  if (path.startsWith('/ai-security')) return html`<${AiSecurity} key=${route.raw} path=${path} query=${query} />`;
  if (path.startsWith('/settings/groups')) return html`<${GroupsScreen} key=${route.raw} path=${path} query=${query} />`;
  return html`<${StagePlaceholder} path=${path} query=${query} />`;
}

function App() {
  const [, force] = useState(0);
  const [route, setRoute] = useState(parseHash());
  useEffect(() => subscribe(() => force(n => n + 1)), []);
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  // Frame links use the current run; sample data is loaded only on explicit request.
  // Scope follows the URL (deep links into Site container frames), and site-only pages force site level.
  const page = pageFor(route.path) || { title: 'Board frame links' };
  useEffect(() => {
    const st = getState();
    const want = route.query.scope === 'msp' && !page.siteOnly ? 'msp' : 'site';
    if (st.scope.level !== want) setState({ scope: { ...st.scope, level: want } });
  }, [route.path, route.query.scope]);

  const nav = navFor(route.path);
  const parts = route.path.split('/').filter(Boolean);
  const base = '/' + parts[0];
  const activeTab = parts[1];
  const inner = parts[1] === 'edit';
  return html`
    <div class="layout">
      <${Sidemenu} nav=${nav} />
      <div class="page-body">
        <${PageHeader} crumb=${page.crumb} title=${groupTitle(route.path) || page.title} scopeLocked=${!!page.siteOnly} />
        <main class=${'body' + (inner ? ' is-inner' : '')} id="main">
          ${page.tabs && !inner && html`<${Tabs} base=${base} tabs=${page.tabs} active=${activeTab} scope=${route.query.scope} />`}
          <${Screen} route=${route} />
        </main>
      </div>
      <div id="drawer-host"></div>
      <div id="modal-host"></div>
      <${Toasts} />
    </div>`;
}

render(html`<${App} />`, document.getElementById('app'));
