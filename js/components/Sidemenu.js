// DS3 "Sidemenu - yael" as fixed on 2026-11-10 (master nav in local component 20204:180219).
import { html, useState, iconStyle } from '../lib.js';
import { c } from '../data/copy.js';
import { go } from '../router.js';
import { getState } from '../store.js';

// App Control pages keep the Site Manager level when you navigate from the menu; site-only pages (AI Security, Groups) don't.
const goKeepScope = route => go(getState().scope.level === 'msp' && /^\/(rmm|ai)\//.test(route) ? route + '?scope=msp' : route);

const ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'nav-overview' },
  { id: 'alerts', label: 'Alerts', icon: 'nav-alerts' },
  { id: 'forensic', label: 'Forensic', icon: 'nav-forensic' },
  { id: 'siem', label: 'SIEM', icon: 'nav-siem', badge: 'Beta' },
  { divider: true },
  { id: 'endpoints', label: 'Endpoints', icon: 'nav-endpoints' },
  { id: 'ai-security', label: 'AI Security', icon: 'nav-ai-security', route: '/ai-security/inventory' },
  { id: 'app-control', label: 'App Control', icon: 'nav-app-control', children: [
    { id: 'rmm', label: 'RMM Guard', route: '/rmm/logs' },
    { id: 'ai', label: 'Applications', route: '/ai/logs' },
  ] },
  { id: 'identity', label: 'Identity protection', icon: 'nav-identity' },
  { id: 'sspm', label: 'SaaS & Cloud', icon: 'nav-sspm' },
  { id: 'networks', label: 'Web content filtering', icon: 'nav-networks' },
  { id: 'email', label: 'Email security', icon: 'nav-email' },
  { divider: true },
  { id: 'actions', label: 'Actions', icon: 'nav-actions' },
  { id: 'reports', label: 'Reports', icon: 'nav-reports' },
  { id: 'audit', label: 'Audit', icon: 'nav-audit' },
  { id: 'scanner', label: 'Scanner', icon: 'nav-scan' },
  { id: 'playbooks', label: 'Playbooks', icon: 'nav-playbooks' },
  { id: 'settings', label: 'Settings', icon: 'nav-settings', children: [
    { id: 'groups', label: 'Groups', route: '/settings/groups' },
    { id: 'allowlist', label: 'Allowlist & Exclusions' }, { id: 'configuration', label: 'Configuration' },
    { id: 'advanced', label: 'Advanced' }, { id: 'users-roles', label: 'Users & Roles' }, { id: 'integrations', label: 'Integrations' },
    { id: 'alerts-s', label: 'Alerts' }, { id: 'it-hygiene', label: 'IT Hygiene' }, { id: 'uba', label: 'UBA' },
    { id: 'threat-hunting', label: 'Threat Hunting' }, { id: 'profiles', label: 'Profiles' }, { id: 'remediation', label: 'Remediation' },
    { id: 'itdr', label: 'ITDR Policy' }, { id: 'deception', label: 'Deception' }, { id: 'security', label: 'Security' },
  ] },
];

export function Sidemenu({ nav }) {
  const [tip, setTip] = useState(null);
  const notHere = (e, label) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ label, top: r.top + 6 });
    setTimeout(() => setTip(null), 1600);
  };
  const open = nav.group;
  return html`
    <nav class="sidemenu" aria-label="Main">
      <div class="sm-header"><a class="logo" href="#/rmm/policies" aria-label="Cynet">
        <img src="assets/icons/logo-mark.svg" alt="" style="width:27.57px;height:23.17px" />
        <img src="assets/icons/logo-wordmark.svg" alt="" style="width:66.5px;height:23.17px" />
      </a></div>
      <div class="sm-items">
        ${ITEMS.map(it => {
          if (it.divider) return html`<div class="sm-divider" role="separator"></div>`;
          const isOpen = it.children && open === it.id;
          const selected = nav.group === it.id && !it.children;
          const groupSelected = it.children && open === it.id;
          const onClick = e => {
            if (it.route) return goKeepScope(it.route);
            if (it.children && it.children[0].route) return goKeepScope(it.children[0].route);
            notHere(e, it.label);
          };
          return html`
            <div class=${'sm-item' + (selected ? ' is-selected' : '') + (groupSelected ? ' is-group-selected' : '')}>
              <button class="nav-item sm-row" onClick=${onClick} aria-expanded=${it.children ? String(!!isOpen) : undefined} aria-current=${selected ? 'page' : undefined}>
                <span style=${iconStyle(it.icon, selected || groupSelected ? 'var(--icon-icon_strong)' : 'var(--icon-icon_default)')}></span>
                <span class="sm-label">${it.label}${it.badge && html` <span class="badge-beta">${it.badge}</span>`}</span>
                <span class=${'sm-chev' + (isOpen ? ' is-open' : '')} style=${iconStyle('expand-more-16', isOpen || selected ? 'var(--icon-icon_strong)' : 'var(--icon-icon_default)', 16)}></span>
              </button>
              ${isOpen && html`<div class="sm-sub">
                ${it.children.map(c => html`
                  <button class=${'nav-item sm-sub-row' + (nav.item === c.id ? ' is-selected' : '')}
                    aria-current=${nav.item === c.id ? 'page' : undefined}
                    onClick=${e => c.route ? goKeepScope(c.route) : notHere(e, c.label)}>${c.label}</button>`)}
              </div>`}
            </div>`;
        })}
      </div>
      ${tip && html`<div class="sm-tip" style=${`top:${tip.top}px`} role="status">${c('tip.navNotInPrototype', { label: tip.label })}</div>`}
    </nav>`;
}
