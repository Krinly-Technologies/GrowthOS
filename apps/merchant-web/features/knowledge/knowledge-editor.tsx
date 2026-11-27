'use client';

import { Button } from '@krinly/ui/components/button';
import { Field } from '@krinly/ui/components/field';
import { Input, Select, Textarea } from '@krinly/ui/components/input';
import { Dialog, DialogContent } from '@krinly/ui/components/overlay';
import { useState } from 'react';
import {
  CATEGORY_LABEL,
  type KnowledgeCategory,
  type KnowledgeEntry,
  type KnowledgeStatus,
} from '@/lib/preview/workspace-domain';

const CATEGORIES = Object.keys(CATEGORY_LABEL) as KnowledgeCategory[];

export interface KnowledgeEntryDraft {
  category: KnowledgeCategory;
  title: string;
  body: string;
  status: KnowledgeStatus;
}

function draftFrom(
  entry: KnowledgeEntry | null,
  defaultCategory: KnowledgeCategory,
): KnowledgeEntryDraft {
  return entry
    ? { category: entry.category, title: entry.title, body: entry.body, status: entry.status }
    : { category: defaultCategory, title: '', body: '', status: 'draft' };
}

/** Create or edit a knowledge entry — a simple structured editor, which is enough here. */
export function KnowledgeEditor({
  open,
  entry,
  defaultCategory,
  onSave,
  onClose,
}: {
  open: boolean;
  entry: KnowledgeEntry | null;
  defaultCategory: KnowledgeCategory;
  onSave: (draft: KnowledgeEntryDraft) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<KnowledgeEntryDraft>(() => draftFrom(entry, defaultCategory));
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(draftFrom(entry, defaultCategory));
  }

  const valid = draft.title.trim() !== '' && draft.body.trim() !== '';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        size="lg"
        title={entry ? 'Edit entry' : 'New knowledge entry'}
        footer={
          <>
            <Button variant="ghost" shape="pill" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="outline"
              shape="pill"
              disabled={!valid}
              onClick={() => {
                onSave({ ...draft, status: 'draft' });
                onClose();
              }}
            >
              Save as draft
            </Button>
            <Button
              variant="brand"
              shape="pill"
              disabled={!valid}
              onClick={() => {
                onSave({ ...draft, status: 'published' });
                onClose();
              }}
            >
              Publish
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Category">
            <Select
              value={draft.category}
              onChange={(e) => {
                setDraft((d) => ({ ...d, category: e.target.value as KnowledgeCategory }));
              }}
            >
              {CATEGORIES.map((id) => (
                <option key={id} value={id}>
                  {CATEGORY_LABEL[id]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Title">
            <Input
              value={draft.title}
              onChange={(e) => {
                setDraft((d) => ({ ...d, title: e.target.value }));
              }}
            />
          </Field>
          <Field
            label="Content"
            hint="What the assistant can draw on when it answers a related question."
          >
            <Textarea
              rows={6}
              value={draft.body}
              onChange={(e) => {
                setDraft((d) => ({ ...d, body: e.target.value }));
              }}
            />
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}
