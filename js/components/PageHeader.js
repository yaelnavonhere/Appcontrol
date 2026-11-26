// DS3 "Page header": breadcrumb + title, scope (site) picker, header actions, help.
import { html, useState, useEffect, useRef, iconStyle } from '../lib.js';
import { getState, setState, resetDemo } from '../store.js';
import { sites, msp } from '../data/seed.js';
import { go } from '../router.js';
import { c } from '../data/copy.js';

export function PageHeader({ crumb, title, scopeLocked }) {
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [switching, setSwitching] = useState(null); // name of the tenant being loaded (demo loader, Yael 2026-11-25)
  const ref = useRef(null);
  const st = getState();
  const isMsp = st.scope.level === 'msp';
  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setHelp(false); } };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const pick = scope => {
    setOpen(false);
    const same = scope.level === st.scope.level && (scope.level === 'msp' || scope.siteId === st.scope.siteId);
    if (same) return;
    // Demo loader: switching tenants takes a moment in the console, and the table barely changes, so show it happened.
    const m = document.getElementById('main');
    const r = m ? m.getBoundingClientRect() : null;
    setSwitching({ name: scope.level === 'msp' ? msp.name : sites.find(s => s.id === scope.siteId).name, rect: r && { top: r.top, left: r.left, width: r.width, height: r.height } });
    setTimeout(() => { navTo(scope); setTimeout(() => setSwitching(null), 120); }, 800);
  };
  const navTo = scope => {
    setState({ scope });
    const h = window.location.hash.replace(/^#/, '').replace(/[?&]scope=msp/, '').replace(/\?$/, '');
    // Site-only pages (AI Security, Settings › Groups) have no Site Manager level view: go to the closest one that does.
    if (scope.level === 'msp' && scopeLocked) { go(h.startsWith('/ai-security') ? '/ai/policies?scope=msp' : '/rmm/policies?scope=msp'); return; }
    go(scope.level === 'msp' ? h.split('?')[0] + '?scope=msp' : h.split('?')[0]);
  };
  return html`
    <header class="page-header" ref=${ref}>
      <div class="ph-title">
        ${crumb && html`<div class="ph-crumb"><span>${crumb}</span><span style=${iconStyle('slash-16', 'var(--icon-icon_default)', 16)}></span></div>`}
        <h1 class="ph-h1">${title}</h1>
      </div>
      <div class="ph-actions">
        <div class="scope-wrap">
          <button class="site-picker" aria-haspopup="listbox" aria-expanded=${String(open)} onClick=${() => setOpen(!open)}>
            <span class="sp-avatar"><span style=${iconStyle(isMsp ? 'site-manager-24' : 'site-24', 'var(--icon-icon_strong)', 24)}></span></span>
            <span class="sp-text">${isMsp ? msp.name : (sites.find(s => s.id === st.scope.siteId) || sites[0]).name}</span>
            <span style=${iconStyle('chevron-down-16', 'var(--icon-icon_default)', 16)}></span>
          </button>
          ${open && html`<div class="dropdown sp-menu" role="listbox">
            <div class="dd-caption">Site manager</div>
            <button role="option" aria-selected=${String(isMsp)} class=${'dd-item' + (isMsp ? ' is-selected' : '')} onClick=${() => pick({ level: 'msp', siteId: st.scope.siteId })}>${msp.name}</button>
            <div class="dd-caption">Sites</div>
            <div class="dd-scroll">
              ${sites.map(s => html`<button role="option" aria-selected=${String(!isMsp && st.scope.siteId === s.id)}
                class=${'dd-item' + (!isMsp && st.scope.siteId === s.id ? ' is-selected' : '')}
                onClick=${() => pick({ level: 'site', siteId: s.id })}>${s.name}</button>`)}
            </div>
          </div>`}
        </div>
        ${switching && html`<div class="scope-loading" role="status" aria-live="polite" style=${switching.rect ? `top:${switching.rect.top}px;left:${switching.rect.left}px;width:${switching.rect.width}px;height:${switching.rect.height}px` : ''}>
          <span class="spinner" aria-hidden="true"></span><span>Loading ${switching.name}…</span></div>`}
        <button class="btn-icon" aria-label="Downloads"><span style=${iconStyle('import-16', 'var(--icon-icon_default)', 16)}></span></button>
        <button class="btn-icon" aria-label="User"><span style=${iconStyle('user-16', 'var(--icon-icon_default)', 16)}></span></button>
        <img class="ph-chatbot" src="assets/icons/chatbot-32.svg" alt="Assistant" width="32" height="32" />
        <div class="scope-wrap">
          <button class="ph-help" aria-label="Help" aria-expanded=${String(help)} onClick=${() => setHelp(!help)}><span>?</span></button>
          ${help && html`<div class="dropdown help-menu" role="menu">
            <button role="menuitem" class="dd-item" onClick=${() => { setHelp(false); go('/frames'); }}>Board frame links</button>
            <button role="menuitem" class="dd-item" onClick=${() => { setHelp(false); resetDemo('oob'); go('/rmm/logs'); }}>Start over (out of the box)</button>
            <button role="menuitem" class="dd-item" onClick=${() => { setHelp(false); resetDemo('sample'); go('/rmm/logs'); }}>Load sample data</button>
          </div>`}
        </div>
      </div>
    </header>`;
}
