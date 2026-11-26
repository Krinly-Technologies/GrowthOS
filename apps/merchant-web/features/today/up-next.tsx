'use client';

import { AvatarGroup } from '@krinly/ui/components/avatar';
import { Button } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import { ActionList, CardStack, ToneIcon } from '@krinly/ui/patterns/card-stack';
import { cn } from '@krinly/ui/lib/utils';
import type { AttentionItem } from '@/lib/preview/today-model';

export function leadPeople(item: AttentionItem) {
  return item.leads.map((lead) => ({ name: lead.latinName ?? lead.name, seed: lead.id }));
}

function Meta({ item }: { item: AttentionItem }) {
  return (
    <>
      {item.meta}
      {item.emphasis ? (
        <span
          className={cn(
            'font-semibold',
            item.tone === 'critical' ? 'text-critical' : 'text-attention',
          )}
        >
          {' · '}
          {item.emphasis}
        </span>
      ) : null}
    </>
  );
}

/**
 * "Up next": the single most important thing, with the rest peeking behind it. Always paired
 * with the full queue below, because a stack hides everything but one card.
 */
export function UpNext({
  items,
  onAct,
}: {
  items: readonly AttentionItem[];
  onAct: (item: AttentionItem) => void;
}) {
  return (
    <CardStack
      items={items}
      getKey={(item) => item.key}
      heading="Up next"
      tone="on-brand"
      empty={
        <div className="rounded-[18px] bg-surface p-5 text-ink shadow-floating">
          <p className="font-display text-base font-semibold">You’re all caught up</p>
          <p className="mt-1 text-sm text-ink-3">
            New enquiries, follow-ups and payments to verify will land here.
          </p>
        </div>
      }
      renderCard={(item, { next }) => (
        <>
          <div className="flex items-start gap-3">
            <ToneIcon icon={item.icon} tone={item.tone} />
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-[18px] leading-snug font-semibold">{item.title}</h3>
              <p className="mt-1 line-clamp-2 text-[13.5px] text-ink-3">
                <Meta item={item} />
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            <AvatarGroup
              people={leadPeople(item)}
              label={`${item.leads.length} people in this task`}
              size={30}
            />
            <div className="flex items-center gap-2">
              {items.length > 1 ? (
                <Button variant="ghost" size="sm" shape="pill" onClick={next}>
                  Later
                </Button>
              ) : null}
              <Button
                size="sm"
                shape="pill"
                onClick={() => {
                  onAct(item);
                }}
              >
                {item.action.label}
                <span className="sr-only">: {item.title}</span>
              </Button>
            </div>
          </div>
        </>
      )}
    />
  );
}

/** The full, prioritised list behind Up next. */
export function ActionQueue({
  items,
  onAct,
}: {
  items: readonly AttentionItem[];
  onAct: (item: AttentionItem) => void;
}) {
  return (
    <ActionList
      label="Everything that needs you, in priority order"
      items={items.map((item, i) => ({
        key: item.key,
        icon: item.icon,
        tone: item.tone,
        title: (
          <span>
            <span className="tnum mr-2 font-bold text-ink-3">{i + 1}</span>
            {item.title}
          </span>
        ),
        meta: <Meta item={item} />,
        action: (
          <Button
            variant="outline"
            size="sm"
            shape="pill"
            onClick={() => {
              onAct(item);
            }}
          >
            {item.action.label}
            <span className="sr-only">: {item.title}</span>
          </Button>
        ),
      }))}
    />
  );
}

/** Collapsed/expanded toggle for the queue, on the navy hero. */
export function QueueToggle({
  open,
  count,
  onToggle,
}: {
  open: boolean;
  count: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls="today-action-queue"
      onClick={onToggle}
      className="mt-3 inline-flex items-center gap-1.5 rounded-md text-[13.5px] font-semibold text-on-brand-2 hover:text-accent"
    >
      <Icon name={open ? 'chevron-down' : 'chevron-right'} size={15} />
      {open ? 'Hide the full list' : `See all ${count} in priority order`}
    </button>
  );
}
