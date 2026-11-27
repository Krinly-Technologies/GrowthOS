'use client';

import { Button } from '@krinly/ui/components/button';
import { Badge } from '@krinly/ui/components/badge';
import { Card, CardTitle } from '@krinly/ui/components/card';
import { EmptyState } from '@krinly/ui/components/feedback';
import { Icon } from '@krinly/ui/components/icon';
import { useRef } from 'react';
import type { KnowledgeDocument } from '@/lib/preview/workspace-domain';

const STATUS_TONE: Record<KnowledgeDocument['status'], 'attention' | 'verified' | 'critical'> = {
  processing: 'attention',
  ready: 'verified',
  failed: 'critical',
};

const STATUS_LABEL: Record<KnowledgeDocument['status'], string> = {
  processing: 'Processing',
  ready: 'Ready',
  failed: 'Failed',
};

/**
 * Simulated document upload. Files never leave the browser — nothing here is sent to an external
 * service, parsed, chunked or embedded; "Processing" just stands in for that step.
 */
export function DocumentUpload({
  documents,
  onUpload,
  onRemove,
}: {
  documents: readonly KnowledgeDocument[];
  onUpload: (name: string) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Card padding="lg" aria-labelledby="knowledge-documents-heading" className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle id="knowledge-documents-heading" className="text-xl">
          Documents
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            inputRef.current?.click();
          }}
        >
          Upload a document
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file.name);
            e.target.value = '';
          }}
        />
      </div>
      <p className="mt-1 text-sm text-ink-2">
        A document stays in your browser in this preview — nothing is uploaded or processed by a
        real system.
      </p>

      {documents.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon="note"
          title="No documents yet"
          description="Upload a price list, menu or policy document to simulate how it would be processed."
        />
      ) : (
        <ul className="mt-4 divide-y divide-line-soft">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 py-2.5">
              <Icon name="note" size={16} className="shrink-0 text-ink-3" />
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{doc.name}</span>
              <Badge tone={STATUS_TONE[doc.status]}>{STATUS_LABEL[doc.status]}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onRemove(doc.id);
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
