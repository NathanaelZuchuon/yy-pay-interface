"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { useCallback, useSyncExternalStore } from "react";

const COLLAPSED_STORAGE_KEY = "yypay-sidebar-collapsed";
const COLLAPSED_EVENT = "yypay:sidebar-collapsed";
const DESKTOP_QUERY = "(min-width: 1024px)";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeCollapsed(onChange: () => void) {
  globalThis.addEventListener("storage", onChange);
  globalThis.addEventListener(COLLAPSED_EVENT, onChange);
  return () => {
    globalThis.removeEventListener("storage", onChange);
    globalThis.removeEventListener(COLLAPSED_EVENT, onChange);
  };
}

/**
 * Préférence « sidebar réduite » (mini-sidebar), persistée en localStorage
 * et synchronisée entre onglets.
 */
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    () => false,
  );

  const setCollapsed = useCallback((next: boolean) => {
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Stockage indisponible (navigation privée) : on garde l'état courant.
    }
    globalThis.dispatchEvent(new Event(COLLAPSED_EVENT));
  }, []);

  return [collapsed, setCollapsed] as const;
}

/** `true` à partir du breakpoint `lg` (sidebar fixe) ; `false` = tiroir mobile. */
export function useIsDesktop() {
  return useMediaQuery(DESKTOP_QUERY);
}
