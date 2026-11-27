'use client';

import { Badge } from '@krinly/ui/components/badge';
import { Button } from '@krinly/ui/components/button';
import { Card, CardTitle } from '@krinly/ui/components/card';
import { EmptyState } from '@krinly/ui/components/feedback';
import { SearchField } from '@krinly/ui/components/input';
import { ListRow } from '@krinly/ui/components/table';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/features/common/confirm-dialog';
import { FilterMenu } from '@/features/common/filter-menu';
import {
  CATEGORY_LABEL,
  type KnowledgeCategory,
  type KnowledgeEntry,
} from '@/lib/preview/workspace-domain';

const CATEGORY_IDS = Object.keys(CATEGORY_LABEL) as KnowledgeCategory[];

function matches(entry: KnowledgeEntry, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return `${entry.title} ${entry.body}`.toLowerCase().includes(needle);
}

/** Search and category filters over every knowledge entry, with edit, archive and delete. */
export function EntryList({
  entries,
  onEdit,
  onArchive,
  onDelete,
}: {
  entries: readonly KnowledgeEntry[];
  onEdit: (entry: KnowledgeEntry) => void;
  onArchive: (entry: KnowledgeEntry) => void;
  onDelete: (entry: KnowledgeEntry) => void;
}) {
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [deleting, setDeleting] = useState<KnowledgeEntry | null>(null);

  const rows = useMemo(
    () =>
      entries.filter(
        (entry) =>
          entry.archived === showArchived &&
          (categories.length === 0 || categories.includes(entry.category)) &&
          matches(entry, query),
      ),
    [entries, categories, query, showArchived],
  );

  return (
    <Card padding="lg" aria-labelledby="knowledge-entries-heading" className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle id="knowledge-entries-heading" className="text-xl">
          Entries
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowArchived((v) => !v);
          }}
        >
          {showArchived ? 'Show active' : 'Show archived'}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SearchField
          label="Search knowledge entries"
          placeholder="Search entries…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          className="w-full max-w-xs"
        />
        <FilterMenu
          label="Category"
          options={CATEGORY_IDS.map((id) => ({ value: id, label: CATEGORY_LABEL[id] }))}
          selected={categories}
          onChange={setCategories}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon="knowledge"
          title={showArchived ? 'Nothing archived' : 'No entries found'}
          description={
            showArchived
              ? 'Archived entries will show up here.'
              : 'Try a different search or category, or create a new entry.'
          }
        />
      ) : (
        <ul className="mt-4 divide-y divide-line-soft">
          {rows.map((entry) => (
            <li key={entry.id}>
              <ListRow
                title={entry.title}
                subtitle={`${CATEGORY_LABEL[entry.category]} · ${entry.body.slice(0, 80)}${entry.body.length > 80 ? '…' : ''}`}
                trailing={
                  <div className="flex items-center gap-2">
                    <Badge tone={entry.status === 'published' ? 'verified' : 'attention'}>
                      {entry.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onEdit(entry);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onArchive(entry);
                      }}
                    >
                      {entry.archived ? 'Unarchive' : 'Archive'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-critical"
                      onClick={() => {
                        setDeleting(entry);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete "${deleting?.title}"?`}
        description="This removes the entry. This can't be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) onDelete(deleting);
        }}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </Card>
  );
}
