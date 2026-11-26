'use client';

import { Button } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import { useToast } from '@krinly/ui/components/toast';
import { usePreview } from '@/lib/preview/store';
import { BUSINESS } from '@/lib/preview/sample/scenario';
import { longDate } from '@/lib/preview/format';

/** Says what this is, on every preview page, above the content. */
export function PreviewBanner() {
  const { state, dispatch } = usePreview();
  const toast = useToast();
  return (
    <aside
      aria-label="Development preview"
      className="border-b border-attention/20 bg-attention-soft px-4 py-2.5 text-[12.5px] text-attention sm:flex sm:items-center sm:gap-3 md:px-6 lg:px-8"
    >
      {/* Two lines on a phone, one row from sm: `sm:contents` dissolves this wrapper so the
          label and the button become siblings of the explanation in the same flex row. */}
      <div className="flex items-center justify-between gap-3 sm:contents">
        <span className="flex items-center gap-1.5 font-bold">
          <Icon name="alert" size={15} />
          Development preview
        </span>
        <Button
          variant="outline"
          size="sm"
          shape="pill"
          className="shrink-0 sm:order-last"
          onClick={() => {
            dispatch({ type: 'reset' });
            toast({ title: 'Fixtures reset', tone: 'info' });
          }}
        >
          Reset fixtures
        </Button>
      </div>
      <p className="mt-1 text-ink-2 sm:mt-0 sm:min-w-0 sm:flex-1">
        Fictional data for {BUSINESS.name}, on a fixed clock ({longDate(state.now)}). No workspace,
        no API and no real money. Built against provisional models, not an approved contract.
      </p>
    </aside>
  );
}
