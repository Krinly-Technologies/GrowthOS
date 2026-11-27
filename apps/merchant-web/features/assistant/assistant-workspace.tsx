'use client';

import { useWorkspaceConfig } from '@/lib/preview/workspace-config';
import { AssistantConfigForm } from './assistant-config-form';
import { AssistantTest } from './assistant-test';

/** AI Assistant configuration: identity, tone, context, qualification and handoff rules. */
export function AssistantWorkspace() {
  const { state, dispatch } = useWorkspaceConfig();

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <h1 className="font-display text-xl font-semibold text-ink">AI assistant</h1>
      <p className="text-sm text-ink-2">
        Changes here apply immediately to the simulated test below — nothing is sent to a real model
        and no setting here can authorise a business action by itself.
      </p>
      <AssistantConfigForm
        config={state.assistant}
        onChange={(config) => {
          dispatch({ type: 'updateAssistant', config });
        }}
      />
      <AssistantTest config={state.assistant} />
    </div>
  );
}
