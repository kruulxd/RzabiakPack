(function () {
  'use strict';

  if (window.__RZP_SORRY_MISSCLICK_LOADED) return;
  window.__RZP_SORRY_MISSCLICK_LOADED = true;

  const ADDON_ID    = 'sorry-missclick';
  const SETTINGS_ID = 'rzp-sorry-missclick-settings';
  const STORAGE_KEY = 'rzp_sorry_missclick_settings';

  // Definicje relacji przyjaznych (id relacji → etykieta)
  const FRIENDLY_RELATIONS = [
    { rel: 2, label: 'Przyjaciel', accusative: 'przyjaciela' },
    { rel: 4, label: 'Klanowicz', accusative: 'klanowicza'  },
    { rel: 5, label: 'Sojusznik', accusative: 'sojusznika'  },
  ];

  const DEFAULT_SETTINGS = {
    blockRelation2: true,  // przyjaciel
    blockRelation4: true,  // klanowicz
    blockRelation5: true,  // sojusznik
  };

  const state = {
    enabled:     false,
    settings:    { ...DEFAULT_SETTINGS },
    settingsWin: null,
  };

  let originalG     = null;
  let hookInstalled = false;
  let retryInterval = null;

  /* ─── storage ─────────────────────────────────────────────── */

  function loadSettings() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        blockRelation2: parsed.blockRelation2 !== false,
        blockRelation4: parsed.blockRelation4 !== false,
        blockRelation5: parsed.blockRelation5 !== false,
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

  function isRelationBlocked(rel) {
    return !!state.settings['blockRelation' + rel];
  }

  /* ─── helpers ─────────────────────────────────────────────── */

  function parseFightTarget(request) {
    const parts = request.split('&').slice(1);
    for (const part of parts) {
      const eq = part.indexOf('=');
      if (eq === -1) continue;
      const val = part.slice(eq + 1);
      if (/^\d+$/.test(val)) {
        return Number(val);
      }
    }
    return null;
  }

  function getPlayerById(id) {
    const list = window.Engine?.others?.getDrawableList?.();
    if (!list) return null;
    const entries = list instanceof Map ? [...list.values()] : Object.values(list);
    return entries.find(e => e?.isPlayer && Number(e?.d?.id) === id) || null;
  }

  /* ─── toast ───────────────────────────────────────────────── */

  function showBlockedToast(nick) {
    if (typeof window.RZP_SHOW_TOAST === 'function') {
      window.RZP_SHOW_TOAST('\uD83D\uDEE1 Missclick zablokowany! (' + nick + ')', {

        color: 'red',
        ms: 2500,
      });
    }
  }

  /* ─── _g hook ─────────────────────────────────────────────── */

  function tryInstallHook() {
    if (hookInstalled) return true;
    if (typeof window._g !== 'function') return false;

    originalG = window._g;

    window._g = function (request) {
      if (
        state.enabled &&
        typeof request === 'string' &&
        /^fight(?:&|$)/.test(request)
      ) {
        const targetId = parseFightTarget(request);
        if (targetId !== null) {
          const player = getPlayerById(targetId);
          const rel = Number(player?.d?.relation);
          if (player && isRelationBlocked(rel)) {
            showBlockedToast(player.d?.nick || '?');
            return;
          }
        }
      }
      return originalG.apply(this, arguments);
    };

    hookInstalled = true;
    return true;
  }

  function startRetry() {
    if (retryInterval) return;
    retryInterval = setInterval(function () {
      if (tryInstallHook()) {
        clearInterval(retryInterval);
        retryInterval = null;
      }
    }, 500);
    setTimeout(function () {
      if (retryInterval) {
        clearInterval(retryInterval);
        retryInterval = null;
      }
    }, 15000);
  }

  /* ─── settings window ─────────────────────────────────────── */

  function buildSettingsWindow() {
    if (state.settingsWin) return state.settingsWin;

    const win = document.createElement('div');
    win.id = SETTINGS_ID;
    win.className = 'rzp-addon-mini-settings hidden';
    win.style.top  = '200px';
    win.style.left = 'calc(50% - 140px)';

    // Header
    const header = document.createElement('div');
    header.className = 'rzp-addon-mini-settings-header';
    header.innerHTML = '\uD83D\uDEE1 Sorry, missclick \u2014 ustawienia';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'rzp-addon-mini-settings-close';
    closeBtn.textContent = '\u2715';
    closeBtn.addEventListener('click', function () {
      win.classList.add('hidden');
    });
    header.appendChild(closeBtn);

    // Body
    const body = document.createElement('div');
    body.className = 'rzp-addon-mini-settings-body';

    // Per-relation toggles
    FRIENDLY_RELATIONS.forEach(function (entry) {
      const key = 'blockRelation' + entry.rel;

      const row = document.createElement('div');
      row.className = 'rzp-dock-toggle-row';
      row.style.marginTop = '0';
      row.style.marginBottom = '6px';

      const label = document.createElement('span');
      label.className = 'rzp-dock-toggle-label';
      label.textContent = 'Blokuj atak na ' + entry.accusative;

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'rzp-dock-toggle-checkbox';
      cb.checked = state.settings[key];
      cb.addEventListener('change', function () {
        state.settings[key] = cb.checked;
        saveSettings();
      });

      row.appendChild(label);
      row.appendChild(cb);
      body.appendChild(row);
    });

    // Widget visibility (dock)
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
    name: 'Sorry, missclick',

    enable() {
      state.settings = loadSettings();
      state.enabled  = true;
      if (!tryInstallHook()) {
        startRetry();
      }
      return true;
    },

    disable() {
      state.enabled = false;
      return true;
    },

    runWidget() {
      // LPM bez funkcji
    },

    openSettings() {
      const win = buildSettingsWindow();
      win.classList.toggle('hidden');
    },
  };

  window.RZP_ADDONS_REGISTRY = window.RZP_ADDONS_REGISTRY || {};
  window.RZP_ADDONS_REGISTRY[ADDON_ID] = addonApi;
})();
