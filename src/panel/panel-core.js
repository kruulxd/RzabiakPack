(function () {
  'use strict';

  if (window.__RZP_PANEL_CORE_LOADED) return;
  window.__RZP_PANEL_CORE_LOADED = true;

  /* ─── CONFIG ─────────────────────────────────────────── */
  const PANEL_ID  = 'mg-addon-panel';
  const BTN_ID    = 'mg-addon-navbtn';
  const VERSION   = '1.2.0';
  const FROG_GIF  = 'https://micc.garmory-cdn.cloud/obrazki/npc/tyt/maddok-tytan2.gif';
  const ADDON_STATE_KEY = 'rzp_addon_state';
  const ADDON_DOCK_POSITION_KEY = 'rzp_addon_dock_position';
  const ADDON_NOTIFICATIONS_KEY = 'rzp_addon_notifications';
  const ADDON_DOCK_HIDDEN_KEY    = 'rzp_addon_dock_hidden';
  const DEFAULT_ADDON_DOCK_POSITION = 'right-top';
  const ADDON_DOCK_POSITIONS = {
    'bottom-left': 'Dolna krawedz - od lewej',
    'bottom-right': 'Dolna krawedz - od prawej',
    'top-left': 'Gorna krawedz - od lewej',
    'top-right': 'Gorna krawedz - od prawej',
    'left-top': 'Lewa krawedz - od gory',
    'left-bottom': 'Lewa krawedz - od dolu',
    'right-top': 'Prawa krawedz - od gory',
    'right-bottom': 'Prawa krawedz - od dolu'
  };

  const ADDON_NOTIFICATION_SETTINGS = {
    'resp-radar': [
      { id: 'resp-radar.mather-warning', label: 'Ostrzeżenie przed graczem Mather', defaultEnabled: true },
    ]
  };

  function gmGetValue(key, defaultValue) {
    if (typeof GM_getValue === 'function') {
      return GM_getValue(key, defaultValue);
    }

    try {
      const raw = window.localStorage.getItem(`rzp_${key}`);
      return raw == null ? defaultValue : JSON.parse(raw);
    } catch (e) {
      return defaultValue;
    }
  }

  function gmSetValue(key, value) {
    if (typeof GM_setValue === 'function') {
      GM_setValue(key, value);
      return;
    }

    try {
      window.localStorage.setItem(`rzp_${key}`, JSON.stringify(value));
    } catch (e) {}
  }

  function gmAddStyle(cssText) {
    if (typeof GM_addStyle === 'function') {
      GM_addStyle(cssText);
      return;
    }

    const style = document.createElement('style');
    style.textContent = String(cssText || '');
    document.head.appendChild(style);
  }

  function detectInterface() {
    // SI (Stary Interfejs) - window.g exists but window.Engine does not
    if (!window.Engine && window.g && typeof window.g === 'object') {
      return 'SI';
    }
    // NI (Nowy Interfejs) - window.Engine exists
    if (window.Engine) {
      return 'NI';
    }
    // Fallback to NI if detection fails
    return 'NI';
  }

  const ADDON_MODULES = [
    'https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/src/addons/ulepszarka/ulepszarka-addon.js',
    'https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/src/addons/ulepszarka-si/ulepszarka-si-addon.js',
    'https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/src/addons/dummy/dummy-addons.js',
    'https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/src/addons/grupa-w-zasiegu/grupa-w-zasiegu-addon.js',
    'https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/src/addons/resp-radar/resp-radar-addon.js',
    'https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/src/addons/kalendarz/kalendarz-addon.js',
    'https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/src/addons/random-group/random-group-addon.js',
    'https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/src/addons/super-sprzedawca/super-sprzedawca-addon.js',
    'https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/src/addons/sorry-missclick/sorry-missclick-addon.js',
    'https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/src/addons/auto-summon/auto-summon-addon.js',
    'https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/src/addons/szybka-walka/szybka-walka-addon.js',
    'https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/src/addons/autoheal/autoheal-addon.js'
  ];

  const ADDON_ITEMS = [
    {
      id: 'ulepszarka-ni',
      name: 'Ulepszarka NI',
      description: 'Automatyczne ulepszanie i rozbijanie przedmiotów (Nowy Interfejs).',
      dockIcon: '🛠',
      dockTitle: 'Ulepszarka NI - launcher/widget',
      requiredInterface: 'NI'
    },
    {
      id: 'ulepszarka-si',
      name: 'Ulepszarka SI',
      description: 'Automatyczne ulepszanie i rozbijanie przedmiotów (Stary Interfejs).',
      dockIcon: '🛠',
      dockTitle: 'Ulepszarka SI - launcher/widget',
      requiredInterface: 'SI'
    },
    {
      id: 'grupa-w-zasiegu',
      name: 'Grupa w zasięgu',
      description: 'Podświetla nicki członków grupy poza zasięgiem walki.',
      dockIcon: '👥',
      dockTitle: 'Grupa w zasięgu',
      hasSettings: true,
      showInDock: true,
      ppmOnly: true,
      requiredInterface: 'NI'
    },
    {
      id: 'resp-radar',
      name: 'Timer z danej lokacji',
      description: 'Timer respu E2 i Tytana pokazany w oknie gry.',
      dockIcon: '⏱',
      dockTitle: 'Timer z danej lokacji',
      requiredInterface: 'NI',
      hasSettings: true
    },
    {
      id: 'roller',
      name: 'Roller',
      description: 'Automatyczne rollowanie bonusów u kowala.',
      dockIcon: '🎲',
      dockTitle: 'Roller - widget',
      requiredInterface: 'NI',
      wip: true
    },
    {
      id: 'super-sprzedawca',
      name: 'Super sprzedawca',
      description: 'Szybkie sprzedawanie przedmiotów u NPC pod przyciskiem.',
      dockIcon: '💰',
      dockTitle: 'Super sprzedawca',
      requiredInterface: 'NI',
      showInDock: true,
      ppmOnly: true,
      hasSettings: true
    },
    {
      id: 'autoheal',
      name: 'AutoHeal',
      description: 'Automatycznie używa mikstur leczących po walce gdy HP spadnie poniżej progu.',
      dockIcon: '💊',
      dockTitle: 'AutoHeal',
      requiredInterface: 'NI',
      showInDock: true,
      lpmHint: 'LPM - włącz/wyłącz',
      hasSettings: true
    },
    {
      id: 'relogger',
      name: 'Relogger',
      description: 'Automatyczne przelogowanie na następną respijącą E2. Obsługa minutnika z gry lub z Gargona.',
      dockIcon: '🔄',
      dockTitle: 'Relogger - widget',
      requiredInterface: 'NI',
      wip: true
    },
    {
      id: 'moje-czy-nie-moje',
      name: 'Moje czy nie moje',
      description: 'Pokazuje nad zdobytą legendą, jaki masz procent na złapanie tej legendy.',
      dockIcon: '🪙',
      dockTitle: 'Moje czy nie moje - widget',
      requiredInterface: 'NI',
      wip: true
    },
    {
      id: 'kalendarz',
      name: 'Kalendarz',
      description: 'Automatyczne odbieranie kalendarza, jeżeli nagroda nie została jeszcze odebrana.',
      dockIcon: '📅',
      dockTitle: 'Kalendarz - widget',
      requiredInterface: 'NI',
      ppmOnly: true,
      hasSettings: true
    },
    {
      id: 'sorry-missclick',
      name: 'Sorry, missclick',
      description: 'Blokuje próby ataku przyjaciół, klanowiczów oraz sojuszników.',
      dockIcon: '🛡',
      dockTitle: 'Sorry, missclick',
      requiredInterface: 'NI',
      showInDock: true,
      ppmOnly: true,
      hasSettings: true
    },
    {
      id: 'auto-summon',
      name: 'Auto-summon',
      description: 'Automatycznie akceptuje przywołanie do grupy.',
      dockIcon: '🔮',
      dockTitle: 'Auto-summon',
      requiredInterface: 'NI',
      showInDock: true,
      lpmHint: 'LPM - włącz/wyłącz',
      hasSettings: true
    },
    {
      id: 'szybka-walka',
      name: 'Szybka walka',
      description: 'Automatycznie daje szybką walkę [F].',
      dockIcon: '⚡',
      dockTitle: 'Szybka walka',
      requiredInterface: 'NI',
      showInDock: true,
      lpmHint: 'LPM - włącz/wyłącz',
      hasSettings: true
    },
    {
      id: 'run-to-hero',
      name: 'Run to hero',
      description: 'Automatyczne podchodzenie do herosa/tropiciela.',
      dockIcon: '🏃',
      dockTitle: 'Run to hero - widget',
      requiredInterface: 'NI',
      wip: true
    },
    {
      id: 'random-group',
      name: 'Random Group',
      description: 'Zapraszanie graczy do drużyny w losowej kolejności pod przycisk [V].',
      dockIcon: '🎰',
      dockTitle: 'Random Group',
      requiredInterface: 'NI',
      hasSettings: true,
      showInDock: true,
      ppmOnly: true
    }
  ];

  const ADDONS = [
    {
      id: 'walka',
      icon: '⚔️',
      label: 'Dodatki',
      description: 'Lista zainstalowanych dodatkow i ich sterowanie.',
      badge: null,
      badgeType: null,
      content: null
    },
    {
      id: 'notif',
      icon: '🔔',
      label: 'Powiadomienia',
      description: 'Alerty i powiadomienia w czasie rzeczywistym.',
      badge: null,
      badgeType: null,
      content: null
    },
    {
      id: 'settings',
      icon: '⚙️',
      label: 'Ustawienia',
      description: 'Konfiguracja panelu i skryptów.',
      badge: null,
      badgeType: null,
      content: null
    }
  ];

  /* ─── STYLES ─────────────────────────────────────────── */
  gmAddStyle(`
    #${PANEL_ID} {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 720px;
      max-width: 96vw;
      height: 530px;
      max-height: 92vh;
      z-index: 99999;
      display: none;
      font-family: 'Trebuchet MS', Tahoma, Verdana, sans-serif;
      font-size: 13px;
      color: #d4f0dc;
      border-radius: 12px;
      overflow: hidden;
      box-shadow:
        0 0 0 1px rgba(52,211,100,0.25),
        0 30px 70px rgba(0,0,0,0.85),
        0 0 40px rgba(34,197,94,0.06);
      background: #07100a;
    }
    #${PANEL_ID}.visible { display: flex; flex-direction: row; }

    /* ─ Sidebar ─ */
    #mg-sidebar {
      width: 190px;
      min-width: 190px;
      background: #050d07;
      border-right: 1px solid rgba(52,211,100,0.12);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    #mg-sidebar-header {
      padding: 16px 14px 12px;
      border-bottom: 1px solid rgba(52,211,100,0.12);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    #mg-sidebar-header img {
      height: 60px;
      image-rendering: pixelated;
      filter: drop-shadow(0 0 8px rgba(34,197,94,0.4));
    }

    .mg-logo-text {
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #22c55e;
      text-shadow: 0 0 10px rgba(34,197,94,0.45);
    }

    .mg-version-label {
      font-size: 9.5px;
      color: #1a3521;
    }

    #mg-nav {
      flex: 1;
      padding: 8px 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #0f2a15 transparent;
    }

    .mg-nav-item {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 8px 10px;
      border-radius: 7px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      color: #4a7a54;
      user-select: none;
    }
    .mg-nav-item:hover {
      background: rgba(34,197,94,0.1);
      color: #d4f0dc;
    }
    .mg-nav-item.active {
      background: rgba(34,197,94,0.13);
      color: #86efac;
      box-shadow: inset 2px 0 0 #22c55e;
    }

    .mg-nav-icon { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }
    .mg-nav-label { font-size: 12.5px; font-weight: 500; flex: 1; }

    .mg-nav-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 4px;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }
    .mg-nav-badge.soon {
      background: rgba(168,146,74,0.18);
      color: #a8924a;
      border: 1px solid rgba(168,146,74,0.25);
    }
    .mg-nav-badge.new {
      background: rgba(34,197,94,0.15);
      color: #22c55e;
    }

    #mg-sidebar-footer {
      padding: 9px 12px;
      border-top: 1px solid rgba(52,211,100,0.08);
      font-size: 9.5px;
      color: #1a3521;
      text-align: center;
      letter-spacing: 0.5px;
    }

    /* ─ Content ─ */
    #mg-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #07100a;
    }

    #mg-content-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 13px 20px 11px;
      border-bottom: 1px solid rgba(52,211,100,0.12);
      flex-shrink: 0;
      background: rgba(0,0,0,0.15);
      cursor: move;
    }

    #mg-content-title {
      font-size: 15px;
      font-weight: 600;
      color: #d4f0dc;
    }

    #mg-content-subtitle {
      font-size: 11px;
      color: #4a7a54;
      margin-top: 2px;
    }

    #mg-close-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(52,211,100,0.12);
      color: #4a7a54;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
      line-height: 1;
    }
    #mg-close-btn:hover {
      background: rgba(239,68,68,0.14);
      color: #f87171;
      border-color: rgba(239,68,68,0.3);
    }

    #mg-content-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      scrollbar-width: thin;
      scrollbar-color: #0f2a15 transparent;
    }

    /* ─ Panes ─ */
    .mg-pane { display: none; }
    .mg-pane.active { display: block; }

    /* ─ Placeholder ─ */
    .mg-placeholder-box {
      border: 1px dashed rgba(52,211,100,0.15);
      border-radius: 10px;
      padding: 36px 24px;
      text-align: center;
      background: rgba(34,197,94,0.02);
      margin-bottom: 16px;
    }
    .mg-ph-icon { font-size: 38px; margin-bottom: 12px; }
    .mg-ph-title { font-size: 14px; font-weight: 600; color: #4a7a54; margin-bottom: 8px; }
    .mg-ph-desc { font-size: 12px; color: #2d4a33; line-height: 1.65; max-width: 320px; margin: 0 auto; }

    .mg-info-strip {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(34,197,94,0.07);
      border: 1px solid rgba(34,197,94,0.2);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 12px;
      color: #22c55e;
      margin-bottom: 16px;
    }

    .mg-addon-list {
      display: grid;
      gap: 8px;
    }
    .mg-addon-item {
      border: 1px solid rgba(52,211,100,0.14);
      border-radius: 11px;
      background: linear-gradient(135deg, rgba(9,26,14,0.95) 0%, rgba(6,16,10,0.98) 100%);
      padding: 13px 14px;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: center;
      transition: border-color 0.18s, box-shadow 0.18s;
      position: relative;
      overflow: hidden;
    }
    .mg-addon-item::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 3px;
      background: linear-gradient(180deg, #22c55e, #15803d);
      border-radius: 11px 0 0 11px;
      opacity: 0;
      transition: opacity 0.18s;
    }
    .mg-addon-item:has(.mg-addon-toggle:checked)::before {
      opacity: 1;
    }
    .mg-addon-item:has(.mg-addon-toggle:checked) {
      border-color: rgba(52,211,100,0.26);
      box-shadow: 0 0 0 1px rgba(34,197,94,0.06) inset, 0 4px 14px rgba(0,0,0,0.35);
    }
    .mg-addon-item:hover {
      border-color: rgba(52,211,100,0.24);
    }
    .mg-addon-meta {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .mg-addon-icon {
      font-size: 20px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border-radius: 8px;
      background: rgba(34,197,94,0.07);
      border: 1px solid rgba(52,211,100,0.14);
    }
    .mg-addon-info { flex: 1; }
    .mg-addon-name {
      font-size: 13px;
      font-weight: 700;
      color: #dcffe6;
      margin-bottom: 3px;
      letter-spacing: 0.2px;
      display: flex;
      align-items: center;
      gap: 30px;
    }
    .mg-addon-installed {
      font-size: 10px;
      font-weight: 700;
      color: #facc15;
      text-shadow: 0 0 6px rgba(250, 204, 21, 0.65);
      letter-spacing: 0.4px;
      white-space: nowrap;
      display: none;
    }
    .mg-addon-item:has(.mg-addon-toggle:checked) .mg-addon-installed {
      display: inline;
    }
    .mg-addon-wip {
      font-size: 10px;
      font-weight: 700;
      color: #f87171;
      text-shadow: 0 0 6px rgba(248, 113, 113, 0.7), 0 0 12px rgba(239, 68, 68, 0.4);
      letter-spacing: 0.4px;
      white-space: nowrap;
    }
    .mg-addon-desc {
      font-size: 11px;
      color: #4a7a54;
      line-height: 1.45;
    }
    .mg-addon-actions {
      display: flex;
      align-items: center;
      gap: 7px;
      flex-shrink: 0;
    }
    .mg-addon-icon-btn {
      width: 30px;
      height: 30px;
      border-radius: 7px;
      border: 1px solid rgba(52,211,100,0.22);
      background: rgba(34,197,94,0.07);
      color: #6faa7e;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .mg-addon-icon-btn:hover {
      background: rgba(34,197,94,0.18);
      border-color: rgba(52,211,100,0.45);
      color: #86efac;
    }
    .mg-addon-icon-btn.hidden {
      display: none;
    }
    /* ─ Settings ─ */
    .mg-settings-group { margin-bottom: 28px; }
    .mg-settings-group-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #22c55e;
      margin-bottom: 12px;
      padding: 0 2px 7px;
      border-bottom: 1px solid rgba(34,197,94,0.12);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .mg-settings-group-title::before {
      content: '';
      display: inline-block;
      width: 3px;
      height: 12px;
      background: #22c55e;
      border-radius: 2px;
    }
    .mg-setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 11px 14px;
      border-radius: 9px;
      border: 1px solid rgba(52,211,100,0.1);
      background: rgba(8,20,11,0.8);
      margin-bottom: 5px;
      transition: border-color 0.15s, background 0.15s;
      gap: 12px;
    }
    .mg-setting-row:hover {
      border-color: rgba(52,211,100,0.2);
      background: rgba(10,25,14,0.9);
    }
    .mg-setting-row:last-child { margin-bottom: 0; }
    .mg-setting-label { font-size: 12.5px; color: #c2e8cc; font-weight: 500; }
    .mg-setting-desc { font-size: 11px; color: #3d6647; margin-top: 3px; line-height: 1.4; }
    .mg-dock-pos-grid {
      display: grid;
      grid-template-columns: 1fr 1.8fr 1fr;
      gap: 4px;
      margin-top: 8px;
      width: 100%;
    }
    .mg-dock-pos-canvas {
      grid-column: 2;
      grid-row: 2 / 4;
      border: 1px dashed rgba(52,211,100,0.25);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: #3d6647;
      min-height: 44px;
      letter-spacing: 0.5px;
    }
    .mg-dock-pos-btn {
      padding: 3px 4px;
      background: rgba(34,197,94,0.07);
      border: 1px solid rgba(52,211,100,0.18);
      color: #86efac;
      border-radius: 5px;
      cursor: pointer;
      font-size: 10px;
      font-weight: 600;
      text-align: center;
      line-height: 1.3;
      transition: background 0.15s, border-color 0.15s;
      font-family: inherit;
    }
    .mg-dock-pos-btn:hover {
      background: rgba(34,197,94,0.18);
      border-color: rgba(52,211,100,0.4);
    }
    .mg-dock-pos-btn.active {
      background: rgba(52,211,100,0.25);
      border-color: rgba(52,211,100,0.7);
      color: #4ade80;
    }

    /* Dock Edit Mode Overlay */
    #mg-dock-editor-overlay {
      position: fixed;
      z-index: 19999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.25s;
    }
    #mg-dock-editor-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }
    .mg-dock-editor-bg {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(3px);
    }
    .mg-dock-editor-canvas {
      position: absolute;
      background: rgba(34, 197, 94, 0.08);
      border: 2px dashed rgba(52, 211, 100, 0.4);
      box-shadow: inset 0 0 0 8px rgba(0, 0, 0, 0.4);
    }
    .mg-dock-bank {
      position: absolute;
      background: rgba(34, 197, 94, 0.18);
      border: 2px solid rgba(52, 211, 100, 0.35);
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      transition: all 0.2s;
      color: rgba(74, 222, 128, 0.7);
    }
    .mg-dock-bank:hover {
      background: rgba(34, 197, 94, 0.35);
      border-color: rgba(52, 211, 100, 0.7);
      color: rgba(74, 222, 128, 1);
      transform: scale(1.08);
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
    }
    .mg-dock-bank.active {
      background: rgba(52, 211, 100, 0.4);
      border-color: #22c55e;
      color: #4ade80;
      box-shadow: 0 0 30px rgba(34, 197, 94, 0.7);
    }
    .mg-edit-mode-btn {
      width: 100%;
      padding: 10px 16px;
      margin-top: 8px;
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.18) 100%);
      border: 1px solid rgba(52, 211, 100, 0.3);
      border-radius: 8px;
      color: #86efac;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s;
      font-family: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .mg-edit-mode-btn:hover {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.22) 0%, rgba(34, 197, 94, 0.28) 100%);
      border-color: rgba(52, 211, 100, 0.5);
      color: #4ade80;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
    }
    .mg-version-badge {
      font-size: 11px;
      font-family: monospace;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #4ade80;
      background: rgba(34,197,94,0.1);
      border: 1px solid rgba(52,211,100,0.28);
      border-radius: 5px;
      padding: 3px 8px;
      flex-shrink: 0;
    }

    .mg-toggle { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
    .mg-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
    .mg-toggle-track {
      position: absolute;
      inset: 0;
      background: #0a1f0d;
      border-radius: 20px;
      cursor: pointer;
      border: 1px solid rgba(52,211,100,0.15);
      transition: background 0.2s;
    }
    .mg-toggle-track::after {
      content: '';
      position: absolute;
      top: 2px; left: 2px;
      width: 14px; height: 14px;
      background: #2d4a33;
      border-radius: 50%;
      transition: transform 0.2s, background 0.2s;
    }
    .mg-toggle input:checked + .mg-toggle-track {
      background: rgba(34,197,94,0.28);
      border-color: rgba(34,197,94,0.4);
    }
    .mg-toggle input:checked + .mg-toggle-track::after {
      transform: translateX(16px);
      background: #4ade80;
    }

    /* ─ Przycisk w grze ─ */
    /*
     * Przycisk siedzi WEWNĄTRZ .bags-navigation-bg jako pierwszy kafelek.
     * Musi mieć taki sam rozmiar co sąsiednie .interface-element-one-black-tile
     * (ok. 34×34px) żeby nie rozjeżdżać układu.
     */
    #${BTN_ID} {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      width: 34px;
      height: 34px;
      border-radius: 5px;
      border: 1px solid rgba(34,197,94,0.4);
      background: #050d07;
      box-shadow: 0 0 6px rgba(34,197,94,0.18);
      z-index: 14;
      user-select: none;
      flex-shrink: 0;
      transition: none;
      position: relative;
      overflow: visible;
    }
    #${BTN_ID}:hover {
      border-color: rgba(34,197,94,0.7);
      box-shadow: 0 0 12px rgba(34,197,94,0.35);
      background: #071209;
    }
    #${BTN_ID} .mg-btn-frog {
      max-height: 100%;
      max-width: 100%;
      height: auto;
      width: auto;
      object-fit: contain;
      object-position: center center;
      image-rendering: pixelated;
      display: block;
      pointer-events: none;
      animation: none !important;
      transition: none !important;
    }
    /* Tooltip z nazwą — pojawia się przy hover, nie zajmuje miejsca */
    #${BTN_ID}::after {
      content: 'RzabiakPack';
      position: absolute;
      bottom: -22px;
      left: 50%;
      transform: translateX(-50%);
      background: #050d07;
      border: 1px solid rgba(34,197,94,0.3);
      color: #4ade80;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      white-space: nowrap;
      padding: 2px 5px;
      border-radius: 3px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      font-family: inherit;
      z-index: 15;
    }
    #${BTN_ID}:hover::after {
      opacity: 1;
    }

    #mg-addon-dock {
      position: fixed;
      z-index: 14;
      display: flex;
      gap: 6px;
      padding: 5px;
      border: 1px solid rgba(52,211,100,0.22);
      border-radius: 10px;
      background: rgba(3, 12, 7, 0.9);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(2px);
    }
    #mg-addon-dock.pos-bottom-left,
    #mg-addon-dock.pos-bottom-right,
    #mg-addon-dock.pos-top-left,
    #mg-addon-dock.pos-top-right {
      flex-direction: row;
    }
    #mg-addon-dock.pos-bottom-right,
    #mg-addon-dock.pos-top-right {
      flex-direction: row-reverse;
    }
    #mg-addon-dock.pos-left-top,
    #mg-addon-dock.pos-left-bottom,
    #mg-addon-dock.pos-right-top,
    #mg-addon-dock.pos-right-bottom {
      flex-direction: column;
    }
    #mg-addon-dock.pos-left-bottom,
    #mg-addon-dock.pos-right-bottom {
      flex-direction: column-reverse;
    }
    .mg-addon-dock-btn {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      border: 1px solid rgba(52,211,100,0.4);
      background: linear-gradient(180deg, rgba(13,42,21,0.94), rgba(9,24,13,0.94));
      color: #dcffe6;
      font-size: 13px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .mg-addon-dock-btn:hover {
      border-color: rgba(74,222,128,0.7);
      box-shadow: 0 0 10px rgba(74,222,128,0.35);
      transform: translateY(-1px);
    }
    #mg-dock-tooltip {
      position: fixed;
      z-index: 15;
      max-width: 170px;
      padding: 6px 8px;
      border-radius: 7px;
      border: 1px solid rgba(52, 211, 100, 0.24);
      background: rgba(4, 12, 7, 0.96);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
      pointer-events: none;
      line-height: 1.25;
    }
    #mg-dock-tooltip.hidden {
      display: none;
    }
    .mg-dock-tooltip-name {
      font-size: 12px;
      font-weight: 700;
      color: #dcffe6;
      margin-bottom: 3px;
    }
    .mg-dock-tooltip-hint {
      font-size: 9px;
      font-weight: 400;
      color: #9ac7a8;
    }

    /* ─ Dock canvas picker ─ */
    .mg-dock-canvas-preview {
      position: relative;
      width: 100%;
      height: 180px;
      background: rgba(2, 8, 4, 0.7);
      border: 1px solid rgba(52, 211, 100, 0.18);
      border-radius: 6px;
      margin-top: 8px;
    }
    .mg-dock-canvas-label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 10px;
      color: rgba(52, 211, 100, 0.12);
      letter-spacing: 2px;
      text-transform: uppercase;
      pointer-events: none;
      user-select: none;
      font-weight: 700;
    }
    .mg-dock-bar {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(10, 30, 14, 0.95);
      border: 1px solid rgba(52, 211, 100, 0.2);
      border-radius: 4px;
      color: #2d5a36;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
      font-family: inherit;
      padding: 0;
    }
    .mg-dock-bar:hover {
      background: rgba(34, 197, 94, 0.14);
      border-color: rgba(52, 211, 100, 0.45);
      color: #6faa7e;
    }
    .mg-dock-bar.active {
      background: rgba(34, 197, 94, 0.28);
      border-color: rgba(52, 211, 100, 0.75);
      color: #4ade80;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.3);
    }
    /* horizontal bars (top / bottom) */
    .mg-dock-bar--top-left,
    .mg-dock-bar--top-right,
    .mg-dock-bar--bottom-left,
    .mg-dock-bar--bottom-right { width: 76px; height: 16px; }
    .mg-dock-bar--top-left    { top: 5px;    left: 5px; }
    .mg-dock-bar--top-right   { top: 5px;    right: 5px; }
    .mg-dock-bar--bottom-left { bottom: 5px; left: 5px; }
    .mg-dock-bar--bottom-right{ bottom: 5px; right: 5px; }
    /* vertical bars (left / right) */
    .mg-dock-bar--left-top,
    .mg-dock-bar--left-bottom,
    .mg-dock-bar--right-top,
    .mg-dock-bar--right-bottom { width: 16px; height: 55px; }
    .mg-dock-bar--left-top    { left: 5px;  top: 27px; }
    .mg-dock-bar--left-bottom { left: 5px;  bottom: 27px; }
    .mg-dock-bar--right-top   { right: 5px; top: 27px; }
    .mg-dock-bar--right-bottom{ right: 5px; bottom: 27px; }

    /* ─ Dock toggle row (shared across addon settings windows) ─ */
    .rzp-dock-toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 7px 10px;
      margin-top: 6px;
      border-radius: 7px;
      border: 1px solid rgba(52,211,100,0.09);
      background: rgba(255,255,255,0.02);
      gap: 8px;
    }
    .rzp-dock-toggle-label {
      color: #9acba6;
      font-size: 11px;
      flex: 1;
    }
    .rzp-dock-toggle-checkbox {
      width: 14px;
      height: 14px;
      accent-color: #22c55e;
      cursor: pointer;
      flex-shrink: 0;
    }

    /* ─ Shared mini settings window ─ */
    .rzp-addon-mini-settings {
      position: fixed;
      width: 280px;
      border-radius: 12px;
      border: 1px solid rgba(52, 211, 100, 0.22);
      background: linear-gradient(160deg, rgba(6, 16, 9, 0.98), rgba(4, 12, 7, 0.99));
      box-shadow: 0 0 0 1px rgba(34,197,94,0.06) inset, 0 16px 40px rgba(0,0,0,0.65);
      color: #c8ead4;
      font-family: 'Trebuchet MS', Tahoma, Verdana, sans-serif;
      font-size: 11px;
      z-index: 20000;
      overflow: hidden;
      user-select: none;
    }
    .rzp-addon-mini-settings.hidden { display: none; }
    .rzp-addon-mini-settings-header {
      padding: 10px 12px 9px;
      font-size: 12px;
      font-weight: 700;
      color: #86efac;
      border-bottom: 1px solid rgba(52,211,100,0.14);
      background: rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 7px;
      cursor: move;
    }
    .rzp-addon-mini-settings-close {
      margin-left: auto;
      width: 18px; height: 18px;
      border-radius: 4px;
      border: 1px solid rgba(52,211,100,0.18);
      background: rgba(0,0,0,0.2);
      color: #3d6647;
      font-size: 11px; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
      font-family: inherit; padding: 0;
    }
    .rzp-addon-mini-settings-close:hover {
      background: rgba(239,68,68,0.18);
      border-color: rgba(239,68,68,0.35);
      color: #f87171;
    }
    .rzp-addon-mini-settings-body { padding: 12px 14px 14px; }
    .rzp-addon-mini-settings-btn {
      display: flex; align-items: center; justify-content: center;
      width: 100%; height: 28px; margin-top: 8px;
      border-radius: 7px;
      border: 1px solid rgba(52,211,100,0.25);
      background: rgba(34,197,94,0.08);
      color: #86efac;
      font-size: 11px; font-family: inherit;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .rzp-addon-mini-settings-btn:hover {
      background: rgba(34,197,94,0.18);
      border-color: rgba(52,211,100,0.45);
    }
  `);

  /* ─── CONTENT BUILDERS ───────────────────────────────── */
  function buildDummyContent(name, icon, desc) {
    return `
      <div class="mg-info-strip">
        <span>🐸</span>
        <span>Ten moduł jest w trakcie tworzenia — wkrótce tu coś będzie!</span>
      </div>
      <div class="mg-placeholder-box">
        <div class="mg-ph-icon">${icon}</div>
        <div class="mg-ph-title">${name}</div>
        <div class="mg-ph-desc">${desc}</div>
      </div>
    `;
  }

  function getAddonState() {
    const state = gmGetValue(ADDON_STATE_KEY, null);
    if (!state || typeof state !== 'object') {
      return {};
    }
    return state;
  }

  function setAddonState(nextState) {
    gmSetValue(ADDON_STATE_KEY, nextState || {});
  }

  function isAddonEnabled(addonId) {
    const state = getAddonState();
    return !!state[addonId];
  }

  function getAddonDockPosition() {
    const saved = gmGetValue(ADDON_DOCK_POSITION_KEY, DEFAULT_ADDON_DOCK_POSITION);
    if (saved && Object.prototype.hasOwnProperty.call(ADDON_DOCK_POSITIONS, saved)) {
      return saved;
    }
    return DEFAULT_ADDON_DOCK_POSITION;
  }

  function setAddonDockPosition(position) {
    const next = Object.prototype.hasOwnProperty.call(ADDON_DOCK_POSITIONS, position)
      ? position
      : DEFAULT_ADDON_DOCK_POSITION;
    gmSetValue(ADDON_DOCK_POSITION_KEY, next);
  }

  function setAddonEnabled(addonId, enabled) {
    const state = getAddonState();
    state[addonId] = !!enabled;
    setAddonState(state);
  }

  function getNotificationSettings() {
    const stored = gmGetValue(ADDON_NOTIFICATIONS_KEY, null);
    if (!stored || typeof stored !== 'object') {
      return {};
    }
    return stored;
  }

  function setNotificationSettings(settings) {
    gmSetValue(ADDON_NOTIFICATIONS_KEY, settings || {});
  }

  function isNotificationEnabled(notificationId) {
    const settings = getNotificationSettings();
    if (notificationId in settings) {
      return !!settings[notificationId];
    }
    // Find default value from config
    for (const addonId in ADDON_NOTIFICATION_SETTINGS) {
      const notifs = ADDON_NOTIFICATION_SETTINGS[addonId];
      const found = notifs.find(n => n.id === notificationId);
      if (found) {
        return found.defaultEnabled !== false;
      }
    }
    return true;
  }

  function setNotificationEnabled(notificationId, enabled) {
    const settings = getNotificationSettings();
    settings[notificationId] = !!enabled;
    setNotificationSettings(settings);
  }

  function getDockHiddenState() {
    const stored = gmGetValue(ADDON_DOCK_HIDDEN_KEY, null);
    if (!stored || typeof stored !== 'object') return {};
    return stored;
  }

  function isAddonDockHidden(addonId) {
    return !!getDockHiddenState()[addonId];
  }

  function setAddonDockHidden(addonId, hidden) {
    const s = getDockHiddenState();
    if (hidden) {
      s[addonId] = true;
    } else {
      delete s[addonId];
    }
    gmSetValue(ADDON_DOCK_HIDDEN_KEY, s);
  }

  function makeDockToggleRow(addonId) {
    const row = document.createElement('div');
    row.className = 'rzp-dock-toggle-row';
    const label = document.createElement('span');
    label.className = 'rzp-dock-toggle-label';
    label.textContent = 'Pokaż w docku';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'rzp-dock-toggle-checkbox';
    input.checked = !isAddonDockHidden(addonId);
    input.addEventListener('change', () => {
      setAddonDockHidden(addonId, !input.checked);
      renderAddonDock();
    });
    row.appendChild(label);
    row.appendChild(input);
    return row;
  }

  function getAddonRegistry() {
    return window.RZP_ADDONS_REGISTRY || {};
  }

  function getEnabledAddonItems() {
    const currentInterface = detectInterface();
    return ADDON_ITEMS.filter(item => {
      // Filter by interface compatibility
      if (item.requiredInterface && item.requiredInterface !== currentInterface) {
        return false;
      }
      return isAddonEnabled(item.id) && item.showInDock !== false && !isAddonDockHidden(item.id);
    });
  }

  function ensureDockTooltip() {
    let tooltip = document.getElementById('mg-dock-tooltip');
    if (tooltip) return tooltip;

    tooltip = document.createElement('div');
    tooltip.id = 'mg-dock-tooltip';
    tooltip.className = 'hidden';
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function positionDockTooltip(tooltip, anchorEl) {
    if (!tooltip || !anchorEl) return;

    const rect = anchorEl.getBoundingClientRect();
    const padding = 8;
    const top = Math.max(
      padding,
      Math.round(rect.top + (rect.height - tooltip.offsetHeight) / 2)
    );
    let left = Math.round(rect.right + 8);

    if (left + tooltip.offsetWidth > window.innerWidth - padding) {
      left = Math.round(rect.left - tooltip.offsetWidth - 8);
    }

    if (left < padding) {
      left = padding;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function showDockTooltip(anchorEl, addonName, addonId) {
    const tooltip = ensureDockTooltip();
    const safeName = String(addonName || 'Dodatek');

    const addonItem = addonId ? ADDON_ITEMS.find(a => a.id === addonId) : null;
    const noHints   = !!(addonItem && addonItem.noHints);
    const ppmOnly   = !!(addonItem && addonItem.ppmOnly);

    // Check if addon exposes a custom tooltip line (e.g. status info)
    const registry  = getAddonRegistry();
    const addonObj  = addonId ? registry[addonId] : null;
    const extraLine = (addonObj && typeof addonObj.getTooltipLine === 'function')
      ? addonObj.getTooltipLine()
      : null;

    let html = `<div class="mg-dock-tooltip-name">${safeName}</div>`;
    if (extraLine) html += `<div class="mg-dock-tooltip-hint" style="color:#c8ead4">${extraLine}</div>`;
    if (!noHints) {
      if (!ppmOnly) html += `<div class="mg-dock-tooltip-hint">LPM - pokaz/ukryj</div>`;
      const ppmText = (addonItem && addonItem.ppmHint) ? addonItem.ppmHint : 'PPM - ustawienia';
      html += `<div class="mg-dock-tooltip-hint">${ppmText}</div>`;
    }

    tooltip.innerHTML = html;
    tooltip.classList.remove('hidden');
    positionDockTooltip(tooltip, anchorEl);
  }

  function hideDockTooltip() {
    const tooltip = document.getElementById('mg-dock-tooltip');
    if (!tooltip) return;
    tooltip.classList.add('hidden');
  }

  function applyAddonDockPlacement(dock) {
    if (!dock) return;

    const canvas = document.getElementById('GAME_CANVAS');
    const rect = canvas
      ? canvas.getBoundingClientRect()
      : {
          left: 12,
          top: 12,
          right: window.innerWidth - 12,
          bottom: window.innerHeight - 12
        };

    const position = getAddonDockPosition();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const inset = 8;

    dock.className = `pos-${position}`;
    dock.removeAttribute('style');
    dock.style.position = 'fixed';
    dock.style.zIndex = '14';

    if (position.startsWith('right-')) {
      dock.style.right = `${Math.max(0, Math.round(viewportWidth - rect.right + inset))}px`;
      if (position === 'right-top') {
        dock.style.top = `${Math.round(rect.top + inset)}px`;
      } else {
        dock.style.bottom = `${Math.max(0, Math.round(viewportHeight - rect.bottom + inset))}px`;
      }
      return;
    }

    if (position.startsWith('left-')) {
      dock.style.left = `${Math.round(rect.left + inset)}px`;
      if (position === 'left-top') {
        dock.style.top = `${Math.round(rect.top + inset)}px`;
      } else {
        dock.style.bottom = `${Math.max(0, Math.round(viewportHeight - rect.bottom + inset))}px`;
      }
      return;
    }

    if (position.startsWith('top-')) {
      dock.style.top = `${Math.round(rect.top + inset)}px`;
      if (position === 'top-left') {
        dock.style.left = `${Math.round(rect.left + inset)}px`;
      } else {
        dock.style.right = `${Math.max(0, Math.round(viewportWidth - rect.right + inset))}px`;
      }
      return;
    }

    dock.style.bottom = `${Math.max(0, Math.round(viewportHeight - rect.bottom + inset))}px`;
    if (position === 'bottom-left') {
      dock.style.left = `${Math.round(rect.left + inset)}px`;
    } else {
      dock.style.right = `${Math.max(0, Math.round(viewportWidth - rect.right + inset))}px`;
    }
  }

  async function renderAddonDock() {
    const enabledItems = getEnabledAddonItems();
    const existingDock = document.getElementById('mg-addon-dock');

    if (enabledItems.length === 0) {
      if (existingDock) existingDock.remove();
      return;
    }

    const dock = existingDock || document.createElement('div');
    dock.id = 'mg-addon-dock';

    dock.innerHTML = enabledItems
      .map(item => `
        <button class="mg-addon-dock-btn" data-addon-id="${item.id}" data-addon-name="${item.name}" aria-label="${item.name}">
          ${item.dockIcon || '🧩'}
        </button>
      `)
      .join('');

    if (!existingDock) {
      document.body.appendChild(dock);
    }

    applyAddonDockPlacement(dock);

    dock.querySelectorAll('.mg-addon-dock-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        showDockTooltip(btn, btn.dataset.addonName, btn.dataset.addonId);
      });

      btn.addEventListener('mousemove', () => {
        const tooltip = document.getElementById('mg-dock-tooltip');
        if (!tooltip || tooltip.classList.contains('hidden')) return;
        positionDockTooltip(tooltip, btn);
      });

      btn.addEventListener('mouseleave', hideDockTooltip);
      btn.addEventListener('blur', hideDockTooltip);

      btn.addEventListener('click', async () => {
        const addonId = btn.dataset.addonId;
        await loadAddonModules();
        const addon = getAddonRegistry()[addonId];
        if (!addon) return;
        await addon.runWidget?.();
      });

      btn.addEventListener('contextmenu', async event => {
        event.preventDefault();
        event.stopPropagation();
        hideDockTooltip();

        const addonId = btn.dataset.addonId;
        await loadAddonModules();
        const addon = getAddonRegistry()[addonId];
        if (!addon) return;
        await addon.openSettings?.();
      });
    });
  }

  function buildAddonsContent() {
    const currentInterface = detectInterface();
    const filteredAddons = ADDON_ITEMS.filter(item => {
      // Show addon if it has no interface requirement or matches current interface
      return !item.requiredInterface || item.requiredInterface === currentInterface;
    });

    return `
      <div class="mg-info-strip">
        <span>🧩</span>
        <span>Włącz lub wyłącz poszczególne dodatki i zarządzaj ich ustawieniami. (Interfejs: ${currentInterface})</span>
      </div>
      <div class="mg-addon-list" id="mg-addon-list">
        ${filteredAddons.map(item => {
          const enabled = isAddonEnabled(item.id);
          const hasSettings = item.hasSettings !== false;
          return `
          <div class="mg-addon-item" data-addon-id="${item.id}">
            <div class="mg-addon-meta">
              <div class="mg-addon-icon">${item.dockIcon || '🧩'}</div>
              <div class="mg-addon-info">
                <div class="mg-addon-name">${item.name}<span class="mg-addon-installed">Zainstalowano</span>${item.wip ? '<span class="mg-addon-wip">work in progress</span>' : ''}</div>
                <div class="mg-addon-desc">${item.description}</div>
              </div>
            </div>
            <div class="mg-addon-actions">
              ${hasSettings ? `<button class="mg-addon-icon-btn mg-addon-settings${enabled ? '' : ' hidden'}" data-addon-id="${item.id}" title="Ustawienia">⚙</button>` : ''}
              <label class="mg-toggle" title="Wlacz/Wylacz">
                <input type="checkbox" class="mg-addon-toggle" data-addon-id="${item.id}" ${enabled ? 'checked' : ''}>
                <div class="mg-toggle-track"></div>
              </label>
            </div>
          </div>
        `;
        }).join('')}
      </div>
    `;
  }

  async function loadAddonModules() {
    const currentInterface = detectInterface();
    
    for (const url of ADDON_MODULES) {
      // Skip ulepszarka-ni if SI is detected
      if (currentInterface === 'SI' && url.includes('ulepszarka/ulepszarka-addon.js')) {
        continue;
      }
      // Skip ulepszarka-si if NI is detected
      if (currentInterface === 'NI' && url.includes('ulepszarka-si/ulepszarka-si-addon.js')) {
        continue;
      }
      // Skip NI-only addons if SI is detected
      if (currentInterface === 'SI' && (url.includes('dummy') || url.includes('grupa-w-zasiegu') || url.includes('resp-radar'))) {
        continue;
      }

      const existing = document.querySelector(`script[data-rzp-addon-module="${url}"]`);
      if (existing) continue;

      await new Promise((resolve) => {
        const versionedUrl = `${url}?v=${Date.now()}`;

        if (typeof window.__RZP_LOAD_MODULE === 'function') {
          // Marker zapobiega ponownemu załadowaniu podczas ładowania
          const marker = document.createElement('script');
          marker.type = 'text/rzp-marker';
          marker.dataset.rzpAddonModule = url;
          document.body.appendChild(marker);
          window.__RZP_LOAD_MODULE(versionedUrl, resolve, resolve);
        } else {
          const script = document.createElement('script');
          script.src = versionedUrl;
          script.async = true;
          script.dataset.rzpAddonModule = url;
          script.onload = () => resolve();
          script.onerror = () => resolve();
          document.body.appendChild(script);
        }
      });
    }
  }

  async function applyAddonState(addonId, enabled) {
    const addon = getAddonRegistry()[addonId];
    if (!addon) return false;

    if (enabled) {
      await addon.enable?.();
      return true;
    }

    addon.disable?.();
    return true;
  }

  async function syncEnabledAddons() {
    await loadAddonModules();

    for (const item of ADDON_ITEMS) {
      const enabled = isAddonEnabled(item.id);
      try {
        await applyAddonState(item.id, enabled);
      } catch (e) {
        console.warn('[RZP] syncEnabledAddons: failed for', item.id, e);
      }
    }

    await renderAddonDock();
  }

  async function setupAddonsPane(panel) {
    await syncEnabledAddons();

    panel.querySelectorAll('.mg-addon-toggle').forEach(toggle => {
      toggle.addEventListener('change', async () => {
        const addonId = toggle.dataset.addonId;
        const enabled = !!toggle.checked;
        const settingsBtn = panel.querySelector(`.mg-addon-settings[data-addon-id="${addonId}"]`);

        setAddonEnabled(addonId, enabled);
        if (settingsBtn) settingsBtn.classList.toggle('hidden', !enabled);

        const ok = await applyAddonState(addonId, enabled);
        if (!ok) {
          toggle.checked = !enabled;
          setAddonEnabled(addonId, !enabled);
          if (settingsBtn) settingsBtn.classList.toggle('hidden', enabled);
        }

        await renderAddonDock();
      });
    });

    panel.querySelectorAll('.mg-addon-settings').forEach(btn => {
      btn.addEventListener('click', async () => {
        const addonId = btn.dataset.addonId;
        await loadAddonModules();
        const addon = getAddonRegistry()[addonId];
        if (!addon) return;
        if (!isAddonEnabled(addonId)) {
          setAddonEnabled(addonId, true);
          const toggle = panel.querySelector(`.mg-addon-toggle[data-addon-id="${addonId}"]`);
          if (toggle) toggle.checked = true;
          await applyAddonState(addonId, true);
        }
        await addon.openSettings?.();
      });
    });

  }

  function setupNotificationsPane(panel) {
    panel.querySelectorAll('.mg-notif-toggle').forEach(toggle => {
      toggle.addEventListener('change', () => {
        const notifId = toggle.dataset.notifId;
        const enabled = !!toggle.checked;
        setNotificationEnabled(notifId, enabled);
      });
    });
  }

  function buildToggleRow(label, desc, id, defaultVal) {
    const saved = gmGetValue(id, defaultVal);
    return `
      <div class="mg-setting-row">
        <div>
          <div class="mg-setting-label">${label}</div>
          ${desc ? `<div class="mg-setting-desc">${desc}</div>` : ''}
        </div>
        <label class="mg-toggle">
          <input type="checkbox" id="mg-tgl-${id}" ${saved ? 'checked' : ''}>
          <div class="mg-toggle-track"></div>
        </label>
      </div>
    `;
  }

  function buildNotificationsContent() {
    let html = `
      <div class="mg-info-strip">
        <span>🔔</span>
        <span>Konfiguruj powiadomienia i alerty dla poszczególnych dodatków.</span>
      </div>
    `;

    for (const addonId in ADDON_NOTIFICATION_SETTINGS) {
      const addonItem = ADDON_ITEMS.find(item => item.id === addonId);
      const notificationsList = ADDON_NOTIFICATION_SETTINGS[addonId];

      if (!notificationsList || notificationsList.length === 0) continue;

      const addonName = addonItem ? addonItem.name : addonId;
      const addonIcon = addonItem ? addonItem.dockIcon || '🧩' : '🧩';

      html += `
        <div class="mg-settings-group">
          <div class="mg-settings-group-title">
            <span style="margin-right: 6px; font-size: 14px;">${addonIcon}</span>${addonName}
          </div>
      `;

      for (const notif of notificationsList) {
        const isEnabled = isNotificationEnabled(notif.id);
        html += `
          <div class="mg-setting-row">
            <div>
              <div class="mg-setting-label">${notif.label}</div>
            </div>
            <label class="mg-toggle">
              <input type="checkbox" class="mg-notif-toggle" data-notif-id="${notif.id}" ${isEnabled ? 'checked' : ''}>
              <div class="mg-toggle-track"></div>
            </label>
          </div>
        `;
      }

      html += `
        </div>
      `;
    }

    return html;
  }

  /* ─── DOCK EDITOR OVERLAY ────────────────────────────── */
  function showDockEditorOverlay() {
    hideDockEditorOverlay();

    const canvas = document.getElementById('GAME_CANVAS');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentPos = getAddonDockPosition();

    const overlay = document.createElement('div');
    overlay.id = 'mg-dock-editor-overlay';
    overlay.innerHTML = `
      <div class="mg-dock-editor-bg"></div>
      <div class="mg-dock-editor-canvas"></div>
    `;

    document.body.appendChild(overlay);

    const canvasBox = overlay.querySelector('.mg-dock-editor-canvas');
    canvasBox.style.left = `${rect.left}px`;
    canvasBox.style.top = `${rect.top}px`;
    canvasBox.style.width = `${rect.width}px`;
    canvasBox.style.height = `${rect.height}px`;

    const bankSize = 70;
    const bankGap = 12;

    const banks = [
      { pos: 'top-left', left: rect.left + bankGap, top: rect.top + bankGap, arrow: '↘' },
      { pos: 'top-right', left: rect.right - bankSize - bankGap, top: rect.top + bankGap, arrow: '↙' },
      { pos: 'bottom-left', left: rect.left + bankGap, top: rect.bottom - bankSize - bankGap, arrow: '↗' },
      { pos: 'bottom-right', left: rect.right - bankSize - bankGap, top: rect.bottom - bankSize - bankGap, arrow: '↖' },
      { pos: 'left-top', left: rect.left + bankGap, top: rect.top + bankGap + bankSize + 12, arrow: '↓' },
      { pos: 'left-bottom', left: rect.left + bankGap, top: rect.bottom - 2 * bankSize - bankGap - 12, arrow: '↑' },
      { pos: 'right-top', left: rect.right - bankSize - bankGap, top: rect.top + bankGap + bankSize + 12, arrow: '↓' },
      { pos: 'right-bottom', left: rect.right - bankSize - bankGap, top: rect.bottom - 2 * bankSize - bankGap - 12, arrow: '↑' }
    ];

    banks.forEach(bank => {
      const bankEl = document.createElement('div');
      bankEl.className = 'mg-dock-bank' + (bank.pos === currentPos ? ' active' : '');
      bankEl.style.left = `${bank.left}px`;
      bankEl.style.top = `${bank.top}px`;
      bankEl.style.width = `${bankSize}px`;
      bankEl.style.height = `${bankSize}px`;
      bankEl.textContent = bank.arrow;
      bankEl.dataset.dockpos = bank.pos;

      bankEl.addEventListener('click', async () => {
        setAddonDockPosition(bank.pos);
        await renderAddonDock();
        hideDockEditorOverlay();
        
        // Refresh settings panel to update current position text
        const settingsPane = document.getElementById('mg-pane-settings');
        if (settingsPane) {
          settingsPane.innerHTML = buildSettingsContent();
          // Reattach edit button listener
          const dockEditBtn = document.getElementById('mg-dock-edit-btn');
          if (dockEditBtn) {
            dockEditBtn.addEventListener('click', () => showDockEditorOverlay());
          }
          // Reattach toggle listeners
          document.querySelectorAll('#mg-pane-settings .mg-toggle input').forEach(input => {
            input.addEventListener('change', () => {
              gmSetValue(input.id.replace('mg-tgl-', ''), input.checked);
            });
          });
        }
      });

      overlay.appendChild(bankEl);
    });

    // Close on background click or Escape
    overlay.querySelector('.mg-dock-editor-bg').addEventListener('click', hideDockEditorOverlay);
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        hideDockEditorOverlay();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Hide panel, show overlay
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.style.display = 'none';

    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
  }

  function hideDockEditorOverlay() {
    const overlay = document.getElementById('mg-dock-editor-overlay');
    if (overlay) overlay.remove();

    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.style.display = '';
  }

  function buildSettingsContent() {
    const dockPosition = getAddonDockPosition();
    return `
      <div class="mg-settings-group">
        <div class="mg-settings-group-title">Panel</div>
        ${buildToggleRow('Otwieraj panel skrótem F2', 'Szybkie otwieranie/zamykanie klawiszem F2', 'hotkey_f2', true)}
        ${buildToggleRow('Zapamiętaj aktywną zakładkę', 'Po ponownym otwarciu wróć do ostatnio wybranej zakładki', 'remember_tab', true)}
        ${buildToggleRow('Animacje przejść', 'Płynne animacje przy zmianie zakładek', 'animations', true)}
        <div class="mg-setting-row" style="flex-direction:column;align-items:flex-start;gap:6px;">
          <div>
            <div class="mg-setting-label">Pozycja docka dodatkow</div>
            <div class="mg-setting-desc">Kliknij prostokat przy krawedzi, gdzie ma sie pojawiac dock z przyciskami</div>
          </div>
          <div class="mg-dock-canvas-preview">
            <div class="mg-dock-canvas-label">game canvas</div>
            <button class="mg-dock-bar mg-dock-bar--top-left${dockPosition === 'top-left' ? ' active' : ''}" data-dockpos="top-left" title="Gorna krawedz - od lewej">→</button>
            <button class="mg-dock-bar mg-dock-bar--top-right${dockPosition === 'top-right' ? ' active' : ''}" data-dockpos="top-right" title="Gorna krawedz - od prawej">←</button>
            <button class="mg-dock-bar mg-dock-bar--left-top${dockPosition === 'left-top' ? ' active' : ''}" data-dockpos="left-top" title="Lewa krawedz - od gory">↓</button>
            <button class="mg-dock-bar mg-dock-bar--left-bottom${dockPosition === 'left-bottom' ? ' active' : ''}" data-dockpos="left-bottom" title="Lewa krawedz - od dolu">↑</button>
            <button class="mg-dock-bar mg-dock-bar--right-top${dockPosition === 'right-top' ? ' active' : ''}" data-dockpos="right-top" title="Prawa krawedz - od gory">↓</button>
            <button class="mg-dock-bar mg-dock-bar--right-bottom${dockPosition === 'right-bottom' ? ' active' : ''}" data-dockpos="right-bottom" title="Prawa krawedz - od dolu">↑</button>
            <button class="mg-dock-bar mg-dock-bar--bottom-left${dockPosition === 'bottom-left' ? ' active' : ''}" data-dockpos="bottom-left" title="Dolna krawedz - od lewej">→</button>
            <button class="mg-dock-bar mg-dock-bar--bottom-right${dockPosition === 'bottom-right' ? ' active' : ''}" data-dockpos="bottom-right" title="Dolna krawedz - od prawej">←</button>
          </div>
          <div style="font-size:10px;color:#3d6647;">
            Aktualna pozycja: <strong id="mg-dock-current-pos" style="color:#4ade80">${ADDON_DOCK_POSITIONS[dockPosition] || dockPosition}</strong>
          </div>
        </div>
      </div>
      <div class="mg-settings-group">
        <div class="mg-settings-group-title">Informacje</div>
        <div class="mg-setting-row">
          <div>
            <div class="mg-setting-label">Wersja skryptu</div>
            <div class="mg-setting-desc">Aktualna wersja RzabiakPack</div>
          </div>
          <span class="mg-version-badge">v${VERSION}</span>
        </div>
        <div class="mg-setting-row">
          <div>
            <div class="mg-setting-label">Margonem</div>
            <div class="mg-setting-desc">Skrypt działa na wszystkich serwerach Margonem</div>
          </div>
          <span style="font-size:18px;">🐸</span>
        </div>
      </div>
    `;
  }

  /* ─── DOM BUILD ──────────────────────────────────────── */
  function buildPanel() {
    ADDONS.find(a => a.id === 'walka').content = buildAddonsContent();
    ADDONS.find(a => a.id === 'notif').content = buildNotificationsContent();
    ADDONS.find(a => a.id === 'settings').content = buildSettingsContent();

    const panel = document.createElement('div');
    panel.id = PANEL_ID;

    const lastTab = gmGetValue('last_tab', ADDONS[0].id);
    const firstAddon = ADDONS.find(a => a.id === lastTab) || ADDONS[0];

    const sidebar = document.createElement('div');
    sidebar.id = 'mg-sidebar';
    sidebar.innerHTML = `
      <div id="mg-sidebar-header">
        <img src="${FROG_GIF}" alt="Rzabiak" draggable="false" onerror="this.style.display='none'">
        <div class="mg-logo-text">RzabiakPack</div>
        <div class="mg-version-label">v${VERSION} · Margonem</div>
      </div>
      <div id="mg-nav">
        ${ADDONS.map(a => `
          <div class="mg-nav-item${a.id === lastTab ? ' active' : ''}" data-tab="${a.id}">
            <span class="mg-nav-icon">${a.icon}</span>
            <span class="mg-nav-label">${a.label}</span>
            ${a.badge ? `<span class="mg-nav-badge ${a.badgeType}">${a.badge}</span>` : ''}
          </div>
        `).join('')}
      </div>
      <div id="mg-sidebar-footer">🐸 RzabiakPack</div>
    `;

    const content = document.createElement('div');
    content.id = 'mg-content';
    content.innerHTML = `
      <div id="mg-content-header">
        <div>
          <div id="mg-content-title">${firstAddon.label}</div>
          <div id="mg-content-subtitle">${firstAddon.description}</div>
        </div>
        <button id="mg-close-btn" title="Zamknij (Esc)">✕</button>
      </div>
      <div id="mg-content-body">
        ${ADDONS.map(a => `
          <div class="mg-pane${a.id === lastTab ? ' active' : ''}" id="mg-pane-${a.id}">
            ${a.content}
          </div>
        `).join('')}
      </div>
    `;

    panel.appendChild(sidebar);
    panel.appendChild(content);
    document.body.appendChild(panel);
    setupPanelWheelScroll(panel);
    enablePanelDrag(panel);

    panel.querySelectorAll('.mg-nav-item').forEach(item => {
      item.addEventListener('click', () => switchTab(item.dataset.tab));
    });

    panel.querySelector('#mg-close-btn').addEventListener('click', closePanel);

    panel.querySelectorAll('.mg-toggle input').forEach(input => {
      input.addEventListener('change', () => {
        gmSetValue(input.id.replace('mg-tgl-', ''), input.checked);
      });
    });

    panel.querySelectorAll('.mg-dock-bar').forEach(bar => {
      bar.addEventListener('click', async () => {
        const pos = bar.dataset.dockpos;
        if (!pos) return;
        setAddonDockPosition(pos);
        await renderAddonDock();
        panel.querySelectorAll('.mg-dock-bar').forEach(b => {
          b.classList.toggle('active', b.dataset.dockpos === pos);
        });
        const currentPosEl = document.getElementById('mg-dock-current-pos');
        if (currentPosEl) currentPosEl.textContent = ADDON_DOCK_POSITIONS[pos] || pos;
      });
    });

    setupAddonsPane(panel);
    setupNotificationsPane(panel);

  }

  /* ─── TAB SWITCH ─────────────────────────────────────── */
  function switchTab(id) {
    const addon = ADDONS.find(a => a.id === id);
    if (!addon) return;
    document.querySelectorAll('.mg-nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.mg-pane').forEach(el => el.classList.remove('active'));
    document.querySelector(`.mg-nav-item[data-tab="${id}"]`)?.classList.add('active');
    document.getElementById(`mg-pane-${id}`)?.classList.add('active');
    document.getElementById('mg-content-title').textContent = addon.label;
    document.getElementById('mg-content-subtitle').textContent = addon.description;
    if (gmGetValue('remember_tab', true)) gmSetValue('last_tab', id);
  }

  /* ─── OPEN / CLOSE ───────────────────────────────────── */
  function openPanel()  {
    document.getElementById(PANEL_ID)?.classList.add('visible');
  }
  function closePanel() {
    document.getElementById(PANEL_ID)?.classList.remove('visible');
  }

  function setupPanelWheelScroll(panel) {
    if (!panel) return;

    panel.addEventListener('wheel', event => {
      if (!panel.classList.contains('visible')) return;

      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const nav = panel.querySelector('#mg-nav');
      const contentBody = panel.querySelector('#mg-content-body');

      if (target.closest('#mg-nav') && nav) {
        nav.scrollTop += event.deltaY;
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (target.closest('#mg-content-body') && contentBody) {
        contentBody.scrollTop += event.deltaY;
        event.preventDefault();
        event.stopPropagation();
      }
    }, { passive: false, capture: true });
  }

  function makeDraggable(container, handle) {
    if (!container || !handle) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    const isInteractiveTarget = target => {
      if (!target || !(target instanceof Element)) return false;
      return !!target.closest('button, input, select, textarea, a, [role="button"]');
    };

    handle.style.cursor = 'grab';

    handle.addEventListener('mousedown', event => {
      if (event.button !== 0) return;
      if (isInteractiveTarget(event.target)) return;

      const rect = container.getBoundingClientRect();
      isDragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startLeft = rect.left;
      startTop = rect.top;

      container.style.left = `${Math.round(rect.left)}px`;
      container.style.top = `${Math.round(rect.top)}px`;
      container.style.transform = 'none';
      handle.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      event.preventDefault();
    });

    window.addEventListener('mousemove', event => {
      if (!isDragging) return;

      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const maxLeft = Math.max(0, window.innerWidth - container.offsetWidth);
      const maxTop = Math.max(0, window.innerHeight - container.offsetHeight);

      const nextLeft = Math.min(Math.max(0, startLeft + deltaX), maxLeft);
      const nextTop = Math.min(Math.max(0, startTop + deltaY), maxTop);

      container.style.left = `${Math.round(nextLeft)}px`;
      container.style.top = `${Math.round(nextTop)}px`;
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      handle.style.cursor = 'grab';
      document.body.style.userSelect = '';
    });
  }

  function enablePanelDrag(panel) {
    makeDraggable(panel, panel.querySelector('#mg-content-header'));
  }

  function positionButtonUnderTalisman() {
    const btn = document.getElementById(BTN_ID);
    if (!btn) return false;

    const talismanSlot = document.querySelector('[data-st="9"]');
    if (!talismanSlot) {
      btn.style.top = 'auto';
      btn.style.left = 'auto';
      btn.style.right = '12px';
      btn.style.bottom = '80px';
      return false;
    }

    const rect = talismanSlot.getBoundingClientRect();
    const top = Math.round(rect.bottom + 6);
    const left = Math.round(rect.left + (rect.width - 34) / 2);

    btn.style.top = `${top}px`;
    btn.style.left = `${left}px`;
    btn.style.right = 'auto';
    btn.style.bottom = 'auto';
    return true;
  }

  /* ─── BUTTON INJECTION ───────────────────────────────── */
  function injectNavButton() {
    if (document.getElementById(BTN_ID)) return;

    const btn = document.createElement('div');
    btn.id = BTN_ID;
    btn.innerHTML = `<img class="mg-btn-frog" src="${FROG_GIF}" alt="RzabiakPack" onerror="this.style.display='none'">`;
    btn.addEventListener('click', openPanel);

    // Przycisk jest zawsze fixed i pozycjonowany pod slotem data-st="9".
    btn.style.cssText = 'position:fixed;bottom:80px;right:12px;z-index:14;';
    document.body.appendChild(btn);
    positionButtonUnderTalisman();
  }

  /* Retry — gra ładuje UI dynamicznie */
  function tryInject(attempt) {
    injectNavButton();
    const pinnedToTalisman = positionButtonUnderTalisman();
    if (!pinnedToTalisman && (attempt || 0) < 30) {
      setTimeout(() => tryInject((attempt || 0) + 1), 600);
    }
  }

  /* ─── KEYBOARD ───────────────────────────────────────── */
  document.addEventListener('keydown', e => {
    if (e.key === 'F2' && gmGetValue('hotkey_f2', true)) {
      e.preventDefault();
      document.getElementById(PANEL_ID)?.classList.contains('visible')
        ? closePanel() : openPanel();
    }
    if (e.key === 'Escape') closePanel();
  });

  /* ─── INIT ───────────────────────────────────────────── */
  
  // Expose public API for addons
  window.RZP_MAKE_DRAGGABLE = makeDraggable;
  window.RZP_PANEL_NOTIFICATIONS = {
    isEnabled: isNotificationEnabled,
    setEnabled: setNotificationEnabled
  };
  window.RZP_DOCK_HIDDEN_UTILS = {
    isHidden: isAddonDockHidden,
    setHidden: (id, hidden) => { setAddonDockHidden(id, hidden); renderAddonDock(); },
    makeRow:   makeDockToggleRow
  };

  function init() {
    buildPanel();
    tryInject(0);
    renderAddonDock();
    window.addEventListener('resize', () => {
      applyAddonDockPlacement(document.getElementById('mg-addon-dock'));
    });
    window.addEventListener('scroll', () => {
      applyAddonDockPlacement(document.getElementById('mg-addon-dock'));
    }, true);
    window.addEventListener('resize', positionButtonUnderTalisman);
    window.addEventListener('scroll', positionButtonUnderTalisman, true);
    setInterval(positionButtonUnderTalisman, 1200);
    setInterval(() => {
      applyAddonDockPlacement(document.getElementById('mg-addon-dock'));
    }, 1200);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

})();