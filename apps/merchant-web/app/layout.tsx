import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { fontVariables } from '@/lib/fonts';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Krinly', template: '%s · Krinly' },
  description: 'Krinly GrowthOS merchant workspace',
};

// Light mode is the default everywhere; following the OS dark preference is a later product
// decision (docs/frontend/design-system.md), so nothing here reads prefers-color-scheme.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN" className={fontVariables}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
