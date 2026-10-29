/**
 * Service worker registration.
 *
 * This used to be an inline script in index.html that registered on every
 * load, including `vite dev`. A caching service worker sitting in front of
 * the dev server competes with HMR and serves stale modules, which shows up
 * as edits that mysteriously do not appear. It now only registers for a real
 * build.
 *
 * The worker is what makes the app installable on Android, so this is also
 * what the home-screen tile depends on.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const next = registration.installing;
          if (!next) return;
          next.addEventListener("statechange", () => {
            // Only skip waiting when an older worker is actually in control;
            // on a first install there is nothing to replace.
            if (next.state === "installed" && navigator.serviceWorker.controller) {
              next.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch((err) => {
        // Private browsing, a blocked origin, or an embedded webview that
        // disallows workers. The app works fine without one; it just is not
        // installable there.
        console.warn("[3am] Service worker unavailable; offline caching is off.", err);
      });

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
