'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { type MemberId, type SourceId, type Stage, STAGES } from './domain';
import { parseRange, type RangeId } from './ranges';
import { type SavedView, SAVED_VIEWS } from './selectors';
import { MEMBER_IDS, SOURCE_IDS } from './sample/scenario';

// View state lives in the URL so every state is linkable and Back-navigable. Updates use the
// native History API, which Next.js syncs with useSearchParams without a server round trip.

type Patch = Record<string, string | null>;

export function useUrlState(): {
  params: URLSearchParams;
  set: (patch: Patch, mode?: 'push' | 'replace') => void;
} {
  const params = useSearchParams();
  const pathname = usePathname();
  const set = useCallback(
    (patch: Patch, mode: 'push' | 'replace' = 'replace') => {
      // Build on the address bar, not on useSearchParams: Next.js syncs History API updates into
      // the hook inside a transition, so two changes in quick succession (choosing a tab, then
      // opening something inside it) would otherwise write the second on top of a stale query
      // and silently drop the first.
      const next = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (mode === 'push') window.history.pushState(null, '', url);
      else window.history.replaceState(null, '', url);
    },
    [pathname],
  );
  return { params: new URLSearchParams(params.toString()), set };
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

/**
 * A single string parameter with a fallback, e.g. the acquisition tab or the form being edited.
 *
 * The new value applies on the same render as the click and is dropped as soon as the URL
 * catches up: Next.js syncs History API updates into useSearchParams inside a transition, which
 * lags noticeably in development, and a tab that waits for that feels broken.
 */
export function useParam(
  key: string,
  fallback: string,
): { value: string; setValue: (next: string, mode?: 'push' | 'replace') => void } {
  const { params, set } = useUrlState();
  const search = params.toString();
  const [pending, setPending] = useState<{ base: string; value: string } | null>(null);
  const fromUrl = params.get(key) ?? fallback;
  const value = pending && pending.base === search ? pending.value : fromUrl;
  const setValue = useCallback(
    (next: string, mode: 'push' | 'replace' = 'replace') => {
      setPending({ base: search, value: next });
      set({ [key]: next === fallback ? null : next }, mode);
    },
    [set, key, fallback, search],
  );
  return { value, setValue };
}

const INBOX_TABS = ['all', 'mine', 'unassigned', 'needs_review', 'closed'] as const;
type InboxTabParam = (typeof INBOX_TABS)[number];

export interface InboxQuery {
  tab: InboxTabParam;
  q: string;
  conversation: string | null;
}

/** Inbox view state: everything is in the URL, so a conversation is linkable and Back-navigable. */
export function useInboxQuery(): {
  query: InboxQuery;
  setQuery: (patch: Partial<InboxQuery>, mode?: 'push' | 'replace') => void;
} {
  const { params, set } = useUrlState();
  const key = params.toString();
  const [pending, setPending] = useState<{ base: string; patch: Partial<InboxQuery> } | null>(null);
  const tabParam = params.get('tab');
  const fromUrl: InboxQuery = {
    tab: INBOX_TABS.find((t) => t === tabParam) ?? 'all',
    q: params.get('q') ?? '',
    conversation: params.get('c'),
  };
  const query: InboxQuery =
    pending && pending.base === key ? { ...fromUrl, ...pending.patch } : fromUrl;
  const setQuery = useCallback(
    (patch: Partial<InboxQuery>, mode: 'push' | 'replace' = 'replace') => {
      setPending((prev) => ({
        base: key,
        patch: prev && prev.base === key ? { ...prev.patch, ...patch } : patch,
      }));
      const out: Patch = {};
      if (patch.tab !== undefined) out.tab = patch.tab === 'all' ? null : patch.tab;
      if (patch.q !== undefined) out.q = patch.q;
      if (patch.conversation !== undefined) out.c = patch.conversation;
      set(out, mode);
    },
    [set, key],
  );
  return { query, setQuery };
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

/** Leads/CRM view state: everything is in the URL, so a view is linkable and Back-navigable. */
export function useLeadsQuery(defaultView: 'list' | 'board'): {
  query: LeadsQuery;
  setQuery: (patch: Partial<LeadsQuery>, mode?: 'push' | 'replace') => void;
} {
  const { params, set } = useUrlState();
  const key = params.toString();
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
