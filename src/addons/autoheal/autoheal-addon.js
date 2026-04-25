(function () {
  'use strict';

  if (window.__RZP_AUTOHEAL_LOADED) return;
  window.__RZP_AUTOHEAL_LOADED = true;

  const ADDON_ID    = 'autoheal';
  const STORAGE_KEY = 'rzp_autoheal_settings';
  const POTION_SCAN_INTERVAL_MS = 4000;
  const NO_POTIONS_RETRY_MS = 20000;

  const DEFAULT_THRESHOLD = 80; // %

  const state = {
    active:           false,
    timer:            null,
    healing:          false,
    wasDead:          false,
    respawnGuardUntil: 0,   // timestamp — nie lecz przed tym czasem (gr. po respawnie)
    settingsWin:      null,
    hpThreshold:      DEFAULT_THRESHOLD,
    noPotionsToastShown: false,
    noPotionsRetryUntil: 0,
    cachedHealingInstanceId: null,
    lastPotionScanAt: 0,
  };

  /* ─── storage ─────────────────────────────────────────────── */

  function loadSettings() {
    try {
      const r = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        active:      r.active === true,
        hpThreshold: (typeof r.hpThreshold === 'number' && r.hpThreshold >= 1 && r.hpThreshold <= 100)
                       ? r.hpThreshold : DEFAULT_THRESHOLD
      };
    } catch (e) {
      return { active: false, hpThreshold: DEFAULT_THRESHOLD };
    }
  }

  function saveSettings() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        active:      state.active,
        hpThreshold: state.hpThreshold
      }));
    } catch (e) {}
  }

  /* ─── HP detection ─────────────────────────────────────────── */

  function getHpPercent() {
    try {
      const ws = window.Engine?.hero?.d?.warrior_stats;
      if (ws && typeof ws.hp === 'number' && typeof ws.maxhp === 'number' && ws.maxhp > 0) {
        return (ws.hp / ws.maxhp) * 100;
      }
    } catch (e) {}
    return null;
  }

  /* ─── Healing item detection ──────────────────────────────── */

  // Sprawdza czy parseStats() przedmiotu wskazuje na leczenie
  // Stat 'perheal' = % leczenia, 'heal' = flat HP, 'fullheal' = pełne leczenie
  // Stat 'poison' = trucizna — odrzucamy
  function statsAreHealing(stats) {
    if (!stats) return false;
    if (stats.poison) return false;

    // `perheal` = % leczenia (mikstury),  `leczy` = flat HP (mikstury)
    // `fullheal` = pełne leczenie,         `hpsa`  = HP per second
    // NIE używamy `heal` — to stat ekwipunku (+heal bonus), nie wskaźnik mikstury
    const perheal  = parseFloat(stats.perheal  || 0);
    const leczy    = parseFloat(stats.leczy    || 0);
    const fullheal = parseFloat(stats.fullheal || 0);
    const hpsa     = parseFloat(stats.hpsa     || 0);

    return perheal > 0 || leczy > 0 || fullheal > 0 || hpsa > 0;
  }

  function findHealingItems(debug = false) {
    const log = (...a) => debug && console.warn('[AutoHeal]', ...a);
    const result = [];
    const seen   = new Set();

    // Poziom 1: DOM — działa gdy torba otwarta
    const domEls = document.querySelectorAll('.inventory-item');
    log('DOM .inventory-item count:', domEls.length);

    for (const el of domEls) {
      const idMatch = (el.className || '').match(/item-id-(\d+)/);
      if (!idMatch) continue;
      const idStr = idMatch[1];
      if (seen.has(idStr)) continue;
      try {
        const item  = window.Engine.items.getItemById(idStr);
        if (!item) continue;
        const stats = item.parseStats?.();
        if (statsAreHealing(stats)) {
          seen.add(idStr);
          result.push({ el, item, instanceId: idStr });
          log('DOM healing item:', idStr, JSON.stringify(stats));
        }
      } catch (e) { log('DOM err', idStr, e.message); }
    }

    // Poziom 2: Engine.bags — działa gdy torba ZAMKNIĘTA
    if (!result.length) {
      log('DOM puste — szukam w Engine.bags...');
      const bags = window.Engine?.bags;
      if (Array.isArray(bags)) {
        outer:
        for (const bag of bags) {
          if (!Array.isArray(bag)) continue;
          for (const id of bag) {
            if (!id || id < 100000) continue;
            const idStr = String(id);
            if (seen.has(idStr)) continue;
            try {
              const item  = window.Engine.items.getItemById(idStr);
              if (!item) continue;
              const stats = item.parseStats?.();
              if (statsAreHealing(stats)) {
                seen.add(idStr);
                const el = document.querySelector(`[class*="item-id-${idStr}"]`) || null;
                result.push({ el, item, instanceId: idStr });
                log('Engine.bags healing item:', idStr, JSON.stringify(stats));
                break outer; // wystarczy pierwsza, reszta w kolejnych tickach
              }
            } catch (e) { log('Engine.bags err', idStr, e.message); }
          }
        }
      }
    }

    return result;
  }

  function getCachedHealingItem(debug = false) {
    const cachedId = state.cachedHealingInstanceId;
    if (!cachedId) return null;

    try {
      const item = window.Engine?.items?.getItemById(cachedId);
      if (!item) return null;
      const stats = item.parseStats?.();
      if (!statsAreHealing(stats)) return null;
      const el = document.querySelector(`[class*="item-id-${cachedId}"]`) || null;
      return { el, item, instanceId: cachedId };
    } catch (e) {
      if (debug) console.warn('[AutoHeal] cache err', e.message);
      return null;
    }
  }

  function getHealingItem(debug = false) {
    const hadCachedId = !!state.cachedHealingInstanceId;
    const cached = getCachedHealingItem(debug);
    if (cached) return cached;

    // Jeśli cache był, ale stracił ważność (np. zużyta mikstura),
    // skanuj natychmiast aby szybko znaleźć kolejną.
    if (hadCachedId) state.lastPotionScanAt = 0;

    const now = Date.now();
    if (now - state.lastPotionScanAt < POTION_SCAN_INTERVAL_MS) return null;

    state.lastPotionScanAt = now;
    const items = findHealingItems(debug);
    const first = items[0] || null;
    state.cachedHealingInstanceId = first ? String(first.instanceId) : null;
    return first;
  }

  /* ─── Item use ────────────────────────────────────────────── */

  function useItem({ el, item, instanceId }) {
    const tplId  = Number(item.getTpl?.() ?? 0);
    const instId = Number(instanceId ?? 0);

    console.warn('[AutoHeal] useItem instId:', instId, 'tplId:', tplId, 'el:', !!el);

    // Metoda 1: Engine.hero.sendUseRequest (potwierdzone w logach gry)
    try {
      const hero = window.Engine?.hero;
      if (typeof hero?.sendUseRequest === 'function') {
        hero.sendUseRequest(instId, tplId);
        return;
      }
    } catch (e) { console.warn('[AutoHeal] sendUseRequest err:', e.message); }

    // Metoda 2: dblclick na elemencie DOM
    const target = el || document.querySelector(`[class*="item-id-${instanceId}"]`);
    if (target) {
      try {
        target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
        return;
      } catch (e) { console.warn('[AutoHeal] dblclick err:', e.message); }
    }

    console.warn('[AutoHeal] WSZYSTKIE metody zawiodły dla instId:', instId);
  }

  /* ─── Heal logic ──────────────────────────────────────────── */

  function tryHeal(debug = false) {
    const log = (...a) => debug && console.warn('[AutoHeal]', ...a);

    if (!state.active)  { log('SKIP: addon nieaktywny'); return; }
    if (state.healing)  { log('SKIP: cooldown'); return; }

    const hpPct = getHpPercent();
    if (hpPct === null) { log('SKIP: nie można odczytać HP'); return; }

    // Gracz martwy — zapamiętaj, nie próbuj leczyć
    if (hpPct <= 0) {
      if (!state.wasDead) {
        state.wasDead = true;
        log('Wykryto śmierć — czekam na respawn');
      }
      return;
    }

    // Respawn — gracz był martwy, teraz ma HP > 0
    // Dodaj opóźnienie (gracz może być jeszcze w animacji nieprzytomności)
    if (state.wasDead) {
      state.wasDead           = false;
      state.respawnGuardUntil = Date.now() + 3000; // 3 sekundy po respawnie
      log('Respawn wykryty — blokada leczenia na 3s');
      return;
    }

    // Ochrona po respawnie jeszcze trwa
    if (Date.now() < state.respawnGuardUntil) {
      log('SKIP: blokada po respawnie, pozostało:', Math.ceil((state.respawnGuardUntil - Date.now()) / 1000) + 's');
      return;
    }

    if (Date.now() < state.noPotionsRetryUntil) {
      return;
    }

    if (hpPct >= state.hpThreshold) return;

    const itemToUse = getHealingItem(debug);
    if (!itemToUse) {
      state.noPotionsRetryUntil = Date.now() + NO_POTIONS_RETRY_MS;
      if (!state.noPotionsToastShown) {
        state.noPotionsToastShown = true;
        window.RZP_SHOW_TOAST?.('AutoHeal: brak mikstur leczących!', { color: 'orange', ms: 3000 });
        console.warn('[AutoHeal] brak mikstur leczących w torbie (pokazano tylko raz do reloadu)');
      }
      return;
    }

    state.noPotionsRetryUntil = 0;
    state.healing = true;
    useItem(itemToUse);
    state.cachedHealingInstanceId = null;
    state.lastPotionScanAt = 0;
    window.RZP_SHOW_TOAST?.(
      `AutoHeal: użyto eliksiru (HP: ${Math.round(hpPct)}%)`,
      { color: 'green', ms: 2500 }
    );

    // Cooldown — daje czas na zadziałanie mikstury zanim użyje kolejnej
    setTimeout(() => { state.healing = false; }, 3500);
  }

  /* ─── HP polling (300ms ≈ natychmiastowe) ─────────────────── */

  function startPolling() {
    if (state.timer) return;
    state.timer = setInterval(tryHeal, 300);
  }

  function stopPolling() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    state.healing           = false;
    state.wasDead           = false;
    state.respawnGuardUntil = 0;
  }

  /* ─── activate / deactivate ───────────────────────────────── */

  function activate() {
    state.active = true;
    startPolling();
    saveSettings();
    window.RZP_SET_DOCK_BTN_ACTIVE?.(ADDON_ID);
    window.RZP_SHOW_TOAST?.('AutoHeal: włączony', { color: 'green', ms: 2000 });
  }

  function deactivate() {
    state.active = false;
    stopPolling();
    saveSettings();
    window.RZP_SET_DOCK_BTN_ACTIVE?.(ADDON_ID);
    window.RZP_SHOW_TOAST?.('AutoHeal: wyłączony', { color: 'orange', ms: 2000 });
  }

  /* ─── settings window ──────────────────────────────────────── */

  function ensureSettingsWin() {
    if (state.settingsWin) return state.settingsWin;

    const win = document.createElement('div');
    win.id = 'rzp-autoheal-settings';
    win.className = 'rzp-addon-mini-settings hidden';
    win.style.top  = '180px';
    win.style.left = 'calc(50% - 140px)';

    const header = document.createElement('div');
    header.className = 'rzp-addon-mini-settings-header';
    header.textContent = 'AutoHeal — ustawienia';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'rzp-addon-mini-settings-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => win.classList.add('hidden'));
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'rzp-addon-mini-settings-body';

    // Wiersz widoczności ikonki na docku
    const dockRow = window.RZP_DOCK_HIDDEN_UTILS?.makeRow?.(ADDON_ID);
    if (dockRow) body.appendChild(dockRow);

    // Suwak progu HP
    body.insertAdjacentHTML('beforeend', `
      <div style="margin-top:4px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:11px;color:#9aa6bf">Próg HP do leczenia</span>
          <span id="ah-threshold-val" style="font-size:11px;font-weight:700;color:#4ade80">${state.hpThreshold}%</span>
        </div>
        <input type="range" id="ah-cfg-threshold" min="1" max="100" value="${state.hpThreshold}"
               style="width:100%" />
        <div style="font-size:10px;color:#9aa6bf;margin-top:5px;line-height:1.4">
          Leczenie uruchamia się gdy HP po walce<br>
          spadnie poniżej tej wartości.
        </div>
      </div>
    `);

    // Przycisk diagnostyczny
    const debugBtn = document.createElement('button');
    debugBtn.className = 'rzp-addon-mini-settings-btn';
    debugBtn.textContent = '🔍 Test teraz (patrz konsola)';
    debugBtn.style.marginTop = '10px';
    debugBtn.addEventListener('click', () => {
      const wasActive = state.active;
      state.active = true;
      state.healing = false;
      state.hpThreshold = 101; // wymusz leczenie niezależnie od HP
      tryHeal(true);
      state.hpThreshold = Number(body.querySelector('#ah-cfg-threshold').value);
      state.active = wasActive;
    });
    body.appendChild(debugBtn);

    const slider   = body.querySelector('#ah-cfg-threshold');
    const valLabel = body.querySelector('#ah-threshold-val');

    slider.addEventListener('input', () => {
      state.hpThreshold = Number(slider.value);
      valLabel.textContent = state.hpThreshold + '%';
      saveSettings();
    });

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
    name: 'AutoHeal',

    enable() {
      const saved = loadSettings();
      state.hpThreshold = saved.hpThreshold;
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
      if (willShow) {
        const sl = win.querySelector('#ah-cfg-threshold');
        if (sl) sl.value = state.hpThreshold;
        const vl = win.querySelector('#ah-threshold-val');
        if (vl) vl.textContent = state.hpThreshold + '%';
      }
    },
  };

  window.RZP_ADDONS_REGISTRY = window.RZP_ADDONS_REGISTRY || {};
  window.RZP_ADDONS_REGISTRY[ADDON_ID] = addonApi;
})();
