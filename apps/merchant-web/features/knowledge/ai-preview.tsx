'use client';

import { Card, CardTitle } from '@krinly/ui/components/card';
import { Icon } from '@krinly/ui/components/icon';
import { Select } from '@krinly/ui/components/input';
import { useMemo, useState } from 'react';
import type { KnowledgeEntry } from '@/lib/preview/workspace-domain';

/**
 * How a published entry could support an AI reply — a worked example, not a real model call.
 * Clearly labelled as simulated: see CLAUDE.md, AI output is a proposal, never a real inference.
 */
export function KnowledgeAiPreview({ entries }: { entries: readonly KnowledgeEntry[] }) {
  const published = useMemo(
    () => entries.filter((e) => e.status === 'published' && !e.archived),
    [entries],
  );
  const [selectedId, setSelectedId] = useState(published[0]?.id ?? '');
  const entry = published.find((e) => e.id === selectedId) ?? published[0] ?? null;

  if (published.length === 0) {
    return null;
  }

  return (
    <Card padding="lg" aria-labelledby="knowledge-ai-preview-heading" className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle id="knowledge-ai-preview-heading" className="text-xl">
          How this could support an AI reply
        </CardTitle>
        <Select
          value={entry?.id ?? ''}
          onChange={(e) => {
            setSelectedId(e.target.value);
          }}
          className="w-64"
        >
          {published.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </Select>
      </div>
      {entry ? (
        <div className="mt-4 rounded-xl bg-canvas p-4">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-3">
            <Icon name="assistant" size={14} /> Simulated reply — not a real AI call
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink">
            &ldquo;Thanks for asking! {entry.body}&rdquo;
          </p>
          <p className="mt-2 text-[12px] text-ink-3">
            Drawn from the published entry &ldquo;{entry.title}&rdquo;. A real assistant reply is
            always a proposal a teammate can edit or dismiss, never sent automatically.
          </p>
        </div>
      ) : null}
    </Card>
  );
}
