(function () {
  'use strict';

  const ADDON_ID = 'resp-radar';
  const TOAST_CLASS = 'rzp-resp-radar-toast';
  const STYLE_ID = 'rzp-resp-radar-style';
  const PANEL_ID = 'rzp-resp-radar-settings';
  const STORAGE_KEY = 'rzp_resp_radar_settings';
  const DEBUG_STORAGE_KEY = 'rzp_resp_radar_debug';
  const DEBUG_STORAGE_KEY_LEGACY = 'rzp-resp-radar-debug';
  const ADDON_BUILD = '2026-04-25-message-phases-v2';
  const ALL_KEYS_FALLBACK_COOLDOWN_MS = 5000;
  const NETWORK_API_POLL_COOLDOWN_MS = 8000;
  const STARTUP_WARMUP_MS = 20000;
  const STARTUP_MIN_REFRESH_MS = 1000;
  const STARTUP_POLL_COOLDOWN_MS = 1500;
  const DATA_REFRESH_MIN_INTERVAL_MS = 2500;
  const DATA_REFRESH_IDLE_INTERVAL_MS = 4500;
  const UI_REFRESH_INTERVAL_MS = 1000;
  const TIMER_WINDOW_TRIGGER_COOLDOWN_MS = 2500;
  const PERSISTED_TIMERS_CACHE_KEY = 'rzp_resp_radar_network_cache_v1';
  const PERSISTED_TIMERS_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
  const RUNTIME_SCAN_COOLDOWN_MS = 5000;
  const RUNTIME_SCAN_MAX_NODES = 12000;
  const RUNTIME_SCAN_MAX_DEPTH = 8;

  const DEFAULT_SETTINGS = {
    position: 'bottom-center',
    refreshMs: 2000
  };

  const POSITIONS = [
    { value: 'top-left', label: 'Gora lewo' },
    { value: 'top-center', label: 'Gora srodek' },
    { value: 'top-right', label: 'Gora prawo' },
    { value: 'middle-left', label: 'Srodek lewo' },
    { value: 'middle-center', label: 'Srodek' },
    { value: 'middle-right', label: 'Srodek prawo' },
    { value: 'bottom-left', label: 'Dol lewo' },
    { value: 'bottom-center', label: 'Dol srodek' },
    { value: 'bottom-right', label: 'Dol prawo' }
  ];

  const REFRESH_OPTIONS = [1000, 2000, 5000, 10000, 20000];

  const ELITE_II_DATA = {
    'Grota Dzikiego Kota': 'Mushita',
    'Las Tropicieli': 'Kotołak Tropiciel',
    'Przeklęta Strażnica - podziemia p.2 s.1': 'Shae Phu',
    'Schowek na Łupy': 'Zorg Jednooki Baron',
    'Podmokła Dolina': 'Władca rzek',
    'Jaskinia Pogardy': 'Gobbos',
    'Pieczara Kwiku - sala 2': 'Tyrtajos',
    'Skalne Turnie': 'Tollok Shimger',
    'Stary Kupiecki Trakt': 'Szczęt alias Gładki',
    'Mokra Grota p.2': 'Agar',
    'Stare Wyrobisko p.3': 'Razuglag Oklash',
    'Lazurytowa Grota p.4': 'Foverk Turrim',
    'Kopalnia Kapiącego Miodu p.2 - sala Owadziej Matki': 'Owadzia Matka',
    'Jaskinia Gnollich Szamanów - komnata Kozuga': 'Furruk Kozug',
    'Namiot Vari Krugera': 'Vari Kruger',
    'Kamienna Jaskinia - sala 3': 'Jotun',
    'Głębokie Skałki p.4': 'Tollok Utumutu',
    'Głębokie Skałki p.3': 'Tollok Atamatu',
    'Krypty Dusz Śniegu p.3 - komnata Lisza': 'Lisz',
    'Erem Czarnego Słońca p.5': 'Grabarz świątynny',
    'Firnowa Grota p.2 s.1': 'Wielka Stopa',
    'Świątynia Andarum - zbrojownia': 'Podły zbrojmistrz',
    'Wylęgarnia Choukkerów p.1': 'Choukker',
    'Kopalnia Margorii': 'Nadzorczyni krasnoludów',
    'Margoria - Sala Królewska': 'Morthen',
    'Zapomniany Święty Gaj p.3': 'Leśne Widmo',
    'Grota Samotnych Dusz p.6': 'Żelazoręki Ohydziarz',
    'Kamienna Strażnica - Sanktuarium': 'Goplana',
    'Zagrzybiałe Ścieżki p.3': 'Gnom Figlid',
    'Dolina Centaurów': 'Centaur Zyfryd',
    'Namiot Kambiona': 'Kambion',
    'Podziemia Zniszczonej Wieży p.5': 'Jertek Moxos',
    'Zabłocona Jama p.2 - Sala Błotnistych Odmętów': 'Miłośnik rycerzy',
    'Zabłocona Jama p.2 - Sala Magicznego Błota': 'Miłośnik magii',
    'Zabłocona Jama p.2 - Sala Duszącej Stęchlizny': 'Miłośnik łowców',
    'Skalne Cmentarzysko p.4': 'Łowca czaszek',
    'Piramida Pustynnego Władcy p.3': 'Ozirus Władca Hieroglifów',
    'Jama Morskiej Macki p.1 - sala 3': 'Morski potwór',
    'Opuszczony statek - pokład': 'Krab pustelnik',
    'Twierdza Rogogłowych - Sala Byka': 'Borgoros Garamir III',
    'Piaskowa Pułapka - Grota Piaskowej Śmierci': 'Stworzyciel',
    'Wulkan Politraki p.1 - sala 3': 'Ifryt',
    'Ukryta Grota Morskich Diabłów - magazyn': 'Młody Jack Truciciel',
    'Ukryta Grota Morskich Diabłów - siedziba': 'Helga Opiekunka Rumu',
    'Ukryta Grota Morskich Diabłów - skarbiec': 'Henry Kaprawe Oko',
    'Piaszczysta Grota p.1 - sala 2': 'Eol',
    'Kopalnia Żółtego Kruszcu p.2 - sala 2': 'Grubber Ochlaj',
    'Kuźnia Worundriela - Komnata Żaru': 'Mistrz Worundriel',
    'Chata wójta Fistuły p.1': 'Wójt Fistuła',
    'Chata Teściowej': 'Teściowa Rumcajsa',
    'Cenotaf Berserkerów p.1 - sala 2': 'Berserker Amuno',
    'Mała Twierdza - sala główna': 'Fodug Zolash',
    'Lokum Złych Goblinów - warsztat': 'Goons Asterus',
    'Laboratorium Adariel': 'Adariel',
    'Grota Orczej Hordy p.2 s.3': 'Burkog Lorulk',
    'Grota Orczych Szamanów p.3 s.1': 'Sheba Orcza Szamanka',
    'Nawiedzone Kazamaty p.4': 'Duch Władcy Klanów',
    'Sala Rady Orków': 'Bragarth Myśliwy Dusz / Fursharag Pożeracz Umysłów / Ziuggrael Strażnik Królowej',
    'Sala Królewska': 'Lusgrathera Królowa Pramatka',
    'Kryształowa Grota - Sala Smutku': 'Królowa Śniegu',
    'Drzewo Dusz p.2': 'Wrzosera / Chryzoprenia / Cantedewia',
    'Ogrza Kawerna p.4': 'Ogr Stalowy Pazur',
    'Krypty Bezsennych p.3': 'Torunia Ankelwald',
    'Skarpa Trzech Słów': 'Pięknotka Mięsożerna',
    'Przysiółek Valmirów': 'Breheret Żelazny Łeb',
    'Starodrzew Przedwiecznych p.2': 'Cerasus',
    'Szlamowe Kanały p.2 - sala 3': 'Mysiur Myświórowy Król',
    'Przerażające Sypialnie': 'Sadolia Nadzorczyni Hurys',
    'Sala Skaryfikacji Grzeszników': 'Sataniel Skrytobójca',
    'Sale Rozdzierania': 'Bergermona Krwawa Hrabina',
    'Tajemnicza Siedziba': 'Annaniel Wysysacz Marzeń / Gothardus Kolekcjoner Głów',
    'Sala Tysiąca Świec': 'Zufulus Smakosz Serc',
    'Zalana Grota': 'Czempion Furboli',
    'Arachnitopia p.6': 'Arachniregina Colosseus / Rycerz z za małym mieczem',
    'Erem Aldiphrina': "Al'diphrin Ilythirahel",
    'Ołtarz Pajęczej Bogini': 'Marlloth Malignitas',
    'Gnijące Topielisko': 'Arytodam olbrzymi',
    'Jaszczurze Korytarze p.2 - sala 5': 'Mocny Maddoks',
    'Gardziel Podgnitych Mchów p.3': 'Fangaj',
    'Źródło Zakorzenionego Ludu': 'Dendroculus',
    'Złota Góra p.3 - sala 2': 'Tolypeutes',
    'Chantli Cuaitla Citlalina': 'Cuaitl Citlalin',
    'Zachodni Mictlan p.9': 'Yaotl',
    'Wschodni Mictlan p.9': 'Quetzalcoatl',
    'Siedlisko Przyjemnej Woni - źródło': 'Wabicielka',
    'Potępione Zamczysko - pracownia': 'Pogardliwa Sybilla',
    'Katakumby Gwałtownej Śmierci': 'Chopesz',
    'Grobowiec Seta': 'Neferkar Set',
    'Urwisko Vapora': 'Terrozaur',
    'Świątynia Hebrehotha - sala ofiary': 'Vaenra Charkhaam',
    'Świątynia Hebrehotha - sala czciciela': 'Chaegd Agnrakh',
    'Drzewo Życia p.3': 'Nymphemonia',
    'Sala Lodowej Magii': 'Artenius',
    'Sala Mroźnych Strzał': 'Furion',
    'Sala Mroźnych Szeptów': 'Zorin'
  };

  const TITAN_DATA = {
    'Migotliwa Pieczara': 'Dziewicza Orlica',
    'Grota Caerbannoga - leże bestii': 'Zabójczy Królik',
    'Bandyckie Chowisko - skarbiec': 'Renegat Baulus',
    'Wulkan Politraki - Piekielne Czeluście': 'Piekielny Arcymag',
    'Lokum Złych Goblinów - pracownia': 'Versus Zoons',
    'Źródło Wspomnień': 'Łowczyni Wspomnień',
    'Komnata Krwawych Obrzędów': 'Przyzywacz Demonów',
    'Nora Jaszczurzych Koszmarów - źródło': 'Maddok Magua',
    'Teotihuacan': 'Tezcatlipoca',
    'Sala Zrujnowanej Świątyni': 'Barbatos Smoczy Strażnik',
    'Sala Tronowa': 'Tanroth'
  };

  const KNOWN_TITAN_NAMES = new Set(
    Object.values(TITAN_DATA)
      .flatMap((value) => String(value).split('/'))
      .map((name) => name.trim())
      .filter(Boolean)
  );

  const KNOWN_ELITE2_NAMES = new Set(
    Object.values(ELITE_II_DATA)
      .flatMap((value) => String(value).split('/'))
      .map((name) => name.trim())
      .filter(Boolean)
  );

  const state = {
    enabled: false,
    visible: true,
    settings: { ...DEFAULT_SETTINGS },
    lootlogTimers: {},
    currentMapName: null,
    refreshIntervalId: null,
    resizeHandlerBound: false,
    matherWarningShown: false,
    debug: {
      lastSummaryAt: 0,
      lastSummaryHash: '',
      lastRefreshLogAt: 0,
      lastRefreshLogHash: ''
    },
    lastAllKeysFallbackAt: 0,
    lastRuntimeScanAt: 0,
    lastDataRefreshAt: 0,
    lastNetworkPollAt: 0,
    warmupUntil: 0,
    lastNetworkPollStatus: 'idle',
    timerWindowObserverBound: false,
    timerWindowObserver: null,
    lastTimerWindowTriggerAt: 0,
    minuteWindowSnapshot: {},
    minuteWindowSnapshotMapName: '',
    forcedRefreshTimeoutIds: [],
    networkHookInstalled: false,
    apiTimersCache: {},
    apiMeta: {
      source: null,
      method: null,
      capturedAt: 0,
      timerCount: 0,
      hasActiveTimers: false
    },
    networkTimersCache: {},
    networkMeta: {
      source: null,
      url: null,
      capturedAt: 0,
      timerCount: 0,
      hasActiveTimers: false,
      messageCount: 0
    },
    diagnostics: {
      build: ADDON_BUILD,
      source: 'none',
      storage: null,
      api: null,
      network: null,
      persisted: null,
      runtime: null,
      dom: null,
      hasActiveNetworkTimers: false,
      hasActivePersistedTimers: false,
      hasActiveApiTimers: false,
      hasActiveStorageTimers: false,
      hasActiveRuntimeTimers: false,
      networkTimerCount: 0,
      persistedTimerCount: 0,
      apiTimerCount: 0,
      storageTimerCount: 0,
      runtimeTimerCount: 0,
      domTimerCount: 0
    }
  };

  function normalizeMapName(name) {
    if (!name) return '';
    return String(name)
      .normalize('NFKC')
      .replace(/[\u2012\u2013\u2014\u2015]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeNpcName(name) {
    if (!name) return '';
    return String(name)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/g, 'l')
      .replace(/Ł/g, 'L')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getTimerForNpcName(npcName, timers) {
    if (!npcName || !timers || typeof timers !== 'object') return null;

    if (timers[npcName]) {
      return timers[npcName];
    }

    const normalizedNpcName = normalizeNpcName(npcName);
    if (!normalizedNpcName) return null;

    let bestTimer = null;
    let bestScore = -1;

    for (const [key, timer] of Object.entries(timers)) {
      const normalizedKey = normalizeNpcName(key);
      if (!normalizedKey) continue;

      if (normalizedKey === normalizedNpcName) {
        return timer;
      }

      const containsMatch =
        normalizedKey.includes(normalizedNpcName) || normalizedNpcName.includes(normalizedKey);

      if (!containsMatch) continue;

      const score = Math.min(normalizedKey.length, normalizedNpcName.length);
      if (score > bestScore) {
        bestScore = score;
        bestTimer = timer;
      }
    }

    return bestTimer;
  }

  function getNpcDataForMap(mapName) {
    if (!mapName) return null;

    const directElite = ELITE_II_DATA[mapName];
    if (directElite) return { npcData: directElite, npcType: 'ELITE2', lookupMode: 'direct' };

    const directTitan = TITAN_DATA[mapName];
    if (directTitan) return { npcData: directTitan, npcType: 'TITAN', lookupMode: 'direct' };

    const normalizedMapName = normalizeMapName(mapName);
    if (!normalizedMapName) return null;

    for (const key of Object.keys(ELITE_II_DATA)) {
      if (normalizeMapName(key) === normalizedMapName) {
        return { npcData: ELITE_II_DATA[key], npcType: 'ELITE2', lookupMode: 'normalized', matchedKey: key };
      }
    }

    for (const key of Object.keys(TITAN_DATA)) {
      if (normalizeMapName(key) === normalizedMapName) {
        return { npcData: TITAN_DATA[key], npcType: 'TITAN', lookupMode: 'normalized', matchedKey: key };
      }
    }

    // Fallback for slight map-name drift between game client and static mapping.
    let bestMatch = null;
    let bestScore = -1;
    const allEntries = [
      ...Object.keys(ELITE_II_DATA).map((key) => ({ key, npcType: 'ELITE2', npcData: ELITE_II_DATA[key] })),
      ...Object.keys(TITAN_DATA).map((key) => ({ key, npcType: 'TITAN', npcData: TITAN_DATA[key] }))
    ];

    for (const entry of allEntries) {
      const normalizedKey = normalizeMapName(entry.key);
      if (!normalizedKey) continue;

      const containsMatch =
        normalizedMapName.includes(normalizedKey) || normalizedKey.includes(normalizedMapName);
      if (!containsMatch) continue;

      const score = Math.min(normalizedMapName.length, normalizedKey.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    if (bestMatch) {
      return {
        npcData: bestMatch.npcData,
        npcType: bestMatch.npcType,
        lookupMode: 'fuzzy',
        matchedKey: bestMatch.key
      };
    }

    return null;
  }

  const isDebugEnabled = () => false;
  const debugLog = () => {};
  const debugWarn = () => {};
  const debugError = () => {};

  function loadSettings() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
      const refreshMs = Number(parsed?.refreshMs);
      return {
        position: POSITIONS.some((p) => p.value === parsed?.position)
          ? parsed.position
          : DEFAULT_SETTINGS.position,
        refreshMs: REFRESH_OPTIONS.includes(refreshMs) ? refreshMs : DEFAULT_SETTINGS.refreshMs
      };
    } catch (error) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
    } catch (error) {}
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .${TOAST_CLASS} {
        position: fixed;
        background: rgba(8, 20, 12, 0.92);
        border: 1px solid rgba(52, 211, 100, 0.3);
        color: #d4f0dc;
        border-radius: 8px;
        padding: 7px 11px;
        font-family: 'Trebuchet MS', Tahoma, Verdana, sans-serif;
        font-size: 12px;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.42);
        z-index: 100000;
        pointer-events: auto;
        cursor: pointer;
      }
      #${PANEL_ID} {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        min-width: 280px;
        background: linear-gradient(180deg, rgba(6, 16, 10, 0.97), rgba(10, 24, 14, 0.96));
        border: 1px solid rgba(52, 211, 100, 0.26);
        border-radius: 10px;
        color: #d4f0dc;
        font-family: 'Trebuchet MS', Tahoma, Verdana, sans-serif;
        box-shadow: 0 14px 30px rgba(0, 0, 0, 0.58);
        z-index: 20;
      }
      #${PANEL_ID}.hidden {
        display: none;
      }
      .rzp-resp-radar-head {
        padding: 10px 12px;
        border-bottom: 1px solid rgba(52, 211, 100, 0.2);
        font-size: 13px;
        font-weight: 700;
        color: #86efac;
      }
      .rzp-resp-radar-body {
        padding: 10px 12px;
      }
      .rzp-radar-section-title {
        font-size: 11px;
        font-weight: 600;
        color: #86efac;
        margin-bottom: 5px;
      }
      .rzp-radar-section-title + .rzp-radar-section-title {
        margin-top: 10px;
      }
      .rzp-radar-pos-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 5px;
      }
      .rzp-radar-pos-btn {
        height: 38px;
        background: rgba(34, 197, 94, 0.07);
        border: 1px solid rgba(52, 211, 100, 0.18);
        color: #a7f3d0;
        border-radius: 6px;
        cursor: pointer;
        font-size: 17px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s, border-color 0.15s;
      }
      .rzp-radar-pos-btn:hover {
        background: rgba(34, 197, 94, 0.18);
        border-color: rgba(52, 211, 100, 0.4);
      }
      .rzp-radar-pos-btn.active {
        background: rgba(52, 211, 100, 0.25);
        border-color: rgba(52, 211, 100, 0.7);
        color: #4ade80;
      }
      .rzp-radar-refresh-row {
        display: flex;
        gap: 5px;
      }
      .rzp-radar-refresh-btn {
        flex: 1;
        height: 28px;
        background: rgba(34, 197, 94, 0.07);
        border: 1px solid rgba(52, 211, 100, 0.18);
        color: #a7f3d0;
        border-radius: 6px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s, border-color 0.15s;
      }
      .rzp-radar-refresh-btn:hover {
        background: rgba(34, 197, 94, 0.18);
        border-color: rgba(52, 211, 100, 0.4);
      }
      .rzp-radar-refresh-btn.active {
        background: rgba(52, 211, 100, 0.25);
        border-color: rgba(52, 211, 100, 0.7);
        color: #4ade80;
      }
      .rzp-resp-radar-note {
        margin-top: 6px;
        color: #8cb49a;
        font-size: 10px;
      }
      @keyframes rzpWarningPulse {
        0%, 100% {
          box-shadow: 0 0 30px rgba(255, 0, 0, 0.8), 0 0 60px rgba(255, 69, 0, 0.4);
        }
        50% {
          box-shadow: 0 0 50px rgba(255, 0, 0, 1), 0 0 100px rgba(255, 69, 0, 0.6);
        }
      }
      @keyframes rzpWarningFadeIn {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.5);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }
      @keyframes rzpWarningShake {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-15deg); }
        75% { transform: rotate(15deg); }
      }
      @keyframes rzpWarningFadeOut {
        from {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        to {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.8);
        }
      }
    `;

    document.head.appendChild(style);
  }

  function getWorld() {
    try {
      if (window.Engine?.worldConfig?.name) return window.Engine.worldConfig.name.toLowerCase();
      if (window.Engine?.worldName) return window.Engine.worldName.toLowerCase();
      const match = window.location.hostname.match(/^(\w+)\.margonem\.(pl|com)$/);
      return match ? match[1].toLowerCase() : 'arkantes';
    } catch (error) {
      return 'arkantes';
    }
  }

  function safeJsonParse(value) {
    if (typeof value !== 'string') return null;
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function toTimestamp(value) {
    if (value === null || value === undefined) return null;

    if (typeof value === 'number' && Number.isFinite(value)) {
      if (value > 1000000000000) return value;
      if (value > 1000000000) return value * 1000;
      return null;
    }

    if (typeof value === 'string') {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) return toTimestamp(numeric);
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  function toSeconds(value) {
    if (value === null || value === undefined) return null;

    if (typeof value === 'number' && Number.isFinite(value)) {
      if (value < 0) return null;
      // Heuristic: large values are probably milliseconds.
      if (value > 100000) return Math.floor(value / 1000);
      return Math.floor(value);
    }

    if (typeof value === 'string') {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) return toSeconds(numeric);
    }

    return null;
  }

  function normalizeNpcType(rawType) {
    if (!rawType || typeof rawType !== 'string') return null;
    const type = rawType.toUpperCase();
    if (type === 'T') return 'TITAN';
    if (type === 'E2' || type === 'EII') return 'ELITE2';
    if (type.includes('ELITE2')) return 'ELITE2';
    if (type.includes('TITAN')) return 'TITAN';
    return null;
  }

  function inferNpcTypeByName(name) {
    const normalized = String(name || '').trim();
    if (!normalized) return null;
    if (KNOWN_TITAN_NAMES.has(normalized)) return 'TITAN';
    if (KNOWN_ELITE2_NAMES.has(normalized)) return 'ELITE2';
    return null;
  }

  function isLootlogStorageKey(key) {
    if (!key || typeof key !== 'string') return false;
    if (key === 'll:query-cache') return true;
    if (key.startsWith('ll:')) return true;
    return /lootlog|guild-timers|guildTimers|query-cache|react-query|persist|timers?/i.test(key);
  }

  function getStorageEntriesFromArea(area, areaName, includeAllKeys) {
    const entries = [];

    try {
      for (let i = 0; i < area.length; i++) {
        const key = area.key(i);
        if (!includeAllKeys && !isLootlogStorageKey(key)) continue;
        const value = area.getItem(key);
        if (typeof value !== 'string' || value.length < 2) continue;
        entries.push([`${areaName}:${key}`, value]);
      }
    } catch (error) {}

    return entries;
  }

  function getLootlogStorageEntries(includeAllKeys) {
    const entries = [];

    entries.push(...getStorageEntriesFromArea(window.localStorage, 'localStorage', includeAllKeys));
    entries.push(...getStorageEntriesFromArea(window.sessionStorage, 'sessionStorage', includeAllKeys));

    entries.sort((a, b) => {
      if (a[0].endsWith(':ll:query-cache')) return -1;
      if (b[0].endsWith(':ll:query-cache')) return 1;
      return a[0].localeCompare(b[0]);
    });

    return entries;
  }

  function buildStorageSignature(entries) {
    return entries
      .map(([key, value]) => `${key}:${value.length}`)
      .join('|');
  }

  function isTimerLikeArray(node) {
    if (!Array.isArray(node) || node.length === 0) return false;

    let matches = 0;
    const sampleSize = Math.min(node.length, 20);

    for (let i = 0; i < sampleSize; i++) {
      const item = node[i];
      if (!item || typeof item !== 'object') continue;
      const npc = item.npc || item.mob || item.monster || item.entity;
      const hasNpcName = Boolean(
        npc?.name || item.name || item.npcName || item.mobName || item.entityName
      );
      const hasType = Boolean(
        normalizeNpcType(npc?.type || item.type || item.npcType || item.mobType || item.kind)
      );
      const hasTime =
        item.minSpawnTime !== undefined ||
        item.maxSpawnTime !== undefined ||
        item.minRespawnTime !== undefined ||
        item.maxRespawnTime !== undefined ||
        item.remainingSeconds !== undefined ||
        item.timeLeft !== undefined;

      if (hasNpcName && hasType && hasTime) {
        matches += 1;
      }
    }

    return matches >= 1;
  }

  function collectGuildTimerArrays(root, world) {
    const arrays = [];
    const seen = new WeakSet();

    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (seen.has(node)) return;
      seen.add(node);

      if (Array.isArray(node)) {
        if (isTimerLikeArray(node)) {
          arrays.push(node);
        }
        for (let i = 0; i < node.length; i++) {
          try {
            visit(node[i]);
          } catch (error) {}
        }
        return;
      }

      const queryKey = node.queryKey;
      if (Array.isArray(queryKey) && (queryKey[0] === 'guild-timers' || queryKey[0] === 'guildTimers')) {
        const queryWorld = String(queryKey[1] || '').toLowerCase();
        if (!world || !queryWorld || queryWorld === world) {
          const data = node.state?.data ?? node.data ?? node.payload?.data;
          if (Array.isArray(data)) arrays.push(data);
        }
      }

      if (typeof node.state === 'string') {
        const parsedState = safeJsonParse(node.state);
        if (parsedState) visit(parsedState);
      }
      if (typeof node.clientState === 'string') {
        const parsedClientState = safeJsonParse(node.clientState);
        if (parsedClientState) visit(parsedClientState);
      }

      let values = [];
      try {
        values = Object.values(node);
      } catch (error) {
        values = [];
      }

      for (let i = 0; i < values.length; i++) {
        try {
          visit(values[i]);
        } catch (error) {}
      }
    }

    try {
      visit(root);
    } catch (error) {}
    return arrays;
  }

  function normalizeTimerEntry(timer, now, fallbackName) {
    if (!timer || typeof timer !== 'object') return null;

    const npc = timer.npc || timer.mob || timer.monster || timer.entity || {};
    const type = normalizeNpcType(
      npc.type || timer.type || timer.npcType || timer.mobType || timer.kind
    );
    const name =
      npc.name || timer.name || timer.npcName || timer.mobName || timer.entityName || null;
    const resolvedName = name || fallbackName || null;
    const resolvedType = type || inferNpcTypeByName(resolvedName);

    if (!resolvedType || !resolvedName) return null;

    const minRaw =
      timer.minSpawnTime ??
      timer.minRespawnTime ??
      timer.minRespTime ??
      timer.minTime ??
      timer.minTimestamp ??
      timer.startTime ??
      timer.respawnFrom ??
      timer.nextSpawnFrom;
    const maxRaw =
      timer.maxSpawnTime ??
      timer.maxRespawnTime ??
      timer.maxRespTime ??
      timer.maxTime ??
      timer.respawnAt ??
      timer.nextRespawn ??
      timer.timestamp ??
      timer.respawnTo ??
      timer.spawnTime ??
      timer.nextSpawnTime ??
      timer.nextRespawnAt ??
      timer.endTime;

    const remainingRaw =
      timer.remainingSeconds ??
      timer.remaining ??
      timer.timeLeft ??
      timer.secondsLeft ??
      timer.maxRemainingSeconds ??
      timer.countdown ??
      timer.respawnIn ??
      timer.timeToRespawn ??
      timer.timeToSpawn ??
      timer.time;

    let minTime = toTimestamp(minRaw);
    let maxTime = toTimestamp(maxRaw);

    if (maxTime === null) {
      const remaining = toSeconds(remainingRaw);
      if (remaining !== null) {
        maxTime = now + remaining * 1000;
      }
    }

    if (minTime === null) {
      const minRemaining = toSeconds(timer.minRemainingSeconds);
      if (minRemaining !== null) {
        minTime = now + minRemaining * 1000;
      }
    }

    // Some payloads expose the future timestamp in min field while max field is stale.
    if (maxTime !== null && maxTime <= now && minTime !== null && minTime > now) {
      maxTime = minTime;
    }

    if (minTime === null) minTime = maxTime;
    if (maxTime === null) return null;

    const minRemainingSeconds = Math.max(0, Math.floor((minTime - now) / 1000));
    const remainingSeconds = Math.max(0, Math.floor((maxTime - now) / 1000));

    return {
      name: resolvedName,
      type: resolvedType,
      minRemainingSeconds,
      remainingSeconds,
      _capturedAtMs: now,
      _minRemainingAtCapture: minRemainingSeconds,
      _remainingAtCapture: remainingSeconds,
      _debug: {
        minRaw,
        maxRaw,
        remainingRaw,
        parsedMinTime: minTime,
        parsedMaxTime: maxTime
      },
      addedByName:
        timer.member?.name ||
        timer.addedByName ||
        timer.addedBy?.name ||
        timer.author?.name ||
        null
    };
  }

  function parseHmsToSeconds(value) {
    if (typeof value !== 'string') return null;
    const match = value.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    if (![hours, minutes, seconds].every(Number.isFinite)) return null;
    return hours * 3600 + minutes * 60 + seconds;
  }

  function normalizeNamedTimerValue(name, value, now) {
    const inferredType = inferNpcTypeByName(name);
    if (!inferredType) return null;

    if (typeof value === 'string') {
      const hmsSeconds = parseHmsToSeconds(value);
      if (hmsSeconds !== null) {
        return {
          name,
          type: inferredType,
          minRemainingSeconds: Math.max(0, hmsSeconds),
          remainingSeconds: Math.max(0, hmsSeconds),
          _capturedAtMs: now,
          _minRemainingAtCapture: Math.max(0, hmsSeconds),
          _remainingAtCapture: Math.max(0, hmsSeconds),
          addedByName: null
        };
      }
      return null;
    }

    if (typeof value === 'number') {
      const seconds = toSeconds(value);
      if (seconds === null) return null;
      return {
        name,
        type: inferredType,
        minRemainingSeconds: Math.max(0, seconds),
        remainingSeconds: Math.max(0, seconds),
        _capturedAtMs: now,
        _minRemainingAtCapture: Math.max(0, seconds),
        _remainingAtCapture: Math.max(0, seconds),
        addedByName: null
      };
    }

    if (value && typeof value === 'object') {
      return normalizeTimerEntry(value, now, name);
    }

    return null;
  }

  function mergeTimers(target, source) {
    if (!source || typeof source !== 'object') return;
    Object.values(source).forEach((timer) => {
      if (!timer?.name) return;
      const existing = target[timer.name];
      const picked = pickBetterTimer(existing, timer);
      if (picked !== existing) {
        target[timer.name] = picked;
      }
    });
  }

  function extractTimersFromObjectGraph(root, now, parsedTimers, limits) {
    const maxDepth = limits?.maxDepth ?? 4;
    const maxNodes = limits?.maxNodes ?? 2500;
    const seen = new WeakSet();
    let visited = 0;
    let normalized = 0;

    const visit = (node, depth) => {
      if (!node || typeof node !== 'object') return;
      if (seen.has(node)) return;
      if (depth > maxDepth) return;
      if (visited >= maxNodes) return;

      seen.add(node);
      visited += 1;

      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
          visit(node[i], depth + 1);
          if (visited >= maxNodes) return;
        }
        return;
      }

      let entries = [];
      try {
        entries = Object.entries(node);
      } catch (error) {
        entries = [];
      }

      for (const [key, value] of entries) {
        const direct = normalizeNamedTimerValue(key, value, now);
        if (direct) {
          const existing = parsedTimers[direct.name];
          const picked = pickBetterTimer(existing, direct);
          if (picked !== existing) {
            parsedTimers[direct.name] = picked;
            normalized += 1;
          }
        }

        if (value && typeof value === 'object') {
          visit(value, depth + 1);
        }

        if (visited >= maxNodes) return;
      }
    };

    visit(root, 0);
    return normalized;
  }

  function maybeCaptureApiTimers(payload, meta) {
    if (!payload || (typeof payload !== 'object' && !Array.isArray(payload))) return;

    const world = getWorld();
    const now = Date.now();
    const { timers, arraysFound, normalizedTimers } = buildTimersFromRoots([payload], world, now);
    const directNormalized = extractTimersFromObjectGraph(payload, now, timers, { maxDepth: 5, maxNodes: 3000 });
    const timerCount = Object.keys(timers).length;
    if (!timerCount) return;

    state.apiTimersCache = timers;
    state.apiMeta = {
      source: meta?.source || 'api',
      method: meta?.method || null,
      capturedAt: now,
      timerCount,
      hasActiveTimers: hasActiveTimers(timers),
      arraysFound,
      normalizedTimers: normalizedTimers + directNormalized
    };
  }

  function getTimerQualityScore(timer) {
    if (!timer) return -1;
    const remaining = Number(timer.remainingSeconds);
    let score = 0;
    if (Number.isFinite(remaining) && remaining > 0) score += 20;
    if (Number.isFinite(remaining) && remaining >= 60) score += 4;
    if (Number.isFinite(remaining) && remaining <= 0) score -= 10;
    if (timer._debug?.maxRaw !== undefined && timer._debug?.maxRaw !== null) score += 3;
    if (timer._debug?.remainingRaw !== undefined && timer._debug?.remainingRaw !== null) score += 2;
    return score;
  }

  function pickBetterTimer(existing, candidate) {
    if (!existing) return candidate;
    const existingScore = getTimerQualityScore(existing);
    const candidateScore = getTimerQualityScore(candidate);

    if (candidateScore > existingScore) return candidate;
    if (candidateScore < existingScore) return existing;

    // Tie-break: prefer closer non-zero resp, but never replace non-zero with zero.
    const existingRemaining = Number(existing.remainingSeconds);
    const candidateRemaining = Number(candidate.remainingSeconds);
    const existingPositive = Number.isFinite(existingRemaining) && existingRemaining > 0;
    const candidatePositive = Number.isFinite(candidateRemaining) && candidateRemaining > 0;

    if (candidatePositive && !existingPositive) return candidate;
    if (!candidatePositive && existingPositive) return existing;

    // Prefer fresher payloads when quality is otherwise equal.
    const existingCapturedAt = Number(existing._capturedAtMs || 0);
    const candidateCapturedAt = Number(candidate._capturedAtMs || 0);
    if (candidateCapturedAt > existingCapturedAt + 1000) return candidate;

    if (candidatePositive && existingPositive && candidateRemaining < existingRemaining) return candidate;

    return existing;
  }

  function hasActiveTimers(timers) {
    if (!timers || typeof timers !== 'object') return false;
    return Object.values(timers).some((timer) => Number(timer?.remainingSeconds) > 0);
  }

  function buildTimersFromRoots(roots, world, now) {
    const parsedTimers = {};
    let arraysFound = 0;
    let normalizedTimers = 0;

    roots.forEach((root) => {
      const arrays = collectGuildTimerArrays(root, world);
      arraysFound += arrays.length;
      arrays.forEach((timers) => {
        timers.forEach((timer) => {
          const normalized = normalizeTimerEntry(timer, now);
          if (!normalized) return;
          const existing = parsedTimers[normalized.name];
          const picked = pickBetterTimer(existing, normalized);
          if (picked !== existing) {
            parsedTimers[normalized.name] = picked;
            normalizedTimers += 1;
          }
        });
      });
    });

    return { timers: parsedTimers, arraysFound, normalizedTimers };
  }

  function shouldInspectNetworkUrl(url) {
    const value = String(url || '').toLowerCase();
    return /lootlog|guild|timer|spawn|resp|query|cache/.test(value);
  }

  function maybeCaptureNetworkTimers(payload, meta) {
    if (!payload || typeof payload !== 'object') return;
    const world = getWorld();
    const now = Date.now();
    const { timers, arraysFound, normalizedTimers } = buildTimersFromRoots([payload], world, now);
    const directNormalized = extractTimersFromObjectGraph(payload, now, timers, { maxDepth: 6, maxNodes: 4500 });
    const timerCount = Object.keys(timers).length;
    if (!timerCount) return;

    state.networkTimersCache = timers;
    state.networkMeta = {
      source: meta?.source || 'network',
      url: meta?.url || null,
      capturedAt: now,
      timerCount,
      hasActiveTimers: hasActiveTimers(timers),
      arraysFound,
      normalizedTimers: normalizedTimers + directNormalized,
      messageCount: state.networkMeta.messageCount || 0
    };

    savePersistedNetworkTimers(timers, now);
  }

  function savePersistedNetworkTimers(timers, savedAt) {
    try {
      const world = getWorld();
      const serialized = {};
      Object.values(timers || {}).forEach((timer) => {
        if (!timer?.name) return;

        const maxTs = Number(timer?._debug?.parsedMaxTime);
        const minTs = Number(timer?._debug?.parsedMinTime);
        const resolvedMaxTs = Number.isFinite(maxTs)
          ? maxTs
          : (savedAt + Math.max(0, Number(timer.remainingSeconds) || 0) * 1000);
        const resolvedMinTs = Number.isFinite(minTs)
          ? minTs
          : (savedAt + Math.max(0, Number(timer.minRemainingSeconds) || 0) * 1000);

        serialized[timer.name] = {
          name: timer.name,
          type: timer.type,
          addedByName: timer.addedByName || null,
          minTs: resolvedMinTs,
          maxTs: resolvedMaxTs
        };
      });

      const payload = {
        world,
        savedAt,
        timers: serialized
      };

      window.localStorage.setItem(PERSISTED_TIMERS_CACHE_KEY, JSON.stringify(payload));
    } catch (error) {}
  }

  function loadPersistedNetworkTimers(world) {
    const diagnostics = {
      found: false,
      valid: false,
      reason: null,
      world: world || null,
      savedAt: 0,
      timerCount: 0,
      hasActiveTimers: false
    };

    try {
      const raw = window.localStorage.getItem(PERSISTED_TIMERS_CACHE_KEY);
      if (!raw) {
        diagnostics.reason = 'missing';
        return { timers: {}, diagnostics };
      }

      diagnostics.found = true;
      const parsed = safeJsonParse(raw);
      if (!parsed || typeof parsed !== 'object') {
        diagnostics.reason = 'invalid-json';
        return { timers: {}, diagnostics };
      }

      const savedWorld = String(parsed.world || '').toLowerCase();
      if (savedWorld && world && savedWorld !== String(world).toLowerCase()) {
        diagnostics.reason = 'world-mismatch';
        return { timers: {}, diagnostics };
      }

      const savedAt = Number(parsed.savedAt || 0);
      diagnostics.savedAt = savedAt;
      if (!Number.isFinite(savedAt) || savedAt <= 0) {
        diagnostics.reason = 'invalid-savedAt';
        return { timers: {}, diagnostics };
      }

      if (Date.now() - savedAt > PERSISTED_TIMERS_CACHE_MAX_AGE_MS) {
        diagnostics.reason = 'expired-cache';
        return { timers: {}, diagnostics };
      }

      const sourceTimers = parsed.timers;
      if (!sourceTimers || typeof sourceTimers !== 'object') {
        diagnostics.reason = 'missing-timers';
        return { timers: {}, diagnostics };
      }

      const now = Date.now();
      const restored = {};
      Object.values(sourceTimers).forEach((item) => {
        if (!item?.name || !item?.type) return;
        const maxTs = Number(item.maxTs);
        const minTs = Number(item.minTs);
        if (!Number.isFinite(maxTs)) return;

        const minRemaining = Number.isFinite(minTs)
          ? Math.max(0, Math.floor((minTs - now) / 1000))
          : Math.max(0, Math.floor((maxTs - now) / 1000));
        const remaining = Math.max(0, Math.floor((maxTs - now) / 1000));

        restored[item.name] = {
          name: item.name,
          type: item.type,
          minRemainingSeconds: minRemaining,
          remainingSeconds: remaining,
          addedByName: item.addedByName || null,
          _debug: {
            source: 'persisted-network-cache',
            parsedMinTime: Number.isFinite(minTs) ? minTs : maxTs,
            parsedMaxTime: maxTs
          }
        };
      });

      diagnostics.valid = true;
      diagnostics.reason = 'ok';
      diagnostics.timerCount = Object.keys(restored).length;
      diagnostics.hasActiveTimers = hasActiveTimers(restored);
      return { timers: restored, diagnostics };
    } catch (error) {
      diagnostics.reason = 'exception';
      return { timers: {}, diagnostics };
    }
  }

  function inspectNetworkText(text, meta) {
    if (typeof text !== 'string' || text.length < 2) return;
    const parsed = safeJsonParse(text);
    if (!parsed) return;
    maybeCaptureNetworkTimers(parsed, meta);
  }

  function inspectNetworkPayload(payload, meta) {
    if (typeof payload === 'string') {
      inspectNetworkText(payload, meta);
      return;
    }

    try {
      if (payload instanceof Blob) {
        payload.text().then((text) => {
          inspectNetworkText(text, meta);
        }).catch(() => {});
        return;
      }
    } catch (error) {}

    try {
      if (payload instanceof ArrayBuffer) {
        const text = new TextDecoder('utf-8').decode(payload);
        inspectNetworkText(text, meta);
      }
    } catch (error) {}
  }

  function clearForcedRefreshTimeouts() {
    if (!Array.isArray(state.forcedRefreshTimeoutIds)) {
      state.forcedRefreshTimeoutIds = [];
      return;
    }

    state.forcedRefreshTimeoutIds.forEach((id) => {
      try {
        clearTimeout(id);
      } catch (error) {}
    });

    state.forcedRefreshTimeoutIds = [];
  }

  function scheduleForcedTimerRefresh() {
    if (!state.enabled) return;

    const run = () => {
      if (!state.enabled) return;
      state.lastDataRefreshAt = 0;
      state.lastNetworkPollAt = 0;
      fetchLootlogTimers({ force: true });
      refreshView();
    };

    clearForcedRefreshTimeouts();
    run();

    [1200, 2800].forEach((delayMs) => {
      const timeoutId = setTimeout(() => {
        run();
      }, delayMs);
      state.forcedRefreshTimeoutIds.push(timeoutId);
    });
  }

  function extractNodeText(node, maxLen) {
    if (!node) return '';
    const limit = Number.isFinite(maxLen) ? maxLen : 1600;

    try {
      const raw = String(node.textContent || '');
      return raw.slice(0, limit);
    } catch (error) {
      return '';
    }
  }

  function shouldSkipTimerWindowNode(node) {
    if (!node) return true;
    const el = node.nodeType === 1 ? node : node.parentElement;
    if (!el || typeof el.closest !== 'function') return false;
    if (el.closest(`.${TOAST_CLASS}`)) return true;
    if (el.closest('#rzp-mather-warning')) return true;
    if (el.closest('#rzp-resp-radar-settings')) return true;
    return false;
  }

  function normalizeMinuteWindowNpcName(nameText) {
    if (!nameText) return '';
    const cleaned = String(nameText)
      .replace(/^\s*\[(?:E2|T)\]\s*/i, '')
      .trim();
    return normalizeNpcName(cleaned);
  }

  function readMinuteWindowTrackedTimers(trackedNpcNames) {
    const result = {};
    if (!Array.isArray(trackedNpcNames) || !trackedNpcNames.length) return result;

    const trackedSet = new Set(trackedNpcNames);
    const rows = document.querySelectorAll('.elite-timer-wnd .npc-list .row');
    if (!rows.length) return result;

    rows.forEach((row) => {
      try {
        const rawName = row.querySelector('.name-val')?.textContent || '';
        const rawTime = row.querySelector('.time-val')?.textContent || '';
        const npcName = normalizeMinuteWindowNpcName(rawName);
        if (!npcName || !trackedSet.has(npcName)) return;

        const seconds = parseHmsToSeconds(String(rawTime).trim());
        if (!Number.isFinite(seconds)) return;
        result[npcName] = seconds;
      } catch (error) {}
    });

    return result;
  }

  function getMinuteWindowTimerForNpc(npcName) {
    const normalizedNpc = normalizeNpcName(npcName);
    if (!normalizedNpc) return null;

    const rows = document.querySelectorAll('.elite-timer-wnd .npc-list .row');
    if (!rows.length) return null;

    for (const row of rows) {
      try {
        const rawName = row.querySelector('.name-val')?.textContent || '';
        const rawTime = row.querySelector('.time-val')?.textContent || '';
        const rowNpc = normalizeMinuteWindowNpcName(rawName);
        if (!rowNpc || rowNpc !== normalizedNpc) continue;

        const seconds = parseHmsToSeconds(String(rawTime).trim());
        if (!Number.isFinite(seconds)) return null;

        return {
          name: npcName,
          type: inferNpcTypeByName(npcName) || 'ELITE2',
          minRemainingSeconds: Math.max(0, seconds),
          remainingSeconds: Math.max(0, seconds),
          _capturedAtMs: Date.now(),
          _minRemainingAtCapture: Math.max(0, seconds),
          _remainingAtCapture: Math.max(0, seconds),
          addedByName: null,
          _debug: {
            source: 'minute-window-dom-fallback'
          }
        };
      } catch (error) {}
    }

    return null;
  }

  function shouldTriggerFromMinuteWindowSnapshot(currentSnapshot, trackedNpcNames) {
    const previousSnapshot = state.minuteWindowSnapshot || {};

    for (const npcName of trackedNpcNames) {
      const currentSeconds = Number(currentSnapshot[npcName]);
      const previousSeconds = Number(previousSnapshot[npcName]);
      const hasCurrent = Number.isFinite(currentSeconds);
      const hadPrevious = Number.isFinite(previousSeconds);

      // New timer row for tracked NPC appeared in minute window.
      if (hasCurrent && !hadPrevious) return true;

      // Timer renewed after kill (time jumps up instead of counting down).
      if (hasCurrent && hadPrevious && currentSeconds > previousSeconds + 20) return true;
    }

    return false;
  }

  function isMinuteWindowMutationNode(node) {
    if (!node) return false;
    const el = node.nodeType === 1 ? node : node.parentElement;
    if (!el || typeof el.closest !== 'function') return false;

    return Boolean(el.closest('.elite-timer-wnd, .elite-timer, .npc-list, .window-list.elite-timer-wnd'));
  }

  function isLikelyTimerWindowNode(node) {
    if (!node || node.nodeType !== 1) return false;
    const el = node;
    const idClass = `${el.id || ''} ${el.className || ''}`.toLowerCase();
    if (/timer|minut|lootlog|elite/.test(idClass)) return true;
    return false;
  }

  function getTrackedNpcNamesForCurrentMap() {
    const mapName = getCurrentMapName();
    const mapData = getNpcDataForMap(mapName);
    if (!mapData?.npcData) return [];
    return String(mapData.npcData)
      .split('/')
      .map((name) => normalizeNpcName(name))
      .filter(Boolean);
  }

  function nodeLooksLikeNpcTimerEntry(node, trackedNpcNames) {
    if (!node || !trackedNpcNames.length) return false;
    const normalizedText = normalizeNpcName(extractNodeText(node, 2400));
    if (!normalizedText) return false;

    // Timer lines usually include HH:MM:SS values.
    const hasHms = /\b\d{1,2}\s*\d{2}\s*\d{2}\b/.test(normalizedText) || /\b\d{2}\s*\d{2}\s*\d{2}\b/.test(normalizedText);
    if (!hasHms) return false;

    return trackedNpcNames.some((npc) => normalizedText.includes(npc));
  }

  function enableTimerWindowRefreshHook() {
    if (state.timerWindowObserverBound) return;
    if (typeof MutationObserver !== 'function') return;

    const observer = new MutationObserver((mutations) => {
      if (!state.enabled) return;

      const now = Date.now();
      if (now - state.lastTimerWindowTriggerAt < TIMER_WINDOW_TRIGGER_COOLDOWN_MS) return;

      const trackedNpcNames = getTrackedNpcNamesForCurrentMap();

      if (!trackedNpcNames.length) return;

      const mapName = getCurrentMapName() || '';
      if (state.minuteWindowSnapshotMapName !== mapName) {
        state.minuteWindowSnapshotMapName = mapName;
        state.minuteWindowSnapshot = {};
      }

      for (const mutation of mutations) {
        const candidates = [];

        if (mutation.type === 'childList' && mutation.addedNodes?.length) {
          mutation.addedNodes.forEach((n) => candidates.push(n));
        } else if (mutation.type === 'characterData' && mutation.target) {
          candidates.push(mutation.target);
        }

        for (const node of candidates) {
          if (shouldSkipTimerWindowNode(node)) continue;
          if (!isMinuteWindowMutationNode(node)) continue;

          let candidateNode = node;
          if (candidateNode.nodeType !== 1 && candidateNode.parentElement) {
            candidateNode = candidateNode.parentElement;
          }

          if (!candidateNode) continue;

          const isLikelyWindowMutation =
            isLikelyTimerWindowNode(candidateNode) ||
            (typeof candidateNode.closest === 'function' && Boolean(candidateNode.closest('[id*="timer" i], [class*="timer" i], [class*="minut" i], [class*="lootlog" i], [class*="elite" i]')));
          if (!isLikelyWindowMutation) continue;

          const currentSnapshot = readMinuteWindowTrackedTimers(trackedNpcNames);
          const shouldTrigger = shouldTriggerFromMinuteWindowSnapshot(currentSnapshot, trackedNpcNames);
          state.minuteWindowSnapshot = currentSnapshot;
          if (!shouldTrigger) continue;

          state.lastTimerWindowTriggerAt = Date.now();
          scheduleForcedTimerRefresh();
          return;
        }
      }
    });

    try {
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true
      });
      state.timerWindowObserver = observer;
      state.timerWindowObserverBound = true;
    } catch (error) {
      try {
        observer.disconnect();
      } catch (disconnectError) {}
    }
  }

  function disableTimerWindowRefreshHook() {
    clearForcedRefreshTimeouts();
    state.minuteWindowSnapshot = {};
    state.minuteWindowSnapshotMapName = '';
    if (!state.timerWindowObserverBound) return;
    try {
      state.timerWindowObserver?.disconnect?.();
    } catch (error) {}
    state.timerWindowObserver = null;
    state.timerWindowObserverBound = false;
  }

  function ensureNetworkTimerHook() {
    if (state.networkHookInstalled) return;
    state.networkHookInstalled = true;

    try {
      if (typeof window.fetch === 'function') {
        const originalFetch = window.fetch;
        window.fetch = function (...args) {
          return originalFetch.apply(this, args).then((response) => {
            try {
              const url = String(args?.[0]?.url || args?.[0] || response?.url || '');
              if (shouldInspectNetworkUrl(url) && response?.clone) {
                const clone = response.clone();
                clone.text().then((text) => {
                  inspectNetworkPayload(text, { source: 'fetch', url });
                }).catch(() => {});
              }
            } catch (error) {}
            return response;
          });
        };
      }
    } catch (error) {}

    try {
      if (window.XMLHttpRequest && window.XMLHttpRequest.prototype) {
        const proto = window.XMLHttpRequest.prototype;
        const originalOpen = proto.open;
        const originalSend = proto.send;

        proto.open = function (method, url, ...rest) {
          try {
            this.__rzpRespRadarUrl = String(url || '');
          } catch (error) {}
          return originalOpen.call(this, method, url, ...rest);
        };

        proto.send = function (...args) {
          try {
            this.addEventListener('load', () => {
              try {
                const url = String(this.__rzpRespRadarUrl || this.responseURL || '');
                if (!shouldInspectNetworkUrl(url)) return;
                if (typeof this.responseText !== 'string') return;
                inspectNetworkPayload(this.responseText, { source: 'xhr', url });
              } catch (error) {}
            });
          } catch (error) {}
          return originalSend.apply(this, args);
        };
      }
    } catch (error) {}

    try {
      if (typeof window.WebSocket === 'function' && !window.WebSocket.__rzpRespRadarWrapped) {
        const NativeWebSocket = window.WebSocket;
        const nativeDispatchEvent = NativeWebSocket.prototype?.dispatchEvent;
        const WrappedWebSocket = function (...args) {
          const socket = new NativeWebSocket(...args);
          try {
            const wsUrl = String(args?.[0] || '');
            socket.addEventListener('message', (event) => {
              try {
                state.networkMeta.messageCount = (state.networkMeta.messageCount || 0) + 1;
                inspectNetworkPayload(event?.data, { source: 'ws', url: wsUrl });
              } catch (error) {}
            });
          } catch (error) {}
          return socket;
        };

        WrappedWebSocket.prototype = NativeWebSocket.prototype;
        WrappedWebSocket.CONNECTING = NativeWebSocket.CONNECTING;
        WrappedWebSocket.OPEN = NativeWebSocket.OPEN;
        WrappedWebSocket.CLOSING = NativeWebSocket.CLOSING;
        WrappedWebSocket.CLOSED = NativeWebSocket.CLOSED;
        WrappedWebSocket.__rzpRespRadarWrapped = true;
        window.WebSocket = WrappedWebSocket;

        if (typeof nativeDispatchEvent === 'function' && !NativeWebSocket.prototype.__rzpRespRadarDispatchWrapped) {
          NativeWebSocket.prototype.dispatchEvent = function (event) {
            try {
              if (event?.type === 'message') {
                state.networkMeta.messageCount = (state.networkMeta.messageCount || 0) + 1;
                const url = String(this?.url || '');
                inspectNetworkPayload(event?.data, { source: 'ws-dispatch', url });
              }
            } catch (error) {}
            return nativeDispatchEvent.call(this, event);
          };
          NativeWebSocket.prototype.__rzpRespRadarDispatchWrapped = true;
        }
      }
    } catch (error) {}
  }

  function pollLootlogTimersApi(world, options) {
    if (!world) return;

    const force = Boolean(options?.force);

    const now = Date.now();
    const pollCooldown =
      now < state.warmupUntil ? STARTUP_POLL_COOLDOWN_MS : NETWORK_API_POLL_COOLDOWN_MS;
    if (!force && now - state.lastNetworkPollAt < pollCooldown) return;
    state.lastNetworkPollAt = now;
    state.lastNetworkPollStatus = 'pending';

    try {
      const api = window.lootlogGameClientApi;
      if (!api || typeof api.getTimers !== 'function') {
        state.lastNetworkPollStatus = 'api-missing';
        return;
      }

      const result = api.getTimers();
      if (result && typeof result.then === 'function') {
        result.then((resolved) => {
          maybeCaptureApiTimers(resolved, { source: 'api-trigger-promise', method: 'getTimers' });
          state.lastNetworkPollStatus = 'api-promise-ok';
        }).catch(() => {
          state.lastNetworkPollStatus = 'api-promise-error';
        });
      } else if (result !== undefined) {
        maybeCaptureApiTimers(result, { source: 'api-trigger-sync', method: 'getTimers' });
        state.lastNetworkPollStatus = 'api-sync-ok';
      } else {
        // Undefined is expected in some Lootlog versions; this call can still trigger
        // internal fetch/socket updates that our network hooks capture.
        state.lastNetworkPollStatus = 'api-triggered';
      }
    } catch (error) {
      state.lastNetworkPollStatus = 'api-trigger-error';
    }
  }

  function parseTimersFromLootlogStorage(world) {
    const now = Date.now();
    const parsedTimers = {};
    const entries = getLootlogStorageEntries(false);
    const diagnostics = {
      world,
      filteredEntryCount: entries.length,
      allEntryCount: 0,
      rootsScanned: 0,
      arraysFound: 0,
      normalizedTimers: 0,
      usedFallbackAllKeys: false,
      fallbackReason: null,
      skippedFallbackByCooldown: false,
      scannedKeys: entries.map(([key]) => key)
    };

    const parseFromEntries = (list) => {
      for (const [entryKey, rawValue] of list) {
        const parsed = safeJsonParse(rawValue);
        if (!parsed) continue;

        const shouldDeepScanRoot =
          /timers?|guild|lootlog|query-cache/i.test(String(entryKey || '')) &&
          String(rawValue || '').length < 350000;

        const roots = [parsed];
        if (typeof parsed.state === 'string') {
          const parsedState = safeJsonParse(parsed.state);
          if (parsedState) roots.push(parsedState);
        }
        if (typeof parsed.clientState === 'string') {
          const parsedClientState = safeJsonParse(parsed.clientState);
          if (parsedClientState) roots.push(parsedClientState);
        }

        for (const root of roots) {
          diagnostics.rootsScanned += 1;
          const timerArrays = collectGuildTimerArrays(root, world);
          diagnostics.arraysFound += timerArrays.length;
          timerArrays.forEach((timers) => {
            timers.forEach((timer) => {
              const normalized = normalizeTimerEntry(timer, now);
              if (!normalized) return;

              const existing = parsedTimers[normalized.name];
              const picked = pickBetterTimer(existing, normalized);
              if (picked !== existing) {
                parsedTimers[normalized.name] = picked;
                diagnostics.normalizedTimers += 1;
              }
            });
          });

          if (shouldDeepScanRoot) {
            diagnostics.normalizedTimers += extractTimersFromObjectGraph(root, now, parsedTimers, {
              maxDepth: 4,
              maxNodes: 1800
            });
          }
        }
      }
    };

    parseFromEntries(entries);

    const noTimers = !Object.keys(parsedTimers).length;
    const noActiveTimers = !hasActiveTimers(parsedTimers);
    const shouldUseFallbackAllKeys = noTimers || noActiveTimers;
    const nowTs = Date.now();
    const cooldownPassed = nowTs - state.lastAllKeysFallbackAt >= ALL_KEYS_FALLBACK_COOLDOWN_MS;

    // Fallback for new Lootlog versions that persist under generic keys,
    // and also when filtered keys only contain stale/expired timers.
    if (shouldUseFallbackAllKeys && cooldownPassed) {
      const allEntries = getLootlogStorageEntries(true);
      diagnostics.usedFallbackAllKeys = true;
      diagnostics.fallbackReason = noTimers ? 'no-timers' : 'only-expired-timers';
      diagnostics.allEntryCount = allEntries.length;
      diagnostics.scannedKeys = allEntries.map(([key]) => key);
      state.lastAllKeysFallbackAt = nowTs;
      parseFromEntries(allEntries);
    } else if (shouldUseFallbackAllKeys) {
      diagnostics.skippedFallbackByCooldown = true;
    }

    return { timers: parsedTimers, diagnostics };
  }

  function parseTimersFromLootlogApi(world) {
    const diagnostics = {
      world,
      apiFound: false,
      rootsTried: 0,
      arraysFound: 0,
      normalizedTimers: 0,
      usedMethods: [],
      pendingPromiseMethods: [],
      candidateKeys: [],
      rawResults: []
    };

    const api = window.lootlogGameClientApi;
    if (!api || typeof api !== 'object') {
      return { timers: {}, diagnostics };
    }

    diagnostics.apiFound = true;
    const now = Date.now();
    const parsedTimers = {};
    const roots = [];

    const addRoot = (value, label) => {
      if (!value) return;
      if (typeof value !== 'object' && !Array.isArray(value)) return;
      roots.push({ value, label });
    };

    addRoot(api, 'api');

    const methodNames = [
      'getState',
      'getStore',
      'getData',
      'getSnapshot',
      'getGuilds',
      'getTimers',
      'getGuildTimers',
      'getQueryClient',
      'getSocketState'
    ];

    methodNames.forEach((name) => {
      const fn = api[name];
      if (typeof fn !== 'function') return;
      try {
        const result = fn.call(api);
        diagnostics.usedMethods.push(name);
        diagnostics.rawResults.push({
          method: name,
          isPromise: Boolean(result && typeof result.then === 'function'),
          type: Array.isArray(result) ? 'array' : typeof result,
          keySample:
            result && typeof result === 'object' && !Array.isArray(result)
              ? Object.keys(result).slice(0, 20)
              : [],
          arrayLength: Array.isArray(result) ? result.length : null,
          sample:
            Array.isArray(result)
              ? result.slice(0, 3)
              : result && typeof result === 'object'
                ? Object.fromEntries(Object.entries(result).slice(0, 5))
                : result ?? null
        });
        if (result && typeof result.then === 'function') {
          diagnostics.pendingPromiseMethods.push(name);
          result.then((resolved) => {
            try {
              maybeCaptureApiTimers(resolved, { source: 'api-promise', method: name });
            } catch (error) {}
          }).catch(() => {});
        } else {
          addRoot(result, `api.${name}()`);
        }
      } catch (error) {}
    });

    let keys = [];
    try {
      keys = Object.keys(api);
    } catch (error) {
      keys = [];
    }

    keys.forEach((key) => {
      if (!/timer|guild|loot|spawn|resp|query|cache|state/i.test(key)) return;
      diagnostics.candidateKeys.push(key);
      try {
        addRoot(api[key], `api.${key}`);
      } catch (error) {}
    });

    roots.forEach(({ value }) => {
      diagnostics.rootsTried += 1;
      const arrays = collectGuildTimerArrays(value, world);
      diagnostics.arraysFound += arrays.length;
      arrays.forEach((timers) => {
        timers.forEach((timer) => {
          const normalized = normalizeTimerEntry(timer, now);
          if (!normalized) return;
          const existing = parsedTimers[normalized.name];
          const picked = pickBetterTimer(existing, normalized);
          if (picked !== existing) {
            parsedTimers[normalized.name] = picked;
            diagnostics.normalizedTimers += 1;
          }
        });
      });

      diagnostics.normalizedTimers += extractTimersFromObjectGraph(value, now, parsedTimers, {
        maxDepth: 4,
        maxNodes: 2500
      });
    });

    return { timers: parsedTimers, diagnostics };
  }

  function shouldTraverseProperty(parentKey, key) {
    if (!key) return false;
    const lower = String(key).toLowerCase();
    if (
      lower.includes('lootlog') ||
      lower.includes('guild') ||
      lower.includes('timer') ||
      lower.includes('query') ||
      lower.includes('cache') ||
      lower.includes('persist') ||
      lower.includes('react') ||
      lower.includes('state') ||
      lower.includes('client') ||
      lower.includes('store') ||
      lower.includes('engine')
    ) {
      return true;
    }
    if (!parentKey) return false;
    return shouldTraverseProperty('', parentKey);
  }

  function collectRuntimeRoots() {
    const roots = [];
    const w = window;

    const pushRoot = (label, value) => {
      if (!value || (typeof value !== 'object' && typeof value !== 'function')) return;
      roots.push({ label, value });
    };

    pushRoot('window.Engine', w.Engine);
    pushRoot('window.g', w.g);
    pushRoot('window.__NEXT_DATA__', w.__NEXT_DATA__);
    pushRoot('window.__NUXT__', w.__NUXT__);
    pushRoot('window.__APOLLO_STATE__', w.__APOLLO_STATE__);
    pushRoot('window.__REACT_QUERY_STATE__', w.__REACT_QUERY_STATE__);

    try {
      Object.keys(w).forEach((key) => {
        if (!shouldTraverseProperty('', key)) return;
        let value = null;
        try {
          value = w[key];
        } catch (error) {
          return;
        }
        pushRoot(`window.${key}`, value);
      });
    } catch (error) {}

    return roots;
  }

  function parseTimersFromRuntimeMemory(world) {
    const now = Date.now();
    if (now - state.lastRuntimeScanAt < RUNTIME_SCAN_COOLDOWN_MS) {
      return {
        timers: {},
        diagnostics: {
          world,
          skippedByCooldown: true,
          rootsScanned: 0,
          nodesVisited: 0,
          arraysFound: 0,
          normalizedTimers: 0,
          rootLabels: []
        }
      };
    }

    state.lastRuntimeScanAt = now;

    const parsedTimers = {};
    const diagnostics = {
      world,
      skippedByCooldown: false,
      rootsScanned: 0,
      nodesVisited: 0,
      arraysFound: 0,
      normalizedTimers: 0,
      rootLabels: []
    };

    const roots = collectRuntimeRoots();
    const seen = new WeakSet();

    const maybeParseNode = (node) => {
      if (!node || typeof node !== 'object') return;

      const timerArrays = collectGuildTimerArrays(node, world);
      if (!Array.isArray(timerArrays) || !timerArrays.length) return;

      diagnostics.arraysFound += timerArrays.length;
      timerArrays.forEach((timers) => {
        timers.forEach((timer) => {
          const normalized = normalizeTimerEntry(timer, now);
          if (!normalized) return;

          const existing = parsedTimers[normalized.name];
          const picked = pickBetterTimer(existing, normalized);
          if (picked !== existing) {
            parsedTimers[normalized.name] = picked;
            diagnostics.normalizedTimers += 1;
          }
        });
      });
    };

    const traverse = (node, depth, parentKey) => {
      if (!node || typeof node !== 'object') return;
      if (seen.has(node)) return;
      if (diagnostics.nodesVisited >= RUNTIME_SCAN_MAX_NODES) return;
      if (depth > RUNTIME_SCAN_MAX_DEPTH) return;

      seen.add(node);
      diagnostics.nodesVisited += 1;

      maybeParseNode(node);

      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
          traverse(node[i], depth + 1, parentKey);
          if (diagnostics.nodesVisited >= RUNTIME_SCAN_MAX_NODES) return;
        }
        return;
      }

      let keys;
      try {
        keys = Object.keys(node);
      } catch (error) {
        return;
      }

      for (const key of keys) {
        if (!shouldTraverseProperty(parentKey, key)) continue;
        let child;
        try {
          child = node[key];
        } catch (error) {
          continue;
        }
        traverse(child, depth + 1, key);
        if (diagnostics.nodesVisited >= RUNTIME_SCAN_MAX_NODES) return;
      }
    };

    roots.forEach((root) => {
      if (diagnostics.nodesVisited >= RUNTIME_SCAN_MAX_NODES) return;
      diagnostics.rootsScanned += 1;
      diagnostics.rootLabels.push(root.label);
      maybeParseNode(root.value);
      traverse(root.value, 0, root.label);
    });

    return { timers: parsedTimers, diagnostics };
  }

  function parseTimersFromLootlogDom() {
    const fromDom = {};
    const diagnostics = {
      foundRoot: false,
      textLength: 0,
      matchCount: 0
    };

    try {
      const timerRoot = document.querySelector('.elite-timer-wnd, [class*="ll-timer"], [class*="timer"]');
      if (!timerRoot) return { timers: fromDom, diagnostics };

      diagnostics.foundRoot = true;

      const text = (timerRoot.textContent || '').replace(/\s+/g, ' ');
      diagnostics.textLength = text.length;
      const regex = /\[(E2|T)\]\s*([^\d\[]+?)\s*(\d{2}:\d{2}:\d{2})/gi;
      let match;

      while ((match = regex.exec(text)) !== null) {
        const typeTag = String(match[1] || '').toUpperCase();
        const name = String(match[2] || '').trim();
        const time = String(match[3] || '').trim();
        if (!name || !time) continue;

        const parts = time.split(':').map((v) => Number(v));
        if (parts.length !== 3 || parts.some((v) => !Number.isFinite(v))) continue;

        fromDom[name] = {
          name,
          type: typeTag === 'T' ? 'TITAN' : 'ELITE2',
          minRemainingSeconds: 0,
          remainingSeconds: parts[0] * 3600 + parts[1] * 60 + parts[2],
          addedByName: null
        };
        diagnostics.matchCount += 1;
      }
    } catch (error) {}

    return { timers: fromDom, diagnostics };
  }

  function logTimerDiagnostics(storageDiagnostics, storageTimerCount, domDiagnostics, domTimerCount, source) {
    if (!isDebugEnabled()) return;

    const now = Date.now();
    const summaryHash = [
      source,
      storageTimerCount,
      domTimerCount,
      storageDiagnostics?.filteredEntryCount || 0,
      storageDiagnostics?.allEntryCount || 0,
      storageDiagnostics?.arraysFound || 0,
      domDiagnostics?.matchCount || 0
    ].join(':');

    const shouldLogSummary =
      state.debug.lastSummaryHash !== summaryHash ||
      now - state.debug.lastSummaryAt > 12000;

    if (!shouldLogSummary) return;

    state.debug.lastSummaryHash = summaryHash;
    state.debug.lastSummaryAt = now;

    debugLog('Timer source:', source, '| world:', storageDiagnostics?.world);
    debugLog('Storage diagnostics:', {
      filteredEntryCount: storageDiagnostics?.filteredEntryCount || 0,
      allEntryCount: storageDiagnostics?.allEntryCount || 0,
      rootsScanned: storageDiagnostics?.rootsScanned || 0,
      arraysFound: storageDiagnostics?.arraysFound || 0,
      normalizedTimers: storageDiagnostics?.normalizedTimers || 0,
      usedFallbackAllKeys: Boolean(storageDiagnostics?.usedFallbackAllKeys),
      scannedKeys: storageDiagnostics?.scannedKeys || []
    });
    debugLog('DOM diagnostics:', {
      foundRoot: Boolean(domDiagnostics?.foundRoot),
      textLength: domDiagnostics?.textLength || 0,
      matchCount: domDiagnostics?.matchCount || 0
    });

    if (storageTimerCount > 0 || domTimerCount > 0) {
      const names = Object.keys(state.lootlogTimers).slice(0, 10);
      debugLog('Loaded timers:', names, '| total:', Object.keys(state.lootlogTimers).length);
    } else {
      debugWarn('No timers found in storage and DOM in this cycle.');
    }
  }

  function fetchLootlogTimers(options) {
    let lastStorageTimers = null;

    try {
      const force = Boolean(options?.force);
      const now = Date.now();
      const currentSource = state.diagnostics.source;
      const hasLiveLikeSource = currentSource === 'network' || currentSource === 'persisted';
      let minInterval = hasLiveLikeSource ? DATA_REFRESH_IDLE_INTERVAL_MS : DATA_REFRESH_MIN_INTERVAL_MS;
      if (now < state.warmupUntil) {
        minInterval = Math.min(minInterval, STARTUP_MIN_REFRESH_MS);
      }

      if (!force && now - state.lastDataRefreshAt < minInterval) {
        return;
      }
      state.lastDataRefreshAt = now;

      const world = getWorld();
      pollLootlogTimersApi(world, { force });

      const fromNetwork = state.networkTimersCache || {};
      const networkTimerCount = Object.keys(fromNetwork).length;
      const hasActiveNetworkTimers = hasActiveTimers(fromNetwork);

      const persistedResult = loadPersistedNetworkTimers(world);
      const fromPersisted = persistedResult.timers || {};
      const persistedTimerCount = Object.keys(fromPersisted).length;
      const hasActivePersistedTimers = hasActiveTimers(fromPersisted);

      state.diagnostics.network = {
        source: state.networkMeta.source,
        url: state.networkMeta.url,
        capturedAt: state.networkMeta.capturedAt,
        timerCount: state.networkMeta.timerCount,
        hasActiveTimers: state.networkMeta.hasActiveTimers,
        arraysFound: state.networkMeta.arraysFound || 0,
        normalizedTimers: state.networkMeta.normalizedTimers || 0,
        messageCount: state.networkMeta.messageCount || 0,
        lastPollAt: state.lastNetworkPollAt || 0,
        lastPollStatus: state.lastNetworkPollStatus || 'idle'
      };
      state.diagnostics.persisted = persistedResult.diagnostics;
      state.diagnostics.hasActiveNetworkTimers = hasActiveNetworkTimers;
      state.diagnostics.hasActivePersistedTimers = hasActivePersistedTimers;
      state.diagnostics.networkTimerCount = networkTimerCount;
      state.diagnostics.persistedTimerCount = persistedTimerCount;

      if (hasActiveNetworkTimers && networkTimerCount > 0) {
        state.lootlogTimers = fromNetwork;
        state.warmupUntil = 0;
        state.diagnostics.source = 'network';
        state.diagnostics.dom = null;
        state.diagnostics.domTimerCount = 0;
        return;
      }

      if (hasActivePersistedTimers && persistedTimerCount > 0) {
        state.lootlogTimers = fromPersisted;
        state.warmupUntil = 0;
        state.diagnostics.source = 'persisted';
        state.diagnostics.dom = null;
        state.diagnostics.domTimerCount = 0;
        return;
      }

      const storageResult = parseTimersFromLootlogStorage(world);
      const fromStorage = storageResult.timers || {};
      lastStorageTimers = fromStorage;
      const storageTimerCount = Object.keys(fromStorage).length;
      const hasActiveStorageTimers = hasActiveTimers(fromStorage);

      const apiResult = parseTimersFromLootlogApi(world);
      const fromApi = apiResult.timers || {};
      const fromApiCache = state.apiTimersCache || {};
      const mergedApiTimers = {};
      mergeTimers(mergedApiTimers, fromApi);
      mergeTimers(mergedApiTimers, fromApiCache);
      const apiTimerCount = Object.keys(mergedApiTimers).length;
      const hasActiveApiTimers = hasActiveTimers(mergedApiTimers);

      let runtimeResult;
      try {
        runtimeResult = parseTimersFromRuntimeMemory(world);
      } catch (runtimeError) {
        runtimeResult = {
          timers: {},
          diagnostics: {
            world,
            skippedByCooldown: false,
            rootsScanned: 0,
            nodesVisited: 0,
            arraysFound: 0,
            normalizedTimers: 0,
            rootLabels: [],
            runtimeError: String(runtimeError?.message || runtimeError || 'unknown-runtime-error')
          }
        };
      }

      const fromRuntime = runtimeResult.timers || {};
      const runtimeTimerCount = Object.keys(fromRuntime).length;
      const hasActiveRuntimeTimers = hasActiveTimers(fromRuntime);

      state.diagnostics.storage = storageResult.diagnostics;
      state.diagnostics.api = apiResult.diagnostics;
      state.diagnostics.api.cache = {
        source: state.apiMeta.source,
        method: state.apiMeta.method,
        capturedAt: state.apiMeta.capturedAt,
        timerCount: state.apiMeta.timerCount,
        hasActiveTimers: state.apiMeta.hasActiveTimers,
        arraysFound: state.apiMeta.arraysFound || 0,
        normalizedTimers: state.apiMeta.normalizedTimers || 0
      };
      state.diagnostics.runtime = runtimeResult.diagnostics;
      state.diagnostics.hasActiveApiTimers = hasActiveApiTimers;
      state.diagnostics.hasActiveStorageTimers = hasActiveStorageTimers;
      state.diagnostics.hasActiveRuntimeTimers = hasActiveRuntimeTimers;
      state.diagnostics.apiTimerCount = apiTimerCount;
      state.diagnostics.storageTimerCount = storageTimerCount;
      state.diagnostics.runtimeTimerCount = runtimeTimerCount;

      const preferNetwork =
        networkTimerCount > 0 &&
        (hasActiveNetworkTimers || (!hasActiveApiTimers && !hasActiveStorageTimers && !hasActiveRuntimeTimers));

      if (preferNetwork) {
        state.lootlogTimers = fromNetwork;
        state.warmupUntil = 0;
        state.diagnostics.source = 'network';
        state.diagnostics.dom = null;
        state.diagnostics.domTimerCount = 0;
        logTimerDiagnostics(state.diagnostics.network, networkTimerCount, null, 0, 'network');
        return;
      }

      const preferPersisted =
        persistedTimerCount > 0 &&
        hasActivePersistedTimers &&
        !hasActiveNetworkTimers &&
        !hasActiveApiTimers;

      if (preferPersisted) {
        state.lootlogTimers = fromPersisted;
        state.warmupUntil = 0;
        state.diagnostics.source = 'persisted';
        state.diagnostics.dom = null;
        state.diagnostics.domTimerCount = 0;
        logTimerDiagnostics(state.diagnostics.persisted, persistedTimerCount, null, 0, 'persisted');
        return;
      }

      const preferApi =
        apiTimerCount > 0 &&
        (hasActiveApiTimers || (!hasActiveStorageTimers && !hasActiveRuntimeTimers));

      if (preferApi) {
        state.lootlogTimers = mergedApiTimers;
        state.diagnostics.source = 'api';
        state.diagnostics.dom = null;
        state.diagnostics.domTimerCount = 0;
        logTimerDiagnostics(state.diagnostics.api, apiTimerCount, null, 0, 'api');
        return;
      }

      const preferRuntime =
        runtimeTimerCount > 0 &&
        (hasActiveRuntimeTimers && !hasActiveStorageTimers || storageTimerCount === 0);

      if (preferRuntime) {
        state.lootlogTimers = fromRuntime;
        state.diagnostics.source = 'runtime';
        state.diagnostics.dom = null;
        state.diagnostics.domTimerCount = 0;
        logTimerDiagnostics(runtimeResult.diagnostics, runtimeTimerCount, null, 0, 'runtime');
        return;
      }

      if (storageTimerCount) {
        state.lootlogTimers = fromStorage;
        state.diagnostics.source = 'storage';
        state.diagnostics.dom = null;
        state.diagnostics.domTimerCount = 0;
        logTimerDiagnostics(storageResult.diagnostics, storageTimerCount, null, 0, 'storage');
        return;
      }

      const domResult = parseTimersFromLootlogDom();
      const fromDom = domResult.timers || {};
      const domTimerCount = Object.keys(fromDom).length;
      state.lootlogTimers = fromDom;
      state.diagnostics.source = domTimerCount ? 'dom' : 'none';
      state.diagnostics.dom = domResult.diagnostics;
      state.diagnostics.domTimerCount = domTimerCount;
      logTimerDiagnostics(storageResult.diagnostics, storageTimerCount, domResult.diagnostics, domTimerCount, domTimerCount ? 'dom' : 'none');
    } catch (error) {
      debugError('fetchLootlogTimers failed:', error);
      if (lastStorageTimers && Object.keys(lastStorageTimers).length) {
        state.lootlogTimers = lastStorageTimers;
        state.diagnostics.source = 'storage-fallback-after-error';
      } else {
        state.lootlogTimers = {};
        state.diagnostics.source = 'error';
      }
      state.diagnostics.fetchError = String(error?.message || error || 'unknown-fetch-error');
    }
  }

  function getCurrentMapName() {
    return window.Engine?.map?.d?.name || window.Engine?.map?.name || window.map?.name || null;
  }

  function getCanvasBounds() {
    const canvas = document.getElementById('GAME_CANVAS');
    if (!canvas) {
      return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    }

    const rect = canvas.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
  }

  function getPositionStyle(index) {
    const spacing = 34;
    const offset = 10;
    const bounds = getCanvasBounds();

    const map = {
      'top-left': {
        top: bounds.top + offset + index * spacing,
        left: bounds.left + offset,
        transform: 'none'
      },
      'top-center': {
        top: bounds.top + offset + index * spacing,
        left: bounds.left + bounds.width / 2,
        transform: 'translateX(-50%)'
      },
      'top-right': {
        top: bounds.top + offset + index * spacing,
        left: bounds.left + bounds.width - offset,
        transform: 'translateX(-100%)'
      },
      'middle-left': {
        top: bounds.top + bounds.height / 2 + index * spacing,
        left: bounds.left + offset,
        transform: 'translateY(-50%)'
      },
      'middle-center': {
        top: bounds.top + bounds.height / 2 + index * spacing,
        left: bounds.left + bounds.width / 2,
        transform: 'translate(-50%, -50%)'
      },
      'middle-right': {
        top: bounds.top + bounds.height / 2 + index * spacing,
        left: bounds.left + bounds.width - offset,
        transform: 'translate(-100%, -50%)'
      },
      'bottom-left': {
        top: bounds.top + bounds.height - offset - index * spacing - 30,
        left: bounds.left + offset,
        transform: 'none'
      },
      'bottom-center': {
        top: bounds.top + bounds.height - offset - index * spacing - 30,
        left: bounds.left + bounds.width / 2,
        transform: 'translateX(-50%)'
      },
      'bottom-right': {
        top: bounds.top + bounds.height - offset - index * spacing - 30,
        left: bounds.left + bounds.width - offset,
        transform: 'translateX(-100%)'
      }
    };

    return map[state.settings.position] || map['bottom-center'];
  }

  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function getLiveRemainingSeconds(timer) {
    if (!timer) return null;

    const now = Date.now();
    const parsedMaxTime = Number(timer?._debug?.parsedMaxTime);
    if (Number.isFinite(parsedMaxTime) && parsedMaxTime > 0) {
      return Math.max(0, Math.floor((parsedMaxTime - now) / 1000));
    }

    const capturedAt = Number(timer?._capturedAtMs);
    const remainingAtCapture = Number(timer?._remainingAtCapture);
    if (Number.isFinite(capturedAt) && Number.isFinite(remainingAtCapture)) {
      const elapsedSeconds = Math.max(0, Math.floor((now - capturedAt) / 1000));
      return Math.max(0, Math.floor(remainingAtCapture - elapsedSeconds));
    }

    const fallback = Number(timer.remainingSeconds);
    if (!Number.isFinite(fallback)) return null;
    return Math.max(0, Math.floor(fallback));
  }

  function getLiveMinRemainingSeconds(timer) {
    if (!timer) return null;

    const now = Date.now();
    const parsedMinTime = Number(timer?._debug?.parsedMinTime);
    if (Number.isFinite(parsedMinTime) && parsedMinTime > 0) {
      return Math.max(0, Math.floor((parsedMinTime - now) / 1000));
    }

    const capturedAt = Number(timer?._capturedAtMs);
    const minRemainingAtCapture = Number(timer?._minRemainingAtCapture);
    if (Number.isFinite(capturedAt) && Number.isFinite(minRemainingAtCapture)) {
      const elapsedSeconds = Math.max(0, Math.floor((now - capturedAt) / 1000));
      return Math.max(0, Math.floor(minRemainingAtCapture - elapsedSeconds));
    }

    const fallback = Number(timer.minRemainingSeconds);
    if (!Number.isFinite(fallback)) return null;
    return Math.max(0, Math.floor(fallback));
  }

  function removeToasts() {
    document.querySelectorAll(`.${TOAST_CLASS}`).forEach((node) => node.remove());
  }

  function showToast(npcName, timer, index, npcType) {
    const node = document.createElement('div');
    node.className = TOAST_CLASS;

    const pos = getPositionStyle(index);
    node.style.top = `${Math.round(pos.top)}px`;
    node.style.left = `${Math.round(pos.left)}px`;
    node.style.transform = pos.transform;

    const nameColor = npcType === 'TITAN' ? '#f87171' : '#fb7185';

    const liveMinRemainingSeconds = getLiveMinRemainingSeconds(timer);
    const liveRemainingSeconds = getLiveRemainingSeconds(timer);
    const hasTimer = Number.isFinite(liveRemainingSeconds);
    const inCooldown = hasTimer && Number.isFinite(liveMinRemainingSeconds) && liveMinRemainingSeconds > 0;
    const inRespWindow = hasTimer && liveRemainingSeconds > 0 && !inCooldown;
    const timerExpired = hasTimer && liveRemainingSeconds <= 0;

    if (inCooldown) {
      node.innerHTML = `
        <span style="color:${nameColor};font-weight:700;">${npcName}</span>
        <span style="opacity:.65;"> - </span>
        <span>zaczyna respić za</span>
        <span style="color:#86efac;font-weight:700;">${formatTime(liveMinRemainingSeconds)}</span>
      `;
    } else if (inRespWindow) {
      node.innerHTML = `
        <span style="color:${nameColor};font-weight:700;">${npcName}</span>
        <span style="opacity:.65;"> - </span>
        <span>respi jeszcze przez</span>
        <span style="color:#fb923c;font-weight:700;">${formatTime(liveRemainingSeconds)}</span>
      `;
    } else if (timerExpired) {
      node.innerHTML = `
        <span style="color:${nameColor};font-weight:700;">${npcName}</span>
        <span style="opacity:.65;"> - </span>
        <span style="color:#facc15;font-weight:700;">zrespił/a</span>
      `;
    } else {
      node.innerHTML = `
        <span style="color:${nameColor};font-weight:700;">${npcName}</span>
        <span style="opacity:.65;"> - </span>
        <span style="color:#9ca3af;">brak na timerze</span>
      `;
    }

    node.addEventListener('click', () => node.remove());
    document.body.appendChild(node);
  }

  function showMatherWarning() {
    if (state.matherWarningShown) return;
    if (!window.RZP_PANEL_NOTIFICATIONS?.isEnabled('resp-radar.mather-warning')) return;

    state.matherWarningShown = true;

    const bounds = getCanvasBounds();
    const warning = document.createElement('div');
    warning.id = 'rzp-mather-warning';
    warning.style.cssText = `
      position: fixed;
      top: ${Math.round(bounds.top + bounds.height / 2)}px;
      left: ${Math.round(bounds.left + bounds.width / 2)}px;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, rgba(139, 0, 0, 0.95), rgba(255, 69, 0, 0.95));
      color: #fff;
      padding: 20px 30px;
      border-radius: 12px;
      font-family: Arial, sans-serif;
      font-size: 24px;
      font-weight: bold;
      box-shadow: 0 0 30px rgba(255, 0, 0, 0.8), 0 0 60px rgba(255, 69, 0, 0.4);
      z-index: 100001;
      animation: rzpWarningPulse 1s ease-in-out infinite, rzpWarningFadeIn 0.5s ease-out;
      border: 3px solid rgba(255, 215, 0, 0.8);
      text-shadow: 0 0 10px rgba(255, 0, 0, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(5px);
      pointer-events: auto;
      cursor: pointer;
    `;

    warning.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px; justify-content: center;">
        <span style="font-size: 32px; animation: rzpWarningShake 0.5s ease-in-out infinite;">⚠️</span>
        <span style="letter-spacing: 2px;">UWAGA MATHER GRASUJE!</span>
        <span style="font-size: 32px; animation: rzpWarningShake 0.5s ease-in-out infinite;">⚠️</span>
      </div>
    `;

    document.body.appendChild(warning);

    warning.addEventListener('click', () => {
      warning.style.animation = 'rzpWarningFadeOut 0.3s ease-out';
      setTimeout(() => warning.remove(), 300);
    });

    setTimeout(() => {
      if (warning.parentNode) {
        warning.style.animation = 'rzpWarningFadeOut 0.5s ease-out';
        setTimeout(() => warning.remove(), 500);
      }
    }, 3000);
  }

  function refreshView() {
    if (!state.enabled) return;

    fetchLootlogTimers();
    const mapName = getCurrentMapName();
    const refreshStateHash = `state:${state.visible}:${mapName || ''}:${Object.keys(state.lootlogTimers).length}`;
    const refreshStateNow = Date.now();
    if (isDebugEnabled() && (state.debug.lastRefreshLogHash !== refreshStateHash || refreshStateNow - state.debug.lastRefreshLogAt > 10000)) {
      state.debug.lastRefreshLogHash = refreshStateHash;
      state.debug.lastRefreshLogAt = refreshStateNow;
      debugLog('refreshView state:', {
        enabled: state.enabled,
        visible: state.visible,
        mapName,
        totalLoadedTimers: Object.keys(state.lootlogTimers).length
      });
    }
    
    // Reset warning flag when map changes
    if (mapName !== state.currentMapName) {
      state.matherWarningShown = false;
    }
    state.currentMapName = mapName;

    removeToasts();
    if (!state.visible || !mapName) {
      const refreshHash = `skip:${state.visible}:${mapName || ''}`;
      const now = Date.now();
      if (isDebugEnabled() && (state.debug.lastRefreshLogHash !== refreshHash || now - state.debug.lastRefreshLogAt > 10000)) {
        state.debug.lastRefreshLogHash = refreshHash;
        state.debug.lastRefreshLogAt = now;
        debugWarn('refreshView skipped:', { visible: state.visible, mapName });
      }
      return;
    }

    const mapData = getNpcDataForMap(mapName);
    const npcData = mapData?.npcData || null;
    const npcType = mapData?.npcType || 'ELITE2';

    if (!npcData) {
      const refreshHash = `no-map-data:${mapName}`;
      const now = Date.now();
      if (isDebugEnabled() && (state.debug.lastRefreshLogHash !== refreshHash || now - state.debug.lastRefreshLogAt > 10000)) {
        state.debug.lastRefreshLogHash = refreshHash;
        state.debug.lastRefreshLogAt = now;
        debugWarn('No NPC mapping for current map:', {
          mapName,
          normalizedMapName: normalizeMapName(mapName)
        });
      }
      return;
    }

    const npcNames = npcData.split('/').map((x) => x.trim());
    let matherDetected = false;
    let matchedCount = 0;
    const npcDebugRows = [];

    npcNames.forEach((npcName, index) => {
      const timerFromState = getTimerForNpcName(npcName, state.lootlogTimers);
      const timerFromMinuteWindow = getMinuteWindowTimerForNpc(npcName);
      const timer = timerFromMinuteWindow || timerFromState || null;

      if (timer) matchedCount += 1;

      if (isDebugEnabled()) {
        npcDebugRows.push({
          npcName,
          matched: Boolean(timer),
          remainingSeconds: timer?.remainingSeconds ?? null,
          minRemainingSeconds: timer?.minRemainingSeconds ?? null,
          addedByName: timer?.addedByName || null,
          rawTimes: timer?._debug || null
        });
      }

      // Check for Mather in ELITE2 NPCs
      if (npcType === 'ELITE2' && timer && timer.addedByName && timer.addedByName.toLowerCase().includes('ilmather')) {
        matherDetected = true;
      }

      showToast(npcName, timer, index, npcType);
    });

    const refreshHash = `render:${mapName}:${npcNames.length}:${matchedCount}:${Object.keys(state.lootlogTimers).length}`;
    const now = Date.now();
    if (isDebugEnabled() && (state.debug.lastRefreshLogHash !== refreshHash || now - state.debug.lastRefreshLogAt > 10000)) {
      state.debug.lastRefreshLogHash = refreshHash;
      state.debug.lastRefreshLogAt = now;
      debugLog('Render summary:', {
        mapName,
        lookupMode: mapData?.lookupMode,
        matchedKey: mapData?.matchedKey || null,
        npcType,
        npcOnMap: npcNames,
        matchedTimers: matchedCount,
        totalLoadedTimers: Object.keys(state.lootlogTimers).length
      });
      debugLog('NPC timer details:', npcDebugRows);
    }

    if (matherDetected) {
      showMatherWarning();
    }
  }

  function stopLoop() {
    if (state.refreshIntervalId) {
      clearInterval(state.refreshIntervalId);
      state.refreshIntervalId = null;
    }
  }

  function startLoop() {
    stopLoop();
    state.refreshIntervalId = setInterval(refreshView, UI_REFRESH_INTERVAL_MS);
  }

  function ensureSettingsPanel() {
    ensureStyle();

    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.className = 'hidden';
    const posIcons = [
      { value: 'top-left', icon: '↖' }, { value: 'top-center', icon: '⬆' }, { value: 'top-right', icon: '↗' },
      { value: 'middle-left', icon: '⬅' }, { value: 'middle-center', icon: '⏺' }, { value: 'middle-right', icon: '➡' },
      { value: 'bottom-left', icon: '↙' }, { value: 'bottom-center', icon: '⬇' }, { value: 'bottom-right', icon: '↘' }
    ];

    panel.innerHTML = `
      <div class="rzp-resp-radar-head">Timer z danej lokacji - ustawienia</div>
      <div class="rzp-resp-radar-body">
        <div class="rzp-radar-section-title">Pozycja komunikatu</div>
        <div class="rzp-radar-pos-grid">
          ${posIcons.map((p) => `<button class="rzp-radar-pos-btn${p.value === state.settings.position ? ' active' : ''}" data-pos="${p.value}">${p.icon}</button>`).join('')}
        </div>
        <div class="rzp-radar-section-title" style="margin-top:10px;">Odświeżanie timera</div>
        <div class="rzp-radar-refresh-row">
          ${REFRESH_OPTIONS.map((ms) => `<button class="rzp-radar-refresh-btn${ms === state.settings.refreshMs ? ' active' : ''}" data-refresh="${ms}">${ms / 1000}s</button>`).join('')}
        </div>
    `;

    document.body.appendChild(panel);

    if (typeof window.RZP_MAKE_DRAGGABLE === 'function') {
      window.RZP_MAKE_DRAGGABLE(panel, panel.querySelector('.rzp-resp-radar-head'));
    }

    panel.querySelectorAll('.rzp-radar-pos-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.rzp-radar-pos-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.settings.position = btn.getAttribute('data-pos');
        saveSettings();
        refreshView();
      });
    });

    panel.querySelectorAll('.rzp-radar-refresh-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.rzp-radar-refresh-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const next = Number(btn.getAttribute('data-refresh'));
        if (!REFRESH_OPTIONS.includes(next)) return;
        state.settings.refreshMs = next;
        saveSettings();
        startLoop();
        refreshView();
      });
    });

    const dockRow = window.RZP_DOCK_HIDDEN_UTILS?.makeRow?.(ADDON_ID);
    if (dockRow) {
      dockRow.style.marginTop = '10px';
      const body = panel.querySelector('.rzp-resp-radar-body');
      if (body) body.appendChild(dockRow);
    }

    return panel;
  }

  function hideSettingsPanel() {
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.classList.add('hidden');
  }

  function toggleSettingsPanel() {
    const panel = ensureSettingsPanel();
    panel.classList.toggle('hidden');
    return !panel.classList.contains('hidden');
  }

  function enableResizeRefresh() {
    if (state.resizeHandlerBound) return;
    window.addEventListener('resize', refreshView);
    state.resizeHandlerBound = true;
  }

  const addonApi = {
    id: ADDON_ID,
    name: 'Timer z danej lokacji',

    async enable() {
      state.enabled = true;
      state.settings = loadSettings();
      state.warmupUntil = Date.now() + STARTUP_WARMUP_MS;
      state.lastDataRefreshAt = 0;
      state.lastNetworkPollAt = 0;
      ensureNetworkTimerHook();
      enableTimerWindowRefreshHook();
      ensureStyle();
      enableResizeRefresh();
      startLoop();
      fetchLootlogTimers({ force: true });
      refreshView();
      return true;
    },

    disable() {
      state.enabled = false;
      stopLoop();
      disableTimerWindowRefreshHook();
      hideSettingsPanel();
      removeToasts();
      return true;
    },

    async runWidget() {
      if (!state.enabled) {
        await this.enable();
      }
      toggleSettingsPanel();
      return true;
    },

    async openSettings() {
      await this.enable();
      toggleSettingsPanel();
      return true;
    }
  };

  window.RZP_ADDONS_REGISTRY = window.RZP_ADDONS_REGISTRY || {};
  window.RZP_ADDONS_REGISTRY[ADDON_ID] = addonApi;
  window.__rzpRespRadarState = state;
})();
