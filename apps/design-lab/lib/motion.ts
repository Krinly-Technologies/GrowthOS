'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

function subscribeTo(query: string) {
  return (callback: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener('change', callback);
    return () => {
      mq.removeEventListener('change', callback);
    };
  };
}

export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    subscribeTo(query),
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** Eases a number toward `target` (used for the hero figure). Instant with reduced motion. */
export function useAnimatedNumber(target: number, duration = 420): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    if (reduced) return;
    const from = current.current;
    if (from === target) return;
    const started = performance.now();
    let frame = requestAnimationFrame(function step(t) {
      const p = Math.min(1, (t - started) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = Math.round(from + (target - from) * eased);
      current.current = next;
      setValue(next);
      if (p < 1) frame = requestAnimationFrame(step);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [target, duration, reduced]);

  return reduced ? target : value;
}
