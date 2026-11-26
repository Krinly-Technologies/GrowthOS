'use client';

import { type ReactNode, useId, useState } from 'react';
import { cn } from '../lib/utils';
import { useElementWidth } from './use-element-width';

// The Flow: how a set of things moves from sources (left) to outcomes (right), as ribbons sized
// by count. Generic — callers decide what the sources, outcomes and colours mean. On narrow
// screens it becomes one stacked bar per source; a table view is always one click away.

interface FlowSource {
  id: string;
  label: string;
}
interface FlowTarget {
  id: string;
  label: string;
  /** Any CSS colour; use the ordinal ramp (var(--step-1..4)) and var(--lost). */
  color: string;
}
interface FlowLink {
  source: string;
  target: string;
  value: number;
}

const H = 300;
const NODE_W = 10;
const GAP = 10;

function FlowChart({
  title,
  description,
  sources,
  targets,
  links,
  targetExtra,
  sourceHeading = 'Source',
  note,
  emptyText = 'Nothing to show yet.',
  className,
}: {
  title: string;
  description?: ReactNode;
  sources: readonly FlowSource[];
  targets: readonly FlowTarget[];
  links: readonly FlowLink[];
  /** Optional extra text after a target's count (e.g. a formatted amount). */
  targetExtra?: (targetId: string) => string | undefined;
  sourceHeading?: string;
  note?: ReactNode;
  emptyText?: string;
  className?: string;
}) {
  const [wrap, width] = useElementWidth<HTMLDivElement>(760, 320);
  const [focus, setFocus] = useState<string | null>(null);
  const [table, setTable] = useState(false);
  const titleId = useId();

  const value = (s: string, t: string) =>
    links.find((l) => l.source === s && l.target === t)?.value ?? 0;
  const bySource = new Map(
    sources.map((s) => [
      s.id,
      links.filter((l) => l.source === s.id).reduce((a, l) => a + l.value, 0),
    ]),
  );
  const byTarget = new Map(
    targets.map((t) => [
      t.id,
      links.filter((l) => l.target === t.id).reduce((a, l) => a + l.value, 0),
    ]),
  );
  const total = [...bySource.values()].reduce((a, b) => a + b, 0);
  const shownSources = sources.filter((s) => (bySource.get(s.id) ?? 0) > 0);
  const shownTargets = targets.filter((t) => (byTarget.get(t.id) ?? 0) > 0);

  const leftX = Math.min(170, width * 0.28);
  const rightX = width - Math.min(250, width * 0.33);
  const usable = (count: number) => H - GAP * Math.max(0, count - 1);
  const scale = total
    ? Math.min(usable(shownSources.length), usable(shownTargets.length)) / total
    : 0;

  const stack = (nodes: readonly { id: string }[], sizes: Map<string, number>) => {
    const out = new Map<string, { y: number; h: number }>();
    let y = 0;
    for (const node of nodes) {
      const h = (sizes.get(node.id) ?? 0) * scale;
      out.set(node.id, { y, h });
      y += h + GAP;
    }
    return { nodes: out, offset: (H - (y - GAP)) / 2 };
  };
  const left = stack(shownSources, bySource);
  const right = stack(shownTargets, byTarget);

  const leftCursor = new Map<string, number>();
  const rightCursor = new Map<string, number>();
  const ribbons = shownSources.flatMap((s) =>
    shownTargets.flatMap((t) => {
      const v = value(s.id, t.id);
      if (!v) return [];
      const h = v * scale;
      const y0 = left.offset + (left.nodes.get(s.id)?.y ?? 0) + (leftCursor.get(s.id) ?? 0);
      leftCursor.set(s.id, (leftCursor.get(s.id) ?? 0) + h);
      return [{ s, t, h, y0 }];
    }),
  );
  // Right ends stack within each target in source order.
  const placed = ribbons.map((r) => {
    const y1 = right.offset + (right.nodes.get(r.t.id)?.y ?? 0) + (rightCursor.get(r.t.id) ?? 0);
    rightCursor.set(r.t.id, (rightCursor.get(r.t.id) ?? 0) + r.h);
    return { ...r, y1 };
  });
  const x0 = leftX + NODE_W;
  const x1 = rightX;
  const mid = (x0 + x1) / 2;

  const labelYs: number[] = [];
  shownTargets.forEach((t, i) => {
    const node = right.nodes.get(t.id);
    const ideal = right.offset + (node?.y ?? 0) + (node?.h ?? 0) / 2 + 4;
    const prev = labelYs[i - 1];
    labelYs.push(prev !== undefined ? Math.max(ideal, prev + 20) : ideal);
  });

  const max = Math.max(1, ...shownSources.map((s) => bySource.get(s.id) ?? 0));

  return (
    <figure className={cn('m-0', className)}>
      <figcaption className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div>
          <h2 id={titleId} className="font-display text-xl font-semibold text-ink">
            {title}
          </h2>
          {description ? (
            <div className="mt-1 max-w-[56ch] text-sm text-ink-2">{description}</div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-ink-2">
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Legend">
            {targets.map((t) => (
              <li key={t.id} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block size-2.5 rounded-[3px]"
                  style={{ background: t.color }}
                />
                {t.label}
              </li>
            ))}
          </ul>
          <button
            type="button"
            aria-pressed={table}
            onClick={() => {
              setTable((v) => !v);
            }}
            className="rounded-full bg-canvas px-3 py-1 font-semibold text-ink-2 hover:text-ink"
          >
            {table ? 'Show chart' : 'Show as table'}
          </button>
        </div>
      </figcaption>

      <div ref={wrap} className="mt-5 min-w-0">
        {total === 0 ? (
          <p className="text-sm text-ink-3">{emptyText}</p>
        ) : table ? (
          <div tabIndex={0} className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-[13.5px]">
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr className="border-b border-line text-left text-[12.5px] text-ink-3">
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    {sourceHeading}
                  </th>
                  {targets.map((t) => (
                    <th key={t.id} scope="col" className="py-2 pr-3 text-right font-semibold">
                      {t.label}
                    </th>
                  ))}
                  <th scope="col" className="py-2 text-right font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {shownSources.map((s) => (
                  <tr key={s.id}>
                    <th scope="row" className="py-2 pr-3 text-left font-semibold">
                      {s.label}
                    </th>
                    {targets.map((t) => (
                      <td key={t.id} className="tnum py-2 pr-3 text-right">
                        {value(s.id, t.id)}
                      </td>
                    ))}
                    <td className="tnum py-2 text-right font-semibold">
                      {bySource.get(s.id) ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <svg
              width={width}
              height={H + 8}
              role="group"
              aria-labelledby={titleId}
              className="hidden overflow-visible sm:block"
            >
              {placed.map((r) => {
                const dimmed = focus !== null && r.s.id !== focus;
                const d = `M${String(x0)},${String(r.y0)} C${String(mid)},${String(r.y0)} ${String(mid)},${String(r.y1)} ${String(x1)},${String(r.y1)} L${String(x1)},${String(r.y1 + r.h)} C${String(mid)},${String(r.y1 + r.h)} ${String(mid)},${String(r.y0 + r.h)} ${String(x0)},${String(r.y0 + r.h)} Z`;
                return (
                  <path
                    key={`${r.s.id}-${r.t.id}`}
                    d={d}
                    fill={r.t.color}
                    opacity={dimmed ? 0.12 : 0.5}
                    className="stroke-surface transition-opacity duration-[var(--duration-base)]"
                    strokeWidth={1}
                  />
                );
              })}
              {shownSources.map((s) => {
                const node = left.nodes.get(s.id);
                if (!node) return null;
                const count = bySource.get(s.id) ?? 0;
                const active = focus === s.id;
                return (
                  <g
                    key={s.id}
                    tabIndex={0}
                    role="button"
                    aria-pressed={active}
                    aria-label={`${s.label}: ${String(count)}. ${shownTargets
                      .map((t) => `${t.label} ${String(value(s.id, t.id))}`)
                      .join(', ')}.`}
                    onMouseEnter={() => {
                      setFocus(s.id);
                    }}
                    onMouseLeave={() => {
                      setFocus(null);
                    }}
                    onFocus={() => {
                      setFocus(s.id);
                    }}
                    onBlur={() => {
                      setFocus(null);
                    }}
                    className="cursor-pointer outline-none [&:focus-visible>rect:first-child]:stroke-[var(--focus)]"
                  >
                    <rect
                      x={0}
                      y={left.offset + node.y - 4}
                      width={leftX + NODE_W + 4}
                      height={Math.max(node.h + 8, 24)}
                      fill="transparent"
                      stroke="transparent"
                      strokeWidth={2}
                      rx={8}
                    />
                    <rect
                      x={leftX}
                      y={left.offset + node.y}
                      width={NODE_W}
                      height={Math.max(node.h, 2)}
                      rx={3}
                      className={active ? 'fill-ink' : 'fill-ink-2'}
                    />
                    <text
                      x={leftX - 10}
                      y={left.offset + node.y + node.h / 2 + 4}
                      textAnchor="end"
                      className={cn(
                        'text-[13px]',
                        active ? 'fill-ink font-bold' : 'fill-ink-2 font-semibold',
                      )}
                    >
                      {s.label}
                      <tspan className="tnum fill-ink-3 font-medium"> {count}</tspan>
                    </text>
                  </g>
                );
              })}
              {shownTargets.map((t, i) => {
                const node = right.nodes.get(t.id);
                if (!node) return null;
                const count = byTarget.get(t.id) ?? 0;
                const extra = targetExtra?.(t.id);
                return (
                  <g key={t.id}>
                    <rect
                      x={rightX}
                      y={right.offset + node.y}
                      width={NODE_W}
                      height={Math.max(node.h, 2)}
                      rx={3}
                      fill={t.color}
                    />
                    <text
                      x={rightX + NODE_W + 10}
                      y={labelYs[i] ?? 0}
                      className="fill-ink text-[13px] font-semibold"
                    >
                      {t.label}
                      <tspan className="tnum fill-ink-3 font-medium">
                        {' '}
                        {focus
                          ? `${String(value(focus, t.id))} of ${String(count)}`
                          : `${String(count)} · ${String(Math.round((count / total) * 100))}%`}
                      </tspan>
                      {extra && !focus ? (
                        <tspan className="tnum fill-ink-3 text-[12px] font-medium">
                          {' '}
                          · {extra}
                        </tspan>
                      ) : null}
                    </text>
                  </g>
                );
              })}
            </svg>
            <ul className="grid gap-3.5 sm:hidden" aria-label={title}>
              {shownSources.map((s) => {
                const count = bySource.get(s.id) ?? 0;
                return (
                  <li key={s.id}>
                    <div className="flex items-baseline justify-between text-[13.5px]">
                      <span className="font-semibold">{s.label}</span>
                      <span className="tnum text-ink-3">{count}</span>
                    </div>
                    <div
                      className="mt-1.5 flex h-3 gap-[2px]"
                      style={{ width: `${String((count / max) * 100)}%` }}
                    >
                      {targets.map((t) => {
                        const v = value(s.id, t.id);
                        if (!v) return null;
                        return (
                          <span
                            key={t.id}
                            className="h-full rounded-[3px]"
                            style={{ flex: v, background: t.color }}
                          />
                        );
                      })}
                    </div>
                    <p className="sr-only">
                      {targets.map((t) => `${t.label}: ${String(value(s.id, t.id))}`).join(', ')}
                    </p>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
      {note ? <p className="mt-3 text-[12.5px] text-ink-3">{note}</p> : null}
    </figure>
  );
}

export { FlowChart };
export type { FlowLink, FlowSource, FlowTarget };
