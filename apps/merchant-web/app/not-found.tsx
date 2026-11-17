import { Button } from '@krinly/ui/components/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page does not exist, or you do not have access to it.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Go to your workspace</Link>
      </Button>
    </main>
  );
}
