'use client';

import { Skeleton } from '@krinly/ui/components/feedback';
import { Suspense } from 'react';
import { AutomationWorkspace } from '@/features/automation/automation-workspace';
import { usePreview } from '@/lib/preview/store';

function Automation() {
  const { state } = usePreview();
  return <AutomationWorkspace now={state.now} />;
}

export default function AutomationPreviewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Automation />
    </Suspense>
  );
}
