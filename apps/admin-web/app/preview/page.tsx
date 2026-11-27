import { Button } from '@krinly/ui/components/button';
import Link from 'next/link';
import { SupportDashboard } from '@/features/support-preview/support-dashboard';

export default function AdminPreviewPage() {
  return (
    <div className="min-h-svh">
      <header className="border-b border-attention/20 bg-attention-soft px-4 py-2.5 text-[12.5px] text-attention">
        Development preview — fictional workspaces, for screens core-api has no endpoint for yet.
      </header>
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Support preview</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Back to Operations</Link>
          </Button>
        </div>
        <SupportDashboard />
      </main>
    </div>
  );
}
