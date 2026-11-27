'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { PREVIEW_NAV_ITEMS } from '@/lib/preview/nav';
import { BUSINESS } from '@/lib/preview/sample/scenario';
import { PreviewStoreProvider } from '@/lib/preview/store';
import { WorkspaceConfigProvider } from '@/lib/preview/workspace-config';
import { PreviewBanner } from './preview-banner';

// A client layout so the preview's navigation list (whose `href` is a function, like the
// production list) stays inside the client bundle rather than crossing the server boundary.

/**
 * The preview runs inside the production application shell — same sidebar, mobile bar, command
 * search and skip link — so what is validated here is what merchants will use. The shell's
 * identity controls are off (`chrome="preview"`): there is no session or workspace behind this.
 */
export default function PreviewWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <PreviewStoreProvider>
      <WorkspaceConfigProvider>
        <AppShell
          org={{ id: 'preview', name: BUSINESS.name }}
          role="Fictional workspace"
          organizations={[]}
          name="Preview"
          email="preview@example.com"
          navItems={PREVIEW_NAV_ITEMS}
          chrome="preview"
          banner={<PreviewBanner />}
        >
          {children}
        </AppShell>
      </WorkspaceConfigProvider>
    </PreviewStoreProvider>
  );
}
