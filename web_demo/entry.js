/* External launcher: resolve the prediction route from this bundled script. */
(() => {
  const destination = new URL('prediction.html', document.currentScript.src);
  destination.search = location.search;
  destination.hash = location.hash;
  document.getElementById('demo-entry').href = destination.href;
  location.replace(destination.href);
})();
