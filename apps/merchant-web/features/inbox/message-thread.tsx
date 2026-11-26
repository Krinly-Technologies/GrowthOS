'use client';

import { Avatar } from '@krinly/ui/components/avatar';
import { Button, IconButton } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import { Textarea } from '@krinly/ui/components/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipProvider,
} from '@krinly/ui/components/overlay';
import { EmptyState } from '@krinly/ui/components/feedback';
import { cn } from '@krinly/ui/lib/utils';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { MemberId } from '@/lib/preview/domain';
import { deliveryStatus, type Conversation, type ConversationMessage } from '@/lib/preview/inbox';
import { time, weekdayDayMonth } from '@/lib/preview/format';
import { CHANNEL_LABEL, MEMBER_IDS, TEAM } from '@/lib/preview/sample/scenario';
import { actorName, CHANNEL_ICON } from '@/features/crm/lead-bits';
import { DELIVERY_LABEL } from './inbox-bits';

const QUICK_REPLIES = [
  'Thanks for reaching out — could you share your event date?',
  "We'd love to help! Could you tell us a bit more about what you're looking for?",
  'Sure, let me check and get back to you shortly.',
];

/** Conversation workspace: identity, chronological history, and the reply composer. */
export function MessageThread({
  conversation,
  now,
  onSendReply,
  onAssign,
  onResolve,
  onReopen,
  onOpenContext,
  onOpenAssist,
}: {
  conversation: Conversation | undefined;
  now: number;
  onSendReply: (leadId: string, text: string) => void;
  onAssign: (leadId: string, owner: MemberId | null) => void;
  onResolve: (leadId: string) => void;
  onReopen: (leadId: string) => void;
  onOpenContext?: () => void;
  onOpenAssist?: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [draftFor, setDraftFor] = useState<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Clear the composer when the selected conversation changes, without calling setState from an
  // effect — React's recommended "adjust during render" pattern (see `crm-workspace.tsx`).
  if (draftFor !== conversation?.lead.id) {
    setDraftFor(conversation?.lead.id);
    if (draft !== '') setDraft('');
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [conversation?.messages.length, conversation?.lead.id]);

  if (!conversation) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center p-6">
        <EmptyState
          icon="inbox"
          title="Select a conversation"
          description="Choose a conversation from the list to see its history."
        />
      </div>
    );
  }

  const { lead } = conversation;
  const who = lead.latinName ?? lead.name;

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendReply(lead.id, trimmed);
    setDraft('');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
        <Avatar name={who} seed={lead.id} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold tracking-tight">{who}</p>
          <p className="flex items-center gap-1 truncate text-[12.5px] text-ink-3">
            <Icon name={CHANNEL_ICON[conversation.channel]} size={12} />
            {CHANNEL_LABEL[conversation.channel]} · {lead.phone}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenAssist ? (
            <IconButton
              label="AI assist"
              variant="outline"
              size="icon-sm"
              onClick={onOpenAssist}
              className="xl:hidden"
            >
              <Icon name="assistant" size={17} />
            </IconButton>
          ) : null}
          {onOpenContext ? (
            <IconButton
              label="Customer details"
              variant="outline"
              size="icon-sm"
              onClick={onOpenContext}
              className="xl:hidden"
            >
              <Icon name="user" size={17} />
            </IconButton>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" shape="pill" aria-label="Change assignee">
                <Icon name="user" size={14} />
                {conversation.assignee ? TEAM[conversation.assignee].firstName : 'Assign'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Assign to</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={conversation.assignee ?? ''}
                onValueChange={(value) => {
                  const next = MEMBER_IDS.find((member) => member === value);
                  onAssign(lead.id, next ?? null);
                }}
              >
                {MEMBER_IDS.map((member) => (
                  <DropdownMenuRadioItem key={member} value={member}>
                    {TEAM[member].name}
                  </DropdownMenuRadioItem>
                ))}
                <DropdownMenuRadioItem value="">Unassigned</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              {conversation.closed ? (
                <DropdownMenuItem
                  onSelect={() => {
                    onReopen(lead.id);
                  }}
                >
                  Reopen
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={() => {
                    onResolve(lead.id);
                  }}
                >
                  Resolve
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href={`/preview/crm?lead=${lead.id}`}>Open CRM record</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {conversation.closed ? (
        <p className="shrink-0 bg-canvas-2 px-4 py-1.5 text-center text-[12.5px] font-semibold text-ink-3">
          This conversation is resolved.{' '}
          <button
            type="button"
            onClick={() => {
              onReopen(lead.id);
            }}
            className="underline"
          >
            Reopen
          </button>
        </p>
      ) : null}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {conversation.messages.length === 0 ? (
          <p className="text-sm text-ink-3">No messages yet.</p>
        ) : (
          <ol className="grid gap-3">
            {conversation.messages.map((message) => (
              <MessageBubble key={message.activity.id} message={message} lead={lead} now={now} />
            ))}
          </ol>
        )}
      </div>

      <div className="shrink-0 border-t border-line p-3 sm:p-4">
        <TooltipProvider>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map((reply) => (
              <Tooltip key={reply} content={reply}>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(reply);
                  }}
                  className="max-w-[220px] truncate rounded-full bg-canvas px-3 py-1 text-[12px] font-semibold text-ink-2 hover:bg-canvas-2"
                >
                  {reply}
                </button>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
        <div className="flex items-end gap-2">
          <Textarea
            aria-label={`Reply to ${who}`}
            placeholder={
              conversation.closed ? 'Reopen the conversation to reply' : 'Write a reply…'
            }
            value={draft}
            disabled={conversation.closed}
            onChange={(e) => {
              setDraft(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send(draft);
              }
            }}
            className="min-h-11 flex-1 resize-none py-2.5"
          />
          <Button
            variant="brand"
            shape="pill"
            disabled={conversation.closed || draft.trim() === ''}
            onClick={() => {
              send(draft);
            }}
          >
            <Icon name="arrow-right" size={15} />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  lead,
  now,
}: {
  message: ConversationMessage;
  lead: Conversation['lead'];
  now: number;
}) {
  const out = message.direction === 'out';
  const delivery = out ? deliveryStatus(message.activity, now) : undefined;
  return (
    <li className={cn('flex', out ? 'justify-end' : 'justify-start')}>
      <div
        className={cn('max-w-[min(32rem,85%)]', out ? 'items-end' : 'items-start', 'flex flex-col')}
      >
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed',
            out ? 'bg-brand text-on-brand' : 'bg-canvas text-ink',
          )}
        >
          {message.activity.text}
        </div>
        <p className="mt-1 px-1 text-[11px] text-ink-3">
          {actorName(message.activity, lead)} · {weekdayDayMonth(message.activity.at)},{' '}
          {time(message.activity.at)}
          {out && delivery ? ` · ${DELIVERY_LABEL[delivery]}` : ''}
        </p>
      </div>
    </li>
  );
}
