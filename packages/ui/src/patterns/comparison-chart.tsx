'use client';

import { useId, useState } from 'react';
import { cn } from '../lib/utils';
import { useElementWidth } from './use-element-width';

// Two cumulative series — this period (emphasised) against the previous period (muted).
// Dataviz rules: 2px lines, end dots with a 2px surface ring, solid hairline grid, legend plus
// selective direct labels, crosshair on hover and keyboard, and a table twin.
//
// `comparison` is the value the screen's headline compares against (e.g. last month up to the
// same time of day). The chart draws exactly that value at the current end point, so the chart
// and the headline can never disagree.

interface ChartPoint {
  /** Full label for tooltips and the table, e.g. "Wed 25 Nov". */
  label: string;
  value: number;
}

// Margins and tick density are width-dependent: the wide form leaves room on the right for the
// previous period's end label, the narrow form gives the plot the space instead and labels fewer
// points, so the x axis never collides with itself on a phone.
const WIDE = { top: 22, right: 96, bottom: 30, left: 56 };
const NARROW = { top: 22, right: 18, bottom: 30, left: 44 };
const NARROW_BELOW = 440;

function niceCeil(value: number): number {
  if (value <= 0) return 10;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / exp;
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => n <= s) ?? 10;
  return step * exp;
}

function ComparisonChart({
  title,
  current,
  previous,
  currentLabel,
  previousLabel,
  comparison,
  formatValue,
  formatAxis = formatValue,
  tickIndices,
  tickLabel,
  xHeading = 'Day',
  height = 236,
  className,
}: {
  title: string;
  current: readonly ChartPoint[];
  previous: readonly ChartPoint[];
  currentLabel: string;
  previousLabel: string;
  comparison?: { value: number; label: string };
  formatValue: (value: number) => string;
  formatAxis?: (value: number) => string;
  /** Indices on the x axis to label; defaults to about six evenly spaced. */
  tickIndices?: readonly number[];
  tickLabel?: (index: number) => string;
  xHeading?: string;
  height?: number;
  className?: string;
}) {
  const [wrap, width] = useElementWidth<HTMLDivElement>(640, 280);
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const id = useId();

  const narrow = width < NARROW_BELOW;
  const M = narrow ? NARROW : WIDE;
  const n = Math.max(current.length, previous.length, 2);
  const plotW = Math.max(40, width - M.left - M.right);
  const plotH = height - M.top - M.bottom;
  const curTotal = current.at(-1)?.value ?? 0;
  const prevTotal = previous.at(-1)?.value ?? 0;
  const yMax = niceCeil(Math.max(curTotal, prevTotal, comparison?.value ?? 0, 1) * 1.06);
  const x = (i: number) => M.left + (i / (n - 1)) * plotW;
  const y = (v: number) => M.top + plotH - (v / yMax) * plotH;
  const path = (points: readonly ChartPoint[]) =>
    points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`)
      .join(' ');
  const lastIdx = current.length - 1;
  const endX = x(Math.max(0, lastIdx));
  const endY = y(curTotal);
  const area = current.length
    ? `${path(current)} L${endX.toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`
    : '';
  const prevEndX = x(previous.length - 1);
  const prevEndY = y(prevTotal);
  const cmpY = comparison ? y(comparison.value) : null;
  // Direct labels: keep the current label clear of the comparison marker.
  const currentLabelBelow = cmpY !== null && cmpY < endY;
  // The previous period's end label lives in the right margin, which the narrow layout gives
  // back to the plot — so it is a wide-layout flourish only.
  const showPrevLabel =
    !narrow && previous.length > 0 && (prevEndX - endX > 40 || Math.abs(prevEndY - endY) > 30);

  const tickCount = Math.min(n, narrow ? 3 : 6);
  const ticks =
    tickIndices ??
    Array.from({ length: tickCount }, (_, k) =>
      Math.round((k / Math.max(1, tickCount - 1)) * (n - 1)),
    );
  const labelFor = (i: number) => tickLabel?.(i) ?? current[i]?.label ?? previous[i]?.label ?? '';

  const active = hover;
  const cur = active !== null ? current[active] : undefined;
  const prev = active !== null ? previous[active] : undefined;

  const summary = [
    `${title}.`,
    `${currentLabel}: ${formatValue(curTotal)}.`,
    comparison ? `${comparison.label}: ${formatValue(comparison.value)}.` : '',
    `${previousLabel}: ${formatValue(prevTotal)} in total.`,
  ]
    .filter(Boolean)
    .join(' ');

  const indexFromPointer = (clientX: number) => {
    const rect = wrap.current?.getBoundingClientRect();
    if (!rect) return null;
    const rel = (clientX - rect.left - M.left) / plotW;
    return Math.max(0, Math.min(n - 1, Math.round(rel * (n - 1))));
  };

  return (
    <figure className={cn('m-0', className)}>
      <figcaption className="flex flex-wrap items-center justify-between gap-3">
        <span id={id} className="text-[13px] text-ink-3">
          {title}
        </span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink-2">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-0.5 w-4 rounded bg-chart-current" />
            {currentLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-0.5 w-4 rounded bg-chart-previous" />
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

      <div ref={wrap} className="mt-2 min-w-0">
        {table ? (
          <div
            tabIndex={0}
            className="overflow-y-auto rounded-lg border border-line"
            style={{ maxHeight: height }}
          >
            <table className="w-full text-[13px]">
              <caption className="sr-only">{summary}</caption>
              <thead className="sticky top-0 bg-surface text-left text-ink-3">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    {xHeading}
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">
                    {currentLabel}
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">
                    {previousLabel}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {Array.from({ length: n }, (_, i) => (
                  <tr key={i}>
                    <th scope="row" className="px-3 py-1.5 text-left font-normal">
                      {current[i]?.label ?? previous[i]?.label}
                    </th>
                    <td className="tnum px-3 py-1.5 text-right">
                      {current[i] ? formatValue(current[i].value) : '–'}
                    </td>
                    <td className="tnum px-3 py-1.5 text-right text-ink-3">
                      {previous[i] ? formatValue(previous[i].value) : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {comparison ? (
              <p className="border-t border-line px-3 py-2 text-[12.5px] text-ink-3">
                {comparison.label}:{' '}
                <span className="tnum font-semibold text-ink-2">
                  {formatValue(comparison.value)}
                </span>
              </p>
            ) : null}
          </div>
        ) : (
          <div
            className="relative rounded-lg outline-offset-4"
            tabIndex={0}
            role="group"
            aria-labelledby={id}
            aria-describedby={`${id}-summary`}
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
            <p id={`${id}-summary`} className="sr-only">
              {summary} Use the left and right arrow keys to read each point.
            </p>
            <svg
              width={width}
              height={height}
              aria-hidden="true"
              className="block overflow-visible"
            >
              {[0, 0.5, 1].map((f) => (
                <g key={f}>
                  <line
                    x1={M.left}
                    x2={M.left + plotW}
                    y1={y(yMax * f)}
                    y2={y(yMax * f)}
                    className="stroke-chart-grid"
                    strokeWidth={1}
                  />
                  <text
                    x={M.left - 10}
                    y={y(yMax * f) + 4}
                    textAnchor="end"
                    className="tnum fill-ink-3 text-[11.5px]"
                  >
                    {formatAxis(yMax * f)}
                  </text>
                </g>
              ))}
              {ticks.map((i) => (
                <text
                  key={i}
                  x={x(i)}
                  y={height - 8}
                  textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
                  className="tnum fill-ink-3 text-[11.5px]"
                >
                  {labelFor(i)}
                </text>
              ))}
              <path d={area} className="fill-chart-current" opacity={0.1} />
              <path
                d={path(previous)}
                fill="none"
                className="stroke-chart-previous"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <path
                d={path(current)}
                fill="none"
                className="stroke-chart-current"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {cmpY !== null && current.length > 0 ? (
                <g>
                  <line
                    x1={endX}
                    x2={endX}
                    y1={Math.min(cmpY, endY)}
                    y2={Math.max(cmpY, endY)}
                    className="stroke-ink-3"
                    strokeWidth={1}
                    strokeDasharray="2 3"
                  />
                  <circle
                    cx={endX}
                    cy={cmpY}
                    r={4}
                    className="fill-chart-previous stroke-surface"
                    strokeWidth={2}
                  />
                  <text
                    x={endX - 10}
                    y={currentLabelBelow ? cmpY - 12 : cmpY + 22}
                    textAnchor="end"
                    className="tnum fill-ink-2 stroke-surface text-[12px] font-semibold [paint-order:stroke]"
                    strokeWidth={4}
                    strokeLinejoin="round"
                  >
                    {formatAxis(comparison?.value ?? 0)}
                    <tspan className="fill-ink-3 font-normal"> {comparison?.label}</tspan>
                  </text>
                </g>
              ) : null}
              {current.length > 0 ? (
                <>
                  <circle
                    cx={endX}
                    cy={endY}
                    r={4.5}
                    className="fill-chart-current stroke-surface"
                    strokeWidth={2}
                  />
                  <text
                    x={endX - 10}
                    y={currentLabelBelow ? endY + 20 : endY - 12}
                    textAnchor="end"
                    className="tnum fill-ink stroke-surface text-[13px] font-semibold [paint-order:stroke]"
                    strokeWidth={4}
                    strokeLinejoin="round"
                  >
                    {formatAxis(curTotal)}
                    <tspan className="fill-ink-3 text-[11.5px] font-normal"> {currentLabel}</tspan>
                  </text>
                </>
              ) : null}
              {showPrevLabel ? (
                <g>
                  <text
                    x={prevEndX + 10}
                    y={prevEndY - 4}
                    className="tnum fill-ink-2 text-[12.5px] font-semibold"
                  >
                    {formatAxis(prevTotal)}
                  </text>
                  <text x={prevEndX + 10} y={prevEndY + 11} className="fill-ink-3 text-[11.5px]">
                    all of {previousLabel}
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
                    className="stroke-ink-3"
                    strokeWidth={1}
                  />
                  {prev ? (
                    <circle
                      cx={x(active)}
                      cy={y(prev.value)}
                      r={4}
                      className="fill-chart-previous stroke-surface"
                      strokeWidth={2}
                    />
                  ) : null}
                  {cur ? (
                    <circle
                      cx={x(active)}
                      cy={y(cur.value)}
                      r={4.5}
                      className="fill-chart-current stroke-surface"
                      strokeWidth={2}
                    />
                  ) : null}
                </g>
              ) : null}
            </svg>
            {active !== null && (cur ?? prev) ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1 z-10 min-w-[170px] rounded-lg bg-surface px-3 py-2 text-[12.5px] shadow-floating ring-1 ring-line"
                style={{ left: Math.min(Math.max(x(active) + 12, 0), width - 186) }}
              >
                {cur ? (
                  <p className="flex items-center gap-2">
                    <span className="inline-block h-0.5 w-3 rounded bg-chart-current" />
                    <span className="tnum font-semibold text-ink">{formatValue(cur.value)}</span>
                    <span className="text-ink-3">{cur.label}</span>
                  </p>
                ) : null}
                {prev ? (
                  <p className="mt-1 flex items-center gap-2">
                    <span className="inline-block h-0.5 w-3 rounded bg-chart-previous" />
                    <span className="tnum font-medium text-ink-2">{formatValue(prev.value)}</span>
                    <span className="text-ink-3">{prev.label}</span>
                  </p>
                ) : null}
              </div>
            ) : null}
            <div aria-live="polite" className="sr-only">
              {cur ? `${cur.label}: ${formatValue(cur.value)}` : ''}
              {prev ? `. ${prev.label}: ${formatValue(prev.value)}` : ''}
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}

export { ComparisonChart };
export type { ChartPoint };
