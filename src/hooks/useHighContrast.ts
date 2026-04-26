import { useEffect, useState } from "react";

const STORAGE_KEY = "tg-high-contrast";

const apply = (on: boolean) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("high-contrast", on);
};

/**
 * Persistent High Contrast Mode toggle.
 * Adds/removes `high-contrast` class on <html> and stores preference.
 */
export const useHighContrast = (): [boolean, (v: boolean) => void] => {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  useEffect(() => {
    apply(enabled);
    try {
      window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    } catch {
      /* ignore quota errors */
    }
  }, [enabled]);

  return [enabled, setEnabled];
};

/** Apply persisted setting as early as possible (call from App root). */
export const initHighContrast = () => {
  if (typeof window === "undefined") return;
  const on = window.localStorage.getItem(STORAGE_KEY) === "1";
  apply(on);
};
