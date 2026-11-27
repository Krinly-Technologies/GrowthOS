'use client';

import { Button, IconButton } from '@krinly/ui/components/button';
import { Field } from '@krinly/ui/components/field';
import { Input, Select, Textarea } from '@krinly/ui/components/input';
import { Dialog, DialogContent } from '@krinly/ui/components/overlay';
import { Icon } from '@krinly/ui/components/icon';
import { useState } from 'react';
import type { AutomationDraft } from '@/lib/preview/workspace-config';
import {
  ACTION_LABEL,
  type Automation,
  type AutomationActionConfig,
  type AutomationActionKind,
  type AutomationCondition,
  type AutomationTemplate,
  type AutomationTriggerId,
  TRIGGER_LABEL,
} from '@/lib/preview/workspace-domain';

const TRIGGER_IDS = Object.keys(TRIGGER_LABEL) as AutomationTriggerId[];
const ACTION_IDS = Object.keys(ACTION_LABEL) as AutomationActionKind[];

let localSeq = 0;
function nextId(prefix: string) {
  localSeq += 1;
  return `${prefix}-${localSeq}`;
}

function draftFrom(
  automation: Automation | null,
  template: AutomationTemplate | null,
): AutomationDraft {
  if (automation) {
    return {
      name: automation.name,
      description: automation.description,
      trigger: automation.trigger,
      conditions: automation.conditions,
      actions: automation.actions,
    };
  }
  if (template) {
    return {
      name: template.name,
      description: template.description,
      trigger: template.trigger,
      conditions: template.conditions,
      actions: template.actions,
    };
  }
  return { name: '', description: '', trigger: 'new_enquiry', conditions: [], actions: [] };
}

/**
 * Create or edit an automation. Kept deliberately simple — a trigger, optional conditions in
 * words, and a list of actions — so a merchant can configure this without understanding
 * orchestration concepts. Nothing here sends a real message or runs on a real schedule.
 */
export function WorkflowEditor({
  open,
  automation,
  template,
  onSave,
  onClose,
}: {
  open: boolean;
  /** null when creating. */
  automation: Automation | null;
  /** Seeds a new automation from a template; ignored when editing. */
  template: AutomationTemplate | null;
  onSave: (draft: AutomationDraft) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<AutomationDraft>(() => draftFrom(automation, template));
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(draftFrom(automation, template));
  }

  const valid = draft.name.trim() !== '' && draft.actions.length > 0;

  const updateCondition = (id: string, patch: Partial<AutomationCondition>) => {
    setDraft((d) => ({
      ...d,
      conditions: d.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };
  const updateAction = (id: string, patch: Partial<AutomationActionConfig>) => {
    setDraft((d) => ({
      ...d,
      actions: d.actions.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        size="lg"
        title={automation ? 'Edit automation' : 'New automation'}
        description="A simulated workflow — it never sends a real message or touches production records."
        footer={
          <>
            <Button variant="ghost" shape="pill" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="brand"
              shape="pill"
              disabled={!valid}
              onClick={() => {
                onSave(draft);
                onClose();
              }}
            >
              Save automation
            </Button>
          </>
        }
      >
        <div className="grid gap-5">
          <Field label="Name">
            <Input
              value={draft.name}
              onChange={(e) => {
                setDraft((d) => ({ ...d, name: e.target.value }));
              }}
              placeholder="e.g. Follow-up reminder"
            />
          </Field>
          <Field label="Description" hint="Shown on the automation list.">
            <Textarea
              rows={2}
              value={draft.description}
              onChange={(e) => {
                setDraft((d) => ({ ...d, description: e.target.value }));
              }}
            />
          </Field>
          <Field label="Trigger" hint="What starts this automation.">
            <Select
              value={draft.trigger}
              onChange={(e) => {
                setDraft((d) => ({ ...d, trigger: e.target.value as AutomationTriggerId }));
              }}
            >
              {TRIGGER_IDS.map((id) => (
                <option key={id} value={id}>
                  {TRIGGER_LABEL[id]}
                </option>
              ))}
            </Select>
          </Field>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-ink">
                Conditions <span className="font-normal text-ink-3">(optional)</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft((d) => ({
                    ...d,
                    conditions: [
                      ...d.conditions,
                      { id: nextId('c'), field: 'Lead value', operator: 'greater_than', value: '' },
                    ],
                  }));
                }}
              >
                <Icon name="plus" size={14} /> Add condition
              </Button>
            </div>
            <div className="mt-2 grid gap-2">
              {draft.conditions.map((condition) => (
                <div key={condition.id} className="flex flex-wrap items-center gap-2">
                  <Input
                    value={condition.field}
                    onChange={(e) => {
                      updateCondition(condition.id, { field: e.target.value });
                    }}
                    className="w-40"
                    placeholder="Field, in words"
                  />
                  <Select
                    value={condition.operator}
                    onChange={(e) => {
                      updateCondition(condition.id, {
                        operator: e.target.value as AutomationCondition['operator'],
                      });
                    }}
                    className="w-40"
                  >
                    <option value="equals">is</option>
                    <option value="greater_than">is more than</option>
                    <option value="less_than">is less than</option>
                    <option value="contains">contains</option>
                  </Select>
                  <Input
                    value={condition.value}
                    onChange={(e) => {
                      updateCondition(condition.id, { value: e.target.value });
                    }}
                    className="w-32"
                    placeholder="Value"
                  />
                  <IconButton
                    label="Remove condition"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setDraft((d) => ({
                        ...d,
                        conditions: d.conditions.filter((c) => c.id !== condition.id),
                      }));
                    }}
                  >
                    <Icon name="close" size={14} />
                  </IconButton>
                </div>
              ))}
              {draft.conditions.length === 0 ? (
                <p className="text-[13px] text-ink-3">Runs every time the trigger happens.</p>
              ) : null}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-ink">Actions</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft((d) => ({
                    ...d,
                    actions: [...d.actions, { id: nextId('a'), kind: 'notify_team', detail: '' }],
                  }));
                }}
              >
                <Icon name="plus" size={14} /> Add action
              </Button>
            </div>
            <div className="mt-2 grid gap-2">
              {draft.actions.map((action) => (
                <div key={action.id} className="flex flex-wrap items-start gap-2">
                  <Select
                    value={action.kind}
                    onChange={(e) => {
                      updateAction(action.id, { kind: e.target.value as AutomationActionKind });
                    }}
                    className="w-56"
                  >
                    {ACTION_IDS.map((id) => (
                      <option key={id} value={id}>
                        {ACTION_LABEL[id]}
                      </option>
                    ))}
                  </Select>
                  <Input
                    value={action.detail}
                    onChange={(e) => {
                      updateAction(action.id, { detail: e.target.value });
                    }}
                    className="min-w-0 flex-1"
                    placeholder="What it says or does, in words"
                  />
                  <IconButton
                    label="Remove action"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setDraft((d) => ({
                        ...d,
                        actions: d.actions.filter((a) => a.id !== action.id),
                      }));
                    }}
                  >
                    <Icon name="close" size={14} />
                  </IconButton>
                </div>
              ))}
              {draft.actions.length === 0 ? (
                <p className="text-[13px] text-critical">Add at least one action.</p>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
