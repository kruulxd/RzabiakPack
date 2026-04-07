// ==UserScript==
// @name         Ulepszarka SI - Core
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Ulepszarka dla Starego Interfejsu Margonema
// @author       Kruul + Dyna (original SI code)
// @match        *://*.margonem.pl/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  if (window.__RZP_ULEPSZARKA_SI_CORE_LOADED) return;
  window.__RZP_ULEPSZARKA_SI_CORE_LOADED = true;

  const SiCore = {
    s: {
      posXY: '100px,200px',
      limit: 0,
      item_ulepszarka: null,
      work: false,
      automatic: false,
      // Rarity settings
      allowCommon: true,
      allowUnique: true,
      allowHeroic: false,
      // Bound settings (podstawa: "Wiąże po założeniu")
      allowSoulbound: false,  // Dodaje "Związany z właścicielem"
      allowPermbound: false,  // Dodaje "Związany z właścicielem na stałe"
      // runtime – not persisted
      intervalId: null,
      itemForUpgrade: [],
      isRunning: false,
    },

    TYPE_LABELS: [
      'Typ:  Jednoręczne',
      'Typ:  Półtoraręczne',
      'Typ:  Dwuręczne',
      'Typ:  Różdżki',
      'Typ:  Dystansowe',
      'Typ:  Orby magiczne',
      'Typ:  Pomocnicze',
      'Typ:  Tarcze',
      'Typ:  Hełmy',
      'Typ:  Pierścienie',
      'Typ:  Naszyjniki',
      'Typ:  Rękawice',
      'Typ:  Zbroje',
      'Typ:  Buty',
      'Typ:  Strzały',
    ],

    SiStorage: {
      getWorldKey() {
        return `si-ulepszarka-world-${window.g.worldConfig.getWorldName()}`;
      },
      getHeroKey() {
        return `si-ulepszarka-hero-${window.hero.id}`;
      },
      save() {
        const { s } = SiCore;
        const worldData = { pos: s.posXY, limit: s.limit };
        const heroData = {
          item_ulepszarka: s.item_ulepszarka,
          work: s.work,
          automatic: s.automatic,
          allowCommon: s.allowCommon,
          allowUnique: s.allowUnique,
          allowHeroic: s.allowHeroic,
          allowSoulbound: s.allowSoulbound,
          allowPermbound: s.allowPermbound,
        };
        try {
          window.localStorage.setItem(SiCore.SiStorage.getWorldKey(), JSON.stringify(worldData));
          window.localStorage.setItem(SiCore.SiStorage.getHeroKey(), JSON.stringify(heroData));
        } catch (e) {}
      },
      load() {
        const { s } = SiCore;
        try {
          const worldRaw = window.localStorage.getItem(SiCore.SiStorage.getWorldKey());
          const heroRaw = window.localStorage.getItem(SiCore.SiStorage.getHeroKey());
          if (worldRaw) {
            const w = JSON.parse(worldRaw);
            if (w.pos) s.posXY = w.pos;
            if (typeof w.limit === 'number') s.limit = w.limit;
          }
          if (heroRaw) {
            const h = JSON.parse(heroRaw);
            
            // Check if this is old data structure (has old category keys)
            const hasOldStructure = 'helmy' in h || 'zbroje' in h || 'uni' in h;
            
            if (hasOldStructure) {
              // Migrate from old structure - only keep these keys
              if (h.item_ulepszarka !== undefined) s.item_ulepszarka = h.item_ulepszarka;
              if (typeof h.work === 'boolean') s.work = h.work;
              if (typeof h.automatic === 'boolean') s.automatic = h.automatic;
              
              // Set safe defaults for new keys
              s.allowCommon = true;
              s.allowUnique = true;
              s.allowHeroic = false;
              s.allowSoulbound = false;
              s.allowPermbound = false;
              
              // Save migrated data
              SiCore.SiStorage.save();
              console.log('✅ Migrated SI Ulepszarka settings from old structure');
            } else {
              // New structure - load normally with defaults
              const boolKeys = [
                'work', 'automatic',
                'allowCommon', 'allowUnique', 'allowHeroic',
                'allowSoulbound', 'allowPermbound',
              ];
              
              boolKeys.forEach(k => { 
                if (typeof h[k] === 'boolean') {
                  s[k] = h[k];
                }
                // If key doesn't exist in saved data, keep default from initial state
              });
              
              // Remove deprecated allowUnbound if it exists
              delete h.allowUnbound;
              
              if (h.item_ulepszarka !== undefined) s.item_ulepszarka = h.item_ulepszarka;
            }
          }
        } catch (e) {
          console.error('SI Ulepszarka - error loading settings:', e);
        }
      },
    },

    SiInventory: {
      getEqItemIds() {
        const ids = [];
        const eq = window.g.eqItems;
        if (!eq) return ids;
        for (const key in eq) {
          if (eq[key] && eq[key].id !== undefined) ids.push(eq[key].id);
        }
        return ids;
      },
      getReagents() {
        const { s } = SiCore;
        if (!s.item_ulepszarka) return [];
        const myEq = SiCore.SiInventory.getEqItemIds();
        const ingredients = [];
        
        let totalItems = 0;
        let debugInfo = {
          noTip: 0,
          inEquipment: 0,
          craftingOpen: 0,
          notInBag: 0,
          isMainItem: 0,
          failedBoundFilter: 0,
          isUpgradedOrLegendary: 0,
          failedRarityFilter: 0,
          noEnhancement: 0,
          passed: 0
        };
        
        for (const i in window.g.item) {
          const item = window.g.item[i];
          totalItems++;
          
          if (!item || !item.tip) {
            debugInfo.noTip++;
            continue;
          }
          
          // Basic checks
          if (myEq.includes(item.id)) {
            debugInfo.inEquipment++;
            continue;
          }
          if (window.g.crafting.opened === true) {
            debugInfo.craftingOpen++;
            continue;
          }
          if (item.loc !== 'g') {
            debugInfo.notInBag++;
            continue;
          }
          if (item.id === s.item_ulepszarka.id) {
            debugInfo.isMainItem++;
            continue;
          }
          
          // Check bound status
          // Note: check permbound first (more specific) to avoid false match on soulbound
          const hasPermbound = item.tip.includes('Związany z właścicielem na stałe');
          const hasAlreadyBound = item.tip.includes('Związany z właścicielem') && !hasPermbound; // Already bound to hero
          const hasBindOnEquip = item.tip.includes('Wiąże po założeniu'); // Will bind when equipped (base case)
          
          // Determine if item should be included based on bound settings
          let passedBoundFilter = false;
          
          // Base case: "Wiąże po założeniu" (not already bound)
          if (hasBindOnEquip && !hasAlreadyBound && !hasPermbound) {
            passedBoundFilter = true;
          }
          // Optional: Already bound items ("Związany z właścicielem")
          else if (hasAlreadyBound && s.allowSoulbound) {
            passedBoundFilter = true;
          }
          // Optional: Permanently bound items ("Związany z właścicielem na stałe")
          else if (hasPermbound && s.allowPermbound) {
            passedBoundFilter = true;
          }
          
          if (!passedBoundFilter) {
            debugInfo.failedBoundFilter++;
            continue;
          }
          
          // Check rarity and apply filters
          const itemType = item.itemTypeName || '';
          const isCommon = !itemType || itemType === 'common' || itemType === '';
          const isUnique = itemType === 'unique' || item.tip.includes('unikatowy');
          const isHeroic = itemType === 'heroic';
          const isUpgraded = itemType === 'upgraded';
          const isLegendary = itemType === 'legendary';
          
          // Skip upgraded and legendary items always
          if (isUpgraded || isLegendary) {
            debugInfo.isUpgradedOrLegendary++;
            continue;
          }
          
          // Soulbound/Permbound only applies to common and unique items.
          // Heroic items with these tags are always skipped.
          if (isHeroic && (hasAlreadyBound || hasPermbound)) {
            debugInfo.failedRarityFilter++;
            continue;
          }
          
          // Apply rarity filters
          if (isHeroic && !s.allowHeroic) {
            debugInfo.failedRarityFilter++;
            continue;
          }
          if (isUnique && !s.allowUnique) {
            debugInfo.failedRarityFilter++;
            continue;
          }
          if (isCommon && !s.allowCommon) {
            debugInfo.failedRarityFilter++;
            continue;
          }
          
          // Check if item has enhancement capability
          const hasEnhancement = item.enhancementPoints !== undefined || 
                                 item.ep !== undefined ||
                                 (item.tip && (
                                   item.tip.includes('Punkty ulepszenia:') ||
                                   item.tip.includes('enhancement')
                                 ));
          
          if (!hasEnhancement) {
            debugInfo.noEnhancement++;
            continue;
          }
          
          if (!ingredients.includes(item.id)) {
            ingredients.push(item.id);
            debugInfo.passed++;
          }
        }
        
        // Debug output
        console.log('🔍 SI Ulepszarka - Debug getReagents():');
        console.log('  Total items checked:', totalItems);
        console.log('  Settings:', {
          allowCommon: s.allowCommon,
          allowUnique: s.allowUnique,
          allowHeroic: s.allowHeroic,
          allowSoulbound: s.allowSoulbound,
          allowPermbound: s.allowPermbound
        });
        console.log('  Filtered out:', debugInfo);
        console.log('  ✅ Items passed:', ingredients.length);
        
        // Show warning if no items passed
        if (ingredients.length === 0) {
          console.warn('⚠️ PROBLEM: Żadne przedmioty nie przeszły filtrów!');
          console.log('💡 Podstawa: przedmioty z tagiem "Wiąże po założeniu"');
          if (debugInfo.failedBoundFilter > 0) {
            console.warn(`⚠️ ${debugInfo.failedBoundFilter} przedmiotów odrzuconych przez filtr bound`);
          }
          if (debugInfo.failedRarityFilter > 0) {
            console.warn(`⚠️ ${debugInfo.failedRarityFilter} przedmiotów odrzuconych przez filtr rzadkości`);
          }
        }
        
        return ingredients;
      },
    },

    SiAutomation: {
      scaleLimit(x) {
        return x * 0.085; // 2000 * 0.085 = 170px (max width)
      },
      getFreeSlots() {
        let total = 0;
        for (let i = 0; i <= 2; i++) {
          const el = document.getElementById(`bs${i}`);
          if (el) total += parseInt(el.textContent) || 0;
        }
        return total;
      },
      checkSlot(uiRefs) {
        const { s } = SiCore;
        if (!s.work) {
          clearInterval(s.intervalId);
          s.intervalId = null;
          return;
        }
        const threshold = s.freeSlotsThreshold ?? 5;
        const freeSlots = SiCore.SiAutomation.getFreeSlots();
        console.log(`📦 Wolnych slotów: ${freeSlots} / próg: ${threshold}`);
        if (freeSlots <= threshold && !window.g.battle) {
          SiCore.SiAutomation.checkItem(uiRefs);
        }
      },
      checkItem(uiRefs) {
        const { s } = SiCore;
        console.log('🔧 SI Ulepszarka - checkItem() rozpoczęty');
        
        if (s.isRunning) {
          console.warn('⚠️ Ulepszarka już pracuje, pomijam');
          return;
        }
        if (s.limit >= 1999) {
          message('Osiągnięto limit ulepszania');
          console.warn('⚠️ Osiągnięto limit 1999');
          return;
        }
        clearInterval(s.intervalId);
        s.intervalId = null;
        
        if (!s.item_ulepszarka) {
          message('Brak itemku do ulepszania');
          console.error('❌ Brak głównego przedmiotu do ulepszania');
          return;
        }
        
        console.log('🎯 Główny przedmiot:', {
          id: s.item_ulepszarka.id,
          name: s.item_ulepszarka.name || 'unknown'
        });
        
        s.itemForUpgrade = SiCore.SiInventory.getReagents();
        console.log('📦 Znalezione składniki:', {
          count: s.itemForUpgrade.length,
          ids: s.itemForUpgrade
        });
        
        if (s.itemForUpgrade.length === 0) {
          message('Brak przedmiotów');
          console.error('❌ Brak składników spełniających kryteria');
          return;
        }
        
        s.isRunning = true;
        console.log('▶️ Uruchamiam openCrafting...');
        SiCore.SiAutomation.openCrafting(uiRefs);
      },
      openCrafting(uiRefs) {
        const { s } = SiCore;
        const silentMode = false; // Disabled: server requires window to be open
        
        if (silentMode) {
          // Silent mode: process directly without opening UI
          console.log('🔇 Tryb silent - przetwarzam bez otwierania UI');
          SiCore.SiAutomation.addSlotItem(uiRefs);
          return;
        }
        
        // Legacy mode: open window UI (but hide it)
        const CRAFTING_SELECTOR = '#crafting';

        const isCraftingVisible = () => {
          const el = document.querySelector(CRAFTING_SELECTOR);
          return !!el && getComputedStyle(el).display !== 'none';
        };

        const isEnhancementReady = () =>
          window.g.crafting?.enhancement && typeof window.g.crafting.enhancement.onClickInventoryItem === 'function';

        const isCraftingReady = () => isCraftingVisible() && isEnhancementReady();

        const hideCraftingWindow = () => {
          if (s.craftingHidden) return;
          const el = document.querySelector(CRAFTING_SELECTOR);
          if (el && getComputedStyle(el).display !== 'none') {
            el.style.visibility = 'hidden';
            el.style.pointerEvents = 'none';
            s.craftingHidden = true;
            s.hiddenCraftingElement = el;
            console.log('👁️ Ukryto okno craftingu #crafting');
          }
        };

        if (isCraftingReady()) {
          hideCraftingWindow();
          console.log('✅ Crafting gotowy, ukrywam i przechodzę do addSlotItem');
          SiCore.SiAutomation.addSlotItem(uiRefs);
        } else {
          // Install MutationObserver BEFORE sending open request — hides window the instant it appears
          const craftingEl = document.querySelector(CRAFTING_SELECTOR);
          if (craftingEl) {
            const observer = new MutationObserver(() => {
              if (getComputedStyle(craftingEl).display !== 'none') {
                hideCraftingWindow();
                observer.disconnect();
              }
            });
            observer.observe(craftingEl, { attributes: true, attributeFilter: ['style', 'class'] });
            // Safety disconnect after 5s
            setTimeout(() => observer.disconnect(), 5000);
          }

          if (!isCraftingVisible()) {
            console.log('📂 Otwieram okno craftingu...');
            window._g('artisanship&action=open');
          } else {
            hideCraftingWindow();
          }
          setTimeout(() => {
            SiCore.SiAutomation.waitForCrafting(uiRefs, 0);
          }, 400);
        }
      },
      
      waitForCrafting(uiRefs, attempts) {
        const { s } = SiCore;
        const maxAttempts = 40; // 10 sekund max (40 x 250ms)
        
        // Sprawdź czy okno jest otwarte - używamy tego samego mechanizmu co w openCrafting
        const isCraftingOpen = () => {
          const el = document.querySelector('#crafting');
          return !!el && getComputedStyle(el).display !== 'none' &&
            window.g.crafting?.enhancement && typeof window.g.crafting.enhancement.onClickInventoryItem === 'function';
        };
        
        console.log(`⏳ Czekam na crafting (próba ${attempts + 1}/${maxAttempts})`, {
          computedDisplay: getComputedStyle(document.querySelector('#crafting') || document.body).display,
          hasEnhancement: !!window.g.crafting?.enhancement,
        });
        
        if (isCraftingOpen()) {
          console.log('✅ Crafting gotowy, ukrywam i przechodzę do addSlotItem');
          if (!s.craftingHidden) {
            const w = document.querySelector('#crafting');
            if (w) { w.style.visibility = 'hidden'; w.style.pointerEvents = 'none'; s.craftingHidden = true; s.hiddenCraftingElement = w; }
          }
          SiCore.SiAutomation.addSlotItem(uiRefs);
        } else if (attempts >= maxAttempts) {
          console.error('❌ Timeout - nie udało się otworzyć craftingu po ' + maxAttempts + ' próbach');
          message('Nie udało się otworzyć okna ulepszania');
          SiCore.s.isRunning = false;
        } else {
          setTimeout(() => SiCore.SiAutomation.waitForCrafting(uiRefs, attempts + 1), 250);
        }
      },
      addSlotItem(uiRefs) {
        const { s } = SiCore;
        const silentMode = false; // Disabled: server requires window to be open
        
        console.log('🎲 addSlotItem() rozpoczęty');
        
        // Always add main item to enhancement slot (optional - UI only, server request is below)
        const mainItem = window.g.item[s.item_ulepszarka.id];
        if (mainItem && window.g.crafting?.enhancement) {
          console.log('➕ Dodaję główny przedmiot do slotu enhancement');
          window.g.crafting.enhancement.onClickInventoryItem(mainItem);
        } else if (!mainItem) {
          console.error('❌ Przedmiot główny nie istnieje!');
          s.isRunning = false;
          return;
        } else {
          console.warn('⚠️ window.g.crafting.enhancement niedostępne - kontynuuję bez kliknięcia slotu');
        }
        
        // Limit ingredients to max 10 items per batch, capped by remaining limit capacity
        const MAX_INGREDIENTS = 10;
        const currentLimit = s.limit || 0;
        const remaining = Math.max(0, 2000 - currentLimit);
        const batchSize = Math.min(MAX_INGREDIENTS, remaining);
        
        if (batchSize === 0) {
          console.warn('⚠️ Osiągnięto limit 2000, przerywam');
          message('Osiągnięto limit ulepszania! 2000/2000');
          s.isRunning = false;
          s.itemForUpgrade = [];
          return;
        }
        
        const ingredients = s.itemForUpgrade.slice(0, batchSize);
        const skipped = s.itemForUpgrade.length - ingredients.length;
        
        if (skipped > 0) {
          console.log(`📦 Paczka ${batchSize}/${s.itemForUpgrade.length} (pozostało: ${skipped})`);
        }
        
        const oldLimit = s.limit || 0;
        console.log(`🚀 [${ingredients.length} items] Limit: ${oldLimit} → ?`);
        
        // Send enhancement request directly
        window._g(`enhancement&action=progress&item=${s.item_ulepszarka.id}&ingredients=${ingredients.join(',')}`);
        
        // Wait for server response: 550ms (optimal balance speed vs stability)
        const timeout = 550;
        
        setTimeout(() => {
          if (window.g.enhanceUsages) {
            s.limit = window.g.enhanceUsages.count;
            const change = s.limit - oldLimit;
            console.log(`✅ Limit: ${oldLimit} → ${s.limit} (+${change})`);
            
            if (change === 0) {
              console.warn('⚠️ UWAGA: Limit nie wzrósł! Serwer mógł odrzucić request.');
            }
          } else {
            console.warn('⚠️ window.g.enhanceUsages nie istnieje!');
          }
          
          uiRefs.limitBar.setAttribute('tip', `Ulepszono ${s.limit}/2000`);
          uiRefs.fill.style.width = SiCore.SiAutomation.scaleLimit(s.limit) + 'px';
          uiRefs.limitText.textContent = Math.floor((s.limit / 2000) * 100) + '%';
          
          // Remove only the used items (first 10) instead of clearing entire list
          const usedCount = Math.min(ingredients.length, s.itemForUpgrade.length);
          s.itemForUpgrade = s.itemForUpgrade.slice(usedCount);
          
          console.log(`🧹 -${usedCount} items, pozostało: ${s.itemForUpgrade.length}`);
          
          // Store remaining count before closing
          SiCore.s.remainingIngredients = s.itemForUpgrade.length;
          
          SiCore.SiAutomation.canClose(uiRefs);
        }, timeout);
      },
      canClose(uiRefs) {
        const { s } = SiCore;

        // Update UI after batch
        uiRefs.fill.style.width = SiCore.SiAutomation.scaleLimit(s.limit) + 'px';
        uiRefs.limitBar.setAttribute('tip', `Ulepszono ${s.limit}/2000`);
        SiCore.SiStorage.save();

        const remainingCount = s.itemForUpgrade?.length || 0;

        if (remainingCount > 0 && s.work) {
          // Window is already open & enhancement ready — go directly to next batch
          console.log(`🔄 Kolejna paczka (${remainingCount} left), okno pozostaje otwarte...`);
          setTimeout(() => SiCore.SiAutomation.addSlotItem(uiRefs), 300);
        } else {
          // All done (or stopped) — restore visibility then close
          s.isRunning = false;
          if (remainingCount > 0) {
            console.log('🛑 Ulepszarka zatrzymana przez użytkownika');
            s.itemForUpgrade = [];
          }
          console.log('✅ Wszystkie składniki przetworzone');

          // Show completion message
          const itemName = s.item_ulepszarka?.name || 'przedmiot';
          if (s.limit >= 2000) {
            message(`Osiągnięto limit ulepszania! Ulepszono ${itemName}, 2000/2000`);
          } else {
            message(`Ulepszono ${itemName}, ${s.limit}/2000`);
          }

          if (s.craftingHidden && s.hiddenCraftingElement) {
            s.hiddenCraftingElement.style.visibility = '';
            s.hiddenCraftingElement.style.pointerEvents = '';
            s.craftingHidden = false;
            s.hiddenCraftingElement = null;
            s.originalCraftingDisplay = null;
            console.log('👁️ Przywrócono widoczność okna craftingu');
          }

          // Close via close button (do NOT send API request - causes Invalid request crash)
          const closeBtn = document.querySelector('#crafting .close-but, #crafting [class*="close"], .crafting .close-but');
          if (closeBtn) {
            closeBtn.click();
            console.log('🚪 Okno craftingu zamknięte via przycisk X');
          } else {
            // Fallback: hide element manually since we can't close via API
            const craftingEl = document.querySelector('#crafting');
            if (craftingEl) craftingEl.style.display = 'none';
            console.log('🚪 Okno craftingu ukryte (brak przycisku close)');
          }

          setTimeout(() => {
            if (s.work && s.automatic) {
              s.intervalId = setInterval(() => SiCore.SiAutomation.checkSlot(uiRefs), 500);
            }
          }, 5000);
        }
      },
    },

    SiUi: {
      setupCss() {
        if (document.getElementById('si-ulepszarka-style')) return;
        const style = document.createElement('style');
        style.id = 'si-ulepszarka-style';
        style.textContent = `
          .si-upg-box {
            position: fixed;
            width: 200px;
            background: #07100a;
            box-shadow: 
              0 0 0 1px rgba(52,211,100,0.25),
              0 8px 24px rgba(0,0,0,0.65),
              0 0 20px rgba(34,197,94,0.08);
            user-select: none;
            font-family: 'Trebuchet MS', Tahoma, Verdana, sans-serif;
            font-size: 12px;
            z-index: 450;
            box-sizing: border-box;
            padding-bottom: 8px;
            border-radius: 8px;
          }
          .si-upg-title {
            padding: 12px;
            background: linear-gradient(180deg, #0d1a10 0%, #050d07 100%);
            border-bottom: 1px solid rgba(52,211,100,0.2);
            font-weight: 600;
            font-size: 14px;
            text-align: center;
            cursor: move;
            color: #86efac;
            letter-spacing: 0.5px;
            border-radius: 8px 8px 0 0;
          }
          .si-upg-item-slot {
            width: 32px;
            height: 32px;
            border: 1px solid rgba(52,211,100,0.2);
            margin: 15px auto 0;
            display: block;
            border-radius: 3px;
            background: rgba(0,0,0,0.3);
          }
          .si-upg-btn {
            width: 170px;
            height: 22px;
            box-shadow: 0 0 6px rgba(34,197,94,0.2), 0 0 3px #000;
            margin: 10px auto 0;
            color: #d4f0dc;
            text-align: center;
            background: linear-gradient(180deg, #1a3521 0%, #0f1f13 100%);
            font-weight: bold;
            cursor: pointer;
            display: block;
            line-height: 22px;
            font-size: 12px;
            border: 1px solid rgba(52,211,100,0.2);
            border-radius: 4px;
            transition: all 0.15s ease;
          }
          .si-upg-btn:active { 
            background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
            box-shadow: 0 0 12px rgba(34,197,94,0.4);
            color: #fff;
          }
          .si-upg-limit-bar {
            width: 170px;
            height: 14px;
            background: rgba(255,107,107,0.2);
            margin: 10px auto 0;
            border: 1px solid rgba(52,211,100,0.15);
            display: block;
            border-radius: 3px;
            overflow: visible;
            position: relative;
          }
          .si-upg-limit-fill {
            height: 14px;
            background: linear-gradient(90deg, #22c55e 0%, #86efac 100%);
            max-width: 170px;
            box-shadow: 0 0 4px rgba(34,197,94,0.5);
          }
          .si-upg-limit-text {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            color: #fff;
            text-shadow: 0 0 3px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9);
            pointer-events: none;
            z-index: 1;
          }
          .si-upg-activ {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            position: absolute;
            right: 10px;
            top: 10px;
            border: 1px solid rgba(52,211,100,0.3);
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .si-upg-gear {
            position: absolute;
            left: 10px;
            top: 10px;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            color: #86efac;
            opacity: 0.8;
            transition: all 0.2s ease;
          }
          .si-upg-gear:hover {
            opacity: 1;
            color: #22c55e;
            text-shadow: 0 0 8px rgba(34,197,94,0.5);
          }
          .si-upg-settings {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 320px;
            background: #050d07;
            display: none;
            box-shadow: 
              0 0 0 1px rgba(52,211,100,0.25),
              0 8px 24px rgba(0,0,0,0.7),
              0 0 16px rgba(34,197,94,0.1);
            z-index: 500;
            max-height: 80vh;
            overflow-y: auto;
            box-sizing: border-box;
            border-radius: 8px;
          }
          .si-upg-settings-header {
            padding: 12px 15px;
            background: linear-gradient(180deg, #0d1a10 0%, #050d07 100%);
            border-bottom: 1px solid rgba(52,211,100,0.2);
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
            border-radius: 8px 8px 0 0;
          }
          .si-upg-settings-title {
            color: #86efac;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .si-upg-settings-close {
            background: transparent;
            border: none;
            color: #86efac;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.15s ease;
          }
          .si-upg-settings-close:hover {
            background: rgba(220,38,38,0.2);
            color: #dc2626;
          }
          .si-upg-settings-content {
            padding: 15px;
          }
          .si-upg-section {
            margin-bottom: 12px;
            border-bottom: 1px solid rgba(52,211,100,0.15);
            padding-bottom: 8px;
          }
          .si-upg-section:last-child {
            border-bottom: none;
          }
          .si-upg-section-title {
            color: #22c55e;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .si-upg-slider-container {
            margin: 10px 0;
          }
          .si-upg-slider-label {
            color: #d4f0dc;
            font-size: 11px;
            margin-bottom: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .si-upg-slider-value {
            color: #22c55e;
            font-weight: bold;
          }
          .si-upg-slider {
            width: 100%;
            height: 6px;
            border-radius: 3px;
            background: rgba(52,211,100,0.1);
            outline: none;
            -webkit-appearance: none;
            appearance: none;
          }
          .si-upg-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #22c55e;
            cursor: pointer;
            box-shadow: 0 0 6px rgba(34,197,94,0.5);
            transition: all 0.15s ease;
          }
          .si-upg-slider::-webkit-slider-thumb:hover {
            background: #86efac;
            box-shadow: 0 0 10px rgba(34,197,94,0.8);
          }
          .si-upg-slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #22c55e;
            cursor: pointer;
            border: none;
            box-shadow: 0 0 6px rgba(34,197,94,0.5);
            transition: all 0.15s ease;
          }
          .si-upg-slider::-moz-range-thumb:hover {
            background: #86efac;
            box-shadow: 0 0 10px rgba(34,197,94,0.8);
          }
          .si-upg-info {
            color: #86efac;
            font-size: 10px;
            margin-bottom: 6px;
            padding: 3px 4px;
            background: rgba(52, 211, 100, 0.08);
            border-radius: 3px;
            font-style: italic;
            border: 1px solid rgba(52,211,100,0.15);
          }
          .si-upg-checkbox-item {
            display: flex;
            align-items: center;
            margin: 4px 0;
            cursor: pointer;
            color: #d4f0dc;
            font-size: 11px;
            padding: 2px 4px;
            border-radius: 3px;
            transition: background 0.15s ease;
          }
          .si-upg-checkbox-item:hover {
            background: rgba(52,211,100,0.08);
          }
          .si-upg-checkbox {
            margin-right: 6px;
            cursor: pointer;
            width: 14px;
            height: 14px;
          }
          .si-upg-warning {
            color: #ff6b6b;
            font-size: 10px;
            margin-top: 6px;
            padding: 4px;
            background: rgba(255, 107, 107, 0.1);
            border-radius: 2px;
            text-align: center;
          }
          .si-upg-reset-btn {
            width: 100%;
            margin-top: 8px;
            padding: 6px 8px;
            background: linear-gradient(180deg, #1a3521 0%, #0f1f13 100%);
            color: #d4f0dc;
            border: 1px solid rgba(52,211,100,0.2);
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            text-align: center;
            transition: all 0.15s ease;
          }
          .si-upg-reset-btn:hover {
            background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
            box-shadow: 0 0 12px rgba(34,197,94,0.3);
            color: #fff;
          }
          .si-upg-reset-btn:active {
            background: linear-gradient(180deg, #16a34a 0%, #15803d 100%);
          }
          .si-upg-context {
            position: fixed;
            background: #050d07;
            color: #86efac;
            font: 12px 'Trebuchet MS', Tahoma, Verdana, sans-serif;
            width: 79px;
            border: 1px solid rgba(52,211,100,0.25);
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 8px rgba(34,197,94,0.1);
            padding: 2px 0;
            z-index: 9999;
            text-align: center;
            display: none;
          }
          .si-upg-context-sep {
            width: 100%;
            background: rgba(52,211,100,0.2);
            margin: 1px 0;
            height: 1px;
          }
          .si-upg-context-item {
            padding: 3px 0;
            cursor: pointer;
            transition: background 0.15s ease;
          }
          .si-upg-context-item:hover { 
            background: rgba(52,211,100,0.15);
            color: #fff;
          }
        `;
        document.head.appendChild(style);
      },

      generateItemHtml(item) {
        if (!item || !item.icon) return '';
        let html = '<div class="item">';
        if (item.stat) {
          if (item.stat.includes('legendary')) html += '<div class="itemHighlighter t_leg"></div>';
          if (item.stat.includes('heroic'))    html += '<div class="itemHighlighter t_her"></div>';
          if (item.stat.includes('unique'))    html += '<div class="itemHighlighter t_uni"></div>';
          if (item.stat.includes('upgraded'))  html += '<div class="itemHighlighter t_upg"></div>';
        }
        html += `<img src="https://micc.garmory-cdn.cloud/obrazki/itemy/${item.icon}">`;
        html += '</div>';
        return html;
      },

      createWidget() {
        if (document.getElementById('si-upg-box')) return null;
        const { s } = SiCore;

        const uiRefs = {};

        const box = document.createElement('div');
        box.id = 'si-upg-box';
        box.className = 'si-upg-box';
        box.style.left = s.posXY.split(',')[0];
        box.style.top  = s.posXY.split(',')[1];
        box.addEventListener('mousedown', e => e.stopPropagation());
        box.addEventListener('mouseup', e => e.stopPropagation());
        box.addEventListener('click', e => e.stopPropagation());
        document.body.appendChild(box);

        const title = document.createElement('div');
        title.className = 'si-upg-title';
        title.textContent = 'SI Ulepszarka';
        box.appendChild(title);

        let isDragging = false, dragOffX = 0, dragOffY = 0;
        title.addEventListener('mousedown', e => {
          isDragging = true;
          e.stopPropagation();
          e.preventDefault();
          const rect = box.getBoundingClientRect();
          dragOffX = e.clientX - rect.left;
          dragOffY = e.clientY - rect.top;
        });
        document.addEventListener('mousemove', e => {
          if (!isDragging) return;
          e.stopPropagation();
          box.style.left = (e.clientX - dragOffX) + 'px';
          box.style.top  = (e.clientY - dragOffY) + 'px';
        }, true);
        const stopBoxDrag = e => {
          if (!isDragging) return;
          isDragging = false;
          s.posXY = box.style.left + ',' + box.style.top;
          SiCore.SiStorage.save();
        };
        window.addEventListener('mouseup', stopBoxDrag, true);
        document.addEventListener('mouseup', stopBoxDrag, true);

        const slot = document.createElement('div');
        slot.className = 'si-upg-item-slot';
        if (s.item_ulepszarka) {
          slot.innerHTML = SiCore.SiUi.generateItemHtml(s.item_ulepszarka);
          slot.style.border = 'none';
        }
        slot.addEventListener('click', e => {
          if (!s.item_ulepszarka) return;
          e.stopPropagation();
          s.item_ulepszarka = null;
          slot.innerHTML = '';
          slot.style.border = '';
          SiCore.SiStorage.save();
        });
        box.appendChild(slot);

        const btn = document.createElement('div');
        btn.className = 'si-upg-btn';
        btn.textContent = 'Ulepsz';
        box.appendChild(btn);

        const fill = document.createElement('div');
        fill.className = 'si-upg-limit-fill';
        fill.style.width = SiCore.SiAutomation.scaleLimit(s.limit) + 'px';

        const limitText = document.createElement('div');
        limitText.className = 'si-upg-limit-text';
        limitText.textContent = Math.floor((s.limit / 2000) * 100) + '%';

        const limitBar = document.createElement('div');
        limitBar.className = 'si-upg-limit-bar';
        limitBar.setAttribute('tip', `Ulepszono ${s.limit}/2000`);
        limitBar.appendChild(fill);
        limitBar.appendChild(limitText);
        box.appendChild(limitBar);
        uiRefs.limitBar = limitBar;
        uiRefs.limitFill = fill;
        uiRefs.limitText = limitText;
        limitBar.addEventListener('contextmenu', e => {
          e.preventDefault();
          s.limit = 0;
          limitBar.setAttribute('tip', 'Ulepszono 0/2000');
          fill.style.width = '0px';
          limitText.textContent = '0%';
          SiCore.SiStorage.save();
        });

        const activ = document.createElement('div');
        activ.className = 'si-upg-activ';
        activ.style.background = s.work ? '#22c55e' : '#dc2626';
        activ.style.boxShadow = s.work ? '0 0 8px rgba(34,197,94,0.6)' : '0 0 8px rgba(220,38,38,0.4)';
        activ.setAttribute('tip', s.work ? 'Ulepszarka: włączona' : 'Ulepszarka: wyłączona');
        box.appendChild(activ);
        activ.addEventListener('click', () => {
          s.work = !s.work;
          activ.style.background = s.work ? '#22c55e' : '#dc2626';
          activ.style.boxShadow = s.work ? '0 0 8px rgba(34,197,94,0.6)' : '0 0 8px rgba(220,38,38,0.4)';
          activ.setAttribute('tip', s.work ? 'Ulepszarka: włączona' : 'Ulepszarka: wyłączona');
          message('Ulepszarka SI: ' + (s.work ? 'włączona' : 'wyłączona'));
          SiCore.SiStorage.save();
          if (s.automatic && s.work) {
            clearInterval(s.intervalId);
            s.intervalId = setInterval(() => SiCore.SiAutomation.checkSlot(uiRefs), 500);
          } else if (!s.work) {
            clearInterval(s.intervalId);
            s.intervalId = null;
            // Any active cycle will finish its current batch then stop (canClose checks s.work)
          }
        });

        const gear = document.createElement('div');
        gear.className = 'si-upg-gear';
        gear.textContent = '⚙️';
        box.appendChild(gear);

        const settingsBox = document.createElement('div');
        settingsBox.className = 'si-upg-settings';
        settingsBox.addEventListener('mousedown', e => e.stopPropagation());
        settingsBox.addEventListener('mouseup', e => e.stopPropagation());
        settingsBox.addEventListener('click', e => e.stopPropagation());
        document.body.appendChild(settingsBox); // Attach to body instead of box

        // Settings header
        const settingsHeader = document.createElement('div');
        settingsHeader.className = 'si-upg-settings-header';
        settingsBox.appendChild(settingsHeader);

        const settingsTitle = document.createElement('div');
        settingsTitle.className = 'si-upg-settings-title';
        settingsTitle.textContent = 'Ustawienia SI Ulepszarka';
        settingsHeader.appendChild(settingsTitle);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'si-upg-settings-close';
        closeBtn.innerHTML = '×';
        closeBtn.title = 'Zamknij';
        settingsHeader.appendChild(closeBtn);

        closeBtn.addEventListener('click', () => {
          settingsBox.style.display = 'none';
        });

        // Make header draggable
        let isDraggingSettings = false, dragOffXSettings = 0, dragOffYSettings = 0;
        settingsHeader.addEventListener('mousedown', e => {
          if (e.target === closeBtn) return;
          isDraggingSettings = true;
          e.stopPropagation();
          e.preventDefault();
          const rect = settingsBox.getBoundingClientRect();
          dragOffXSettings = e.clientX - rect.left;
          dragOffYSettings = e.clientY - rect.top;
        });
        document.addEventListener('mousemove', e => {
          if (!isDraggingSettings) return;
          e.stopPropagation();
          settingsBox.style.left = (e.clientX - dragOffXSettings) + 'px';
          settingsBox.style.top = (e.clientY - dragOffYSettings) + 'px';
          settingsBox.style.transform = 'none';
        }, true);
        const stopSettingsDrag = () => { isDraggingSettings = false; };
        window.addEventListener('mouseup', stopSettingsDrag, true);
        document.addEventListener('mouseup', stopSettingsDrag, true);

        // Settings content container
        const settingsContent = document.createElement('div');
        settingsContent.className = 'si-upg-settings-content';
        settingsBox.appendChild(settingsContent);

        gear.addEventListener('click', () => {
          const isVisible = settingsBox.style.display === 'block';
          settingsBox.style.display = isVisible ? 'none' : 'block';
          if (!isVisible) {
            // Reset to center when opening
            settingsBox.style.left = '50%';
            settingsBox.style.top = '50%';
            settingsBox.style.transform = 'translate(-50%, -50%)';
          }
        });

        // Rarity settings section
        const raritySection = document.createElement('div');
        raritySection.className = 'si-upg-section';
        settingsContent.appendChild(raritySection);

        const rarityTitle = document.createElement('div');
        rarityTitle.className = 'si-upg-section-title';
        rarityTitle.textContent = 'Rzadkość przedmiotów:';
        raritySection.appendChild(rarityTitle);

        const RARITY_SETTINGS = [
          { key: 'allowCommon', label: 'Zwykłe', title: 'Używaj zwykłych przedmiotów' },
          { key: 'allowUnique', label: 'Unikaty', title: 'Używaj unikatów' },
          { key: 'allowHeroic', label: 'Heroiki', title: 'Używaj heroików' },
        ];

        RARITY_SETTINGS.forEach(({ key, label, title }) => {
          const item = document.createElement('label');
          item.className = 'si-upg-checkbox-item';
          item.title = title;

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'si-upg-checkbox';
          checkbox.checked = s[key];
          checkbox.dataset.settingKey = key;

          const labelSpan = document.createElement('span');
          labelSpan.textContent = label;

          item.appendChild(checkbox);
          item.appendChild(labelSpan);
          raritySection.appendChild(item);
        });

        // Bound settings section
        const boundSection = document.createElement('div');
        boundSection.className = 'si-upg-section';
        settingsContent.appendChild(boundSection);

        const boundTitle = document.createElement('div');
        boundTitle.className = 'si-upg-section-title';
        boundTitle.textContent = 'Dodatkowe przedmioty:';
        boundSection.appendChild(boundTitle);

        const BOUND_SETTINGS = [
          { key: 'allowSoulbound',  label: 'Soulbound', title: 'Dodaje przedmioty "Związany z właścicielem"' },
          { key: 'allowPermbound',  label: 'Permbound', title: 'Dodaje przedmioty "Związany z właścicielem na stałe"' },
        ];

        BOUND_SETTINGS.forEach(({ key, label, title }) => {
          const item = document.createElement('label');
          item.className = 'si-upg-checkbox-item';
          item.title = title;

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'si-upg-checkbox';
          checkbox.checked = s[key];
          checkbox.dataset.settingKey = key;

          const labelSpan = document.createElement('span');
          labelSpan.textContent = label;

          item.appendChild(checkbox);
          item.appendChild(labelSpan);
          boundSection.appendChild(item);
        });

        // Warning message
        const warning = document.createElement('div');
        warning.className = 'si-upg-warning';
        warning.innerHTML = '⚠️ Włączenie soulbound/permbound może spalić ważne itemy!';
        boundSection.appendChild(warning);

        // Automation section
        const automationSection = document.createElement('div');
        automationSection.className = 'si-upg-section';
        settingsContent.appendChild(automationSection);

        const automationTitle = document.createElement('div');
        automationTitle.className = 'si-upg-section-title';
        automationTitle.textContent = 'Automatyzacja:';
        automationSection.appendChild(automationTitle);

        const automaticItem = document.createElement('label');
        automaticItem.className = 'si-upg-checkbox-item';
        automaticItem.title = 'Automatyczne ulepszanie gdy brakuje slotów';

        const automaticCheckbox = document.createElement('input');
        automaticCheckbox.type = 'checkbox';
        automaticCheckbox.className = 'si-upg-checkbox';
        automaticCheckbox.checked = s.automatic;
        automaticCheckbox.dataset.settingKey = 'automatic';

        const automaticLabel = document.createElement('span');
        automaticLabel.textContent = 'Auto-ulepszanie';

        automaticItem.appendChild(automaticCheckbox);
        automaticItem.appendChild(automaticLabel);
        automationSection.appendChild(automaticItem);

        // Free slots threshold slider
        if (!s.freeSlotsThreshold) s.freeSlotsThreshold = 5;
        
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'si-upg-slider-container';
        automationSection.appendChild(sliderContainer);

        const sliderLabel = document.createElement('div');
        sliderLabel.className = 'si-upg-slider-label';
        sliderLabel.innerHTML = `<span>Minimalnie wolnych slotów:</span><span class="si-upg-slider-value">${s.freeSlotsThreshold}</span>`;
        sliderContainer.appendChild(sliderLabel);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'si-upg-slider';
        slider.min = '0';
        slider.max = '20';
        slider.value = s.freeSlotsThreshold;
        slider.title = `Uruchom auto-ulepszanie gdy wolnych slotów <= ${s.freeSlotsThreshold}`;
        sliderContainer.appendChild(slider);

        slider.addEventListener('input', () => {
          s.freeSlotsThreshold = parseInt(slider.value);
          sliderLabel.querySelector('.si-upg-slider-value').textContent = s.freeSlotsThreshold;
          slider.title = `Uruchom auto-ulepszanie gdy wolnych slotów <= ${s.freeSlotsThreshold}`;
          SiCore.SiStorage.save();
        });

        // Reset button
        const resetBtn = document.createElement('button');
        resetBtn.className = 'si-upg-reset-btn';
        resetBtn.textContent = '↻ Reset do domyślnych';
        resetBtn.title = 'Przywróć domyślne ustawienia';
        automationSection.appendChild(resetBtn);

        resetBtn.addEventListener('click', () => {
          // Reset to safe defaults
          s.allowCommon = true;
          s.allowUnique = true;
          s.allowHeroic = false;
          s.allowSoulbound = false;
          s.allowPermbound = false;
          s.automatic = false;
          s.freeSlotsThreshold = 5;
          
          // Update UI
          settingsContent.querySelectorAll('.si-upg-checkbox').forEach(checkbox => {
            const key = checkbox.dataset.settingKey;
            checkbox.checked = s[key];
          });
          slider.value = s.freeSlotsThreshold;
          sliderLabel.querySelector('.si-upg-slider-value').textContent = s.freeSlotsThreshold;
          
          SiCore.SiStorage.save();
          message('Ustawienia zresetowane do domyślnych');
        });

        // Bind event handlers for all checkboxes
        settingsContent.querySelectorAll('.si-upg-checkbox').forEach(checkbox => {
          checkbox.addEventListener('change', () => {
            const key = checkbox.dataset.settingKey;
            s[key] = checkbox.checked;
            
            // Handle automatic mode
            if (key === 'automatic') {
              if (s.automatic && s.work) {
                clearInterval(s.intervalId);
                s.intervalId = setInterval(() => SiCore.SiAutomation.checkSlot(uiRefs), 500);
              } else if (!s.automatic) {
                clearInterval(s.intervalId);
                s.intervalId = null;
              }
            }
            
            SiCore.SiStorage.save();
          });
        });

        const ctxMenu = document.createElement('div');
        ctxMenu.className = 'si-upg-context';
        document.body.appendChild(ctxMenu);

        const ctxEnhance = document.createElement('div');
        ctxEnhance.className = 'si-upg-context-item';
        ctxEnhance.textContent = 'Ulepsz';
        ctxMenu.appendChild(ctxEnhance);

        const ctxSep = document.createElement('div');
        ctxSep.className = 'si-upg-context-sep';
        ctxMenu.appendChild(ctxSep);

        const ctxClose = document.createElement('div');
        ctxClose.className = 'si-upg-context-item';
        ctxClose.textContent = 'Zamknij';
        ctxMenu.appendChild(ctxClose);
        ctxClose.addEventListener('click', () => { ctxMenu.style.display = 'none'; });

        Object.assign(uiRefs, { slot, btn, limitBar, fill, activ, ctxMenu, ctxEnhance });

        btn.addEventListener('click', () => {
          console.log('🖱️ Kliknięto przycisk "Ulepsz"');
          SiCore.SiAutomation.checkItem(uiRefs);
        });
        SiCore.SiUi.bindContextMenu(uiRefs);

        if (s.automatic && s.work) {
          s.intervalId = setInterval(() => SiCore.SiAutomation.checkSlot(uiRefs), 500);
        }

        return uiRefs;
      },

      bindContextMenu(uiRefs) {
        let pendingItemId = null;

        document.addEventListener('contextmenu', e => {
          const targetItem = e.target.closest('.item');
          if (!targetItem) {
            if (uiRefs.ctxMenu.style.display === 'block') {
              uiRefs.ctxMenu.style.display = 'none';
            }
            return;
          }
          const rawId = targetItem.id ? targetItem.id.replace('item', '') : null;
          if (!rawId || !window.g.item[rawId]) return;

          const item = window.g.item[rawId];
          const isValidType = SiCore.TYPE_LABELS.some(
            label => item.tip && item.tip.includes(label)
          );
          if (!isValidType) return;

          e.preventDefault();
          pendingItemId = rawId;
          uiRefs.ctxMenu.style.left = (e.clientX - 31) + 'px';
          uiRefs.ctxMenu.style.top  = (e.clientY - 6)  + 'px';
          uiRefs.ctxMenu.style.display = 'block';
        });

        uiRefs.ctxEnhance.addEventListener('click', () => {
          console.log('🖱️ Kliknięto "Ulepsz" w menu kontekstowym, pendingItemId:', pendingItemId);
          
          if (!pendingItemId || !window.g.item[pendingItemId]) {
            console.error('❌ Brak pendingItemId lub przedmiot nie istnieje');
            return;
          }
          
          SiCore.s.item_ulepszarka = window.g.item[pendingItemId];
          console.log('✅ Ustawiono główny przedmiot:', {
            id: SiCore.s.item_ulepszarka.id,
            name: SiCore.s.item_ulepszarka.name,
            stat: SiCore.s.item_ulepszarka.stat
          });
          
          uiRefs.slot.innerHTML = SiCore.SiUi.generateItemHtml(SiCore.s.item_ulepszarka);
          uiRefs.slot.style.border = 'none';
          uiRefs.ctxMenu.style.display = 'none';
          SiCore.SiStorage.save();
        });
      },
    },

    init() {
      function CanTry() {
        if (window.hero && window.hero.id !== undefined) {
          SiCore.SiStorage.load();
          SiCore.SiUi.setupCss();
          SiCore.SiUi.createWidget();
        } else {
          setTimeout(CanTry, 100);
        }
      }
      CanTry();
    },

  };

  // Autostart when loaded via g.loadQueue
  if (window.g && window.g.loadQueue) {
    window.g.loadQueue.push({
      fun: () => {
        SiCore.init();
      }
    });
  } else {
    // Fallback if loadQueue not available
    SiCore.init();
  }

  // Export API
  window.__RZP_ULEPSZARKA_SI_API = {
    enable() {
      return true;
    },
    disable() {
      const box = document.getElementById('si-upg-box');
      if (box) box.style.display = 'none';
      return true;
    },
    runWidget() {
      const box = document.getElementById('si-upg-box');
      if (box) {
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
      }
      return true;
    },
    openSettings() {
      const box = document.getElementById('si-upg-box');
      const settings = document.querySelector('.si-upg-settings');
      if (box && settings) {
        box.style.display = 'block';
        settings.style.display = settings.style.display === 'block' ? 'none' : 'block';
      }
      return true;
    },
  };
})();
