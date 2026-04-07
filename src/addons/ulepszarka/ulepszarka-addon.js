(function () {
  'use strict';

  const ADDON_ID = 'ulepszarka-ni';
  const CORE_SCRIPT_URL = 'https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/src/addons/ulepszarka/ulepszarka-core.js';
  const DISABLE_STYLE_ID = 'rzp-ulepszarka-ni-disabled-style';

  let loadPromise = null;

  function isCoreLoaded() {
    return !!window.__RZP_ULEPSZARKA_NI_CORE_LOADED
      || !!document.querySelector('.upgrader-launcher')
      || !!document.querySelector('.upgrader-modal');
  }

  function ensureCoreLoaded() {
    if (isCoreLoaded()) {
      window.__RZP_ULEPSZARKA_NI_CORE_LOADED = true;
      return Promise.resolve(true);
    }

    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-rzp-ulepszarka-ni-core="1"]');
      if (existing) {
        resolve(true);
        return;
      }

      const versionedUrl = `${CORE_SCRIPT_URL}?v=${Date.now()}`;

      if (typeof window.__RZP_LOAD_MODULE === 'function') {
        const marker = document.createElement('script');
        marker.type = 'text/rzp-marker';
        marker.dataset.rzpUlepszarkaNiCore = '1';
        document.body.appendChild(marker);
        window.__RZP_LOAD_MODULE(
          versionedUrl,
          () => { window.__RZP_ULEPSZARKA_NI_CORE_LOADED = true; resolve(true); },
          () => reject(new Error('Nie udalo sie zaladowac Ulepszarki NI.'))
        );
      } else {
        const script = document.createElement('script');
        script.src = versionedUrl;
        script.async = true;
        script.dataset.rzpUlepszarkaNiCore = '1';
        script.onload = () => {
          window.__RZP_ULEPSZARKA_NI_CORE_LOADED = true;
          resolve(true);
        };
        script.onerror = () => {
          reject(new Error('Nie udalo sie zaladowac Ulepszarki NI.'));
        };
        document.body.appendChild(script);
      }
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
      .upgrader-launcher,
      .upgrader-modal,
      .upgrader-root,
      [class*="upgrader-"] {
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
    return window.__RZP_ULEPSZARKA_NI_API || null;
  }

  function toggleGuiPanelFallback() {
    const panel = document.getElementById('upgrader-gui-panel');
    if (panel) {
      const isVisible = getComputedStyle(panel).display !== 'none';
      panel.style.display = isVisible ? 'none' : 'block';
      return true;
    }

    const configBtn = document.getElementById('upgrader-launcher-config-btn');
    if (configBtn) {
      configBtn.click();
      return true;
    }

    return false;
  }

  function toggleLauncherFallback() {
    const launcher = document.getElementById('upgrader-launcher');
    if (!launcher) return false;

    const isVisible = getComputedStyle(launcher).display !== 'none';
    launcher.style.display = isVisible ? 'none' : 'block';

    const guiPanel = document.getElementById('upgrader-gui-panel');
    if (guiPanel && !isVisible) {
      guiPanel.style.display = 'none';
    }

    return true;
  }

  let settingsWin = null;

  function ensureSettingsWin() {
    if (settingsWin) return settingsWin;
    const win = document.createElement('div');
    win.id = 'rzp-ulepszarka-ni-addon-settings';
    win.className = 'rzp-addon-mini-settings hidden';
    win.style.top  = '180px';
    win.style.left = 'calc(50% - 140px)';
    const header = document.createElement('div');
    header.className = 'rzp-addon-mini-settings-header';
    header.textContent = 'Ulepszarka NI — ustawienia';
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
    coreBtn.textContent = 'Ustawienia Ulepszarki →';
    coreBtn.addEventListener('click', () => {
      win.classList.add('hidden');
      const api = getCoreApi();
      if (api?.toggleSettingsPanel) { api.toggleSettingsPanel(); return; }
      if (api?.openSettingsPanel)   { api.openSettingsPanel();   return; }
      toggleGuiPanelFallback();
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
    name: 'Ulepszarka NI',

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
      if (api?.toggleWidgetLauncher) {
        api.toggleWidgetLauncher();
        return true;
      }

      toggleLauncherFallback();
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
