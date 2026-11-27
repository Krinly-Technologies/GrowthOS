import { Icon } from '@krinly/ui/components/icon';
import { EmptyState } from '@krinly/ui/components/feedback';
import type { AutomationRun } from '@/lib/preview/workspace-domain';
import { ago } from '@/lib/preview/format';

const STATUS_ICON: Record<
  AutomationRun['status'],
  { icon: 'check' | 'close' | 'clock'; className: string }
> = {
  success: { icon: 'check', className: 'text-verified' },
  skipped: { icon: 'clock', className: 'text-ink-3' },
  failed: { icon: 'close', className: 'text-critical' },
};

/** Simulated execution history for one automation — never a real send. */
export function RunHistory({ runs, now }: { runs: readonly AutomationRun[]; now: number }) {
  if (runs.length === 0) {
    return (
      <EmptyState
        icon="clock"
        title="No simulated runs yet"
        description='Use "Test run" to see what this automation would do.'
      />
    );
  }
  return (
    <ol className="grid gap-2">
      {runs.map((run) => {
        const status = STATUS_ICON[run.status];
        return (
          <li key={run.id} className="flex items-start gap-2.5 rounded-lg bg-canvas px-3 py-2.5">
            <Icon name={status.icon} size={16} className={`mt-0.5 shrink-0 ${status.className}`} />
            <div className="min-w-0">
              <p className="text-[13.5px] text-ink">{run.summary}</p>
              <p className="mt-0.5 text-[12px] text-ink-3">
                {ago(run.at, now)} · simulated, not sent
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
