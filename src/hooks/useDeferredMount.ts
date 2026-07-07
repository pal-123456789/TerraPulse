import { useEffect, useState } from "react";

/**
 * Defers mounting heavy/3D children until the browser is idle (or after a
 * short timeout fallback). Lets first paint and FCP land before pulling in
 * large dependencies like @react-three/drei.
 */
export const useDeferredMount = (timeoutMs = 600): boolean => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fire = () => {
      if (!cancelled) setReady(true);
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(fire, { timeout: timeoutMs });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
      };
    }

    const t = window.setTimeout(fire, timeoutMs);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [timeoutMs]);

  return ready;
};
