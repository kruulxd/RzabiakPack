(function () {
  'use strict';

  if (window.__RZP_KALENDARZ_LOADED) return;
  window.__RZP_KALENDARZ_LOADED = true;

  const ADDON_ID    = 'kalendarz';
  const STYLE_ID    = 'rzp-kalendarz-style';
  const STORAGE_KEY = 'rzp_kalendarz_state';

  /* --- state ------------------------------------------------ */
  const state = {
    enabled:        false,
    checkTimeoutId: null,
    isCollecting:   false
  };

  /* --- helpers ---------------------------------------------- */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function waitForElement(selector, timeout) {
    timeout = timeout || 4000;
    return new Promise(function (resolve, reject) {
      var el = document.querySelector(selector);
      if (el) { resolve(el); return; }
      var obs = new MutationObserver(function () {
        var found = document.querySelector(selector);
        if (!found) return;
        obs.disconnect();
        resolve(found);
      });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { obs.disconnect(); reject(new Error('Timeout: ' + selector)); }, timeout);
    });
  }

  /* --- date / storage --------------------------------------- */
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function loadKalState() {
    try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function saveKalState(data) {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (e) {}
  }

  /* --- character identification ----------------------------- */
  function getCurrentCharKey() {
    try {
      if (window.Engine && window.Engine.hero && window.Engine.hero.d && window.Engine.hero.d.nick)
        return String(window.Engine.hero.d.nick);
      if (window.hero && window.hero.d && window.hero.d.nick)
        return String(window.hero.d.nick);
    } catch (e) {}
    var selectors = ['.nick.hero-nick', '.hero-nick', '[data-hero-nick]', '.player-nick'];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return null;
  }

  function isCollectedToday(charKey) {
    if (!charKey) return false;
    return loadKalState()[charKey] === todayStr();
  }

  function markCollectedToday(charKey) {
    if (!charKey) return;
    var s = loadKalState();
    s[charKey] = todayStr();
    saveKalState(s);
  }

  /* --- calendar DOM interaction ----------------------------- */
  function calendarButtonEl() {
    return document.querySelector('.widget-rewards-calendar-icon');
  }

  function isCalendarOpen() {
    return !!document.querySelector('.day.current.today');
  }

  function openCalendar() {
    var btn = calendarButtonEl();
    if (btn) { btn.click(); return true; }
    return false;
  }

  function closeCalendar() {
    var closeSelectors = [
      '.rewards-calendar-container .close',
      '.rewards-calendar .close',
      '.event-rewards .close',
      '.rewards-calendar-container [data-close]',
      '[class*="calendar"] .close-button',
      '[class*="calendar"] button.close'
    ];
    for (var i = 0; i < closeSelectors.length; i++) {
      var el = document.querySelector(closeSelectors[i]);
      if (el) { el.click(); return; }
    }
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  }

  /* --- toast ------------------------------------------------ */
  function showToast(msg, color) {
    ensureStyle();
    var id = 'rzp-kal-toast';
    var toast = document.getElementById(id);
    if (!toast) {
      toast = document.createElement('div');
      toast.id = id;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    if (color === 'green') {
      toast.style.background   = 'rgba(6, 20, 10, 0.95)';
      toast.style.borderColor  = 'rgba(74, 222, 128, 0.45)';
      toast.style.color        = '#4ade80';
    } else {
      toast.style.background   = 'rgba(30, 12, 5, 0.95)';
      toast.style.borderColor  = 'rgba(251, 146, 60, 0.45)';
      toast.style.color        = '#fdba74';
    }
    toast.className = 'rzp-kal-toast';
    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(function () { toast.remove(); }, 4000);
  }

  /* --- CSS --------------------------------------------------- */
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#rzp-kal-toast {',
      '  position: fixed;',
      '  bottom: 60px;',
      '  left: 50%;',
      '  transform: translateX(-50%);',
      '  padding: 6px 14px;',
      '  border-radius: 8px;',
      '  border: 1px solid;',
      '  font-family: "Trebuchet MS", Tahoma, Verdana, sans-serif;',
      '  font-size: 12px;',
      '  font-weight: 600;',
      '  z-index: 20000;',
      '  pointer-events: none;',
      '  box-shadow: 0 6px 18px rgba(0,0,0,0.5);',
      '  white-space: nowrap;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* --- main logic ------------------------------------------- */
  async function tryCollect() {
    if (state.isCollecting) return;

    var charKey = getCurrentCharKey();
    if (!charKey) return;

    if (isCollectedToday(charKey)) {
      updateDockBadge(true);
      return;
    }

    if (!calendarButtonEl()) return;

    state.isCollecting = true;
    var wasOpen = isCalendarOpen();

    try {
      if (!wasOpen) {
        if (!openCalendar()) return;
        try {
          await waitForElement('.day.current.today', 3000);
        } catch (e) {
          return;
        }
      }

      // Already collected but not saved in our local state
      if (document.querySelector('.day.current.today .reward.is-open')) {
        markCollectedToday(charKey);
        showToast('\uD83D\uDCC5 Odebrano juz nagrode', 'orange');

        if (!wasOpen) closeCalendar();
        return;
      }

      var canOpen = document.querySelector('.day.current.today .reward.can-open');
      if (!canOpen) {
        if (!wasOpen) closeCalendar();
        return;
      }

      canOpen.click();
      await sleep(900);

      if (document.querySelector('.day.current.today .reward.is-open')) {
        markCollectedToday(charKey);
        showToast('\uD83D\uDCC5 Nagroda z kalendarza odebrana!', 'green');

      }

      if (!wasOpen) {
        await sleep(400);
        closeCalendar();
      }
    } catch (e) {
      console.log('[RZP Kalendarz] Blad: ' + e);
    } finally {
      state.isCollecting = false;
    }
  }

  /* --- one-shot check --------------------------------------- */
  function scheduleCheck() {
    if (state.checkTimeoutId) return;
    state.checkTimeoutId = setTimeout(function () {
      state.checkTimeoutId = null;
      tryCollect();
    }, 4000);
  }

  function cancelCheck() {
    if (state.checkTimeoutId) {
      clearTimeout(state.checkTimeoutId);
      state.checkTimeoutId = null;
    }
  }

  /* --- API -------------------------------------------------- */
  var settingsWin = null;

  var addonApi = {
    id:   ADDON_ID,
    name: 'Kalendarz',

    getTooltipLine: function () {
      var charKey = getCurrentCharKey();
      if (!charKey) return null;
      return isCollectedToday(charKey) ? '\u2713 Odebrano' : '\u25cb Nie odebrano';
    },

    async enable() {
      state.enabled = true;
      ensureStyle();
      scheduleCheck();
      return true;
    },

    disable() {
      state.enabled = false;
      cancelCheck();
      return true;
    },

    async runWidget()    { return true; },

    openSettings() {
      if (!settingsWin) {
        settingsWin = document.createElement('div');
        settingsWin.id = 'rzp-kalendarz-addon-settings';
        settingsWin.className = 'rzp-addon-mini-settings hidden';
        settingsWin.style.top  = '180px';
        settingsWin.style.left = 'calc(50% - 140px)';
        var h = document.createElement('div');
        h.className = 'rzp-addon-mini-settings-header';
        h.textContent = 'Kalendarz — ustawienia';
        var cb = document.createElement('button');
        cb.className = 'rzp-addon-mini-settings-close';
        cb.textContent = '✕';
        cb.addEventListener('click', function () { settingsWin.classList.add('hidden'); });
        h.appendChild(cb);
        var b = document.createElement('div');
        b.className = 'rzp-addon-mini-settings-body';
        var dr = window.RZP_DOCK_HIDDEN_UTILS?.makeRow?.(ADDON_ID);
        if (dr) b.appendChild(dr);
        settingsWin.appendChild(h);
        settingsWin.appendChild(b);
        document.body.appendChild(settingsWin);
        if (typeof window.RZP_MAKE_DRAGGABLE === 'function') {
          window.RZP_MAKE_DRAGGABLE(settingsWin, h);
        }
      }
      settingsWin.classList.toggle('hidden');
      return true;
    }
  };

  window.RZP_ADDONS_REGISTRY = window.RZP_ADDONS_REGISTRY || {};
  window.RZP_ADDONS_REGISTRY[ADDON_ID] = addonApi;
})();
