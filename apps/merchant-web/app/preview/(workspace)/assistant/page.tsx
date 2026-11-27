'use client';

import { Skeleton } from '@krinly/ui/components/feedback';
import { Suspense } from 'react';
import { AssistantWorkspace } from '@/features/assistant/assistant-workspace';

export default function AssistantPreviewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <AssistantWorkspace />
    </Suspense>
  );
}
