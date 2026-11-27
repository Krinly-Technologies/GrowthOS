'use client';

import { Button } from '@krinly/ui/components/button';
import { Card, CardTitle } from '@krinly/ui/components/card';
import { Icon } from '@krinly/ui/components/icon';
import { Textarea } from '@krinly/ui/components/input';
import { useState } from 'react';
import type { AssistantConfig } from '@/lib/preview/workspace-domain';

const HANDOFF_KEYWORDS = ['price', 'discount', 'refund', 'complain', 'angry', 'cancel'];

function simulateReply(
  config: AssistantConfig,
  message: string,
): { reply: string | null; reason: string | null } {
  const lower = message.toLowerCase();
  const hit = HANDOFF_KEYWORDS.find((k) => lower.includes(k));
  if (hit) {
    return {
      reply: null,
      reason: `Routed to a teammate — the message mentions "${hit}", which matches a configured handoff condition.`,
    };
  }
  const opener =
    config.tone === 'friendly'
      ? 'Hey! Thanks so much for reaching out.'
      : config.tone === 'professional'
        ? 'Thank you for getting in touch.'
        : config.tone === 'concise'
          ? 'Thanks for your message.'
          : 'Thank you for writing in — happy to help!';
  const question =
    config.qualificationQuestions[0] ?? 'Could you share a bit more about what you need?';
  return { reply: `${opener} ${question}`, reason: null };
}

/**
 * A worked example of how the configured assistant might respond to a fictional enquiry.
 * Deterministic and local — not a real model call, and the output is always labelled simulated.
 */
export function AssistantTest({ config }: { config: AssistantConfig }) {
  const [message, setMessage] = useState('Hi, I wanted to ask about your bridal packages.');
  const [result, setResult] = useState<ReturnType<typeof simulateReply> | null>(null);

  return (
    <Card padding="lg" aria-labelledby="assistant-test-heading" className="min-w-0">
      <CardTitle id="assistant-test-heading" className="text-xl">
        Test the assistant
      </CardTitle>
      <p className="mt-1 text-sm text-ink-2">
        Try a fictional customer message against the current configuration.
      </p>
      <Textarea
        rows={3}
        className="mt-4"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
      />
      <Button
        variant="brand"
        shape="pill"
        size="sm"
        className="mt-3"
        onClick={() => {
          setResult(simulateReply(config, message));
        }}
      >
        See simulated reply
      </Button>

      {result ? (
        <div className="mt-4 rounded-xl bg-canvas p-4">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-3">
            <Icon name="assistant" size={14} /> Simulated — no real AI call was made
          </p>
          {result.reply ? (
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink">{result.reply}</p>
          ) : (
            <p className="mt-2 flex items-center gap-1.5 text-[13.5px] text-attention">
              <Icon name="alert" size={14} /> {result.reason}
            </p>
          )}
        </div>
      ) : null}
    </Card>
  );
}
