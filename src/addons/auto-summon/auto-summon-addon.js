(function () {
  'use strict';

  if (window.__RZP_AUTO_SUMMON_LOADED) return;
  window.__RZP_AUTO_SUMMON_LOADED = true;

  const ADDON_ID    = 'auto-summon';
  const STORAGE_KEY = 'rzp_auto_summon_settings';

  // Frazy po normalizacji (bez polskich znaków, lower-case)
  const SUMMON_PHRASES = [
    'przyzywa do siebie swoja druzyne',
    'czy chcesz sie teleportowac do lokacji'
  ];

  const state = {
    active:      false,
    observer:    null,
    settingsWin: null,
    lastHandledKey: '',
    lastHandledAt: 0,
  };

  /* ─── storage ─────────────────────────────────────────────── */

  function loadSettings() {
    try {
      const r = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
      return { active: r.active === true };
    } catch (e) {
      return { active: false };
    }
  }

  function saveSettings() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ active: state.active }));
    } catch (e) {}
  }

  /* ─── core logic ───────────────────────────────────────────── */

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function isSummonAlertText(text) {
    const normalized = normalizeText(text);
    return SUMMON_PHRASES.every((phrase) => normalized.includes(phrase));
  }

  // Szuka widocznego przycisku potwierdzenia w obrębie elementu docelowego
  function findConfirmButton(root) {
    if (!root) return null;

    const direct = root.querySelector(
      '.window-controlls .button.small.alert-accept-hotkey, .alert-accept-hotkey'
    );
    if (direct) return direct;

    const firstSmall = root.querySelector('.window-controlls .button.small:first-child');
    if (firstSmall) return firstSmall;

    // Wspólne selektory dla przycisków "Tak" / "OK" / "Potwierdź"
    const candidates = root.querySelectorAll(
      'button, input[type="button"], input[type="submit"], a.btn, .btn, .button.small, .window-controlls > div'
    );
    for (const el of candidates) {
      const text = normalizeText((el.textContent || el.value || '').trim());
      if (text === 'tak' || text === 'ok' || text === 'potwierdz' || text === 'teleportuj') {
        return el;
      }
    }
    // Fallback: pierwszy przycisk w kontenerze
    return root.querySelector('button, input[type="button"], .button.small') || null;
  }

  function clickConfirm(el) {
    if (!el) return;
    try {
      ['mouseenter', 'mousedown', 'mouseup', 'click'].forEach((type) => {
        el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
      });
    } catch (e) {
      try { el.click(); } catch (err) {}
    }
  }

  function hideSummonAlert(alertEl) {
    if (!alertEl) return;
    try {
      alertEl.classList.remove('window-on-peak');
      alertEl.style.opacity = '0';
      alertEl.style.pointerEvents = 'none';
      alertEl.style.visibility = 'hidden';
      alertEl.style.display = 'none';
    } catch (e) {}
  }

  function findSummonAlert(node) {
    if (!(node instanceof Element)) return null;

    const ownAlert = node.matches?.('.askAlert, .mAlert.askAlert') ? node : null;
    if (ownAlert && isSummonAlertText(ownAlert.textContent || '')) return ownAlert;

    const nearest = node.closest?.('.askAlert, .mAlert.askAlert');
    if (nearest && isSummonAlertText(nearest.textContent || '')) return nearest;

    const all = document.querySelectorAll('.askAlert, .mAlert.askAlert');
    for (const alert of all) {
      if (isSummonAlertText(alert.textContent || '')) return alert;
    }

    return null;
  }

  function tryHandleNode(node) {
    if (!state.active) return;
    if (!(node instanceof Element)) return;

    const alert = findSummonAlert(node);
    if (!alert) return;

    const alertKey = normalizeText(alert.textContent || '').slice(0, 220);
    const now = Date.now();
    if (state.lastHandledKey === alertKey && now - state.lastHandledAt < 1500) return;

    const btn = findConfirmButton(alert);
    if (btn) {
      // Kliknij od razu (eliminuje krótkie przyciemnienie), a alert ukryj natychmiast.
      clickConfirm(btn);
      hideSummonAlert(alert);

      // Krótkie retry, gdyby pierwszy click trafił przed pełną gotowością okna.
      setTimeout(() => {
        if (!state.active) return;
        if (alert.isConnected) clickConfirm(btn);
      }, 40);

      setTimeout(() => {
        if (!state.active) return;
        if (alert.isConnected) clickConfirm(btn);
        state.lastHandledKey = alertKey;
        state.lastHandledAt = Date.now();
      }, 120);
    }
  }

  function startObserver() {
    if (state.observer) return;
    state.observer = new MutationObserver(mutations => {
      for (const mut of mutations) {
        for (const node of mut.addedNodes) {
          tryHandleNode(node);
        }
      }
    });
    state.observer.observe(document.body, { childList: true, subtree: true });

    // Obsłuż alert, który mógł już być otwarty zanim observer wystartował.
    tryHandleNode(document.body);
  }

  function stopObserver() {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
  }

  /* ─── activate / deactivate ───────────────────────────────── */

  function activate() {
    state.active = true;
    startObserver();
    saveSettings();
    window.RZP_SET_DOCK_BTN_ACTIVE?.(ADDON_ID);
    if (typeof window.RZP_SHOW_TOAST === 'function') {
      window.RZP_SHOW_TOAST('Auto-summon: włączony', { color: 'green', ms: 2000 });
    }
  }

  function deactivate() {
    state.active = false;
    stopObserver();
    saveSettings();
    window.RZP_SET_DOCK_BTN_ACTIVE?.(ADDON_ID);
    if (typeof window.RZP_SHOW_TOAST === 'function') {
      window.RZP_SHOW_TOAST('Auto-summon: wyłączony', { color: 'orange', ms: 2000 });
    }
  }

  /* ─── settings window ──────────────────────────────────────── */

  function ensureSettingsWin() {
    if (state.settingsWin) return state.settingsWin;

    const win = document.createElement('div');
    win.id = 'rzp-auto-summon-settings';
    win.className = 'rzp-addon-mini-settings hidden';
    win.style.top  = '180px';
    win.style.left = 'calc(50% - 140px)';

    const header = document.createElement('div');
    header.className = 'rzp-addon-mini-settings-header';
    header.textContent = 'Auto-summon — ustawienia';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'rzp-addon-mini-settings-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => win.classList.add('hidden'));
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'rzp-addon-mini-settings-body';

    const dockRow = window.RZP_DOCK_HIDDEN_UTILS?.makeRow?.(ADDON_ID);
    if (dockRow) body.appendChild(dockRow);

    win.appendChild(header);
    win.appendChild(body);
    document.body.appendChild(win);

    if (typeof window.RZP_MAKE_DRAGGABLE === 'function') {
      window.RZP_MAKE_DRAGGABLE(win, header);
    }

    state.settingsWin = win;
    return win;
  }

  /* ─── addon API ───────────────────────────────────────────── */

  const addonApi = {
    id:   ADDON_ID,
    name: 'Auto-summon',

    enable() {
      const saved = loadSettings();
      if (saved.active) activate();
      return true;
    },

    disable() {
      deactivate();
      return true;
    },

    isActive() {
      return state.active;
    },

    runWidget() {
      if (state.active) deactivate(); else activate();
    },

    openSettings() {
      const win = ensureSettingsWin();
      const willShow = win.classList.contains('hidden');
      win.classList.toggle('hidden');
    },
  };

  window.RZP_ADDONS_REGISTRY = window.RZP_ADDONS_REGISTRY || {};
  window.RZP_ADDONS_REGISTRY[ADDON_ID] = addonApi;
})();
