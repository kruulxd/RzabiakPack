(function () {
  'use strict';

  if (window.__RZP_RESP_RADAR_LOADED) return;
  window.__RZP_RESP_RADAR_LOADED = true;

  const ADDON_ID = 'resp-radar';
  const STYLE_ID = 'rzp-resp-radar-style';
  const SETTINGS_ID = 'rzp-resp-radar-settings';
  const DOCK_ID = 'rzp-resp-radar-dock';
  const CONTAINER_ID = 'rzp-resp-radar-container';
  const STORAGE_KEY_POSITION = 'rzp_resp_radar_position';
  const DEFAULT_POSITION = 'top-right';

  const POSITIONS = {
    'top-left': { top: '80px', left: '10px', right: 'auto', bottom: 'auto', label: 'Góra - Lewo' },
    'top-right': { top: '80px', right: '10px', left: 'auto', bottom: 'auto', label: 'Góra - Prawo' },
    'bottom-left': { bottom: '10px', left: '10px', right: 'auto', top: 'auto', label: 'Dół - Lewo' },
    'bottom-right': { bottom: '10px', right: '10px', left: 'auto', top: 'auto', label: 'Dół - Prawo' }
  };

  /* --- State ------------------------------------------------ */
  const state = {
    enabled: false,
    currentMapName: null,
    lootlogTimers: {},
    currentWorld: 'arkantes',
    timerRefreshIntervalId: null,
    mapCheckIntervalId: null,
    tickIntervalId: null,
    apiUnsubscribe: null,
    position: DEFAULT_POSITION
  };

  /* --- Storage ----------------------------------------------- */
  function loadPosition() {
    try {
      return localStorage.getItem(STORAGE_KEY_POSITION) || DEFAULT_POSITION;
    } catch (e) {
      return DEFAULT_POSITION;
    }
  }

  function savePosition(position) {
    try {
      localStorage.setItem(STORAGE_KEY_POSITION, position);
    } catch (e) {}
  }

  /* --- Elite/Titan Data ------------------------------------- */
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
    'Erem Aldiphrina': 'Al\'diphrin Ilythirahel',
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

  /* --- Lootlog Parsing ---------------------------------------- */
  function safeJsonParse(value) {
    if (typeof value !== 'string') return null;
    try {
      return JSON.parse(value);
    } catch (e) {
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

  function parseTimersFromAPI(world) {
    const now = Date.now();
    const parsedTimers = {};

    try {
      const api = window.lootlogGameClientApi;
      if (!api || !api.getTimers || !api.ready) return null;

      const timers = api.getTimers({ world });
      if (!timers || !Array.isArray(timers)) return null;

      timers.forEach((timer) => {
        if (!timer || typeof timer !== 'object') return;

        const npc = timer.npc;
        if (!npc) return;

        const type = normalizeNpcType(npc.type);
        const name = npc.name;

        if (!type || !name) return;

        let minTime = toTimestamp(timer.minSpawnTime);
        let maxTime = toTimestamp(timer.maxSpawnTime);

        if (maxTime === null) return;
        if (minTime === null) minTime = maxTime;

        const normalized = {
          name,
          type,
          remainingSeconds: Math.max(0, Math.floor((maxTime - now) / 1000)),
          minRemainingSeconds: Math.max(0, Math.floor((minTime - now) / 1000)),
          minSpawnTime: timer.minSpawnTime,
          maxSpawnTime: timer.maxSpawnTime,
          location: npc.location || null,
          addedByName: timer.member?.name || null
        };

        const existing = parsedTimers[name];
        if (!existing || normalized.remainingSeconds < existing.remainingSeconds) {
          parsedTimers[name] = normalized;
        }
      });

      return parsedTimers;
    } catch (e) {
      return null;
    }
  }

  /* --- Game Utilities ---------------------------------------- */
  function getWorld() {
    try {
      if (window.Engine?.worldConfig?.name) {
        return window.Engine.worldConfig.name.toLowerCase();
      }
      if (window.Engine?.worldName) {
        return window.Engine.worldName.toLowerCase();
      }
      const match = window.location.hostname.match(/^(\w+)\.margonem\.pl/);
      if (match) {
        return match[1].toLowerCase();
      }
      return 'arkantes';
    } catch (e) {
      return 'arkantes';
    }
  }

  function getCurrentMapName() {
    try {
      if (window.Engine?.map?.d?.name) return window.Engine.map.d.name;
      if (window.map?.name) return window.map.name;
      if (window.Engine?.map?.name) return window.Engine.map.name;
      return null;
    } catch (e) {
      return null;
    }
  }

  /* --- Core Logic --------------------------------------------- */
  function fetchLootlogTimers() {
    try {
      state.lootlogTimers = {};
      state.currentWorld = getWorld();

      const apiTimers = parseTimersFromAPI(state.currentWorld);
      if (apiTimers !== null) {
        Object.values(apiTimers).forEach((timer) => {
          state.lootlogTimers[timer.name] = timer;
        });
      }
    } catch (e) {}
  }

  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function refreshView() {
    const mapName = getCurrentMapName();
    if (!mapName) return;

    if (mapName !== state.currentMapName) {
      state.currentMapName = mapName;
    }

    const eliteData = ELITE_II_DATA[mapName];
    const titanData = TITAN_DATA[mapName];
    const npcData = eliteData || titanData;
    const npcType = titanData ? 'TITAN' : 'ELITE2';

    const container = document.getElementById(CONTAINER_ID);
    if (!npcData) {
      if (container) container.style.display = 'none';
      return;
    }

    const npcNames = npcData.split('/').map(n => n.trim());
    let html = '';

    npcNames.forEach((npcName) => {
      let lootlogTimer = null;

      if (state.lootlogTimers[npcName]) {
        lootlogTimer = state.lootlogTimers[npcName];
      } else {
        for (const key in state.lootlogTimers) {
          if (key.includes(npcName) || npcName.includes(key)) {
            lootlogTimer = state.lootlogTimers[key];
            break;
          }
        }
      }

      const nameColor = npcType === 'TITAN' ? '#ff3333' : '#ff6b9d';

      if (lootlogTimer) {
        const now = Date.now();
        let totalSeconds = 0;
        let minSeconds = 0;

        if (lootlogTimer.maxSpawnTime) {
          const maxTime = typeof lootlogTimer.maxSpawnTime === 'number' 
            ? lootlogTimer.maxSpawnTime 
            : Date.parse(lootlogTimer.maxSpawnTime);
          if (maxTime) {
            totalSeconds = Math.max(0, Math.floor((maxTime - now) / 1000));
          }
        }

        if (lootlogTimer.minSpawnTime) {
          const minTime = typeof lootlogTimer.minSpawnTime === 'number'
            ? lootlogTimer.minSpawnTime
            : Date.parse(lootlogTimer.minSpawnTime);
          if (minTime) {
            minSeconds = Math.max(0, Math.floor((minTime - now) / 1000));
          }
        }

        let timerColor = '#00ff88';
        let labelText = 'respi za';

        if (npcType === 'TITAN') {
          if (minSeconds > 0) {
            timerColor = '#fff';
            labelText = 'respi za';
          } else {
            timerColor = '#ffa500';
            labelText = 'respi jeszcze przez';
          }
        }

        html += `
          <div class="timer-row">
            <span class="timer-name" style="color: ${nameColor};">${npcName}</span>
            <span class="timer-sep">-</span>
            <span class="timer-label">${labelText}</span>
            <span data-npc="${npcName}" class="timer-value" style="color: ${timerColor};">${formatTime(totalSeconds)}</span>
          </div>
        `;
      } else {
        html += `
          <div class="timer-row">
            <span class="timer-name" style="color: ${nameColor};">${npcName}</span>
            <span class="timer-sep">-</span>
            <span class="timer-empty">brak na timerze</span>
          </div>
        `;
      }
    });

    if (container) {
      container.innerHTML = html;
      container.style.display = 'block';
    }
  }

  function tickTimers() {
    const now = Date.now();
    const timerElements = document.querySelectorAll('.timer-value');

    timerElements.forEach((el) => {
      const npcName = el.getAttribute('data-npc');
      if (!npcName) return;

      let lootlogTimer = state.lootlogTimers[npcName];
      if (!lootlogTimer) {
        for (const key in state.lootlogTimers) {
          if (key.includes(npcName) || npcName.includes(key)) {
            lootlogTimer = state.lootlogTimers[key];
            break;
          }
        }
      }

      if (lootlogTimer) {
        let remainingSeconds = 0;
        let minRemainingSeconds = 0;

        if (lootlogTimer.maxSpawnTime) {
          const maxTime = typeof lootlogTimer.maxSpawnTime === 'number' 
            ? lootlogTimer.maxSpawnTime 
            : Date.parse(lootlogTimer.maxSpawnTime);
          if (maxTime) {
            remainingSeconds = Math.max(0, Math.floor((maxTime - now) / 1000));
          }
        }

        if (lootlogTimer.minSpawnTime) {
          const minTime = typeof lootlogTimer.minSpawnTime === 'number'
            ? lootlogTimer.minSpawnTime
            : Date.parse(lootlogTimer.minSpawnTime);
          if (minTime) {
            minRemainingSeconds = Math.max(0, Math.floor((minTime - now) / 1000));
          }
        }

        el.textContent = formatTime(remainingSeconds);

        const mapName = getCurrentMapName();
        if (mapName && TITAN_DATA[mapName]) {
          const parentDiv = el.closest('.timer-row');
          const labelSpan = parentDiv.querySelector('.timer-label');

          if (minRemainingSeconds > 0) {
            el.style.color = '#fff';
            if (labelSpan) labelSpan.textContent = 'respi za';
          } else {
            el.style.color = '#ffa500';
            if (labelSpan) labelSpan.textContent = 'respi jeszcze przez';
          }
        }

        if (remainingSeconds <= 0) {
          el.textContent = 'ZRESPIŁ/A';
          el.style.color = '#00ff88';
        }
      }
    });
  }

  /* --- Styles ------------------------------------------------- */
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${CONTAINER_ID} {
        position: fixed;
        z-index: 18;
        min-width: 280px;
        max-width: 400px;
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
        padding: 12px;
        user-select: none;
      }

      #${CONTAINER_ID} .timer-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
      }

      #${CONTAINER_ID} .timer-row:last-child {
        margin-bottom: 0;
      }

      #${CONTAINER_ID} .timer-name {
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      }

      #${CONTAINER_ID} .timer-sep {
        color: #555;
      }

      #${CONTAINER_ID} .timer-label {
        color: #a0c0a8;
      }

      #${CONTAINER_ID} .timer-value {
        font-weight: 700;
        text-shadow: 0 1px 3px rgba(0,0,0,0.7);
        font-family: 'Courier New', monospace;
      }

      #${CONTAINER_ID} .timer-empty {
        color: #666;
        font-style: italic;
      }

      #${SETTINGS_ID} {
        position: fixed;
        z-index: 19;
        min-width: 320px;
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
        user-select: none;
        display: none;
      }

      #${SETTINGS_ID} .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        background: rgba(0,0,0,0.2);
        border-bottom: 1px solid rgba(52,211,100,0.12);
      }

      #${SETTINGS_ID} .header-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #34d364;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      }

      #${SETTINGS_ID} .close-btn {
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        background: rgba(239,68,68,0.15);
        border: 1px solid rgba(239,68,68,0.3);
        color: #f87171;
        font-size: 11px;
        font-weight: 600;
        transition: all 0.2s;
      }

      #${SETTINGS_ID} .close-btn:hover {
        background: rgba(239,68,68,0.25);
        border-color: rgba(239,68,68,0.5);
      }

      #${SETTINGS_ID} .content {
        padding: 14px;
      }

      #${SETTINGS_ID} .setting-group {
        margin-bottom: 16px;
      }

      #${SETTINGS_ID} .setting-group:last-child {
        margin-bottom: 0;
      }

      #${SETTINGS_ID} .setting-label {
        display: block;
        margin-bottom: 8px;
        color: #a0c0a8;
        font-size: 12px;
        font-weight: 500;
      }

      #${SETTINGS_ID} .position-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      #${SETTINGS_ID} .position-btn {
        cursor: pointer;
        padding: 10px;
        border-radius: 8px;
        background: rgba(52,211,100,0.08);
        border: 1px solid rgba(52,211,100,0.2);
        color: #c8ead4;
        text-align: center;
        font-size: 12px;
        transition: all 0.2s;
      }

      #${SETTINGS_ID} .position-btn:hover {
        background: rgba(52,211,100,0.15);
        border-color: rgba(52,211,100,0.35);
      }

      #${SETTINGS_ID} .position-btn.active {
        background: rgba(52,211,100,0.25);
        border-color: rgba(52,211,100,0.5);
        color: #34d364;
        font-weight: 600;
      }
    `;

    document.head.appendChild(style);
  }

  /* --- Settings Modal ----------------------------------------- */
  function createSettingsModal() {
    if (document.getElementById(SETTINGS_ID)) return;

    ensureStyle();

    const modal = document.createElement('div');
    modal.id = SETTINGS_ID;
    modal.innerHTML = `
      <div class="header">
        <div class="header-title">
          <span>⏱</span>
          <span>Timer z danej lokacji - Ustawienia</span>
        </div>
        <div class="close-btn">✕ Zamknij</div>
      </div>
      <div class="content">
        <div class="setting-group">
          <label class="setting-label">Pozycja timera na ekranie:</label>
          <div class="position-grid">
            ${Object.keys(POSITIONS).map(key => `
              <div class="position-btn" data-position="${key}">${POSITIONS[key].label}</div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close button
    modal.querySelector('.close-btn').addEventListener('click', closeSettings);

    // Position buttons
    modal.querySelectorAll('.position-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const position = btn.getAttribute('data-position');
        setPosition(position);
      });
    });

    // Update active button
    updateActivePosition();
  }

  function openSettings() {
    const modal = document.getElementById(SETTINGS_ID);
    if (!modal) {
      createSettingsModal();
    }

    const m = document.getElementById(SETTINGS_ID);
    if (m) {
      m.style.display = 'block';
      m.style.top = '50%';
      m.style.left = '50%';
      m.style.transform = 'translate(-50%, -50%)';
      updateActivePosition();
    }
  }

  function closeSettings() {
    const modal = document.getElementById(SETTINGS_ID);
    if (modal) {
      modal.style.display = 'none';
    }
  }

  function updateActivePosition() {
    const modal = document.getElementById(SETTINGS_ID);
    if (!modal) return;

    modal.querySelectorAll('.position-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-position') === state.position) {
        btn.classList.add('active');
      }
    });
  }

  function setPosition(position) {
    if (!POSITIONS[position]) return;

    state.position = position;
    savePosition(position);
    updateActivePosition();

    const container = document.getElementById(CONTAINER_ID);
    if (container) {
      const pos = POSITIONS[position];
      container.style.top = pos.top;
      container.style.right = pos.right;
      container.style.bottom = pos.bottom;
      container.style.left = pos.left;
    }
  }

  /* --- Container ---------------------------------------------- */
  function ensureContainer() {
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
      ensureStyle();

      container = document.createElement('div');
      container.id = CONTAINER_ID;
      document.body.appendChild(container);
    }

    const pos = POSITIONS[state.position];
    container.style.top = pos.top;
    container.style.right = pos.right;
    container.style.bottom = pos.bottom;
    container.style.left = pos.left;

    return container;
  }

  /* --- Lifecycle ---------------------------------------------- */
  function enable() {
    if (state.enabled) return;

    state.enabled = true;
    state.position = loadPosition();

    ensureContainer();
    fetchLootlogTimers();

    // Subscribe to Lootlog API events
    try {
      const api = window.lootlogGameClientApi;
      if (api && api.subscribe) {
        state.apiUnsubscribe = api.subscribe('timers:changed', (event) => {
          if (event.world === state.currentWorld) {
            fetchLootlogTimers();
            const mapName = getCurrentMapName();
            if (mapName && (ELITE_II_DATA[mapName] || TITAN_DATA[mapName])) {
              refreshView();
            }
          }
        });
      }
    } catch (e) {}

    // Intervals
    state.timerRefreshIntervalId = setInterval(fetchLootlogTimers, 20000);
    state.mapCheckIntervalId = setInterval(refreshView, 2000);
    state.tickIntervalId = setInterval(tickTimers, 1000);

    refreshView();
  }

  function disable() {
    if (!state.enabled) return;

    state.enabled = false;

    if (state.apiUnsubscribe) {
      try {
        state.apiUnsubscribe();
        state.apiUnsubscribe = null;
      } catch (e) {}
    }

    if (state.timerRefreshIntervalId) {
      clearInterval(state.timerRefreshIntervalId);
      state.timerRefreshIntervalId = null;
    }
    if (state.mapCheckIntervalId) {
      clearInterval(state.mapCheckIntervalId);
      state.mapCheckIntervalId = null;
    }
    if (state.tickIntervalId) {
      clearInterval(state.tickIntervalId);
      state.tickIntervalId = null;
    }

    const container = document.getElementById(CONTAINER_ID);
    if (container) {
      container.innerHTML = '';
      container.style.display = 'none';
    }
  }

  function toggleDock() {
    openSettings();
  }

  /* --- Registration ------------------------------------------- */
  if (!window.RZP_ADDONS_REGISTRY) {
    window.RZP_ADDONS_REGISTRY = {};
  }

  window.RZP_ADDONS_REGISTRY[ADDON_ID] = {
    name: ADDON_ID,
    version: '2026-04-26-panel-v5',
    enable,
    disable,
    getState: () => state,
    openSettings,
    closeSettings,
    toggleDock
  };

})();
