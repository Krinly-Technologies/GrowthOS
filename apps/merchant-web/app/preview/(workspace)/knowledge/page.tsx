'use client';

import { Skeleton } from '@krinly/ui/components/feedback';
import { Suspense } from 'react';
import { KnowledgeWorkspace } from '@/features/knowledge/knowledge-workspace';

export default function KnowledgePreviewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <KnowledgeWorkspace />
    </Suspense>
  );
}
