import type { ReactNode } from 'react';
import { Wordmark } from '@/components/wordmark';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Wordmark />
        </div>
        {children}
      </div>
    </main>
  );
}
