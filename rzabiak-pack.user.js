// ==UserScript==
// @name         RzabiakPack - Panel Dodatkow
// @namespace    https://margonem.pl/
// @version      1.2.9
// @description  Loader panelu RzabiakPack
// @author       kruulxd
// @match        *://*.margonem.pl/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
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

  // Globalnie wycisza logi konsoli na stronie gry.
  (function silenceConsole() {
    try {
      const noop = function () {};
      const target = unsafeWindow?.console || window.console;
      if (!target) return;
      target.log = noop;
      target.warn = noop;
      target.error = noop;
      target.info = noop;
      target.debug = noop;
    } catch (error) {}
  })();

  // Udostępnij loader omijający CSP dla panel-core.js
  unsafeWindow.__RZP_LOAD_MODULE = function (url, onload, onerror) {
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function (response) {
        try {
          const script = document.createElement('script');
          script.textContent = response.responseText;
          document.documentElement.appendChild(script);
          script.remove();
          if (onload) onload();
        } catch (e) {
          if (onerror) onerror(e);
        }
      },
      onerror: function () {
        if (onerror) onerror(new Error('Failed: ' + url));
      }
    });
  };

  GM_xmlhttpRequest({
    method: 'GET',
    url: `${CORE_URL}?v=${Date.now()}`,
    onload: function (response) {
      const script = document.createElement('script');
      script.textContent = response.responseText;
      document.documentElement.appendChild(script);
      script.remove();
    },
    onerror: function () {}
  });
})();
