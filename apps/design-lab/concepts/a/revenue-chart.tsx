'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { istParts } from '@/lib/clock';
import { dayMonth, inr, inrCompact, time, weekdayDayMonth } from '@/lib/format';
import type { ResolvedRange } from '@/lib/ranges';
import type { SeriesPoint } from '@/lib/selectors';

// Cumulative verified revenue: this period (emphasised) against the whole previous period
// (grey). Dataviz rules: 2px lines, end dot with a 2px surface ring, solid hairline grid,
// legend + selective direct labels, crosshair tooltip on hover and keyboard, table twin.

const CURRENT = '#287d57';
const PREVIOUS = '#aab2aa';
const GRID = '#e7eae6';
const HEIGHT = 236;
const M = { top: 18, right: 92, bottom: 30, left: 56 };

function niceCeil(value: number): number {
  if (value <= 0) return 10000;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / exp;
  const step =
    n <= 1
      ? 1
      : n <= 1.5
        ? 1.5
        : n <= 2
          ? 2
          : n <= 2.5
            ? 2.5
            : n <= 3
              ? 3
              : n <= 4
                ? 4
                : n <= 5
                  ? 5
                  : n <= 6
                    ? 6
                    : n <= 8
                      ? 8
                      : 10;
  return step * exp;
}

function bucketLabel(t: number, range: ResolvedRange): string {
  return range.bucket === 'hour' ? time(t) : range.id === '7d' ? weekdayDayMonth(t) : dayMonth(t);
}

export function RevenueChartA({
  current,
  previous,
  compareAtSamePoint,
  range,
  currentLabel,
  previousLabel,
}: {
  current: SeriesPoint[];
  previous: SeriesPoint[];
  /** The value the headline compares with (previous period up to the same moment). */
  compareAtSamePoint: number;
  range: ResolvedRange;
  currentLabel: string;
  previousLabel: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(280, Math.round(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);

  const n = Math.max(current.length, previous.length, 2);
  const plotW = width - M.left - M.right;
  const plotH = HEIGHT - M.top - M.bottom;
  const curTotal = current.at(-1)?.total ?? 0;
  const prevTotal = previous.at(-1)?.total ?? 0;
  // Use the headline's comparison value, not the previous series' bucket total: the last bucket
  // is a whole day, while the headline compares up to the same time of day.
  const prevAtSame = compareAtSamePoint;
  const yMax = niceCeil(Math.max(curTotal, prevTotal, 1) * 1.06);
  const x = (i: number) => M.left + (i / (n - 1)) * plotW;
  const y = (v: number) => M.top + plotH - (v / yMax) * plotH;
  const path = (points: SeriesPoint[]) =>
    points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.total).toFixed(1)}`)
      .join(' ');
  const area = current.length
    ? `${path(current)} L${x(current.length - 1).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`
    : '';

  const lastIdx = current.length - 1;
  const endX = x(Math.max(0, lastIdx));
  const endY = y(curTotal);
  const prevEndY = y(prevTotal);
  const sameX = lastIdx === previous.length - 1;
  const showPrevLabel = !sameX || Math.abs(prevEndY - endY) > 30;

  // x ticks
  const ticks: number[] = [];
  if (range.bucket === 'hour') [0, 6, 12, 18, 23].forEach((h) => ticks.push(h));
  else if (n <= 8) for (let i = 0; i < n; i++) ticks.push(i);
  else for (let i = 0; i < n; i += 7) ticks.push(i);
  const tickLabel = (i: number) => {
    const p = current[i] ?? previous[i];
    if (!p) return '';
    if (range.bucket === 'hour') return time(p.t);
    if (n <= 8) return weekdayDayMonth(p.t).split(',')[0] ?? '';
    return istParts(p.t).day.toString();
  };

  const active = hover ?? null;
  const cur = active !== null ? current[active] : undefined;
  const prev = active !== null ? previous[active] : undefined;

  function indexFromPointer(clientX: number) {
    const rect = wrap.current?.getBoundingClientRect();
    if (!rect) return null;
    const rel = (clientX - rect.left - M.left) / plotW;
    return Math.max(0, Math.min(n - 1, Math.round(rel * (n - 1))));
  }

  const summary = `Cumulative verified revenue. ${currentLabel}: ${inr(curTotal)}${
    current.at(-1) ? ` by ${bucketLabel(current.at(-1)?.t ?? 0, range)}` : ''
  }. ${previousLabel}: ${inr(prevAtSame)} at the same point, ${inr(prevTotal)} in total.`;

  return (
    <figure className="m-0">
      <figcaption className="flex flex-wrap items-center justify-between gap-3">
        <span id={titleId} className="text-[13px] text-ink-3">
          Verified revenue, adding up day by day
        </span>
        <span className="flex items-center gap-4 text-[12.5px] text-ink-2">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-0.5 w-4 rounded"
              style={{ background: CURRENT }}
            />
            {currentLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-0.5 w-4 rounded"
              style={{ background: PREVIOUS }}
            />
            {previousLabel}
          </span>
          <button
            type="button"
            aria-pressed={table}
            onClick={() => {
              setTable((t) => !t);
            }}
            className="rounded-md px-1.5 py-0.5 text-ink-3 underline-offset-4 hover:text-ink hover:underline"
          >
            {table ? 'Show chart' : 'Show as table'}
          </button>
        </span>
      </figcaption>

      {table ? (
        <div className="mt-3 max-h-[236px] overflow-y-auto rounded-lg border border-line">
          <table className="w-full text-[13px]">
            <caption className="sr-only">{summary}</caption>
            <thead className="sticky top-0 bg-surface text-left text-ink-3">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  {range.bucket === 'hour' ? 'Hour' : 'Day'}
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  {currentLabel}
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  {previousLabel}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {Array.from({ length: n }, (_, i) => (
                <tr key={i}>
                  <td className="px-3 py-1.5">{tickLabelFull(current[i] ?? previous[i], range)}</td>
                  <td className="tnum px-3 py-1.5 text-right">
                    {current[i] ? inr(current[i].total) : '–'}
                  </td>
                  <td className="tnum px-3 py-1.5 text-right text-ink-3">
                    {previous[i] ? inr(previous[i].total) : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          ref={wrap}
          className="relative mt-2 rounded-lg outline-offset-4"
          tabIndex={0}
          role="group"
          aria-labelledby={titleId}
          aria-describedby={`${titleId}-summary`}
          onPointerMove={(e) => {
            setHover(indexFromPointer(e.clientX));
          }}
          onPointerLeave={() => {
            setHover(null);
          }}
          onFocus={() => {
            setHover(Math.max(0, lastIdx));
          }}
          onBlur={() => {
            setHover(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              e.preventDefault();
              const step = e.key === 'ArrowRight' ? 1 : -1;
              setHover((h) => Math.max(0, Math.min(n - 1, (h ?? lastIdx) + step)));
            } else if (e.key === 'Escape') setHover(null);
          }}
        >
          <p id={`${titleId}-summary`} className="sr-only">
            {summary} Use the left and right arrow keys to read each day.
          </p>
          <svg width={width} height={HEIGHT} aria-hidden="true" className="block overflow-visible">
            {[0, 0.5, 1].map((f) => (
              <g key={f}>
                <line
                  x1={M.left}
                  x2={width - M.right}
                  y1={y(yMax * f)}
                  y2={y(yMax * f)}
                  stroke={GRID}
                  strokeWidth={1}
                />
                <text
                  x={M.left - 10}
                  y={y(yMax * f) + 4}
                  textAnchor="end"
                  className="tnum fill-[var(--ink-3)] text-[11.5px]"
                >
                  {f === 0 ? '₹0' : inrCompact(yMax * f)}
                </text>
              </g>
            ))}
            {ticks.map((i) => (
              <text
                key={i}
                x={x(i)}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="tnum fill-[var(--ink-3)] text-[11.5px]"
              >
                {tickLabel(i)}
              </text>
            ))}
            <path d={area} fill={CURRENT} opacity={0.1} />
            <path
              d={path(previous)}
              fill="none"
              stroke={PREVIOUS}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={path(current)}
              fill="none"
              stroke={CURRENT}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Same point last period */}
            {current.length > 0 && current.length <= previous.length ? (
              <circle
                cx={endX}
                cy={y(prevAtSame)}
                r={4}
                fill={PREVIOUS}
                stroke="#fff"
                strokeWidth={2}
              />
            ) : null}
            {current.length > 0 ? (
              <circle cx={endX} cy={endY} r={4.5} fill={CURRENT} stroke="#fff" strokeWidth={2} />
            ) : null}
            {/* Direct labels: endpoints only */}
            {current.length > 0 ? (
              <g>
                <text
                  x={endX - 10}
                  y={endY - 12}
                  textAnchor="end"
                  className="tnum fill-[var(--ink)] text-[13px] font-semibold"
                >
                  {inrCompact(curTotal)}
                  <tspan className="fill-[var(--ink-3)] text-[11.5px] font-normal">
                    {' '}
                    {currentLabel.toLowerCase()}
                  </tspan>
                </text>
              </g>
            ) : null}
            {showPrevLabel && previous.length > 0 ? (
              <g>
                <text
                  x={x(previous.length - 1) + 10}
                  y={prevEndY - 4}
                  className="tnum fill-[var(--ink-2)] text-[12.5px] font-medium"
                >
                  {inrCompact(prevTotal)}
                </text>
                <text
                  x={x(previous.length - 1) + 10}
                  y={prevEndY + 11}
                  className="fill-[var(--ink-3)] text-[11.5px]"
                >
                  all of {previousLabel.split(' ')[0]?.toLowerCase()}
                </text>
              </g>
            ) : null}
            {active !== null ? (
              <g>
                <line
                  x1={x(active)}
                  x2={x(active)}
                  y1={M.top}
                  y2={M.top + plotH}
                  stroke="var(--ink-3)"
                  strokeWidth={1}
                />
                {prev ? (
                  <circle
                    cx={x(active)}
                    cy={y(prev.total)}
                    r={4}
                    fill={PREVIOUS}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ) : null}
                {cur ? (
                  <circle
                    cx={x(active)}
                    cy={y(cur.total)}
                    r={4.5}
                    fill={CURRENT}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ) : null}
              </g>
            ) : null}
          </svg>
          {active !== null && (cur ?? prev) ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1 z-10 min-w-[170px] rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] shadow-[0_8px_24px_-12px_rgb(17_28_45/0.35)]"
              style={{ left: Math.min(Math.max(x(active) + 12, 0), width - 186) }}
            >
              {cur ? (
                <p className="flex items-center gap-2">
                  <span
                    className="inline-block h-0.5 w-3 rounded"
                    style={{ background: CURRENT }}
                  />
                  <span className="tnum font-semibold text-ink">{inr(cur.total)}</span>
                  <span className="text-ink-3">by {bucketLabel(cur.t, range)}</span>
                </p>
              ) : null}
              {prev ? (
                <p className="mt-1 flex items-center gap-2">
                  <span
                    className="inline-block h-0.5 w-3 rounded"
                    style={{ background: PREVIOUS }}
                  />
                  <span className="tnum font-medium text-ink-2">{inr(prev.total)}</span>
                  <span className="text-ink-3">by {bucketLabel(prev.t, range)}</span>
                </p>
              ) : null}
            </div>
          ) : null}
          <div aria-live="polite" className="sr-only">
            {active !== null && cur ? `${bucketLabel(cur.t, range)}: ${inr(cur.total)}` : ''}
            {active !== null && prev ? `. ${bucketLabel(prev.t, range)}: ${inr(prev.total)}` : ''}
          </div>
        </div>
      )}
    </figure>
  );
}

function tickLabelFull(point: SeriesPoint | undefined, range: ResolvedRange): string {
  if (!point) return '';
  return range.bucket === 'hour' ? time(point.t) : weekdayDayMonth(point.t);
}
