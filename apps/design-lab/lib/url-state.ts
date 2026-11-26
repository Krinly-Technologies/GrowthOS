'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { type MemberId, type SourceId, type Stage, STAGES } from './domain';
import { parseRange, type RangeId } from './ranges';
import { MEMBER_IDS, SOURCE_IDS } from './sample/scenario';
import { SAVED_VIEWS, type SavedView } from './selectors';

// View state lives in the URL so every state is linkable, screenshottable and Back-navigable.
// Updates use the native History API, which Next.js syncs with useSearchParams without a
// server round trip.

type Patch = Record<string, string | null>;

export function useUrlState(): {
  params: URLSearchParams;
  set: (patch: Patch, mode?: 'push' | 'replace') => void;
} {
  const params = useSearchParams();
  const pathname = usePathname();
  const set = useCallback(
    (patch: Patch, mode: 'push' | 'replace' = 'replace') => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (mode === 'push') window.history.pushState(null, '', url);
      else window.history.replaceState(null, '', url);
    },
    [params, pathname],
  );
  return { params: new URLSearchParams(params.toString()), set };
}

function parseList<T extends string>(value: string | null, allowed: readonly T[]): T[] {
  if (!value) return [];
  return value.split(',').flatMap((part) => allowed.filter((a) => a === part));
}

export interface LeadsQuery {
  view: 'list' | 'board';
  saved: SavedView;
  q: string;
  stages: Stage[];
  sources: SourceId[];
  owners: MemberId[];
  lead: string | null;
}

export function useLeadsQuery(defaultView: 'list' | 'board'): {
  query: LeadsQuery;
  setQuery: (patch: Partial<LeadsQuery>, mode?: 'push' | 'replace') => void;
} {
  const { params, set } = useUrlState();
  const key = params.toString();
  // Optimistic patch: applied on the same render as the keystroke/click, and dropped as soon as the
  // URL changes (Next.js syncs History API updates into useSearchParams inside a transition, which
  // can lag noticeably in development).
  const [pending, setPending] = useState<{ base: string; patch: Partial<LeadsQuery> } | null>(null);
  const viewParam = params.get('view');
  const fromUrl: LeadsQuery = {
    view: viewParam === 'board' || viewParam === 'list' ? viewParam : defaultView,
    saved: SAVED_VIEWS.find((v) => v.id === params.get('show'))?.id ?? 'open',
    q: params.get('q') ?? '',
    stages: parseList(params.get('stage'), STAGES),
    sources: parseList(params.get('source'), SOURCE_IDS),
    owners: parseList(params.get('owner'), MEMBER_IDS),
    lead: params.get('lead'),
  };
  const query: LeadsQuery =
    pending && pending.base === key ? { ...fromUrl, ...pending.patch } : fromUrl;
  const setQuery = useCallback(
    (patch: Partial<LeadsQuery>, mode: 'push' | 'replace' = 'replace') => {
      setPending((prev) => ({
        base: key,
        patch: prev && prev.base === key ? { ...prev.patch, ...patch } : patch,
      }));
      const out: Patch = {};
      if (patch.view !== undefined) out.view = patch.view === defaultView ? null : patch.view;
      if (patch.saved !== undefined) out.show = patch.saved === 'open' ? null : patch.saved;
      if (patch.q !== undefined) out.q = patch.q;
      if (patch.stages !== undefined) out.stage = patch.stages.join(',');
      if (patch.sources !== undefined) out.source = patch.sources.join(',');
      if (patch.owners !== undefined) out.owner = patch.owners.join(',');
      if (patch.lead !== undefined) out.lead = patch.lead;
      set(out, mode);
    },
    [set, defaultView, key],
  );
  return { query, setQuery };
}

export function useRangeParam(): { range: RangeId; setRange: (range: RangeId) => void } {
  const { params, set } = useUrlState();
  const range = parseRange(params.get('range'));
  const setRange = useCallback(
    (next: RangeId) => {
      set({ range: next === 'month' ? null : next });
    },
    [set],
  );
  return { range, setRange };
}
