// Development must always serve live source rather than a cached application.
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const base = new URL(import.meta.env.BASE_URL, window.location.origin);
  const workerUrl = new URL("sw.js", base).href;

  try {
    if (import.meta.env.PROD) {
      await navigator.serviceWorker.register(workerUrl, {
        scope: base.pathname,
        updateViaCache: "none",
      });
    } else {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations
        .filter((registration) => [registration.active, registration.waiting, registration.installing]
          .some((worker) => worker?.scriptURL === workerUrl))
        .map((registration) => registration.unregister()));
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith("oman-debates-"))
        .map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn("PWA service worker could not be configured:", error);
  }
}
