'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

/** The server (and the hydration render) can't measure the viewport, so it never matches there. */
const getServerMediaQuerySnapshot = () => false;

/** Whether a CSS media query matches, kept in sync as the viewport changes. */
export const useMediaQuery = (mediaQuery: string) => {
  // One MediaQueryList per query, shared by subscribe and getSnapshot; none on the server.
  const mediaQueryList = useMemo(
    () => (typeof window === 'undefined' ? null : window.matchMedia(mediaQuery)),
    [mediaQuery],
  );

  const subscribeToMediaQuery = useCallback(
    (onMediaQueryChange: () => void) => {
      mediaQueryList?.addEventListener('change', onMediaQueryChange);
      return () => mediaQueryList?.removeEventListener('change', onMediaQueryChange);
    },
    [mediaQueryList],
  );

  const getMediaQuerySnapshot = useCallback(
    () => mediaQueryList?.matches ?? false,
    [mediaQueryList],
  );

  return useSyncExternalStore(
    subscribeToMediaQuery,
    getMediaQuerySnapshot,
    getServerMediaQuerySnapshot,
  );
};
