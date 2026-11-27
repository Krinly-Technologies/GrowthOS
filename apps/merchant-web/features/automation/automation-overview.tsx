import { Card } from '@krinly/ui/components/card';
import { Metric } from '@krinly/ui/patterns/metric';
import type { Automation } from '@/lib/preview/workspace-domain';
import { plural } from '@/lib/preview/format';

/** How many automations are active, paused or still drafts, and how many simulated runs happened. */
export function AutomationOverview({ automations }: { automations: readonly Automation[] }) {
  const active = automations.filter((a) => a.status === 'active').length;
  const paused = automations.filter((a) => a.status === 'paused').length;
  const draft = automations.filter((a) => a.status === 'draft').length;
  const runs = automations.reduce((sum, a) => sum + a.runs.length, 0);

  return (
    <Card padding="lg" aria-labelledby="automation-overview-heading" className="min-w-0">
      <h2 id="automation-overview-heading" className="sr-only">
        Automation overview
      </h2>
      <div className="grid gap-6 sm:grid-cols-4">
        <Metric
          label="Active"
          value={active}
          context={`of ${plural(automations.length, 'automation')}`}
        />
        <Metric label="Paused" value={paused} />
        <Metric label="Draft" value={draft} />
        <Metric label="Simulated runs" value={runs} context="never a real send" />
      </div>
    </Card>
  );
}
