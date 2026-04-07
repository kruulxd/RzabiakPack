(function () {
  'use strict';

  if (window.__RZP_SUPER_SPRZEDAWCA_LOADED) return;
  window.__RZP_SUPER_SPRZEDAWCA_LOADED = true;

  const ADDON_ID    = 'super-sprzedawca';
  const STORAGE_KEY = 'rzp_super_sprzedawca_settings';
  const STYLE_ID    = 'rzp-super-sprzedawca-style';
  const SETTINGS_ID = 'rzp-super-sprzedawca-settings';

  const DEFAULT_SETTINGS = {
    hotkey: '2'
  };

  const state = {
    enabled:         false,
    settings:        { ...DEFAULT_SETTINGS },
    keyHandler:      null,
    settingsNode:    null,
    isCapturingKey:  false
  };

  /* ─── storage ─────────────────────────────────────────── */
  function loadSettings() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        hotkey: (typeof parsed.hotkey === 'string' && parsed.hotkey.length > 0)
          ? parsed.hotkey
          : DEFAULT_SETTINGS.hotkey
      };
    } catch (e) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
    } catch (e) {}
  }

  /* ─── shop helpers ────────────────────────────────────── */
  function isShopOpen() {
    return !!document.querySelector('.shop-content.normal-shop-zl');
  }

  function isChatFocused() {
    const el = document.activeElement;
    return !!(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable));
  }

  function clickEl(el) {
    if (!el) return;
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('click',     { bubbles: true, cancelable: true }));
  }

  /* ─── core sell logic ─────────────────────────────────── */
  function sellBatch() {
    if (!state.enabled || !isShopOpen()) return;

    const shop = document.querySelector('.shop-content.normal-shop-zl');
    if (!shop) return;

    const bag1 = shop.querySelector('.grab-bag-1');
    const bag2 = shop.querySelector('.grab-bag-2');
    const bag3 = shop.querySelector('.grab-bag-3');
    const finalize = shop.querySelector('.finalize-button .button');

    if (bag1) clickEl(bag1);
    if (bag2) clickEl(bag2);
    if (bag3) clickEl(bag3);
    if (finalize) clickEl(finalize);
  }

  /* ─── key handler ─────────────────────────────────────── */
  function handleKeyDown(e) {
    if (!state.enabled) return;
    if (isChatFocused()) return;
    if (!isShopOpen()) return;
    if (e.key !== state.settings.hotkey) return;

    e.preventDefault();
    sellBatch();
  }

  /* ─── styles ──────────────────────────────────────────── */
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${SETTINGS_ID} {
        position: fixed;
        top: 200px;
        left: calc(50% - 160px);
        width: 320px;
        border-radius: 12px;
        border: 1px solid rgba(52, 211, 100, 0.22);
        background: linear-gradient(160deg, rgba(6, 16, 9, 0.98), rgba(4, 12, 7, 0.99));
        box-shadow:
          0 0 0 1px rgba(34,197,94,0.06) inset,
          0 16px 40px rgba(0,0,0,0.65),
          0 0 24px rgba(34,197,94,0.04);
        color: #c8ead4;
        font-family: 'Trebuchet MS', Tahoma, Verdana, sans-serif;
        font-size: 11px;
        z-index: 20000;
        overflow: hidden;
        user-select: none;
      }
      #${SETTINGS_ID}.hidden { display: none; }

      .rzp-ss-header {
        padding: 10px 12px 9px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.3px;
        color: #86efac;
        border-bottom: 1px solid rgba(52,211,100,0.14);
        background: rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 7px;
        cursor: move;
      }
      .rzp-ss-header::before {
        content: '💰';
        font-size: 13px;
      }
      .rzp-ss-body {
        padding: 12px 14px 14px;
      }
      .rzp-ss-close {
        margin-left: auto;
        width: 18px;
        height: 18px;
        border-radius: 4px;
        border: 1px solid rgba(52,211,100,0.18);
        background: rgba(0,0,0,0.2);
        color: #3d6647;
        font-size: 11px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        transition: background 0.15s, color 0.15s, border-color 0.15s;
        font-family: inherit;
        padding: 0;
      }
      .rzp-ss-close:hover {
        background: rgba(239,68,68,0.18);
        border-color: rgba(239,68,68,0.35);
        color: #f87171;
      }
      .rzp-ss-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid rgba(52,211,100,0.09);
        background: rgba(255,255,255,0.02);
        gap: 10px;
        margin-bottom: 6px;
      }
      .rzp-ss-row:last-of-type { margin-bottom: 0; }
      .rzp-ss-label {
        color: #9acba6;
        font-size: 11px;
        flex: 1;
      }
      .rzp-ss-key-capture {
        position: relative;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .rzp-ss-key-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 22px;
        padding: 0 7px;
        border-radius: 5px;
        border: 1px solid rgba(52,211,100,0.3);
        background: rgba(34,197,94,0.1);
        color: #4ade80;
        font-size: 11px;
        font-weight: 700;
        font-family: monospace;
        letter-spacing: 0.5px;
        white-space: nowrap;
      }
      .rzp-ss-capture-btn {
        height: 22px;
        padding: 0 8px;
        border-radius: 5px;
        border: 1px solid rgba(52,211,100,0.22);
        background: rgba(34,197,94,0.07);
        color: #6faa7e;
        font-size: 10px;
        font-family: inherit;
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.15s, color 0.15s, border-color 0.15s;
      }
      .rzp-ss-capture-btn:hover {
        background: rgba(34,197,94,0.18);
        border-color: rgba(52,211,100,0.45);
        color: #86efac;
      }
      .rzp-ss-capture-btn.capturing {
        background: rgba(250,204,21,0.12);
        border-color: rgba(250,204,21,0.35);
        color: #fbbf24;
        animation: rzp-ss-pulse 0.8s ease-in-out infinite;
      }
      @keyframes rzp-ss-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }

    `;
    document.head.appendChild(style);
  }

  /* ─── settings window ─────────────────────────────────── */
  function buildSettingsWindow() {
    if (state.settingsNode) return state.settingsNode;
    ensureStyle();

    const win = document.createElement('div');
    win.id = SETTINGS_ID;
    win.className = 'hidden';

    const header = document.createElement('div');
    header.className = 'rzp-ss-header';
    header.innerHTML = `<span>Super Sprzedawca — ustawienia</span>`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'rzp-ss-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => win.classList.add('hidden'));
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'rzp-ss-body';

    const keyBadge = document.createElement('span');
    keyBadge.className = 'rzp-ss-key-badge';
    keyBadge.id = 'rzp-ss-key-badge';
    keyBadge.textContent = state.settings.hotkey;

    const captureBtn = document.createElement('button');
    captureBtn.className = 'rzp-ss-capture-btn';
    captureBtn.id = 'rzp-ss-capture-btn';
    captureBtn.textContent = 'Zmień';

    const captureWrap = document.createElement('div');
    captureWrap.className = 'rzp-ss-key-capture';
    captureWrap.appendChild(keyBadge);
    captureWrap.appendChild(captureBtn);

    const row = document.createElement('div');
    row.className = 'rzp-ss-row';
    const label = document.createElement('span');
    label.className = 'rzp-ss-label';
    label.textContent = 'Przycisk sprzedawania';
    row.appendChild(label);
    row.appendChild(captureWrap);

    body.appendChild(row);
    const dockRow = window.RZP_DOCK_HIDDEN_UTILS?.makeRow?.('super-sprzedawca');
    if (dockRow) body.appendChild(dockRow);

    win.appendChild(header);
    win.appendChild(body);
    document.body.appendChild(win);

    if (typeof window.RZP_MAKE_DRAGGABLE === 'function') {
      window.RZP_MAKE_DRAGGABLE(win, header);
    }

    captureBtn.addEventListener('click', () => {
      if (state.isCapturingKey) return;
      state.isCapturingKey = true;
      captureBtn.textContent = 'Naciśnij klawisz…';
      captureBtn.classList.add('capturing');

      function onKey(e) {
        e.preventDefault();
        e.stopPropagation();

        const key = e.key;
        if (key === 'Escape') {
          stopCapture();
          return;
        }

        state.settings.hotkey = key;
        saveSettings();
        keyBadge.textContent = key;
        stopCapture();

        // Reattach key handler with new key
        if (state.enabled) {
          detachKeyHandler();
          attachKeyHandler();
        }
      }

      function stopCapture() {
        document.removeEventListener('keydown', onKey, true);
        state.isCapturingKey = false;
        captureBtn.textContent = 'Zmień';
        captureBtn.classList.remove('capturing');
      }

      document.addEventListener('keydown', onKey, true);
    });

    state.settingsNode = win;
    return win;
  }

  /* ─── key handler management ──────────────────────────── */
  function attachKeyHandler() {
    if (state.keyHandler) return;
    state.keyHandler = handleKeyDown;
    document.addEventListener('keydown', state.keyHandler);
  }

  function detachKeyHandler() {
    if (!state.keyHandler) return;
    document.removeEventListener('keydown', state.keyHandler);
    state.keyHandler = null;
  }

  /* ─── addon API ───────────────────────────────────────── */
  const addonApi = {
    id:   ADDON_ID,
    name: 'Super sprzedawca',

    enable() {
      state.settings = loadSettings();
      state.enabled  = true;
      ensureStyle();
      attachKeyHandler();
      return true;
    },

    disable() {
      state.enabled = false;
      detachKeyHandler();
      if (state.settingsNode) {
        state.settingsNode.classList.add('hidden');
      }
      return true;
    },

    runWidget() {
      return true;
    },

    openSettings() {
      buildSettingsWindow();
      state.settingsNode.classList.toggle('hidden');
      return true;
    }
  };

  window.RZP_ADDONS_REGISTRY = window.RZP_ADDONS_REGISTRY || {};
  window.RZP_ADDONS_REGISTRY[ADDON_ID] = addonApi;
})();
