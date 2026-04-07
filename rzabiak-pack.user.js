// ==UserScript==
// @name         RzabiakPack - Panel Dodatkow
// @namespace    https://margonem.pl/
// @version      1.2.0
// @description  Loader panelu RzabiakPack
// @author       kruulxd
// @match        *://*.margonem.pl/*
// @match        *://margonem.pl/*
// @grant        none
// @connect      raw.githubusercontent.com
// @downloadURL  https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/rzabiak-pack.user.js
// @updateURL    https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/rzabiak-pack.user.js
// ==/UserScript==

(function () {
  'use strict';

  const CORE_URL = 'https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/src/panel/panel-core.js';

  if (window.__RZP_PANEL_LOADER_DONE) {
    return;
  }
  window.__RZP_PANEL_LOADER_DONE = true;

  const existing = document.querySelector('script[data-rzp-panel-core="1"]');
  if (existing) {
    return;
  }

  const script = document.createElement('script');
  script.src = `${CORE_URL}?v=${Date.now()}`;
  script.async = true;
  script.dataset.rzpPanelCore = '1';
  script.onload = () => {
    console.log('RzabiakPack core loaded');
  };
  script.onerror = () => {
    console.error('RzabiakPack core failed to load');
  };

  document.body.appendChild(script);
})();
