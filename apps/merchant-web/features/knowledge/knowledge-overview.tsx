import { Card } from '@krinly/ui/components/card';
import { Metric } from '@krinly/ui/patterns/metric';
import type { KnowledgeEntry } from '@/lib/preview/workspace-domain';

export function KnowledgeOverview({ entries }: { entries: readonly KnowledgeEntry[] }) {
  const active = entries.filter((e) => !e.archived);
  const published = active.filter((e) => e.status === 'published').length;
  const draft = active.filter((e) => e.status === 'draft').length;
  const archived = entries.length - active.length;

  return (
    <Card padding="lg" aria-labelledby="knowledge-overview-heading" className="min-w-0">
      <h2 id="knowledge-overview-heading" className="sr-only">
        Knowledge overview
      </h2>
      <div className="grid gap-6 sm:grid-cols-3">
        <Metric label="Published" value={published} context="available to the AI assistant" />
        <Metric label="Drafts" value={draft} context="not yet available to the assistant" />
        <Metric label="Archived" value={archived} />
      </div>
    </Card>
  );
}
