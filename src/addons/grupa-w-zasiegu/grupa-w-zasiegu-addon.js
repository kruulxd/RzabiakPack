(function () {
  'use strict';

  const ADDON_ID    = 'grupa-w-zasiegu';
  const STYLE_ID    = 'rzp-gwz-style';
  const SETTINGS_ID = 'rzp-gwz-settings';
  const STORAGE_KEY = 'rzp_gwz_settings';
  const DEFAULT_COLOR = '#ef4444';

  const state = {
    enabled: false,
    hooked: false,
    originalParseJSON: null,
    settings: { color: DEFAULT_COLOR },
  };

  function isValidColor(str) {
    return typeof str === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(str.trim());
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && isValidColor(parsed.color)) {
        state.settings.color = parsed.color.trim();
      }
    } catch (e) {}
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
    } catch (e) {}
  }

  function isOtherInBattleRange(other) {
    const hero = window.Engine?.hero?.d;
    const otherData = other?.d;
    if (!hero || !otherData) return false;

    const dx = Math.abs(Number(otherData.x) - Number(hero.x));
    const dy = Math.abs(Number(otherData.y) - Number(hero.y));
    return Math.max(dx, dy) <= 20;
  }

  function setPartyNickColor(id, color) {
    const el = document.querySelector(`.party-member.other-party-id-${id} .nickname-text`);
    if (el) el.style.color = color;
  }

  function updatePartyMembers() {
    if (!state.enabled) return;

    const party = window.Engine?.party;
    const hero = window.Engine?.hero?.d;
    const othersApi = window.Engine?.others;

    if (!party || !hero) return;

    const members = party.getMembers?.();
    if (!members) return;
    const heroId = String(hero.id);

    const drawableList = othersApi?.getDrawableList?.() || {};

    // Build id→entry map from drawable list for range checks
    const drawableById = {};
    for (const entry of Object.values(drawableList)) {
      const eid = entry?.d?.id;
      if (eid != null) drawableById[String(eid)] = entry;
    }

    const ids = members instanceof Map ? [...members.keys()] : Object.keys(members);
    for (const id of ids) {
      if (String(id) === heroId) continue;

      const entry = drawableById[String(id)];
      const inRange = entry && isOtherInBattleRange(entry);
      setPartyNickColor(id, inRange ? '' : (state.settings.color || DEFAULT_COLOR));
    }
  }

  function clearPartyMemberColors() {
    const party = window.Engine?.party;
    const hero = window.Engine?.hero?.d;
    if (!party || !hero) return;

    const members = party.getMembers?.();
    if (!members) return;
    const heroId = String(hero.id);
    const ids = members instanceof Map ? [...members.keys()] : Object.keys(members);
    for (const id of ids) {
      if (String(id) !== heroId) setPartyNickColor(id, '');
    }
  }

  function ensureHooked() {
    if (state.hooked) return;

    const communication = window.Engine?.communication;
    if (!communication || typeof communication.parseJSON !== 'function') return;

    const original = communication.parseJSON;
    state.originalParseJSON = original;

    communication.parseJSON = function (...args) {
      const result = original.apply(this, args);
      const data = args[0];

      if (state.enabled && data && (data.h || data.party || data.other || data.others)) {
        updatePartyMembers();
      }

      return result;
    };

    state.hooked = true;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${SETTINGS_ID} {
        position: fixed;
        z-index: 18;
        min-width: 260px;
        border-radius: 12px;
        border: 1px solid rgba(52,211,100,0.18);
        background: linear-gradient(160deg, rgba(6,16,9,0.98), rgba(4,12,7,0.99));
        box-shadow:
          0 0 0 1px rgba(34,197,94,0.06) inset,
          0 16px 40px rgba(0,0,0,0.65),
          0 0 24px rgba(34,197,94,0.04);
        color: #c8ead4;
        font-family: 'Trebuchet MS', Tahoma, Verdana, sans-serif;
        font-size: 13px;
        overflow: hidden;
        user-select: none;
      }
      #${SETTINGS_ID} .gwz-header {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 9px 12px 8px;
        background: rgba(0,0,0,0.2);
        border-bottom: 1px solid rgba(52,211,100,0.12);
        cursor: move;
      }
      #${SETTINGS_ID} .gwz-header::before {
        content: '';
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #22c55e;
        opacity: 0.7;
        flex-shrink: 0;
      }
      #${SETTINGS_ID} .gwz-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.4px;
        color: #c8ead4;
        flex: 1;
      }
      #${SETTINGS_ID} .gwz-close {
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
      #${SETTINGS_ID} .gwz-close:hover {
        background: rgba(239,68,68,0.18);
        border-color: rgba(239,68,68,0.35);
        color: #f87171;
      }
      #${SETTINGS_ID} .gwz-body {
        padding: 10px 12px 12px;
        font-size: 11px;
      }
      #${SETTINGS_ID} .gwz-label {
        color: #4a7a54;
        font-size: 11px;
        margin-bottom: 8px;
        display: block;
      }
      #${SETTINGS_ID} .gwz-color-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 7px 9px;
        border-radius: 7px;
        border: 1px solid rgba(52,211,100,0.09);
        background: rgba(255,255,255,0.02);
      }
      #${SETTINGS_ID} .gwz-color-input {
        width: 44px;
        height: 44px;
        border: 1px solid rgba(52,211,100,0.25);
        border-radius: 6px;
        cursor: pointer;
        background: none;
        padding: 2px;
        flex-shrink: 0;
      }
      #${SETTINGS_ID} .gwz-color-value {
        font-size: 11px;
        color: #9acba6;
        font-family: monospace;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureSettings() {
    if (document.getElementById(SETTINGS_ID)) return;
    ensureStyle();

    const win = document.createElement('div');
    win.id = SETTINGS_ID;
    win.style.top = '120px';
    win.style.left = '60px';
    win.style.display = 'none';
    win.innerHTML = `
      <div class="gwz-header">
        <span class="gwz-title">Grupa w zasięgu — Ustawienia</span>
        <button class="gwz-close">✕</button>
      </div>
      <div class="gwz-body">
        <span class="gwz-label">Kolor gracza poza zasięgiem walki:</span>
        <div class="gwz-color-row">
          <input type="color" class="gwz-color-input" value="${state.settings.color}">
          <span class="gwz-color-value">${state.settings.color}</span>
        </div>
      </div>
    `;

    win.querySelector('.gwz-close').addEventListener('click', () => {
      win.style.display = 'none';
    });

    const colorInput = win.querySelector('.gwz-color-input');
    const colorValue = win.querySelector('.gwz-color-value');
    colorInput.addEventListener('input', () => {
      state.settings.color = colorInput.value;
      colorValue.textContent = colorInput.value;
      saveSettings();
      updatePartyMembers();
    });

    // Drag support
    const header = win.querySelector('.gwz-header');
    let dragging = false, ox = 0, oy = 0;
    header.addEventListener('mousedown', e => {
      dragging = true;
      ox = e.clientX - win.offsetLeft;
      oy = e.clientY - win.offsetTop;
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      win.style.left = (e.clientX - ox) + 'px';
      win.style.top  = (e.clientY - oy) + 'px';
    });
    document.addEventListener('mouseup', () => { dragging = false; });

    const dockRow = window.RZP_DOCK_HIDDEN_UTILS?.makeRow?.(ADDON_ID);
    if (dockRow) {
      const body = win.querySelector('.gwz-body');
      if (body) body.appendChild(dockRow);
    }

    document.body.appendChild(win);
  }

  const addonApi = {
    id: ADDON_ID,
    name: 'Grupa w zasięgu',

    async enable() {
      loadSettings();
      state.enabled = true;
      ensureHooked();
      updatePartyMembers();
      return true;
    },

    disable() {
      state.enabled = false;
      clearPartyMemberColors();
      return true;
    },

    debug() {
      const party = window.Engine?.party;
      const hero = window.Engine?.hero?.d;
      const othersApi = window.Engine?.others;

      console.group('[GWZ Debug]');
      console.log('state.enabled:', state.enabled);
      console.log('state.settings.color:', state.settings.color);
      console.log('Engine.party:', party);
      console.log('Engine.hero.d:', hero);

      const members = party?.getMembers?.() || {};
      console.log('party.getMembers():', members);
      console.log('member IDs:', members instanceof Map ? [...members.keys()] : Object.keys(members));

      const drawableList = othersApi?.getDrawableList?.() || {};
      console.log('others.getDrawableList() count:', Object.keys(drawableList).length);
      const playerEntries = Object.values(drawableList).filter(e => e?.isPlayer);
      console.log('players in drawable list:', playerEntries.map(e => ({ id: e.d?.id, nick: e.d?.nick, x: e.d?.x, y: e.d?.y })));

      console.log('hero position:', { x: hero?.x, y: hero?.y });

      const domMembers = document.querySelectorAll('.party-member[class*="other-party-id-"]');
      console.log('DOM party members found:', domMembers.length);
      domMembers.forEach(el => {
        const cls = [...el.classList].find(c => c.startsWith('other-party-id-'));
        const nickEl = el.querySelector('.nickname-text');
        console.log('  DOM member:', cls, '| nick:', nickEl?.textContent, '| current color:', nickEl?.style?.color);
      });

      const debugIds = members instanceof Map ? [...members.keys()] : Object.keys(members);
      for (const id of debugIds) {
        if (String(id) === String(hero?.id)) continue;
        const entry = Object.values(drawableList).find(e => String(e?.d?.id) === String(id));
        const domEl = document.querySelector(`.party-member.other-party-id-${id} .nickname-text`);
        const inRange = entry ? isOtherInBattleRange(entry) : null;
        console.log(`  Member id=${id}: drawable=${!!entry}, domEl=${!!domEl}, inRange=${inRange}`);
      }
      console.groupEnd();
    },

    runWidget() {},

    openSettings() {
      ensureSettings();
      const win = document.getElementById(SETTINGS_ID);
      if (!win) return;
      // Sync picker with current (possibly loaded) settings
      const colorInput = win.querySelector('.gwz-color-input');
      const colorValue = win.querySelector('.gwz-color-value');
      if (colorInput) colorInput.value = state.settings.color;
      if (colorValue) colorValue.textContent = state.settings.color;
      win.style.display = win.style.display === 'none' ? 'block' : 'none';
    },
  };

  window.RZP_ADDONS_REGISTRY = window.RZP_ADDONS_REGISTRY || {};
  window.RZP_ADDONS_REGISTRY[ADDON_ID] = addonApi;
})();
