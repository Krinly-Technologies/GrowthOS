'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@krinly/ui/lib/utils';
import { type Concept, useLab } from '@/lib/store';
import { Icon } from './icons';
import { useToast } from './toast';

/** Prototype tape shown on every concept screen: honest labelling, concept switch, reset. */
export function LabBar({ concept }: { concept: Concept }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const { dispatch } = useLab();
  const notify = useToast();
  const qs = search.toString();
  const hrefFor = (target: Concept) =>
    `${pathname.replace(/^\/(a|b|g)/, `/${target}`)}${qs ? `?${qs}` : ''}`;
  const LABEL: Record<Concept, [string, string]> = {
    a: ['A', 'A · Quiet Intelligence'],
    b: ['B', 'B · Growth Studio'],
    g: ['B+', 'B+ · Refined'],
  };

  return (
    <aside
      aria-label="Prototype notice"
      className="lab-bar relative z-40 flex h-8 shrink-0 items-center gap-3 border-b border-[#ecdcae] bg-[#fff6dc] px-3 text-[12px] text-[#5a4300]"
    >
      <Link href="/" className="flex items-center gap-1.5 font-semibold hover:underline">
        <Icon name="lab" size={14} />
        <span className="hidden sm:inline">Krinly design lab</span>
        <span className="sm:hidden">Prototype</span>
      </Link>
      <span className="hidden truncate md:inline">
        Fictional sample data · nothing is saved or sent
      </span>
      <nav
        aria-label="Concept"
        className="ml-auto flex items-center rounded-md border border-[#e4cf96] bg-[#fffaf0] p-0.5"
      >
        {(['a', 'b', 'g'] as const).map((c) => (
          <Link
            key={c}
            href={hrefFor(c)}
            aria-current={c === concept ? 'page' : undefined}
            className={cn(
              'rounded px-2 py-0.5 font-medium',
              c === concept ? 'bg-[#5a4300] text-[#fff6dc]' : 'hover:bg-[#f5e7bd]',
            )}
          >
            <span className="sm:hidden">{LABEL[c][0]}</span>
            <span className="hidden sm:inline">{LABEL[c][1]}</span>
          </Link>
        ))}
      </nav>
      <Link href="/type" className="hidden font-medium hover:underline lg:inline">
        Type &amp; colour
      </Link>
      <button
        type="button"
        onClick={() => {
          dispatch({ type: 'reset' });
          notify({
            title: 'Sample data reset',
            description: 'Everything is back to 10:30 am on 25 Nov.',
          });
        }}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 font-medium hover:bg-[#f5e7bd]"
      >
        <Icon name="undo" size={13} />
        <span className="hidden sm:inline">Reset</span>
        <span className="sr-only sm:hidden">Reset sample data</span>
      </button>
    </aside>
  );
}
