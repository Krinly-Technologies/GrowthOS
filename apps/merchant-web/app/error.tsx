'use client';

import { Button } from '@krinly/ui/components/button';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        We could not load this page. Please try again in a moment.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
