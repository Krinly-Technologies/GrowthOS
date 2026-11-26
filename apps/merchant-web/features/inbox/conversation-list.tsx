'use client';

import { Avatar } from '@krinly/ui/components/avatar';
import { Icon } from '@krinly/ui/components/icon';
import { SearchField } from '@krinly/ui/components/input';
import { ListRow } from '@krinly/ui/components/table';
import { EmptyState } from '@krinly/ui/components/feedback';
import { cn } from '@krinly/ui/lib/utils';
import type { Conversation } from '@/lib/preview/inbox';
import { ago } from '@/lib/preview/format';
import type { InboxModel } from '@/lib/preview/inbox-model';
import { CHANNEL_LABEL, TEAM } from '@/lib/preview/sample/scenario';
import { CHANNEL_ICON } from '@/features/crm/lead-bits';
import { INBOX_TABS, INBOX_TAB_LABEL } from './inbox-bits';

/** Conversation panel: search, status filters and the list itself. */
export function ConversationList({ model, className }: { model: InboxModel; className?: string }) {
  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="shrink-0 border-b border-line p-3">
        <SearchField
          label="Search conversations"
          placeholder="Search by name, phone or area"
          value={model.query.q}
          onChange={(e) => {
            model.setQuery({ q: e.target.value });
          }}
        />
        <nav
          aria-label="Inbox filters"
          className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
        >
          {INBOX_TABS.map((tab) => {
            const active = model.query.tab === tab;
            return (
              <button
                key={tab}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  model.setQuery({ tab });
                }}
                className={cn(
                  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold whitespace-nowrap',
                  active ? 'bg-ink text-white' : 'bg-canvas text-ink-2 hover:text-ink',
                )}
              >
                {INBOX_TAB_LABEL[tab]}
                <span
                  className={cn(
                    'tnum rounded-full px-1.5 text-[11px]',
                    active ? 'bg-white/15 text-mint' : 'bg-surface text-ink-3',
                  )}
                >
                  {model.counts[tab]}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {model.filtered.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="No conversations here"
            description="Try a different filter or search."
            className="m-3 border-0"
          />
        ) : (
          <ul aria-label="Conversations" className="divide-y divide-line-soft">
            {model.filtered.map((conversation) => (
              <li key={conversation.lead.id}>
                <ConversationRow
                  conversation={conversation}
                  active={model.selected?.lead.id === conversation.lead.id}
                  now={model.now}
                  onSelect={() => {
                    model.openConversation(conversation.lead.id);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ConversationRow({
  conversation,
  active,
  now,
  onSelect,
}: {
  conversation: Conversation;
  active: boolean;
  now: number;
  onSelect: () => void;
}) {
  const { lead, lastMessage, unread } = conversation;
  const who = lead.latinName ?? lead.name;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
      className="w-full"
    >
      <ListRow
        className={cn('cursor-pointer text-left hover:bg-canvas', active ? 'bg-canvas' : undefined)}
        leading={
          <span className="relative shrink-0">
            <Avatar name={who} seed={lead.id} size={40} />
            {unread ? (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-accent-strong ring-2 ring-surface"
              />
            ) : null}
          </span>
        }
        title={
          <span className="flex items-center gap-1.5">
            <span className={cn('truncate', unread ? 'font-bold' : '')}>{who}</span>
            <Icon
              name={CHANNEL_ICON[conversation.channel]}
              size={13}
              label={CHANNEL_LABEL[conversation.channel]}
              className="shrink-0 text-ink-3"
            />
          </span>
        }
        subtitle={
          <span className={cn(unread ? 'font-semibold text-ink-2' : '')}>
            {lastMessage ? messagePreview(lastMessage) : 'No messages yet'}
          </span>
        }
        trailing={
          <span className="flex flex-col items-end gap-1 text-right">
            <span className="text-[11.5px] text-ink-3">{ago(conversation.lastAt, now)}</span>
            {conversation.needsReview ? (
              <span className="rounded-full bg-critical-soft px-1.5 py-0.5 text-[10.5px] font-bold text-critical">
                Review
              </span>
            ) : conversation.closed ? (
              <span className="rounded-full bg-canvas-2 px-1.5 py-0.5 text-[10.5px] font-bold text-ink-3">
                Closed
              </span>
            ) : conversation.assignee ? (
              <span className="text-[11px] text-ink-3">
                {TEAM[conversation.assignee].firstName}
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-attention">Unassigned</span>
            )}
          </span>
        }
      />
    </button>
  );
}

function messagePreview(message: Conversation['lastMessage']): string {
  if (!message) return '';
  const prefix = message.direction === 'out' ? 'You: ' : '';
  return `${prefix}${message.activity.text}`;
}
