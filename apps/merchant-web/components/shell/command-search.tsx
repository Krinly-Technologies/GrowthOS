'use client';

import { Button, IconButton } from '@krinly/ui/components/button';
import { Dialog, DialogContent, DialogTrigger } from '@krinly/ui/components/overlay';
import { Icon, type IconName } from '@krinly/ui/components/icon';
import { Input } from '@krinly/ui/components/input';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface Destination {
  key: string;
  label: string;
  group: 'Go to' | 'Switch workspace';
  icon: IconName;
  href: string;
}

/**
 * Minimal command palette (Ctrl/Cmd K). Only navigates to pages this app actually has — nav
 * sections and other workspaces the user belongs to. No fabricated search results.
 */
export function CommandSearch({
  destinations,
  onBrand = false,
}: {
  destinations: Destination[];
  onBrand?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? destinations.filter((d) => d.label.toLowerCase().includes(q))
      : destinations;
    const groups = new Map<Destination['group'], Destination[]>();
    for (const d of matches) groups.set(d.group, [...(groups.get(d.group) ?? []), d]);
    return groups;
  }, [destinations, query]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={onBrand ? 'on-brand' : 'outline'}
          shape="pill"
          className="hidden md:inline-flex md:w-full md:max-w-[420px] md:justify-start md:gap-3 md:px-4 md:font-normal"
        >
          <Icon name="search" size={16} />
          <span className="flex-1 text-left text-[13px]">Search workspace</span>
          <kbd className="rounded-md bg-canvas px-1.5 py-0.5 text-[11px] font-semibold text-ink-3">
            Ctrl K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogTrigger asChild>
        <IconButton
          label="Search"
          variant={onBrand ? 'on-brand' : 'outline'}
          shape="pill"
          className="md:hidden"
        >
          <Icon name="search" size={18} />
        </IconButton>
      </DialogTrigger>
      <DialogContent title="Search" size="sm" className="p-0">
        <div className="border-b border-line p-3">
          <Input
            autoFocus
            placeholder="Search workspace and settings…"
            aria-label="Search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.size === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-ink-3">No matches.</p>
          ) : (
            [...results.entries()].map(([group, items]) => (
              <div key={group} className="mb-1">
                <p className="px-2 pt-2 pb-1 text-xs font-bold text-ink-3">{group}</p>
                {items.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push(d.href);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-canvas-2"
                  >
                    <Icon name={d.icon} size={16} className="text-ink-3" />
                    {d.label}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { Destination };
