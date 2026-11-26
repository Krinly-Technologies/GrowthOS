'use client';

import { Badge } from '@krinly/ui/components/badge';
import { Button } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import { Textarea } from '@krinly/ui/components/input';
import { EmptyState } from '@krinly/ui/components/feedback';
import { useState } from 'react';
import type { Conversation } from '@/lib/preview/inbox';
import { AI_INTENT_LABEL } from '@/lib/preview/inbox';
import { INTENT_ICON } from './inbox-bits';

/**
 * AI Sales Assistant for one conversation. Every output here is a simulated development-preview
 * proposal — it never sends or changes anything by itself; the merchant always takes the action.
 */
export function AiAssistPanel({
  conversation,
  onAccept,
  onSendEdited,
  onRegenerate,
  onDismiss,
  onEscalate,
  onApproveStage,
}: {
  conversation: Conversation | undefined;
  onAccept: (leadId: string, text: string) => void;
  onSendEdited: (leadId: string, text: string) => void;
  onRegenerate: (leadId: string) => void;
  onDismiss: (leadId: string) => void;
  onEscalate: (leadId: string) => void;
  onApproveStage: (leadId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [editingFor, setEditingFor] = useState<string | undefined>(undefined);

  // Reset the edit draft when the selected conversation (or its suggestion) changes, without
  // calling setState from an effect — React's recommended "adjust during render" pattern.
  const editKey = conversation
    ? `${conversation.lead.id}:${conversation.ai.suggestedReply ?? ''}`
    : undefined;
  if (editingFor !== editKey) {
    setEditingFor(editKey);
    if (editing) setEditing(false);
  }

  if (!conversation) {
    return (
      <div className="p-4">
        <EmptyState icon="assistant" title="No conversation selected" className="border-0" />
      </div>
    );
  }

  const { lead, ai, aiStatus, closed } = conversation;
  const showStageProposal =
    !closed && ai.intent === 'booking_request' && lead.stage !== 'ready' && lead.stage !== 'booked';

  return (
    <div className="grid gap-4 p-4">
      <div className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-canvas-2 text-ink-2">
          <Icon name="assistant" size={16} />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-[14px] font-semibold tracking-tight">
            AI sales assistant
          </h3>
          <p className="text-[11.5px] text-ink-3">
            Simulated development preview — not a real model
          </p>
        </div>
      </div>

      <section className="rounded-xl bg-canvas p-3.5">
        <p className="text-xs font-semibold text-ink-3">Summary</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink">{ai.summary}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Badge tone="outline">
            <Icon name={INTENT_ICON[ai.intent]} size={13} />
            {AI_INTENT_LABEL[ai.intent]}
          </Badge>
          <span className="text-[12px] text-ink-3">
            {Math.round(ai.confidence * 100)}% confidence
          </span>
        </div>
      </section>

      {ai.missingInfo.length > 0 ? (
        <section>
          <p className="text-xs font-semibold text-ink-3">Missing information</p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {ai.missingInfo.map((item) => (
              <li
                key={item}
                className="rounded-full bg-attention-soft px-2.5 py-0.5 text-[12px] font-semibold text-attention"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {aiStatus === 'dismissed' ? (
        <section className="rounded-xl bg-canvas p-3.5 text-[13px] text-ink-3">
          Suggestion dismissed.{' '}
          <button
            type="button"
            className="font-semibold text-ink underline"
            onClick={() => {
              onRegenerate(lead.id);
            }}
          >
            Restore
          </button>
        </section>
      ) : ai.reviewReason ? (
        <section className="rounded-xl bg-critical-soft p-3.5">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-critical">
            <Icon name="alert" size={15} />
            Needs human review
          </p>
          <p className="mt-1 text-[13px] text-ink-2">{ai.reviewReason}.</p>
          <p className="mt-2 text-[13px] font-semibold text-ink">{ai.recommendedAction}</p>
          {aiStatus === 'escalated' ? (
            <p className="mt-2 text-[12px] text-ink-3">Escalated — waiting on a teammate.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                shape="pill"
                onClick={() => {
                  onEscalate(lead.id);
                }}
              >
                <Icon name="megaphone" size={14} />
                Request human assistance
              </Button>
              <Button
                variant="outline"
                size="sm"
                shape="pill"
                onClick={() => {
                  onDismiss(lead.id);
                }}
              >
                Dismiss
              </Button>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-xl bg-canvas p-3.5">
          <p className="text-xs font-semibold text-ink-3">Suggested reply</p>
          {editing ? (
            <Textarea
              autoFocus
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
              }}
              className="mt-1.5 bg-surface"
            />
          ) : (
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink">{ai.suggestedReply}</p>
          )}
          <p className="mt-2 text-[12px] text-ink-3">{ai.recommendedAction}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {editing ? (
              <Button
                size="sm"
                shape="pill"
                variant="brand"
                onClick={() => {
                  onSendEdited(lead.id, draft);
                  setEditing(false);
                }}
              >
                <Icon name="check" size={14} />
                Send edited reply
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  shape="pill"
                  variant="brand"
                  onClick={() => {
                    if (ai.suggestedReply) onAccept(lead.id, ai.suggestedReply);
                  }}
                >
                  <Icon name="check" size={14} />
                  Accept &amp; send
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  shape="pill"
                  onClick={() => {
                    setDraft(ai.suggestedReply ?? '');
                    setEditing(true);
                  }}
                >
                  Edit
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              shape="pill"
              onClick={() => {
                onRegenerate(lead.id);
              }}
            >
              <Icon name="undo" size={14} />
              Regenerate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              shape="pill"
              onClick={() => {
                onDismiss(lead.id);
              }}
            >
              Dismiss
            </Button>
          </div>
        </section>
      )}

      {showStageProposal ? (
        <section className="rounded-xl bg-info-soft p-3.5">
          <p className="text-[13px] font-semibold text-ink">
            The conversation reads as ready to book. Update the CRM stage?
          </p>
          <div className="mt-2.5 flex gap-2">
            <Button
              size="sm"
              shape="pill"
              onClick={() => {
                onApproveStage(lead.id);
              }}
            >
              Approve — move to Ready to book
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
