(function () {
  'use strict';

  const ADDON_ID = 'resp-radar';
  const TOAST_CLASS = 'rzp-resp-radar-toast';
  const STYLE_ID = 'rzp-resp-radar-style';
  const PANEL_ID = 'rzp-resp-radar-settings';
  const STORAGE_KEY = 'rzp_resp_radar_settings';
  const DEBUG_STORAGE_KEY = 'rzp_resp_radar_debug';

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
    'Skalne Cmentarzysko p.4': 'Łowca czaszek',
    'Piramida Pustynnego Władcy p.3': 'Ozirus Władca Hieroglifów',
    'Jama Morskiej Macki p.1 - sala 3': 'Morski potwór',
    'Opuszczony statek - pokład': 'Krab pustelnik',
    'Twierdza Rogogłowych - Sala Byka': 'Borgoros Garamir III',
    'Wulkan Politraki p.1 - sala 3': 'Ifryt',
    'Piaszczysta Grota p.1 - sala 2': 'Eol',
    'Kopalnia Żółtego Kruszcu p.2 - sala 2': 'Grubber Ochlaj',
    'Kuźnia Worundriela - Komnata Żaru': 'Mistrz Worundriel',
    'Chata wójta Fistuły p.1': 'Wójt Fistuła',
    'Chata Teściowej': 'Teściowa Rumcajsa',
    'Laboratorium Adariel': 'Adariel',
    'Grota Orczej Hordy p.2 s.3': 'Burkog Lorulk',
    'Grota Orczych Szamanów p.3 s.1': 'Sheba Orcza Szamanka',
    'Nawiedzone Kazamaty p.4': 'Duch Władcy Klanów',
    'Sala Królewska': 'Lusgrathera Królowa Pramatka',
    'Kryształowa Grota - Sala Smutku': 'Królowa Śniegu',
    'Ogrza Kawerna p.4': 'Ogr Stalowy Pazur',
    'Krypty Bezsennych p.3': 'Torunia Ankelwald',
    'Skarpa Trzech Słów': 'Pięknotka Mięsożerna',
    'Przysiółek Valmirów': 'Breheret Żelazny Łeb',
    'Starodrzew Przedwiecznych p.2': 'Cerasus',
    'Szlamowe Kanały p.2 - sala 3': 'Mysiur Myświórowy Król',
    'Zalana Grota': 'Czempion Furboli',
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

  function isDebugEnabled() {
    try {
      const saved = window.localStorage.getItem(DEBUG_STORAGE_KEY);
      if (saved === null) return true;
      return saved === '1' || saved === 'true' || saved === 'on';
    } catch (error) {
      return true;
    }
  }

  function debugLog(...args) {
    if (!isDebugEnabled()) return;
    console.log('[RespRadar]', ...args);
  }

  function debugWarn(...args) {
    if (!isDebugEnabled()) return;
    console.warn('[RespRadar]', ...args);
  }

  function debugError(...args) {
    if (!isDebugEnabled()) return;
    console.error('[RespRadar]', ...args);
  }

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

  function normalizeNpcType(rawType) {
    if (!rawType || typeof rawType !== 'string') return null;
    const type = rawType.toUpperCase();
    if (type.includes('ELITE2')) return 'ELITE2';
    if (type.includes('TITAN')) return 'TITAN';
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
        node.forEach(visit);
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

      Object.values(node).forEach(visit);
    }

    visit(root);
    return arrays;
  }

  function normalizeTimerEntry(timer, now) {
    if (!timer || typeof timer !== 'object') return null;

    const npc = timer.npc || timer.mob || timer.monster || timer.entity || {};
    const type = normalizeNpcType(
      npc.type || timer.type || timer.npcType || timer.mobType || timer.kind
    );
    const name =
      npc.name || timer.name || timer.npcName || timer.mobName || timer.entityName || null;

    if (!type || !name) return null;

    const minRaw =
      timer.minSpawnTime ??
      timer.minRespawnTime ??
      timer.minRespTime ??
      timer.minTime ??
      timer.respawnFrom;
    const maxRaw =
      timer.maxSpawnTime ??
      timer.maxRespawnTime ??
      timer.maxRespTime ??
      timer.maxTime ??
      timer.respawnTo ??
      timer.spawnTime;

    let minTime = toTimestamp(minRaw);
    let maxTime = toTimestamp(maxRaw);

    if (maxTime === null) {
      const remaining = Number(timer.remainingSeconds ?? timer.remaining ?? timer.timeLeft);
      if (Number.isFinite(remaining) && remaining >= 0) {
        maxTime = now + remaining * 1000;
      }
    }

    if (minTime === null) minTime = maxTime;
    if (maxTime === null) return null;

    return {
      name,
      type,
      minRemainingSeconds: Math.max(0, Math.floor((minTime - now) / 1000)),
      remainingSeconds: Math.max(0, Math.floor((maxTime - now) / 1000)),
      addedByName:
        timer.member?.name ||
        timer.addedByName ||
        timer.addedBy?.name ||
        timer.author?.name ||
        null
    };
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
      scannedKeys: entries.map(([key]) => key)
    };

    const parseFromEntries = (list) => {
      for (const [, rawValue] of list) {
        const parsed = safeJsonParse(rawValue);
        if (!parsed) continue;

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
              if (!existing || normalized.remainingSeconds < existing.remainingSeconds) {
                parsedTimers[normalized.name] = normalized;
                diagnostics.normalizedTimers += 1;
              }
            });
          });
        }
      }
    };

    parseFromEntries(entries);

    // Fallback for new Lootlog versions that persist under generic keys.
    if (!Object.keys(parsedTimers).length) {
      const allEntries = getLootlogStorageEntries(true);
      diagnostics.usedFallbackAllKeys = true;
      diagnostics.allEntryCount = allEntries.length;
      diagnostics.scannedKeys = allEntries.map(([key]) => key);
      parseFromEntries(allEntries);
    }

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

  function fetchLootlogTimers() {
    try {
      const world = getWorld();
      const storageResult = parseTimersFromLootlogStorage(world);
      const fromStorage = storageResult.timers || {};
      const storageTimerCount = Object.keys(fromStorage).length;

      if (storageTimerCount) {
        state.lootlogTimers = fromStorage;
        logTimerDiagnostics(storageResult.diagnostics, storageTimerCount, null, 0, 'storage');
        return;
      }

      const domResult = parseTimersFromLootlogDom();
      const fromDom = domResult.timers || {};
      const domTimerCount = Object.keys(fromDom).length;
      state.lootlogTimers = fromDom;
      logTimerDiagnostics(storageResult.diagnostics, storageTimerCount, domResult.diagnostics, domTimerCount, domTimerCount ? 'dom' : 'none');
    } catch (error) {
      debugError('fetchLootlogTimers failed:', error);
      state.lootlogTimers = {};
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

    if (timer && typeof timer.remainingSeconds === 'number') {
      node.innerHTML = `
        <span style="color:${nameColor};font-weight:700;">${npcName}</span>
        <span style="opacity:.65;"> - </span>
        <span>respi za</span>
        <span style="color:#86efac;font-weight:700;">${formatTime(timer.remainingSeconds)}</span>
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

    npcNames.forEach((npcName, index) => {
      let timer = state.lootlogTimers[npcName] || null;
      if (!timer) {
        for (const key of Object.keys(state.lootlogTimers)) {
          if (key.includes(npcName) || npcName.includes(key)) {
            timer = state.lootlogTimers[key];
            break;
          }
        }
      }

      if (timer) matchedCount += 1;

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
    state.refreshIntervalId = setInterval(refreshView, state.settings.refreshMs);
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
      ensureStyle();
      enableResizeRefresh();
      startLoop();
      refreshView();
      return true;
    },

    disable() {
      state.enabled = false;
      stopLoop();
      hideSettingsPanel();
      removeToasts();
      return true;
    },

    async runWidget() {
      if (!state.enabled) {
        await this.enable();
        state.visible = true;
      } else {
        state.visible = !state.visible;
      }
      refreshView();
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
})();
