'use client';

import { type RefObject, useEffect, useRef, useState } from 'react';

/** Tracks an element's content width (for SVG charts that draw in pixels). */
export function useElementWidth<T extends HTMLElement>(
  fallback: number,
  min = 0,
): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(min, Math.round(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [min]);
  return [ref, width];
}
