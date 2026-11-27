'use client';

import { Button } from '@krinly/ui/components/button';
import { Badge } from '@krinly/ui/components/badge';
import { Card, CardTitle } from '@krinly/ui/components/card';
import { EmptyState } from '@krinly/ui/components/feedback';
import { useState } from 'react';
import type { Automation, AutomationStatus } from '@/lib/preview/workspace-domain';
import { ACTION_LABEL, TRIGGER_LABEL } from '@/lib/preview/workspace-domain';
import { ConfirmDialog } from '@/features/common/confirm-dialog';
import { RunHistory } from './run-history';

const STATUS_TONE: Record<AutomationStatus, 'verified' | 'neutral' | 'attention'> = {
  active: 'verified',
  paused: 'neutral',
  draft: 'attention',
};

const STATUS_LABEL: Record<AutomationStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  draft: 'Draft',
};

/** Every configured automation, grouped by status, with enable/disable, edit, test and delete. */
export function WorkflowList({
  automations,
  now,
  onToggle,
  onEdit,
  onSimulate,
  onDelete,
}: {
  automations: readonly Automation[];
  now: number;
  onToggle: (automation: Automation) => void;
  onEdit: (automation: Automation) => void;
  onSimulate: (automation: Automation) => void;
  onDelete: (automation: Automation) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Automation | null>(null);

  if (automations.length === 0) {
    return (
      <Card padding="lg" className="min-w-0">
        <EmptyState
          icon="automation"
          title="No automations yet"
          description="Use a template above, or create one from scratch."
        />
      </Card>
    );
  }

  return (
    <Card padding="lg" aria-labelledby="automation-list-heading" className="min-w-0">
      <CardTitle id="automation-list-heading" className="text-xl">
        Workflows
      </CardTitle>
      <ul className="mt-4 grid gap-3">
        {automations.map((automation) => {
          const open = expanded === automation.id;
          return (
            <li key={automation.id} className="rounded-xl border border-line">
              <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-left"
                    onClick={() => {
                      setExpanded(open ? null : automation.id);
                    }}
                  >
                    <h3 className="font-display text-[15px] font-semibold text-ink">
                      {automation.name}
                    </h3>
                    <Badge tone={STATUS_TONE[automation.status]}>
                      {STATUS_LABEL[automation.status]}
                    </Badge>
                  </button>
                  <p className="mt-1 text-[13px] text-ink-2">{automation.description}</p>
                  <p className="mt-1 text-[12px] text-ink-3">
                    When {TRIGGER_LABEL[automation.trigger].toLowerCase()} ·{' '}
                    {automation.actions.map((a) => ACTION_LABEL[a.kind]).join(', ') ||
                      'no actions configured'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant={automation.status === 'active' ? 'outline' : 'brand'}
                    size="sm"
                    onClick={() => {
                      onToggle(automation);
                    }}
                  >
                    {automation.status === 'active' ? 'Pause' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onEdit(automation);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onSimulate(automation);
                    }}
                  >
                    Test run
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-critical"
                    onClick={() => {
                      setDeleting(automation);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              {open ? (
                <div className="border-t border-line-soft p-4">
                  <RunHistory runs={automation.runs} now={now} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete "${deleting?.name}"?`}
        description="This removes the automation and its simulated run history. This can't be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) onDelete(deleting);
        }}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </Card>
  );
}
