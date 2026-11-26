import { Button } from '@krinly/ui/components/button';
import { EmptyState } from '@krinly/ui/components/feedback';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-canvas px-4">
      <EmptyState
        icon="alert"
        title="Not found"
        description="This page does not exist, or you do not have access to it."
        action={
          <Button asChild variant="outline">
            <Link href="/">Go to your workspace</Link>
          </Button>
        }
        className="w-full max-w-sm border-none"
      />
    </main>
  );
}
