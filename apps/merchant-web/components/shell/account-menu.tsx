'use client';

import { Avatar } from '@krinly/ui/components/avatar';
import { Icon } from '@krinly/ui/components/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@krinly/ui/components/overlay';

export function AccountMenu({
  name,
  email,
  role,
  onBrand = false,
}: {
  name: string;
  email: string;
  role: string;
  /** Styled for the navy sidebar rather than a light surface. */
  onBrand?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          onBrand
            ? 'flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left hover:bg-brand-raised'
            : 'flex items-center gap-2.5 rounded-full p-0.5 hover:bg-canvas-2'
        }
        // onBrand already shows the name as visible text, so the accessible name is built from
        // that content (plus a hidden "account menu" suffix) instead of an aria-label that would
        // then omit the visible role text (axe: label-content-name-mismatch). The icon-only
        // variant has no visible text, so it needs the aria-label instead.
        aria-label={onBrand ? undefined : `${name}, account menu`}
      >
        <Avatar name={name} size={32} decorative />
        {onBrand ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-semibold text-on-brand">{name}</span>
            <span className="block truncate text-xs text-on-brand-2">{role}</span>
            <span className="sr-only">, account menu</span>
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={onBrand ? 'start' : 'end'} side="top">
        <DropdownMenuLabel>
          <span className="block font-semibold text-ink">{name}</span>
          {email !== name ? (
            <span className="block text-xs font-normal text-ink-3">{email}</span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          tone="critical"
          onSelect={() => {
            // Radix closes (and unmounts) this item synchronously on select, so a submit button
            // tied to a sibling <form> via the `form=` attribute never actually fires — the POST
            // never reaches the server. Do the sign-out directly instead.
            void fetch('/auth/signout', { method: 'POST' }).then(() => {
              // A hard navigation (not the router) so every client cache is flushed on sign-out.
              window.location.replace('/login');
            });
          }}
        >
          <Icon name="exit" size={16} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
