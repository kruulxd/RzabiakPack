(function () {
  'use strict';

  if (window.__RZP_SZYBKA_WALKA_LOADED) return;
  window.__RZP_SZYBKA_WALKA_LOADED = true;

  const ADDON_ID    = 'szybka-walka';
  const STORAGE_KEY = 'rzp_szybka_walka_settings';

  const state = {
    active:      false,
    observer:    null,
    inBattle:    false,
    settingsWin: null,
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

  /* ─── fast fight trigger ──────────────────────────────────── */

  function triggerFastFight() {
    // 1. Przycisk DOM — główna metoda
    const btn = document.querySelector('.auto-fight-btn');
    if (btn) { btn.click(); return; }

    // 2. Przez Engine.battle / Engine.fight
    try {
      if (typeof window.Engine?.battle?.setFastFight === 'function') {
        window.Engine.battle.setFastFight(true); return;
      }
      if (typeof window.Engine?.fight?.setFast === 'function') {
        window.Engine.fight.setFast(true); return;
      }
    } catch (e) {}

    // 3. Fallback — symulacja klawisza F
    try {
      const target = document.activeElement || document.body;
      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', keyCode: 70, which: 70, bubbles: true }));
      target.dispatchEvent(new KeyboardEvent('keyup',   { key: 'f', code: 'KeyF', keyCode: 70, which: 70, bubbles: true }));
    } catch (e) {}
  }

  /* ─── battle detection ────────────────────────────────────── */

  function isBattleActive() {
    const btn = document.querySelector('.auto-fight-btn');
    if (!btn) return false;
    // Button hidden (display:none) means fast-fight is already ON — don't re-trigger
    return btn.style.display !== 'none' && getComputedStyle(btn).display !== 'none';
  }

  function startPolling() {
    if (state.observer) return;

    const check = () => {
      if (!state.active) return;
      const nowInBattle = isBattleActive();
      if (nowInBattle && !state.inBattle) {
        state.inBattle = true;
        triggerFastFight();
      } else if (!nowInBattle && state.inBattle) {
        state.inBattle = false;
      }
    };

    state.observer = new MutationObserver(check);
    state.observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

    // Sprawdź natychmiast — walka może być już aktywna
    check();
  }

  function stopPolling() {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    state.inBattle = false;
  }

  /* ─── activate / deactivate ───────────────────────────────── */

  function activate() {
    state.active = true;
    startPolling();
    saveSettings();
    window.RZP_SET_DOCK_BTN_ACTIVE?.(ADDON_ID);
    if (typeof window.RZP_SHOW_TOAST === 'function') {
      window.RZP_SHOW_TOAST('Szybka walka: włączona', { color: 'green', ms: 2000 });
    }
  }

  function deactivate() {
    state.active = false;
    stopPolling();
    saveSettings();
    window.RZP_SET_DOCK_BTN_ACTIVE?.(ADDON_ID);
    if (typeof window.RZP_SHOW_TOAST === 'function') {
      window.RZP_SHOW_TOAST('Szybka walka: wyłączona', { color: 'orange', ms: 2000 });
    }
  }

  /* ─── settings window ──────────────────────────────────────── */

  function ensureSettingsWin() {
    if (state.settingsWin) return state.settingsWin;

    const win = document.createElement('div');
    win.id = 'rzp-szybka-walka-settings';
    win.className = 'rzp-addon-mini-settings hidden';
    win.style.top  = '180px';
    win.style.left = 'calc(50% - 140px)';

    const header = document.createElement('div');
    header.className = 'rzp-addon-mini-settings-header';
    header.textContent = 'Szybka walka — ustawienia';
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
    name: 'Szybka walka',

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
