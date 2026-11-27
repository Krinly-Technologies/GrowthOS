'use client';

import { Card, CardTitle } from '@krinly/ui/components/card';
import { Choice, Field } from '@krinly/ui/components/field';
import { Select, Textarea, Input } from '@krinly/ui/components/input';
import type { AssistantConfig } from '@/lib/preview/workspace-domain';
import { TONE_LABEL } from '@/lib/preview/workspace-domain';
import { StringListEditor } from './string-list-editor';

const TONE_IDS = Object.keys(TONE_LABEL) as AssistantConfig['tone'][];
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali'];
const APPROVAL_ACTIONS = [
  'Sending a quotation',
  'Confirming a booking',
  'Recording a payment',
  'Marking a lead as lost',
];

/**
 * Merchant-facing AI configuration. Deliberately stops at identity, tone, context and reply
 * preferences — no raw model parameters, provider keys or autonomous capabilities are exposed
 * (see CLAUDE.md: AI output is a proposal, never a business mutation).
 */
export function AssistantConfigForm({
  config,
  onChange,
}: {
  config: AssistantConfig;
  onChange: (next: AssistantConfig) => void;
}) {
  return (
    <div className="grid gap-5 sm:gap-6">
      <Card padding="lg" aria-labelledby="assistant-identity-heading" className="min-w-0">
        <CardTitle id="assistant-identity-heading" className="text-xl">
          Identity & purpose
        </CardTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Assistant name">
            <Input
              value={config.name}
              onChange={(e) => {
                onChange({ ...config, name: e.target.value });
              }}
            />
          </Field>
          <Field label="Tone">
            <Select
              value={config.tone}
              onChange={(e) => {
                onChange({ ...config, tone: e.target.value as AssistantConfig['tone'] });
              }}
            >
              {TONE_IDS.map((id) => (
                <option key={id} value={id}>
                  {TONE_LABEL[id]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label="Purpose"
          className="mt-4"
          hint="What the assistant is for, in one or two sentences."
        >
          <Textarea
            rows={2}
            value={config.purpose}
            onChange={(e) => {
              onChange({ ...config, purpose: e.target.value });
            }}
          />
        </Field>
        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-ink">Supported languages</legend>
          <div className="mt-2 grid gap-0.5 sm:grid-cols-3">
            {LANGUAGES.map((lang) => (
              <Choice
                key={lang}
                label={lang}
                checked={config.languages.includes(lang)}
                onChange={() => {
                  onChange({
                    ...config,
                    languages: config.languages.includes(lang)
                      ? config.languages.filter((l) => l !== lang)
                      : [...config.languages, lang],
                  });
                }}
              />
            ))}
          </div>
        </fieldset>
      </Card>

      <Card padding="lg" aria-labelledby="assistant-context-heading" className="min-w-0">
        <CardTitle id="assistant-context-heading" className="text-xl">
          Business context & reply preferences
        </CardTitle>
        <Field
          label="Business context"
          className="mt-4"
          hint="What the assistant should know about your business."
        >
          <Textarea
            rows={3}
            value={config.businessContext}
            onChange={(e) => {
              onChange({ ...config, businessContext: e.target.value });
            }}
          />
        </Field>
        <Field
          label="Reply preferences"
          className="mt-4"
          hint="How replies should read — length, what to avoid, what to always do."
        >
          <Textarea
            rows={3}
            value={config.replyPreferences}
            onChange={(e) => {
              onChange({ ...config, replyPreferences: e.target.value });
            }}
          />
        </Field>
      </Card>

      <Card padding="lg" aria-labelledby="assistant-qualification-heading" className="min-w-0">
        <CardTitle id="assistant-qualification-heading" className="text-xl">
          Qualification questions
        </CardTitle>
        <p className="mt-1 text-sm text-ink-2">
          Asked one at a time to understand a new enquiry before a teammate steps in.
        </p>
        <div className="mt-4">
          <StringListEditor
            items={config.qualificationQuestions}
            onChange={(next) => {
              onChange({ ...config, qualificationQuestions: next });
            }}
            addLabel="Add question"
            placeholder="e.g. What is your budget range?"
          />
        </div>
      </Card>

      <Card padding="lg" aria-labelledby="assistant-handoff-heading" className="min-w-0">
        <CardTitle id="assistant-handoff-heading" className="text-xl">
          Human handoff conditions
        </CardTitle>
        <p className="mt-1 text-sm text-ink-2">
          When the assistant should stop and route to a teammate.
        </p>
        <div className="mt-4">
          <StringListEditor
            items={config.handoffConditions}
            onChange={(next) => {
              onChange({ ...config, handoffConditions: next });
            }}
            addLabel="Add condition"
            placeholder="e.g. Customer mentions a complaint"
          />
        </div>
      </Card>

      <Card padding="lg" aria-labelledby="assistant-approval-heading" className="min-w-0">
        <CardTitle id="assistant-approval-heading" className="text-xl">
          Approval requirements
        </CardTitle>
        <p className="mt-1 text-sm text-ink-2">
          These always need a teammate&rsquo;s approval — the assistant can propose but never act
          alone.
        </p>
        <div className="mt-3 grid gap-0.5">
          {APPROVAL_ACTIONS.map((action) => (
            <Choice
              key={action}
              label={action}
              checked={config.requireApprovalFor.includes(action)}
              onChange={() => {
                onChange({
                  ...config,
                  requireApprovalFor: config.requireApprovalFor.includes(action)
                    ? config.requireApprovalFor.filter((a) => a !== action)
                    : [...config.requireApprovalFor, action],
                });
              }}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
