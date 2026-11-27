'use client';

import { Skeleton } from '@krinly/ui/components/feedback';
import { Suspense } from 'react';
import { SettingsWorkspace } from '@/features/settings/settings-workspace';
import { usePreview } from '@/lib/preview/store';

function Settings() {
  const { state } = usePreview();
  return <SettingsWorkspace now={state.now} />;
}

export default function SettingsPreviewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Settings />
    </Suspense>
  );
}
