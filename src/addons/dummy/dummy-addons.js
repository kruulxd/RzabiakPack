(function () {
  'use strict';

  if (window.__RZP_DUMMY_ADDONS_LOADED) return;
  window.__RZP_DUMMY_ADDONS_LOADED = true;

  const ADDONS = [
    {
      id: 'roller',
      name: 'Roller',
      description: 'Automatyczne rollowanie bonusów u kowala.',
      accent: '#f97316'
    },
    {
      id: 'autoheal',
      name: 'Autoheal',
      description: 'Automatyczne leczenie postaci po walce, gdy HP poniżej wyznaczonego poziomu.',
      accent: '#f43f5e'
    },
    {
      id: 'relogger',
      name: 'Relogger',
      description: 'Automatyczne (lub ręczne) przelogowanie na następną respijącą E2. Obsługa minutnika z gry lub z Gargonem.',
      accent: '#38bdf8'
    },
    {
      id: 'moje-czy-nie-moje',
      name: 'Moje czy nie moje',
      description: 'Pokazuje nad zdobytą legendą, jaki masz procent na złapanie tej legendy.',
      accent: '#facc15'
    },
    {
      id: 'sorry-missclick',
      name: 'Sorry, missclick',
      description: 'Blokuje próby ataku przyjaciół, klanowiczów oraz sojuszników.',
      accent: '#ef4444'
    },
    {
      id: 'auto-summon',
      name: 'Auto-summon',
      description: 'Automatycznie akceptuje przywołanie do grupy.',
      accent: '#4ade80'
    },
    {
      id: 'szybka-walka',
      name: 'Szybka walka',
      description: 'Automatycznie daje szybką walkę [F].',
      accent: '#e879f9'
    },
    {
      id: 'run-to-hero',
      name: 'Run to hero',
      description: 'Automatyczne podchodzenie do herosa/tropiciela.',
      accent: '#34d399'
    }
  ];

  const SETTINGS_PREFIX = 'rzp_dummy_settings_';
  const STYLE_ID = 'rzp-dummy-addons-style';

  function getSettingKey(addonId) {
    return `${SETTINGS_PREFIX}${addonId}`;
  }

  function loadAddonSettings(addonId) {
    try {
      const raw = window.localStorage.getItem(getSettingKey(addonId));
      if (!raw) return { enabled: true };
      const parsed = JSON.parse(raw);
      return { enabled: parsed?.enabled !== false };
    } catch (e) {
      return { enabled: true };
    }
  }

  function saveAddonSettings(addonId, settings) {
    try {
      window.localStorage.setItem(getSettingKey(addonId), JSON.stringify(settings));
    } catch (e) {}
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .rzp-dummy-window {
        position: fixed;
        min-width: 240px;
        border-radius: 12px;
        border: 1px solid rgba(52, 211, 100, 0.18);
        background: linear-gradient(160deg, rgba(6, 16, 9, 0.98), rgba(4, 12, 7, 0.99));
        box-shadow:
          0 0 0 1px rgba(34,197,94,0.06) inset,
          0 16px 40px rgba(0, 0, 0, 0.65),
          0 0 24px rgba(34,197,94,0.04);
        color: #c8ead4;
        font-family: 'Trebuchet MS', Tahoma, Verdana, sans-serif;
        z-index: 18;
        overflow: hidden;
      }
      .rzp-dummy-window.hidden {
        display: none;
      }
      .rzp-dummy-header {
        padding: 9px 12px 8px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.4px;
        border-bottom: 1px solid rgba(52, 211, 100, 0.12);
        background: rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .rzp-dummy-header::before {
        content: '';
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        opacity: 0.7;
        flex-shrink: 0;
      }
      .rzp-dummy-body {
        padding: 10px 12px 12px;
        font-size: 11px;
      }
      .rzp-dummy-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 7px 9px;
        margin-bottom: 5px;
        border-radius: 7px;
        border: 1px solid rgba(52,211,100,0.09);
        background: rgba(255,255,255,0.02);
        gap: 8px;
        transition: border-color 0.15s;
      }
      .rzp-dummy-row:hover {
        border-color: rgba(52,211,100,0.18);
      }
      .rzp-dummy-row:last-of-type {
        margin-bottom: 0;
      }
      .rzp-dummy-row span {
        color: #9acba6;
        font-size: 11px;
      }
      .rzp-dummy-checkbox {
        width: 15px;
        height: 15px;
        accent-color: #22c55e;
        cursor: pointer;
        flex-shrink: 0;
      }
      .rzp-dummy-note {
        color: #3d6647;
        font-size: 10px;
        line-height: 1.45;
        margin-top: 9px;
        padding: 7px 9px;
        border-radius: 6px;
        background: rgba(34,197,94,0.04);
        border: 1px solid rgba(52,211,100,0.08);
      }
      /* Widget styles */
      .rzp-dummy-widget {
        width: 190px;
      }
      .rzp-dummy-metric {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 0;
        border-bottom: 1px solid rgba(52,211,100,0.07);
        font-size: 11px;
      }
      .rzp-dummy-metric:last-of-type {
        border-bottom: none;
        margin-bottom: 4px;
      }
      .rzp-dummy-metric span:first-child {
        color: #4a7a54;
      }
      .rzp-dummy-value {
        font-weight: 700;
        color: #86efac;
        font-variant-numeric: tabular-nums;
      }
      .rzp-dummy-mini-btn {
        margin-top: 9px;
        width: 100%;
        height: 26px;
        border-radius: 7px;
        border: 1px solid rgba(52, 211, 100, 0.28);
        background: rgba(34, 197, 94, 0.08);
        color: #86efac;
        cursor: pointer;
        font-size: 11px;
        font-family: inherit;
        letter-spacing: 0.2px;
        transition: background 0.15s, border-color 0.15s;
      }
      .rzp-dummy-mini-btn:hover {
        background: rgba(34, 197, 94, 0.18);
        border-color: rgba(52,211,100,0.45);
      }
      .rzp-dummy-close {
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
      .rzp-dummy-close:hover {
        background: rgba(239,68,68,0.18);
        border-color: rgba(239,68,68,0.35);
        color: #f87171;
      }
    `;

    document.head.appendChild(style);
  }

  function createWindow(id, title, bodyClass, top, left, accent) {
    const node = document.createElement('div');
    node.id = id;
    node.className = `rzp-dummy-window ${bodyClass} hidden`;
    node.style.top = `${top}px`;
    node.style.left = `${left}px`;
    node.style.borderColor = `${accent}33`;
    node.style.boxShadow = `0 0 0 1px ${accent}11 inset, 0 16px 40px rgba(0,0,0,0.65)`;

    const header = document.createElement('div');
    header.className = 'rzp-dummy-header';
    header.style.color = accent;

    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;
    header.appendChild(titleSpan);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'rzp-dummy-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => node.classList.add('hidden'));
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'rzp-dummy-body';

    node.appendChild(header);
    node.appendChild(body);
    document.body.appendChild(node);

    if (typeof window.RZP_MAKE_DRAGGABLE === 'function') {
      window.RZP_MAKE_DRAGGABLE(node, header);
    }

    return { node, body };
  }

  function setVisible(node, visible) {
    if (!node) return;
    node.classList.toggle('hidden', !visible);
  }

  function isVisible(node) {
    return !!node && !node.classList.contains('hidden');
  }

  function registerDummyAddon(addon, index) {
    const settingsId = `rzp-dummy-settings-${addon.id}`;
    const widgetId = `rzp-dummy-widget-${addon.id}`;

    let settingsNode = null;
    let widgetNode = null;

    function ensureNodes() {
      if (settingsNode && widgetNode) return;
      ensureStyle();

      const settings = createWindow(
        settingsId,
        `${addon.name} - ustawienia`,
        'rzp-dummy-settings',
        170 + index * 28,
        270 + index * 34,
        addon.accent
      );

      const widget = createWindow(
        widgetId,
        `${addon.name} - widget`,
        'rzp-dummy-widget',
        180 + index * 20,
        30 + index * 14,
        addon.accent
      );

      const currentSettings = loadAddonSettings(addon.id);

      settings.body.innerHTML = `
        <div class="rzp-dummy-row">
          <span>Modul aktywny</span>
          <input type="checkbox" class="rzp-dummy-checkbox" id="${settingsId}-enabled" ${currentSettings.enabled ? 'checked' : ''}>
        </div>
        <div class="rzp-dummy-note">${addon.description}<br><br>Ustawienia beda dostepne po implementacji modulu.</div>
      `;

      widget.body.innerHTML = `
        <div class="rzp-dummy-note" style="margin:0">Modul w trakcie implementacji.</div>
      `;

      const enabledInput = settings.node.querySelector(`#${settingsId}-enabled`);
      if (enabledInput) {
        enabledInput.addEventListener('change', () => {
          saveAddonSettings(addon.id, { enabled: !!enabledInput.checked });
        });
      }

      const dockRow = window.RZP_DOCK_HIDDEN_UTILS?.makeRow?.(addon.id);
      if (dockRow) settings.body.appendChild(dockRow);

      settingsNode = settings.node;
      widgetNode = widget.node;
    }

    function hideAll() {
      setVisible(settingsNode, false);
      setVisible(widgetNode, false);
    }

    return {
      id: addon.id,
      name: addon.name,

      async enable() {
        ensureNodes();
        return true;
      },

      disable() {
        hideAll();
        return true;
      },

      async openSettings() {
        await this.enable();
        const next = !isVisible(settingsNode);
        setVisible(settingsNode, next);
        if (next) setVisible(widgetNode, false);
        return true;
      },

      async runWidget() {
        await this.enable();
        const next = !isVisible(widgetNode);
        setVisible(widgetNode, next);
        if (next) setVisible(settingsNode, false);
        return true;
      }
    };
  }

  window.RZP_ADDONS_REGISTRY = window.RZP_ADDONS_REGISTRY || {};

  ADDONS.forEach((addon, index) => {
    window.RZP_ADDONS_REGISTRY[addon.id] = registerDummyAddon(addon, index);
  });
})();