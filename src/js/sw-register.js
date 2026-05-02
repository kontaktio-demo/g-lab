// G-Lab - rejestracja service workera (PWA)
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function (e) {
      // soft-fail - PWA jest opcjonalna
      if (window.console && console.info) console.info('SW register failed:', e);
    });
  });
}
