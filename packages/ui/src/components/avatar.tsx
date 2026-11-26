import type * as React from 'react';
import { initials } from '../lib/format';
import { cn } from '../lib/utils';

function hueFor(seed: string): number {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

/**
 * Initials avatar (never a photo of a real person in prototypes). The tint is derived from `seed`
 * so the same person keeps the same colour everywhere.
 */
function Avatar({
  name,
  seed,
  hue,
  size = 32,
  className,
  decorative = true,
}: {
  name: string;
  seed?: string;
  hue?: number;
  size?: number;
  className?: string;
  /** When false the avatar is announced with the person's name. */
  decorative?: boolean;
}) {
  const h = hue ?? hueFor(seed ?? name);
  return (
    <span
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative ? true : undefined}
      title={decorative ? undefined : name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, Math.round(size * 0.37)),
        background: `oklch(0.94 0.03 ${h.toString()})`,
        color: `oklch(0.38 0.06 ${h.toString()})`,
      }}
    >
      {initials(name)}
    </span>
  );
}

/** Overlapping avatars with an overflow count. Provide `label` describing the group. */
function AvatarGroup({
  people,
  max = 4,
  size = 30,
  label,
  ringClassName = 'ring-surface',
  className,
}: {
  people: readonly { name: string; seed?: string }[];
  max?: number;
  size?: number;
  label: string;
  ringClassName?: string;
  className?: string;
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span role="img" aria-label={label} className={cn('flex -space-x-1.5', className)}>
      {shown.map((p) => (
        <Avatar
          key={p.seed ?? p.name}
          name={p.name}
          seed={p.seed ?? p.name}
          size={size}
          className={cn('ring-2', ringClassName)}
        />
      ))}
      {extra > 0 ? (
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-canvas-2 text-[11px] font-bold text-ink-2 ring-2',
            ringClassName,
          )}
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      ) : null}
    </span>
  );
}

export { Avatar, AvatarGroup };

export type AvatarProps = React.ComponentProps<typeof Avatar>;
