import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { bricolage, manrope, notoDevanagari, notoTamil } from '@/lib/fonts';
import { isLabEnabled } from '@/lib/lab-guard';
import './system.css';

// Separate root layout: the lab's prototype CSS never loads here, so the showcase renders the
// @krinly/ui tokens and components exactly as production apps consume them.

export const metadata: Metadata = {
  title: 'Krinly design system',
  description: 'Development-only showcase of @krinly/ui.',
  robots: { index: false, follow: false },
};

const fonts = [manrope, bricolage, notoDevanagari, notoTamil].map((f) => f.variable).join(' ');

export default function SystemRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN" className={fonts}>
      <body>
        {isLabEnabled() ? (
          children
        ) : (
          <main className="mx-auto max-w-lg px-6 py-16 text-sm">
            <h1 className="text-xl font-semibold">The design lab is turned off</h1>
            <p className="mt-2 text-ink-3">
              Development-only. Enable it with <code>apps/design-lab/.env.local</code> (see README).
            </p>
          </main>
        )}
      </body>
    </html>
  );
}
