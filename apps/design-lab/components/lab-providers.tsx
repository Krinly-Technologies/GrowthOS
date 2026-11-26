'use client';

import { Tooltip } from 'radix-ui';
import type { ReactNode } from 'react';
import { LabStoreProvider } from '@/lib/store';
import { ToastProvider } from './toast';

export function LabProviders({ children }: { children: ReactNode }) {
  return (
    <LabStoreProvider>
      <Tooltip.Provider delayDuration={300} skipDelayDuration={150}>
        <ToastProvider>{children}</ToastProvider>
      </Tooltip.Provider>
    </LabStoreProvider>
  );
}
