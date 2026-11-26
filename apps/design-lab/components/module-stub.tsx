import Link from 'next/link';
import { notFound } from 'next/navigation';
import { moduleFromSlug, STATUS_LABEL } from '@/lib/modules';
import type { Concept } from '@/lib/store';

/** In-shell page for modules outside this prototype: what it is, its status, where to go now. */
export function ModuleStub({ slug, concept }: { slug: string; concept: Concept }) {
  const info = moduleFromSlug(slug);
  if (!info || info.slug === 'today' || info.slug === 'leads') notFound();
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 md:px-8 lg:py-14">
      <p className="text-[13px] text-ink-3">Not part of this prototype</p>
      <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-ink">{info.label}</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{info.purpose}</p>
      <dl className="mt-8 grid gap-4 border-y border-line py-5 text-[14px] sm:grid-cols-[160px_1fr]">
        <dt className="text-ink-3">Status</dt>
        <dd className="font-medium text-ink">{STATUS_LABEL[info.status]}</dd>
        <dt className="text-ink-3">Basis</dt>
        <dd className="text-ink-2">{info.basis}</dd>
        {info.inPrototype ? (
          <>
            <dt className="text-ink-3">In this prototype</dt>
            <dd className="text-ink-2">{info.inPrototype}</dd>
          </>
        ) : null}
      </dl>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href={`/${concept}/today`}
          className="inline-flex h-10 items-center rounded-lg bg-ink px-4 text-sm font-medium text-white hover:bg-ink-2"
        >
          Go to Today
        </Link>
        <Link
          href={`/${concept}/leads`}
          className="inline-flex h-10 items-center rounded-lg border border-line px-4 text-sm font-medium text-ink hover:border-ink"
        >
          Go to Leads
        </Link>
      </div>
    </div>
  );
}
