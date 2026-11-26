'use client';

import { Skeleton } from '@krinly/ui/components/feedback';
import { useToast } from '@krinly/ui/components/toast';
import { Suspense } from 'react';
import { InboxWorkspace } from '@/features/inbox/inbox-workspace';
import { useInboxModel } from '@/lib/preview/inbox-model';
import { usePreview } from '@/lib/preview/store';

function Inbox() {
  const { state, dispatch } = usePreview();
  const model = useInboxModel();
  const toast = useToast();

  const onUndo = () => {
    dispatch({ type: 'undo' });
  };

  return (
    <InboxWorkspace
      model={model}
      data={state.data}
      actions={{
        sendReply: (leadId, text) => {
          dispatch({ type: 'sendReply', leadId, text });
        },
        assign: (leadId, owner) => {
          dispatch({ type: 'assignConversation', leadId, owner });
        },
        assignOwner: (leadId, owner) => {
          dispatch({ type: 'assignOwner', leadId, owner });
        },
        resolve: (leadId) => {
          dispatch({ type: 'resolveConversation', leadId });
          toast({ title: 'Conversation resolved', action: { label: 'Undo', onClick: onUndo } });
        },
        reopen: (leadId) => {
          dispatch({ type: 'reopenConversation', leadId });
        },
        regenerateSuggestion: (leadId) => {
          dispatch({ type: 'regenerateSuggestion', leadId });
        },
        dismissSuggestion: (leadId) => {
          dispatch({ type: 'dismissSuggestion', leadId });
          toast({ title: 'Suggestion dismissed', action: { label: 'Undo', onClick: onUndo } });
        },
        escalateSuggestion: (leadId) => {
          dispatch({ type: 'escalateSuggestion', leadId });
          toast({
            title: 'Requested human assistance',
            description: 'Flagged for review in Needs review.',
            action: { label: 'Undo', onClick: onUndo },
          });
        },
        approveStage: (leadId) => {
          dispatch({ type: 'changeStage', leadId, to: 'ready' });
          toast({ title: 'Moved to Ready to book', action: { label: 'Undo', onClick: onUndo } });
        },
      }}
    />
  );
}

export default function InboxPreviewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Inbox />
    </Suspense>
  );
}
