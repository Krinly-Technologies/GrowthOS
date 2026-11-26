import { Wordmark } from '@/components/wordmark';
import { PublicForm } from '@/features/acquisition/public-form';
import { createForms } from '@/lib/preview/acquisition';
import { LAB_NOW } from '@/lib/preview/clock';

/**
 * The isolated customer-facing form preview. It is deliberately outside the preview shell and
 * reads the fixture forms directly — public submission stays isolated until there is a real
 * backend contract (an endpoint, spam protection and a workspace to attach the enquiry to).
 *
 * Forms created while using the preview live in memory in that tab, so they are previewed from
 * the editor rather than here.
 */
export default async function PublicFormPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const form = createForms(LAB_NOW).find((candidate) => candidate.slug === slug);

  return (
    <main className="flex min-h-svh flex-col items-center bg-canvas px-4 py-8">
      {form ? (
        <div className="w-full overflow-hidden rounded-2xl shadow-card">
          <PublicForm form={form} as="h1" />
        </div>
      ) : (
        <div className="w-full max-w-[420px] rounded-2xl bg-surface p-6 text-center shadow-card">
          <h1 className="font-display text-lg font-semibold text-ink">No form at this address</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            The development fixtures have no form with the address{' '}
            <code className="rounded bg-canvas px-1 py-0.5 text-[13px]">{slug}</code>. Forms you
            create in the preview are kept in memory only — preview those from the form editor.
          </p>
        </div>
      )}
      <p className="mt-6 flex items-center gap-2 text-[12px] text-ink-3">
        <Wordmark compact />
        Development preview · nothing submits
      </p>
    </main>
  );
}
