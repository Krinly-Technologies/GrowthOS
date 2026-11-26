'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@krinly/ui/lib/utils';
import type { LabData, Lead, SourceId } from '@/lib/domain';
import { inr, plural } from '@/lib/format';
import { furthestStage } from '@/lib/selectors';
import { SOURCE_IDS, SOURCES } from '@/lib/sample/scenario';

// The Flow: where this period's enquiries came from and where they are now.
// Two-column Sankey. Outcome colours are an ordinal ramp (one hue, monotone lightness —
// validated) with Lost as a separate neutral. Legend + direct labels + table view; source
// nodes are focusable and trace their ribbons on hover or focus.

export type Outcome = 'talking' | 'ready' | 'booked' | 'paid' | 'lost';
export const OUTCOMES: { id: Outcome; label: string; color: string }[] = [
  { id: 'paid', label: 'Paid & verified', color: 'var(--step-4)' },
  { id: 'booked', label: 'Booked', color: 'var(--step-3)' },
  { id: 'ready', label: 'Ready to book', color: 'var(--step-2)' },
  { id: 'talking', label: 'Still talking', color: 'var(--step-1)' },
  { id: 'lost', label: 'Lost', color: 'var(--lost)' },
];

export function outcomeOf(lead: Lead, paid: Set<string>): Outcome {
  if (lead.stage === 'lost') return 'lost';
  if (paid.has(lead.id)) return 'paid';
  const f = furthestStage(lead);
  if (lead.stage === 'booked' || f === 'booked') return 'booked';
  if (lead.stage === 'ready') return 'ready';
  return 'talking';
}

interface Link {
  source: SourceId;
  outcome: Outcome;
  value: number;
}

export function useFlow(data: LabData, cohort: Lead[]) {
  return useMemo(() => {
    const paid = new Set(data.payments.filter((p) => p.status === 'verified').map((p) => p.leadId));
    const links: Link[] = [];
    const bySource = new Map<SourceId, number>();
    const byOutcome = new Map<Outcome, number>();
    for (const lead of cohort) {
      const outcome = outcomeOf(lead, paid);
      const existing = links.find((l) => l.source === lead.source && l.outcome === outcome);
      if (existing) existing.value += 1;
      else links.push({ source: lead.source, outcome, value: 1 });
      bySource.set(lead.source, (bySource.get(lead.source) ?? 0) + 1);
      byOutcome.set(outcome, (byOutcome.get(outcome) ?? 0) + 1);
    }
    const sources = SOURCE_IDS.filter((s) => (bySource.get(s) ?? 0) > 0).sort(
      (a, b) => (bySource.get(b) ?? 0) - (bySource.get(a) ?? 0),
    );
    const outcomes = OUTCOMES.filter((o) => (byOutcome.get(o.id) ?? 0) > 0);
    return { links, bySource, byOutcome, sources, outcomes, total: cohort.length };
  }, [data.payments, cohort]);
}

const H = 300;
const NODE_W = 10;
const GAP = 10;

export function FlowChart({
  data,
  cohort,
  phrase,
  cohortLabel,
}: {
  data: LabData;
  cohort: Lead[];
  phrase: string;
  /** e.g. "1 Nov – 25 Nov": makes the cohort explicit (people by first-enquiry date). */
  cohortLabel: string;
}) {
  const flow = useFlow(data, cohort);
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [focus, setFocus] = useState<SourceId | null>(null);
  const [table, setTable] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(320, Math.round(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [table]);

  const leftX = Math.min(170, width * 0.28);
  const rightX = width - Math.min(250, width * 0.33);
  const usable = (n: number) => H - GAP * Math.max(0, n - 1);
  const scale = flow.total
    ? Math.min(usable(flow.sources.length), usable(flow.outcomes.length)) / flow.total
    : 0;

  // Node positions
  const leftNodes = new Map<SourceId, { y: number; h: number }>();
  let y = 0;
  for (const s of flow.sources) {
    const h = (flow.bySource.get(s) ?? 0) * scale;
    leftNodes.set(s, { y, h });
    y += h + GAP;
  }
  const leftTotal = y - GAP;
  const rightNodes = new Map<Outcome, { y: number; h: number }>();
  y = 0;
  for (const o of flow.outcomes) {
    const h = (flow.byOutcome.get(o.id) ?? 0) * scale;
    rightNodes.set(o.id, { y, h });
    y += h + GAP;
  }
  const rightTotal = y - GAP;
  const offL = (H - leftTotal) / 2;
  const offR = (H - rightTotal) / 2;

  // Ribbons, stacked in node order on both ends
  const leftCursor = new Map<SourceId, number>();
  const rightCursor = new Map<Outcome, number>();
  const outcomeOrder = flow.outcomes.map((o) => o.id);
  const sortedLinks = [...flow.links].sort(
    (a, b) =>
      flow.sources.indexOf(a.source) - flow.sources.indexOf(b.source) ||
      outcomeOrder.indexOf(a.outcome) - outcomeOrder.indexOf(b.outcome),
  );
  // Pass 1: left ends, stacked within each source in outcome order.
  const leftEnds = sortedLinks.map((link) => {
    const h = link.value * scale;
    const y0 = offL + (leftNodes.get(link.source)?.y ?? 0) + (leftCursor.get(link.source) ?? 0);
    leftCursor.set(link.source, (leftCursor.get(link.source) ?? 0) + h);
    return { link, h, y0 };
  });
  // Pass 2: right ends, stacked within each outcome in source order.
  const ribbons = leftEnds.map((end) => {
    const y1 =
      offR + (rightNodes.get(end.link.outcome)?.y ?? 0) + (rightCursor.get(end.link.outcome) ?? 0);
    rightCursor.set(end.link.outcome, (rightCursor.get(end.link.outcome) ?? 0) + end.h);
    return { ...end, y1 };
  });
  const x0 = leftX + NODE_W;
  const x1 = rightX;
  const mid = (x0 + x1) / 2;

  const paidRevenue = useMemo(() => {
    const ids = new Set(cohort.map((l) => l.id));
    return data.payments
      .filter((p) => p.status === 'verified' && ids.has(p.leadId))
      .reduce((s, p) => s + p.amount, 0);
  }, [data.payments, cohort]);

  // Right-hand label positions, pushed apart to a minimum of 20px.
  const labelYs: number[] = [];
  flow.outcomes.forEach((o, i) => {
    const node = rightNodes.get(o.id);
    const ideal = offR + (node?.y ?? 0) + (node?.h ?? 0) / 2 + 4;
    const prev = labelYs[i - 1];
    labelYs.push(prev !== undefined ? Math.max(ideal, prev + 20) : ideal);
  });

  const color = (o: Outcome) => OUTCOMES.find((x) => x.id === o)?.color ?? 'var(--lost)';
  const focusLinks = focus ? flow.links.filter((l) => l.source === focus) : [];
  const advanced =
    (flow.byOutcome.get('ready') ?? 0) +
    (flow.byOutcome.get('booked') ?? 0) +
    (flow.byOutcome.get('paid') ?? 0);

  return (
    <figure className="m-0">
      <figcaption className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div>
          <h2 id={titleId} className="b-heading text-[22px] text-ink">
            The Flow
          </h2>
          <p className="mt-1 max-w-[52ch] text-[14px] text-ink-2">
            <span className="font-semibold text-ink">
              {plural(flow.total, 'person', 'people')} who first enquired {cohortLabel}
            </span>{' '}
            — where they came from and where they are today.{' '}
            {flow.total > 0 ? `${advanced.toString()} are ready to book or beyond.` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-ink-2">
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Legend">
            {OUTCOMES.map((o) => (
              <li key={o.id} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block size-2.5 rounded-[3px]"
                  style={{ background: o.color }}
                />
                {o.label}
              </li>
            ))}
          </ul>
          <button
            type="button"
            aria-pressed={table}
            onClick={() => {
              setTable((t) => !t);
            }}
            className="rounded-full bg-canvas px-3 py-1 font-semibold text-ink-2 hover:text-ink"
          >
            {table ? 'Show the Flow' : 'Show as table'}
          </button>
        </div>
      </figcaption>

      {flow.total === 0 ? (
        <p className="mt-6 text-sm text-ink-3">No enquiries {phrase} yet.</p>
      ) : table ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13.5px]">
            <caption className="sr-only">Enquiries by source and where they are now</caption>
            <thead>
              <tr className="border-b border-line text-left text-[12.5px] text-ink-3">
                <th scope="col" className="py-2 pr-3 font-semibold">
                  Source
                </th>
                {OUTCOMES.map((o) => (
                  <th key={o.id} scope="col" className="py-2 pr-3 text-right font-semibold">
                    {o.label}
                  </th>
                ))}
                <th scope="col" className="py-2 text-right font-semibold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {flow.sources.map((s) => (
                <tr key={s}>
                  <th scope="row" className="py-2 pr-3 text-left font-semibold">
                    {SOURCES[s].label}
                  </th>
                  {OUTCOMES.map((o) => (
                    <td key={o.id} className="tnum py-2 pr-3 text-right">
                      {flow.links.find((l) => l.source === s && l.outcome === o.id)?.value ?? 0}
                    </td>
                  ))}
                  <td className="tnum py-2 text-right font-semibold">
                    {flow.bySource.get(s) ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={wrap} className="relative mt-5 w-full min-w-0 overflow-hidden">
          <svg
            width={width}
            height={H + 8}
            role="group"
            aria-labelledby={titleId}
            className="block overflow-visible"
          >
            <title>
              {flow.sources
                .map((s) => `${SOURCES[s].label}: ${(flow.bySource.get(s) ?? 0).toString()}`)
                .join(', ')}
            </title>
            {ribbons.map((r) => {
              const { y1 } = r;
              const dimmed = focus !== null && r.link.source !== focus;
              const d = `M${x0},${r.y0} C${mid},${r.y0} ${mid},${y1} ${x1},${y1} L${x1},${y1 + r.h} C${mid},${y1 + r.h} ${mid},${r.y0 + r.h} ${x0},${r.y0 + r.h} Z`;
              return (
                <path
                  key={`${r.link.source}-${r.link.outcome}`}
                  d={d}
                  className="b-ribbon"
                  fill={color(r.link.outcome)}
                  opacity={dimmed ? 0.12 : r.link.outcome === 'lost' ? 0.55 : 0.5}
                  stroke="var(--surface)"
                  strokeWidth={1}
                />
              );
            })}
            {flow.sources.map((s) => {
              const node = leftNodes.get(s);
              if (!node) return null;
              const count = flow.bySource.get(s) ?? 0;
              const active = focus === s;
              return (
                <g
                  key={s}
                  tabIndex={0}
                  role="button"
                  aria-pressed={active}
                  aria-label={`${SOURCES[s].label}: ${plural(count, 'enquiry', 'enquiries')}. Highlight its flow.`}
                  onMouseEnter={() => {
                    setFocus(s);
                  }}
                  onMouseLeave={() => {
                    setFocus(null);
                  }}
                  onFocus={() => {
                    setFocus(s);
                  }}
                  onBlur={() => {
                    setFocus(null);
                  }}
                  className="cursor-pointer outline-none [&:focus-visible>rect:first-child]:stroke-[var(--focus)]"
                >
                  <rect
                    x={0}
                    y={offL + node.y - 4}
                    width={leftX + NODE_W + 4}
                    height={Math.max(node.h + 8, 24)}
                    fill="transparent"
                    stroke="transparent"
                    strokeWidth={2}
                    rx={8}
                  />
                  <rect
                    x={leftX}
                    y={offL + node.y}
                    width={NODE_W}
                    height={Math.max(node.h, 2)}
                    rx={3}
                    fill={active ? 'var(--ink)' : 'var(--ink-2)'}
                  />
                  <text
                    x={leftX - 10}
                    y={offL + node.y + node.h / 2 + 4}
                    textAnchor="end"
                    className={cn(
                      'text-[13px]',
                      active ? 'fill-[var(--ink)] font-bold' : 'fill-[var(--ink-2)] font-semibold',
                    )}
                  >
                    {SOURCES[s].label}
                    <tspan className="tnum fill-[var(--ink-3)] font-medium"> {count}</tspan>
                  </text>
                </g>
              );
            })}
            {flow.outcomes.map((o, oi) => {
              const node = rightNodes.get(o.id);
              if (!node) return null;
              const labelY = labelYs[oi] ?? offR + node.y + node.h / 2 + 4;
              const count = flow.byOutcome.get(o.id) ?? 0;
              const focusCount = focus
                ? (focusLinks.find((l) => l.outcome === o.id)?.value ?? 0)
                : null;
              return (
                <g key={o.id}>
                  <rect
                    x={rightX}
                    y={offR + node.y}
                    width={NODE_W}
                    height={Math.max(node.h, 2)}
                    rx={3}
                    fill={o.color}
                  />
                  <text
                    x={rightX + NODE_W + 10}
                    y={labelY}
                    className="fill-[var(--ink)] text-[13px] font-semibold"
                  >
                    {o.label}
                    <tspan className="tnum fill-[var(--ink-3)] font-medium">
                      {' '}
                      {focusCount !== null
                        ? `${focusCount.toString()} of ${count.toString()}`
                        : `${count.toString()} · ${Math.round((count / flow.total) * 100).toString()}%`}
                    </tspan>
                    {o.id === 'paid' && paidRevenue > 0 ? (
                      <tspan className="tnum fill-[var(--ink-3)] text-[12px] font-medium">
                        {' '}
                        · {inr(paidRevenue)}
                      </tspan>
                    ) : null}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
      <p className="mt-3 text-[12.5px] text-ink-3">
        Hover or tab to a source to trace it. This counts people by first-enquiry date and first
        source — unlike Money, which counts payments verified {phrase} from anyone. Stages are
        provisional.
      </p>
    </figure>
  );
}

/** Mobile alternative: a stacked bar per source (same ramp, same legend). */
export function FlowBars({ data, cohort }: { data: LabData; cohort: Lead[] }) {
  const flow = useFlow(data, cohort);
  const max = Math.max(1, ...flow.sources.map((s) => flow.bySource.get(s) ?? 0));
  return (
    <ul className="mt-5 grid gap-3.5" aria-label="Enquiries by source and where they are now">
      {flow.sources.map((s) => {
        const count = flow.bySource.get(s) ?? 0;
        return (
          <li key={s}>
            <div className="flex items-baseline justify-between text-[13.5px]">
              <span className="font-semibold">{SOURCES[s].label}</span>
              <span className="tnum text-ink-3">{count}</span>
            </div>
            <div
              className="mt-1.5 flex h-3 gap-[2px]"
              style={{ width: `${((count / max) * 100).toString()}%` }}
            >
              {OUTCOMES.map((o) => {
                const value =
                  flow.links.find((l) => l.source === s && l.outcome === o.id)?.value ?? 0;
                if (!value) return null;
                return (
                  <span
                    key={o.id}
                    title={`${o.label}: ${value.toString()}`}
                    className="h-full rounded-[3px]"
                    style={{ flex: value, background: o.color }}
                  />
                );
              })}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
