'use client';

import { Button } from '@krinly/ui/components/button';
import { ErrorState } from '@krinly/ui/components/feedback';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-canvas px-4">
      <ErrorState
        title="Something went wrong"
        description="We could not load this page. Please try again in a moment."
        reference={error.digest}
        action={<Button onClick={reset}>Try again</Button>}
        className="w-full max-w-sm"
      />
    </main>
  );
}
