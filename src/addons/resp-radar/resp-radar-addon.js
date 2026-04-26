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
  const STORAGE_KEY_VISIBLE = 'rzp_resp_radar_visible';
  const DEFAULT_POSITION = 'top-center';

  const POSITIONS = {
    'top-left': { top: '10px', left: '10px', right: 'auto', bottom: 'auto', transform: 'none', label: 'Góra - Lewo' },
    'top-center': { top: '10px', left: '50%', right: 'auto', bottom: 'auto', transform: 'translateX(-50%)', label: 'Góra - Środek' },
    'top-right': { top: '10px', right: '10px', left: 'auto', bottom: 'auto', transform: 'none', label: 'Góra - Prawo' },
    'bottom-left': { bottom: '10px', left: '10px', right: 'auto', top: 'auto', transform: 'none', label: 'Dół - Lewo' },
    'bottom-center': { bottom: '10px', left: '50%', right: 'auto', top: 'auto', transform: 'translateX(-50%)', label: 'Dół - Środek' },
    'bottom-right': { bottom: '10px', right: '10px', left: 'auto', top: 'auto', transform: 'none', label: 'Dół - Prawo' }
  };

  /* --- State ------------------------------------------------ */
  const state = {
    enabled: false,
    visible: true,
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

  function loadVisible() {
    try {
      const val = localStorage.getItem(STORAGE_KEY_VISIBLE);
      return val === null ? true : val === 'true';
    } catch (e) {
      return true;
    }
  }

  function saveVisible(visible) {
    try {
      localStorage.setItem(STORAGE_KEY_VISIBLE, String(visible));
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
    const eliteData = ELITE_II_DATA[mapName];
    const titanData = TITAN_DATA[mapName];
    const npcData = eliteData || titanData;
    const npcType = titanData ? 'TITAN' : 'ELITE2';
    const container = ensureContainer();
    let html = '';
    if (!mapName) {
      html = `<div class="timer-row"><span class="timer-empty">Nie można wykryć mapy</span></div>`;
    } else if (!npcData) {
      html = `<div class="timer-row"><span class="timer-empty">Brak obsługi dla tej mapy: <b>${mapName}</b></span></div>`;
    } else {
      const npcNames = npcData.split('/').map(n => n.trim());
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
        const titan = npcType === 'TITAN';
        let labelText = '';
        let valueClass = 'timer-value';
        let timeValue = '';
        if (titan) valueClass += ' titan';
        else valueClass += ' elite2';
        if (lootlogTimer) {
          const now = Date.now();
          let minSeconds = 0;
          let maxSeconds = 0;
          if (lootlogTimer.minSpawnTime) {
            const minTime = typeof lootlogTimer.minSpawnTime === 'number'
              ? lootlogTimer.minSpawnTime
              : Date.parse(lootlogTimer.minSpawnTime);
            if (minTime) {
              minSeconds = Math.max(0, Math.floor((minTime - now) / 1000));
            }
          }
          if (lootlogTimer.maxSpawnTime) {
            const maxTime = typeof lootlogTimer.maxSpawnTime === 'number'
              ? lootlogTimer.maxSpawnTime
              : Date.parse(lootlogTimer.maxSpawnTime);
            if (maxTime) {
              maxSeconds = Math.max(0, Math.floor((maxTime - now) / 1000));
            }
          }
          if (minSeconds > 0) {
            labelText = 'rozpoczyna respa za';
            timeValue = formatTime(minSeconds);
          } else if (maxSeconds > 0) {
            labelText = 'respi jeszcze przez';
            timeValue = formatTime(maxSeconds);
          } else {
            labelText = 'ZRESPIŁ/A';
            timeValue = '';
          }
          html += `
            <div class="timer-row">
              <span class="timer-name${titan ? ' titan' : ' elite2'}">${npcName}</span>
              <span class="timer-sep">-</span>
              <span class="timer-label">${labelText}</span>
              <span data-npc="${npcName}" class="${valueClass}">${timeValue}</span>
            </div>
          `;
        } else {
          html += `
            <div class="timer-row">
              <span class="timer-name${titan ? ' titan' : ' elite2'}">${npcName}</span>
              <span class="timer-sep">-</span>
              <span class="timer-empty">brak na timerze</span>
            </div>
          `;
        }
      });
    }
    container.innerHTML = html;
    container.style.display = state.visible ? 'block' : 'none';
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

  /* --- Container (toast notification pattern) --- */
  function ensureContainer() {
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
      ensureStyle();
      container = document.createElement('div');
      container.id = CONTAINER_ID;
      // Toast: always above, prefer #GAME_CANVAS parent, fallback to body
      const canvas = document.getElementById('GAME_CANVAS');
      if (canvas && canvas.parentElement) {
        canvas.parentElement.appendChild(container);
      } else {
        document.body.appendChild(container);
      }
    }
    // Toast: fixed position, always visible if enabled
    container.style.position = 'fixed';
    container.style.zIndex = 14;
    container.style.left = '50%';
    container.style.bottom = '60px';
    container.style.top = 'auto';
    container.style.right = 'auto';
    container.style.transform = 'translateX(-50%)';
    container.style.display = state.visible ? 'block' : 'none';
    return container;
  }

  /* --- Styles (toast notification) --- */
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${CONTAINER_ID} {
        min-width: 220px;
        max-width: 400px;
        border-radius: 10px;
        background: rgba(18,32,22,0.82);
        box-shadow: 0 6px 32px 0 rgba(0,0,0,0.35), 0 0 0 1.5px #34d36444;
        color: #eafff0;
        font-family: 'Trebuchet MS', Tahoma, Verdana, sans-serif;
        font-size: 14px;
        padding: 10px 18px;
        user-select: none;
        pointer-events: auto;
        text-align: center;
        opacity: 0.93;
        backdrop-filter: blur(2px);
        bottom: 20px !important;
        top: auto !important;
      }
      #${CONTAINER_ID} .timer-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 4px;
      }
      #${CONTAINER_ID} .timer-row:last-child {
        margin-bottom: 0;
      }
      #${CONTAINER_ID} .timer-name.titan {
        color: #ff3333;
        text-shadow: 0 0 6px #ff3333cc, 0 1px 2px #000a;
      }
      #${CONTAINER_ID} .timer-name.elite2 {
        color: #33cfff;
        text-shadow: 0 0 6px #33cfffcc, 0 1px 2px #000a;
      }
      #${CONTAINER_ID} .timer-sep {
        color: #555;
      }
      #${CONTAINER_ID} .timer-label {
        color: #a0c0a8;
      }
      #${CONTAINER_ID} .timer-value {
        font-weight: 700;
        text-shadow: 0 1px 3px #000c;
        font-family: 'Courier New', monospace;
        color: #00ff88;
      }
      #${CONTAINER_ID} .timer-value.titan {
        color: #ffa500;
      }
      #${CONTAINER_ID} .timer-empty {
        color: #666;
        font-style: italic;
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
    modal.style.top = '120px';
    modal.style.left = '60px';
    modal.innerHTML = `
      <div class="header">
        <span class="header-title">Timer z danej lokacji — Ustawienia</span>
        <button class="close-btn">✕</button>
      </div>
      <div class="content">
        <div class="setting-group">
          <span class="setting-label">Pozycja timera na ekranie gry:</span>
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

    // Draggable support
    const header = modal.querySelector('.header');
    let dragging = false, offsetX = 0, offsetY = 0;

    header.addEventListener('mousedown', e => {
      if (e.target.closest('.close-btn') || e.target.closest('button')) return;
      dragging = true;
      offsetX = e.clientX - modal.offsetLeft;
      offsetY = e.clientY - modal.offsetTop;
      modal.style.transform = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      modal.style.left = (e.clientX - offsetX) + 'px';
      modal.style.top = (e.clientY - offsetY) + 'px';
    });

    document.addEventListener('mouseup', () => {
      dragging = false;
    });

    // Dock visibility row
    const dockRow = window.RZP_DOCK_HIDDEN_UTILS?.makeRow?.(ADDON_ID);
    if (dockRow) {
      const body = modal.querySelector('.content');
      if (body) body.appendChild(dockRow);
    }

    updateActivePosition();
  }

  function openSettings() {
    let modal = document.getElementById(SETTINGS_ID);
    if (!modal) {
      createSettingsModal();
      modal = document.getElementById(SETTINGS_ID);
    }

    if (modal) {
      const isVisible = modal.style.display === 'block';
      modal.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) updateActivePosition();
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
      container.style.transform = pos.transform;
    }
  }

  /* --- Lifecycle ---------------------------------------------- */
  function enable() {
    if (state.enabled) return;

    state.enabled = true;
    state.position = loadPosition();
    state.visible = loadVisible();

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
    updateDockGlow();
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

    updateDockGlow();
  }

  /* --- Dock Handlers ------------------------------------------ */
  function runWidget() {
    toggleTimer();
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
    version: '2026-04-26-panel-v6',
    enable,
    disable,
    getState: () => state,
    runWidget,
    openSettings,
    closeSettings,
    toggleDock
  };

})();
