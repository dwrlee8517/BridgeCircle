// bc-account-menu — the shared topbar avatar popover (account menu) for
// BridgeCircle page templates. Home and the App shell carry a DC-native copy
// of the same design; every other section page mounts this element so the
// menu stays identical everywhere.
//
// Usage (in a page at templates/<folder>/Page.dc.html):
//   <helmet>… <script src="../app-shell/account-menu.js"></script> …</helmet>
//   <bc-account-menu></bc-account-menu>
//
// Attributes (all optional): name, email, initials, base (href prefix,
// default ".." — correct for pages one folder below templates/).
// The pause switch shares sessionStorage bcHelpPageState.openTo with
// Help·Give and the Settings page (one source of truth, ADR 0011).
(() => {
  if (customElements.get('bc-account-menu')) return;

  class BcAccountMenu extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      const base = this.getAttribute('base') || '..';
      const name = this.getAttribute('name') || 'Iris Lau';
      const email = this.getAttribute('email') || 'iris.lau@alum.chadwick.edu';
      const initials = this.getAttribute('initials') || 'IL';

      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>
          :host{position:relative;display:inline-flex;font-family:var(--font-sans,'Pretendard Variable',sans-serif)}
          button{font-family:inherit}
          .avatar{width:40px;height:40px;border-radius:50%;border:0;padding:0;background:var(--gradient-avatar);box-shadow:inset 0 0 0 1px rgb(255 255 255 / 0.2);color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;cursor:pointer}
          .avatar:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}
          .scrim{position:fixed;inset:0;z-index:30}
          .menu{position:absolute;top:48px;right:0;z-index:31;width:300px;background:var(--surface-card,#fff);border-radius:18px;box-shadow:var(--ring-card-elevated),0 20px 50px -14px rgb(25 31 40 / 0.3);overflow:hidden;text-align:left}
          a{text-decoration:none;color:inherit}
          a:focus-visible{outline:2px solid var(--focus-ring);outline-offset:-2px}
          .id{display:flex;align-items:center;gap:12px;padding:16px 18px 14px}
          .id:hover{background:var(--row-hover)}
          .id .av{width:42px;height:42px;flex:none;border-radius:50%;background:var(--gradient-avatar);box-shadow:inset 0 0 0 1px rgb(255 255 255 / 0.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff}
          .id b{display:block;font-size:14px;font-weight:800;letter-spacing:-0.01em;color:var(--text-primary)}
          .id small{display:block;font-size:11.5px;color:var(--text-faint);font-weight:500;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .id .chev{flex:none;color:var(--text-faint);font-size:14px}
          .items{display:block;border-top:1px solid var(--divider-row);padding:6px 0}
          .items a{display:block;padding:9px 18px;font-size:13px;font-weight:600;color:var(--text-secondary)}
          .items a:hover{background:var(--row-hover)}
          .pause{display:flex;align-items:center;gap:10px;padding:11px 18px;border-top:1px solid var(--divider-row)}
          .pause b{display:block;font-size:13px;font-weight:700;color:var(--text-primary)}
          .pause small{display:block;font-size:11.5px;color:var(--text-faint);font-weight:500;margin-top:1px}
          .sw{width:34px;height:20px;border-radius:999px;position:relative;border:0;padding:0;cursor:pointer;flex:none;background:#c8cfd8}
          .sw:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}
          .sw.on{background:var(--green-500,#02b26c)}
          .sw i{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgb(25 31 40 / 0.2);transition:left .12s ease}
          @media (prefers-reduced-motion: reduce){.sw i{transition:none}}
          .sw.on i{left:16px}
          .foot{display:flex;align-items:center;gap:14px;padding:11px 18px 13px;border-top:1px solid var(--divider-row);background:#fbfcfd}
          .foot a{font-size:12.5px;color:var(--text-secondary);font-weight:700}
          .foot a:hover{color:var(--text-primary)}
          .foot .out{margin-left:auto}
          [hidden]{display:none !important}
        </style>
        <button class="avatar" aria-label="Account menu" aria-expanded="false">${initials}</button>
        <div class="scrim" hidden></div>
        <div class="menu" role="dialog" aria-label="Account" hidden>
          <a class="id" href="${base}/profile-self/ProfileSelf.dc.html">
            <span class="av">${initials}</span>
            <span style="flex:1;min-width:0"><b>${name}</b><small>${email}</small></span>
            <span class="chev">&rsaquo;</span>
          </a>
          <span class="items">
            <a href="${base}/profile-self/ProfileSelf.dc.html">View profile</a>
            <a href="${base}/my-circle/MyCircle.dc.html">My circle</a>
            <a href="${base}/help/AskHistory.dc.html">Your asks</a>
            <a href="${base}/notifications/Notifications.dc.html">Notifications</a>
            <a href="${base}/settings/Settings.dc.html">Settings</a>
          </span>
          <span class="pause">
            <span style="flex:1;min-width:0"><b>Open to helping</b><small>Pausing stops matching &mdash; never announced</small></span>
            <button class="sw" role="switch" aria-checked="true" aria-label="Open to helping"><i></i></button>
          </span>
          <span class="foot">
            <a href="mailto:bridgecircle@chadwick.edu">Send feedback</a>
            <a class="out" href="${base}/settings/SignedOut.dc.html">Sign out</a>
          </span>
        </div>`;

      this._avatar = root.querySelector('.avatar');
      this._scrim = root.querySelector('.scrim');
      this._menu = root.querySelector('.menu');
      this._sw = root.querySelector('.sw');

      this._avatar.addEventListener('click', () => this.toggle());
      this._scrim.addEventListener('click', () => this.close());
      this._sw.addEventListener('click', () => this.togglePause());
      this._onKey = (e) => { if (e.key === 'Escape' && !this._menu.hidden) this.close(); };
      window.addEventListener('keydown', this._onKey);

      this.renderPause();
    }

    disconnectedCallback() {
      if (this._onKey) window.removeEventListener('keydown', this._onKey);
    }

    toggle() { if (this._menu.hidden) { this.renderPause(); this._menu.hidden = false; this._scrim.hidden = false; this._avatar.setAttribute('aria-expanded', 'true'); } else { this.close(); } }
    close() { this._menu.hidden = true; this._scrim.hidden = true; this._avatar.setAttribute('aria-expanded', 'false'); }

    readOpenTo() {
      try {
        const h = JSON.parse(sessionStorage.getItem('bcHelpPageState') || '{}') || {};
        return h.openTo !== false;
      } catch (e) { return true; }
    }

    renderPause() {
      const on = this.readOpenTo();
      this._sw.classList.toggle('on', on);
      this._sw.setAttribute('aria-checked', on ? 'true' : 'false');
    }

    togglePause() {
      const openTo = !this.readOpenTo();
      try {
        const h = JSON.parse(sessionStorage.getItem('bcHelpPageState') || '{}') || {};
        h.openTo = openTo;
        sessionStorage.setItem('bcHelpPageState', JSON.stringify(h));
      } catch (e) { /* storage unavailable */ }
      this.renderPause();
    }
  }

  customElements.define('bc-account-menu', BcAccountMenu);
})();
