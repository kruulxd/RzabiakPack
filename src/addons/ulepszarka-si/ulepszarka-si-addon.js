(function () {
  'use strict';

  const ADDON_ID = 'ulepszarka-si';
  const CORE_SCRIPT_URL = 'https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/src/addons/ulepszarka-si/ulepszarka-si-core.js';
  const DISABLE_STYLE_ID = 'rzp-ulepszarka-si-disabled-style';

  let loadPromise = null;

  function isCoreLoaded() {
    return !!window.__RZP_ULEPSZARKA_SI_CORE_LOADED
      || !!document.getElementById('si-upg-box');
  }

  function ensureCoreLoaded() {
    if (isCoreLoaded()) {
      window.__RZP_ULEPSZARKA_SI_CORE_LOADED = true;
      return Promise.resolve(true);
    }

    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-rzp-ulepszarka-si-core="1"]');
      if (existing) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `${CORE_SCRIPT_URL}?v=${Date.now()}`;
      script.async = true;
      script.dataset.rzpUlepszarkaSiCore = '1';
      script.onload = () => {
        window.__RZP_ULEPSZARKA_SI_CORE_LOADED = true;
        resolve(true);
      };
      script.onerror = () => {
        reject(new Error('Nie udalo sie zaladowac Ulepszarki SI.'));
      };

      document.body.appendChild(script);
    }).finally(() => {
      loadPromise = null;
    });

    return loadPromise;
  }

  function ensureDisableStyle() {
    if (document.getElementById(DISABLE_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = DISABLE_STYLE_ID;
    style.textContent = `
      #si-upg-box,
      .si-upg-context,
      [class*="si-upg-"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;

    document.head.appendChild(style);
  }

  function removeDisableStyle() {
    const style = document.getElementById(DISABLE_STYLE_ID);
    if (style) style.remove();
  }

  function getCoreApi() {
    return window.__RZP_ULEPSZARKA_SI_API || null;
  }

  let settingsWin = null;

  function ensureSettingsWin() {
    if (settingsWin) return settingsWin;
    const win = document.createElement('div');
    win.id = 'rzp-ulepszarka-si-addon-settings';
    win.className = 'rzp-addon-mini-settings hidden';
    win.style.top  = '180px';
    win.style.left = 'calc(50% - 140px)';
    const header = document.createElement('div');
    header.className = 'rzp-addon-mini-settings-header';
    header.textContent = 'Ulepszarka SI — ustawienia';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'rzp-addon-mini-settings-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => win.classList.add('hidden'));
    header.appendChild(closeBtn);
    const body = document.createElement('div');
    body.className = 'rzp-addon-mini-settings-body';
    const dockRow = window.RZP_DOCK_HIDDEN_UTILS?.makeRow?.(ADDON_ID);
    if (dockRow) body.appendChild(dockRow);
    const coreBtn = document.createElement('button');
    coreBtn.className = 'rzp-addon-mini-settings-btn';
    coreBtn.textContent = 'Ustawienia Ulepszarki SI →';
    coreBtn.addEventListener('click', () => {
      win.classList.add('hidden');
      const api = getCoreApi();
      if (api?.openSettings) { api.openSettings(); return; }
      const box = document.getElementById('si-upg-box');
      const settings = document.querySelector('.si-upg-settings');
      if (box && settings) {
        box.style.display = 'block';
        settings.style.display = settings.style.display === 'block' ? 'none' : 'block';
      }
    });
    body.appendChild(coreBtn);
    win.appendChild(header);
    win.appendChild(body);
    document.body.appendChild(win);
    if (typeof window.RZP_MAKE_DRAGGABLE === 'function') {
      window.RZP_MAKE_DRAGGABLE(win, header);
    }
    settingsWin = win;
    return win;
  }

  const addonApi = {
    id: ADDON_ID,
    name: 'Ulepszarka SI',

    async enable() {
      removeDisableStyle();
      await ensureCoreLoaded();
      return true;
    },

    disable() {
      ensureDisableStyle();
      return true;
    },

    async runWidget() {
      await this.enable();

      const api = getCoreApi();
      if (api?.runWidget) {
        api.runWidget();
        return true;
      }

      const box = document.getElementById('si-upg-box');
      if (box) {
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
      }
      return true;
    },

    async openSettings() {
      await this.enable();
      const win = ensureSettingsWin();
      win.classList.toggle('hidden');
      return true;
    }
  };

  window.RZP_ADDONS_REGISTRY = window.RZP_ADDONS_REGISTRY || {};
  window.RZP_ADDONS_REGISTRY[ADDON_ID] = addonApi;
})();
