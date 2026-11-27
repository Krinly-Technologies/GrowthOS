'use client';

import { useToast } from '@krinly/ui/components/toast';
import { useState } from 'react';
import type { AutomationDraft } from '@/lib/preview/workspace-config';
import { useWorkspaceConfig } from '@/lib/preview/workspace-config';
import {
  AUTOMATION_TEMPLATES,
  type Automation,
  type AutomationTemplate,
} from '@/lib/preview/workspace-domain';
import { AutomationOverview } from './automation-overview';
import { TemplatesGallery } from './templates-gallery';
import { WorkflowEditor } from './workflow-editor';
import { WorkflowList } from './workflow-list';

/** The Automation workspace: overview, templates, and the merchant's configured workflows. */
export function AutomationWorkspace({ now }: { now: number }) {
  const { state, dispatch } = useWorkspaceConfig();
  const toast = useToast();
  const [editing, setEditing] = useState<{
    automation: Automation | null;
    template: AutomationTemplate | null;
  } | null>(null);

  const save = (draft: AutomationDraft) => {
    if (editing?.automation) {
      dispatch({ type: 'updateAutomation', id: editing.automation.id, draft });
      toast({ title: 'Automation updated' });
    } else {
      dispatch({ type: 'createAutomation', draft, templateId: editing?.template?.id ?? null });
      toast({
        title: 'Automation created',
        description: 'It starts as a draft until you activate it.',
      });
    }
  };

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <AutomationOverview automations={state.automations} />
      <TemplatesGallery
        templates={AUTOMATION_TEMPLATES}
        onUse={(template) => {
          setEditing({ automation: null, template });
        }}
      />
      <WorkflowList
        automations={state.automations}
        now={now}
        onToggle={(automation) => {
          dispatch({
            type: 'setAutomationStatus',
            id: automation.id,
            status: automation.status === 'active' ? 'paused' : 'active',
          });
        }}
        onEdit={(automation) => {
          setEditing({ automation, template: null });
        }}
        onSimulate={(automation) => {
          dispatch({ type: 'simulateAutomation', id: automation.id });
          toast({
            title: 'Test run recorded',
            description: 'See what it would have done in the automation’s history.',
          });
        }}
        onDelete={(automation) => {
          dispatch({ type: 'deleteAutomation', id: automation.id });
          toast({ title: 'Automation deleted' });
        }}
      />
      <WorkflowEditor
        open={editing !== null}
        automation={editing?.automation ?? null}
        template={editing?.template ?? null}
        onSave={save}
        onClose={() => {
          setEditing(null);
        }}
      />
    </div>
  );
}
