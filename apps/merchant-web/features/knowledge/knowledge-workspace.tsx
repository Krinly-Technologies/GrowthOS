'use client';

import { Button } from '@krinly/ui/components/button';
import { useToast } from '@krinly/ui/components/toast';
import { useState } from 'react';
import { useSimulateUploadDelay, useWorkspaceConfig } from '@/lib/preview/workspace-config';
import type { KnowledgeEntry } from '@/lib/preview/workspace-domain';
import { KnowledgeAiPreview } from './ai-preview';
import { DocumentUpload } from './document-upload';
import { EntryList } from './entry-list';
import { KnowledgeEditor, type KnowledgeEntryDraft } from './knowledge-editor';
import { KnowledgeOverview } from './knowledge-overview';

/** The Knowledge Base workspace for the merchant's AI sales assistant. */
export function KnowledgeWorkspace() {
  const { state, dispatch } = useWorkspaceConfig();
  const toast = useToast();
  const simulateUploadDelay = useSimulateUploadDelay();
  const [editing, setEditing] = useState<{ entry: KnowledgeEntry | null } | null>(null);

  const save = (draft: KnowledgeEntryDraft) => {
    if (editing?.entry) {
      dispatch({ type: 'updateKnowledge', id: editing.entry.id, draft });
      toast({ title: 'Entry updated' });
    } else {
      dispatch({ type: 'createKnowledge', draft });
      toast({ title: draft.status === 'published' ? 'Entry published' : 'Draft saved' });
    }
  };

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-ink">Knowledge base</h1>
        <Button
          variant="brand"
          shape="pill"
          onClick={() => {
            setEditing({ entry: null });
          }}
        >
          New entry
        </Button>
      </div>

      <KnowledgeOverview entries={state.knowledge} />

      <EntryList
        entries={state.knowledge}
        onEdit={(entry) => {
          setEditing({ entry });
        }}
        onArchive={(entry) => {
          dispatch({ type: 'archiveKnowledge', id: entry.id });
          toast({ title: entry.archived ? 'Entry restored' : 'Entry archived' });
        }}
        onDelete={(entry) => {
          dispatch({ type: 'deleteKnowledge', id: entry.id });
          toast({ title: 'Entry deleted' });
        }}
      />

      <KnowledgeAiPreview entries={state.knowledge} />

      <DocumentUpload
        documents={state.documents}
        onUpload={(name) => {
          const id = `doc-${Date.now()}`;
          dispatch({ type: 'uploadDocument', id, name });
          toast({ title: 'Processing document', description: name });
          simulateUploadDelay(id);
        }}
        onRemove={(id) => {
          dispatch({ type: 'removeDocument', id });
        }}
      />

      <KnowledgeEditor
        open={editing !== null}
        entry={editing?.entry ?? null}
        defaultCategory="faq"
        onSave={save}
        onClose={() => {
          setEditing(null);
        }}
      />
    </div>
  );
}
