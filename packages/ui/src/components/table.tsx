import type * as React from 'react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Icon } from './icon';

// Semantic table primitives. Use a real <table> for comparable rows on desktop and switch to a
// structured list (ListRow) below `lg`. Numeric columns: `numeric` right-aligns with tabular figures.

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    // tabIndex makes the scroll container reachable from the keyboard, so a table wider than its
    // column can be scrolled without a pointer (axe: scrollable-region-focusable).
    <div tabIndex={0} className="w-full overflow-x-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead className={cn('[&_tr]:border-b [&_tr]:border-line', className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      className={cn(
        '[&_tr]:border-b [&_tr]:border-line-soft [&_tr:last-child]:border-0',
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return <tr className={cn('transition-colors hover:bg-canvas/60', className)} {...props} />;
}

function TableHead({
  className,
  numeric,
  ...props
}: React.ComponentProps<'th'> & { numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        'h-10 px-3 text-left text-xs font-bold text-ink-3',
        numeric && 'text-right',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  numeric,
  ...props
}: React.ComponentProps<'td'> & { numeric?: boolean }) {
  return (
    <td
      className={cn('px-3 py-2.5 align-middle text-ink', numeric && 'tnum text-right', className)}
      {...props}
    />
  );
}

/** Row for lists and mobile tables: leading visual, two lines of text, trailing value/action. */
function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  className,
  ...props
}: Omit<React.ComponentProps<'div'>, 'title'> & {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3 px-4 py-2.5', className)} {...props}>
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink">{title}</div>
        {subtitle ? <div className="truncate text-[13px] text-ink-3">{subtitle}</div> : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

/** Previous/next pagination with a "Showing x–y of z" summary. */
function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-between gap-3 text-[13px] text-ink-3', className)}
    >
      <p className="tnum min-w-0" aria-live="polite">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          shape="pill"
          disabled={page <= 1}
          onClick={() => {
            onPageChange(page - 1);
          }}
        >
          <Icon name="chevron-left" />
          Previous
        </Button>
        <span className="tnum hidden px-1 whitespace-nowrap text-ink-2 sm:inline">
          {page} / {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          shape="pill"
          disabled={page >= pages}
          onClick={() => {
            onPageChange(page + 1);
          }}
        >
          Next
          <Icon name="chevron-right" />
        </Button>
      </div>
    </nav>
  );
}

export { ListRow, Pagination, Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
