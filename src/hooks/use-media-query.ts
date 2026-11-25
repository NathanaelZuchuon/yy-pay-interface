"use client";

import { useCallback, useSyncExternalStore } from "react";

/** `true` si la media query correspond. Toujours `false` au rendu serveur. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = globalThis.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => globalThis.matchMedia(query).matches,
    () => false,
  );
}
