// =============================================================================
// RESP-RADAR ADDON - MINIMAL VERSION (based on working Iledoe2 standalone)
// =============================================================================
// Simplified architecture:
// 1. Read Lootlog from localStorage (parseTimersFromLootlogStorage)
// 2. Storage event listener as main trigger
// 3. Fingerprint polling every 10s as backup trigger
// 4. Render timer in panel div
// =============================================================================

const ADDON_NAME = 'resp-radar';
const ADDON_BUILD = '2026-04-26-minimal-v1';

// Debug logging
const RZP_DEBUG = true;
window.__RZP_RADAR_LOGS = [];
window.__RZP_RADAR_BUILD = ADDON_BUILD;

function rzpLog(...args) {
    const msg = `[RespRadar/${ADDON_BUILD}] ${args.join(' ')}`;
    if (RZP_DEBUG) {
        console.warn(msg);
    }
    window.__RZP_RADAR_LOGS.push({
        timestamp: Date.now(),
        message: msg
    });
    if (window.__RZP_RADAR_LOGS.length > 200) {
        window.__RZP_RADAR_LOGS.shift();
    }
}

// =============================================================================
// ELITE/TITAN DATA
// =============================================================================

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

// =============================================================================
// LOOTLOG PARSING (from Iledoe2 working version)
// =============================================================================

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
        if (Number.isFinite(numeric)) {
            return toTimestamp(numeric);
        }
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
    return /lootlog|guild-timers|query-cache|timers?/i.test(key);
}

function getLootlogStorageEntries() {
    const entries = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!isLootlogStorageKey(key)) continue;
            const value = localStorage.getItem(key);
            if (typeof value !== 'string' || value.length < 2) continue;
            entries.push([key, value]);
        }
    } catch (e) {
        rzpLog('ERROR getting localStorage entries:', e);
    }

    entries.sort((a, b) => {
        if (a[0] === 'll:query-cache') return -1;
        if (b[0] === 'll:query-cache') return 1;
        return a[0].localeCompare(b[0]);
    });

    return entries;
}

function getLootlogStorageFingerprint() {
    try {
        const entries = getLootlogStorageEntries();
        if (!entries.length) return '';
        return entries
            .map(([key, value]) => `${key}:${value.length}:${value.slice(0, 120)}`)
            .join('|');
    } catch (e) {
        return '';
    }
}

function collectGuildTimerArrays(root, world) {
    const arrays = [];
    const seen = new WeakSet();

    function visit(node) {
        if (!node || typeof node !== 'object') return;
        if (seen.has(node)) return;
        seen.add(node);

        if (Array.isArray(node)) {
            node.forEach(visit);
            return;
        }

        const queryKey = node.queryKey;
        if (Array.isArray(queryKey) && queryKey[0] === 'guild-timers') {
            const queryWorld = String(queryKey[1] || '').toLowerCase();
            if (!world || !queryWorld || queryWorld === world) {
                const data = node.state?.data ?? node.data ?? node.payload?.data;
                if (Array.isArray(data)) {
                    arrays.push(data);
                }
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

    let minRaw =
        timer.minSpawnTime ??
        timer.minRespawnTime ??
        timer.minRespTime ??
        timer.minTime ??
        timer.respawnFrom;
    let maxRaw =
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

    if (minTime === null) {
        minTime = maxTime;
    }

    if (maxTime === null) {
        return null;
    }

    return {
        name,
        type,
        remainingSeconds: Math.max(0, Math.floor((maxTime - now) / 1000)),
        minRemainingSeconds: Math.max(0, Math.floor((minTime - now) / 1000)),
        minSpawnTime: minRaw ?? null,
        maxSpawnTime: maxRaw ?? null,
        location: npc.location || timer.location || null,
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

    const entries = getLootlogStorageEntries();
    rzpLog(`Storage: Found ${entries.length} Lootlog entries`);

    for (const [key, rawValue] of entries) {
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
            const timerArrays = collectGuildTimerArrays(root, world);
            for (const timers of timerArrays) {
                timers.forEach((timer) => {
                    const normalized = normalizeTimerEntry(timer, now);
                    if (!normalized) return;

                    const existing = parsedTimers[normalized.name];
                    if (!existing || normalized.remainingSeconds < existing.remainingSeconds) {
                        parsedTimers[normalized.name] = normalized;
                    }
                });
            }
        }
    }

    rzpLog(`Storage: Parsed ${Object.keys(parsedTimers).length} timers`);
    return parsedTimers;
}

// =============================================================================
// GAME UTILITIES
// =============================================================================

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
        if (window.Engine?.map?.d?.name) {
            return window.Engine.map.d.name;
        }
        if (window.map?.name) {
            return window.map.name;
        }
        if (window.Engine?.map?.name) {
            return window.Engine.map.name;
        }
        return null;
    } catch (e) {
        return null;
    }
}

// =============================================================================
// ADDON STATE
// =============================================================================

const state = {
    enabled: false,
    currentMapName: null,
    lootlogTimers: {},
    currentWorld: 'arkantes',
    lastStorageFingerprint: '',
    storagePollingIntervalId: null,
    mapCheckIntervalId: null,
    timerRefreshIntervalId: null,
    tickIntervalId: null
};

// =============================================================================
// CORE LOGIC
// =============================================================================

function fetchLootlogTimers() {
    try {
        rzpLog('Fetching timers from Lootlog localStorage...');
        
        state.lootlogTimers = {};
        state.currentWorld = getWorld();

        const parsedTimers = parseTimersFromLootlogStorage(state.currentWorld);
        Object.values(parsedTimers).forEach((timer) => {
            state.lootlogTimers[timer.name] = timer;
        });

        rzpLog(`FetchLootlog: Got ${Object.keys(state.lootlogTimers).length} timers`);
        
        // Debug: print timer names
        if (Object.keys(state.lootlogTimers).length > 0) {
            rzpLog('Timers:', Object.keys(state.lootlogTimers).join(', '));
        }
        
    } catch (e) {
        rzpLog('ERROR fetching Lootlog timers:', e);
    }
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function refreshView() {
    const mapName = getCurrentMapName();
    
    if (!mapName) {
        rzpLog('RefreshView: No map name');
        return;
    }
    
    // Check if map changed
    if (mapName !== state.currentMapName) {
        rzpLog(`RefreshView: Map changed from "${state.currentMapName}" to "${mapName}"`);
        state.currentMapName = mapName;
    }
    
    const eliteData = ELITE_II_DATA[mapName];
    const titanData = TITAN_DATA[mapName];
    const npcData = eliteData || titanData;
    const npcType = titanData ? 'TITAN' : 'ELITE2';
    
    if (!npcData) {
        // Not an elite/titan map - hide panel
        const container = document.getElementById('rzp-resp-radar-container');
        if (container) {
            container.style.display = 'none';
        }
        return;
    }
    
    rzpLog(`RefreshView: On ${npcType} map: ${mapName} -> ${npcData}`);
    
    const npcNames = npcData.split('/').map(n => n.trim());
    
    let html = `<div style="padding: 10px; font-family: Arial, sans-serif; font-size: 13px;">`;
    
    npcNames.forEach((npcName) => {
        let lootlogTimer = null;
        
        // Try exact match first
        if (state.lootlogTimers[npcName]) {
            lootlogTimer = state.lootlogTimers[npcName];
        } else {
            // Try fuzzy match
            for (const key in state.lootlogTimers) {
                if (key.includes(npcName) || npcName.includes(key)) {
                    lootlogTimer = state.lootlogTimers[key];
                    break;
                }
            }
        }
        
        const nameColor = npcType === 'TITAN' ? '#ff3333' : '#ff6b9d';
        
        if (lootlogTimer && lootlogTimer.remainingSeconds !== undefined) {
            const totalSeconds = lootlogTimer.remainingSeconds;
            const minSeconds = lootlogTimer.minRemainingSeconds || 0;
            
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
                <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                    <span style="color: ${nameColor}; font-weight: bold;">${npcName}</span>
                    <span style="color: #aaa;">-</span>
                    <span style="color: #fff;">${labelText}</span>
                    <span data-npc="${npcName}" class="resp-timer" style="color: ${timerColor}; font-weight: bold;">${formatTime(totalSeconds)}</span>
                </div>
            `;
        } else {
            html += `
                <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                    <span style="color: ${nameColor}; font-weight: bold;">${npcName}</span>
                    <span style="color: #aaa;">-</span>
                    <span style="color: #999;">brak na timerze</span>
                </div>
            `;
        }
    });
    
    html += `</div>`;
    
    let container = document.getElementById('rzp-resp-radar-container');
    if (!container) {
        rzpLog('WARNING: Container #rzp-resp-radar-container NOT FOUND - creating it now');
        // Create container if it doesn't exist
        container = document.createElement('div');
        container.id = 'rzp-resp-radar-container';
        container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(20, 20, 20, 0.9);
            border: 1px solid #444;
            border-radius: 8px;
            z-index: 99999;
            min-width: 250px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `;
        document.body.appendChild(container);
        rzpLog('Container created and appended to body');
    }
    
    if (container) {
        container.innerHTML = html;
        container.style.display = 'block';
        rzpLog(`Container updated with HTML (${npcNames.length} NPC(s))`);
    }
}

function tickTimers() {
    // Update displayed timers every second
    // IMPORTANT: Calculate time dynamically from timestamps, don't mutate state
    const now = Date.now();
    const timerElements = document.querySelectorAll('.resp-timer');
    
    timerElements.forEach((el) => {
        const npcName = el.getAttribute('data-npc');
        if (!npcName) return;
        
        let lootlogTimer = state.lootlogTimers[npcName];
        if (!lootlogTimer) {
            // Try fuzzy match
            for (const key in state.lootlogTimers) {
                if (key.includes(npcName) || npcName.includes(key)) {
                    lootlogTimer = state.lootlogTimers[key];
                    break;
                }
            }
        }
        
        if (lootlogTimer) {
            // Calculate remaining seconds from timestamps (don't mutate state)
            let remainingSeconds = 0;
            let minRemainingSeconds = 0;
            
            if (lootlogTimer.maxSpawnTime) {
                const maxTime = typeof lootlogTimer.maxSpawnTime === 'number' 
                    ? lootlogTimer.maxSpawnTime 
                    : Date.parse(lootlogTimer.maxSpawnTime);
                if (maxTime) {
                    remainingSeconds = Math.max(0, Math.floor((maxTime - now) / 1000));
                }
            } else {
                // Fallback to stored remainingSeconds (will drift)
                remainingSeconds = lootlogTimer.remainingSeconds || 0;
            }
            
            if (lootlogTimer.minSpawnTime) {
                const minTime = typeof lootlogTimer.minSpawnTime === 'number'
                    ? lootlogTimer.minSpawnTime
                    : Date.parse(lootlogTimer.minSpawnTime);
                if (minTime) {
                    minRemainingSeconds = Math.max(0, Math.floor((minTime - now) / 1000));
                }
            } else {
                minRemainingSeconds = lootlogTimer.minRemainingSeconds || 0;
            }
            
            el.textContent = formatTime(remainingSeconds);
            
            // Update color for titans
            const mapName = getCurrentMapName();
            if (mapName && TITAN_DATA[mapName]) {
                const parentDiv = el.closest('div');
                const labelSpan = parentDiv.querySelector('span:nth-child(3)');
                
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

function onStorageChange(e) {
    // Storage event listener - main trigger from Iledoe2
    if (e.key === null || isLootlogStorageKey(e.key)) {
        rzpLog('Storage: Detected change in Lootlog storage, refreshing...');
        fetchLootlogTimers();
        // Refresh view immediately after fetching new timers
        const mapName = getCurrentMapName();
        if (mapName && (ELITE_II_DATA[mapName] || TITAN_DATA[mapName])) {
            refreshView();
            rzpLog('Storage: Forced refreshView() after storage change');
        }
    }
}

function checkStorageFingerprint() {
    // Fingerprint polling - backup trigger from Iledoe2
    try {
        const newHash = getLootlogStorageFingerprint();
        if (newHash && state.lastStorageFingerprint && state.lastStorageFingerprint !== newHash) {
            rzpLog('Storage: Fingerprint changed, refreshing...');
            fetchLootlogTimers();
            // Refresh view immediately
            const mapName = getCurrentMapName();
            if (mapName && (ELITE_II_DATA[mapName] || TITAN_DATA[mapName])) {
                refreshView();
                rzpLog('Storage: Forced refreshView() after fingerprint change');
            }
        }
        state.lastStorageFingerprint = newHash;
    } catch (e) {
        rzpLog('ERROR checking storage fingerprint:', e);
    }
}

function checkMapChange() {
    refreshView();
}

// =============================================================================
// ADDON LIFECYCLE
// =============================================================================

function enable() {
    if (state.enabled) return;
    
    rzpLog('=== ADDON ENABLE ===');
    
    state.enabled = true;
    
    // Initial fetch
    fetchLootlogTimers();
    
    // Storage event listener (main trigger)
    window.addEventListener('storage', onStorageChange);
    rzpLog('Attached storage event listener');
    
    // Fingerprint polling (backup trigger - every 10s)
    state.storagePollingIntervalId = setInterval(checkStorageFingerprint, 10000);
    rzpLog('Started fingerprint polling (10s)');
    
    // Timer refresh polling (every 20s)
    state.timerRefreshIntervalId = setInterval(fetchLootlogTimers, 20000);
    rzpLog('Started timer refresh polling (20s)');
    
    // Map check polling (every 2s)
    state.mapCheckIntervalId = setInterval(checkMapChange, 2000);
    rzpLog('Started map check polling (2s)');
    
    // Tick timers every second
    state.tickIntervalId = setInterval(tickTimers, 1000);
    rzpLog('Started timer tick (1s)');
    
    // Initial render
    refreshView();
    
    rzpLog('=== ADDON ENABLED ===');
}

function disable() {
    if (!state.enabled) return;
    
    rzpLog('=== ADDON DISABLE ===');
    
    state.enabled = false;
    
    // Remove storage listener
    window.removeEventListener('storage', onStorageChange);
    
    // Clear intervals
    if (state.storagePollingIntervalId) {
        clearInterval(state.storagePollingIntervalId);
        state.storagePollingIntervalId = null;
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
    
    // Clear UI
    const container = document.getElementById('rzp-resp-radar-container');
    if (container) {
        container.innerHTML = '';
        container.style.display = 'none';
    }
    
    rzpLog('=== ADDON DISABLED ===');
}

// =============================================================================
// REGISTRATION
// =============================================================================

if (!window.RZP_ADDONS_REGISTRY) {
    window.RZP_ADDONS_REGISTRY = {};
}

window.RZP_ADDONS_REGISTRY[ADDON_NAME] = {
    name: ADDON_NAME,
    version: ADDON_BUILD,
    enable,
    disable,
    getState: () => state
};

rzpLog(`Addon registered: ${ADDON_NAME} (${ADDON_BUILD})`);
