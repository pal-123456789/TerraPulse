// Permanent fix for blank-screen-on-refresh.
// Unregister any service workers and clear all caches on every app boot.
// This is a no-op once the user is clean, but heals every existing user
// who still has the old PWA service worker installed.

export const cleanupServiceWorkersAndCaches = async (): Promise<void> => {
  if (typeof window === "undefined") return;
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => undefined)));
    }
  } catch {
    /* ignore */
  }
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch {
    /* ignore */
  }
};

// Fire-and-forget on import so it runs as early as possible.
cleanupServiceWorkersAndCaches();
