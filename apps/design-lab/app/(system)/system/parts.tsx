import { Card } from '@krinly/ui/components/card';
import type { ReactNode } from 'react';

export function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28">
      <h2 id={`${id}-title`} className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      {intro ? <p className="mt-1 max-w-[70ch] text-sm text-ink-3">{intro}</p> : null}
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5">{children}</div>
    </section>
  );
}

export function Specimen({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card padding="md" className={className}>
      <h3 className="text-xs font-bold tracking-wide text-ink-3 uppercase">{label}</h3>
      <div className="min-w-0">{children}</div>
    </Card>
  );
}
