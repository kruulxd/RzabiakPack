(function () {
  'use strict';

  const ADDON_ID = 'random-group';
  const ALLOWED_RELATIONS = [2, 4, 5];

  const state = {
    enabled: false,
    keyHandler: null,
  };

  function isChatFocused() {
    const el = document.activeElement;
    return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
  }

  function isInParty(id) {
    const members = window.Engine?.party?.getMembers?.();
    if (!members) return false;
    if (members instanceof Map) {
      return members.has(id) || members.has(Number(id)) || members.has(String(id));
    }
    return Object.prototype.hasOwnProperty.call(members, id);
  }

  function canInvite(player) {
    return ALLOWED_RELATIONS.includes(player.d.relation);
  }

  function getShuffledPlayerIds() {
    const drawableList = window.Engine?.others?.getDrawableList?.() || {};
    const entries = drawableList instanceof Map ? [...drawableList.values()] : Object.values(drawableList);
    return entries
      .filter(entry => entry.isPlayer && canInvite(entry))
      .map(entry => ({ id: entry.d.id, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(entry => entry.id);
  }

  function invitePlayer(playerId) {
    if (!isChatFocused() && !isInParty(playerId)) {
      _g('party&a=inv&id=' + playerId);
    }
  }

  function inviteAll() {
    if (!state.enabled) return;
    const ids = getShuffledPlayerIds();
    for (const id of ids) {
      invitePlayer(id);
    }
  }

  let settingsWin = null;

  const addonApi = {
    id: ADDON_ID,
    name: 'Random Group',

    enable() {
      if (state.keyHandler) return true;
      state.enabled = true;
      state.keyHandler = function (e) {
        if (e.keyCode === 86) inviteAll(); // V
      };
      document.addEventListener('keydown', state.keyHandler);
      return true;
    },

    disable() {
      state.enabled = false;
      if (state.keyHandler) {
        document.removeEventListener('keydown', state.keyHandler);
        state.keyHandler = null;
      }
      return true;
    },

    runWidget() {},

    openSettings() {
      if (!settingsWin) {
        settingsWin = document.createElement('div');
        settingsWin.id = 'rzp-random-group-addon-settings';
        settingsWin.className = 'rzp-addon-mini-settings hidden';
        settingsWin.style.top  = '180px';
        settingsWin.style.left = 'calc(50% - 140px)';
        const h = document.createElement('div');
        h.className = 'rzp-addon-mini-settings-header';
        h.textContent = 'Random Group — ustawienia';
        const cb = document.createElement('button');
        cb.className = 'rzp-addon-mini-settings-close';
        cb.textContent = '✕';
        cb.addEventListener('click', () => settingsWin.classList.add('hidden'));
        h.appendChild(cb);
        const b = document.createElement('div');
        b.className = 'rzp-addon-mini-settings-body';
        const dr = window.RZP_DOCK_HIDDEN_UTILS?.makeRow?.(ADDON_ID);
        if (dr) b.appendChild(dr);
        settingsWin.appendChild(h);
        settingsWin.appendChild(b);
        document.body.appendChild(settingsWin);
        if (typeof window.RZP_MAKE_DRAGGABLE === 'function') {
          window.RZP_MAKE_DRAGGABLE(settingsWin, h);
        }
      }
      settingsWin.classList.toggle('hidden');
    },
  };

  window.RZP_ADDONS_REGISTRY = window.RZP_ADDONS_REGISTRY || {};
  window.RZP_ADDONS_REGISTRY[ADDON_ID] = addonApi;
})();
