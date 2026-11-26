import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { LabDisabled } from '@/components/lab-disabled';
import { LabProviders } from '@/components/lab-providers';
import { fontVariables } from '@/lib/fonts';
import { isLabEnabled } from '@/lib/lab-guard';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Krinly design lab', template: '%s · Krinly design lab' },
  description: 'Development-only visual prototypes with fictional data.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const enabled = isLabEnabled();
  return (
    <html lang="en-IN" className={fontVariables}>
      <body>{enabled ? <LabProviders>{children}</LabProviders> : <LabDisabled />}</body>
    </html>
  );
}
