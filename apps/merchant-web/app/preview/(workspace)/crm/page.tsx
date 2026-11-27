'use client';

import { Skeleton } from '@krinly/ui/components/feedback';
import { Suspense } from 'react';
import { CrmWorkspace } from '@/features/crm/crm-workspace';
import { useCrmModel } from '@/lib/preview/crm-model';
import { usePreview } from '@/lib/preview/store';

function Crm() {
  const { dispatch } = usePreview();
  const model = useCrmModel('list');

  return (
    <CrmWorkspace
      model={model}
      actions={{
        createLead: (draft) => {
          dispatch({ type: 'createLead', draft });
        },
        updateLead: (leadId, draft) => {
          dispatch({ type: 'updateLead', leadId, draft });
        },
        changeStage: (leadId, to) => {
          dispatch({ type: 'changeStage', leadId, to });
        },
        reopenLead: (leadId) => {
          dispatch({ type: 'reopenLead', leadId });
        },
        markLost: (leadId, reason) => {
          dispatch({ type: 'changeStage', leadId, to: 'lost', reason });
        },
        assignOwner: (leadId, owner) => {
          dispatch({ type: 'assignOwner', leadId, owner });
        },
        addNote: (leadId, text) => {
          dispatch({ type: 'addNote', leadId, text });
        },
        logCall: (leadId) => {
          dispatch({ type: 'logCall', leadId, text: 'Called the customer.' });
        },
        completeFollowUp: (leadId) => {
          dispatch({ type: 'completeFollowUp', leadId });
        },
        setFollowUp: (leadId, label, due, kind) => {
          dispatch({ type: 'setFollowUp', leadId, label, due, kind });
        },
        createBooking: (leadId, draft) => {
          dispatch({ type: 'createBooking', leadId, draft, status: 'confirmed' });
        },
        requestPayment: (leadId, amount, kind) => {
          dispatch({ type: 'requestPayment', leadId, amount, kind });
        },
        recordPayment: (leadId, amount, method, reference, kind) => {
          dispatch({ type: 'recordPayment', leadId, amount, method, reference, kind });
        },
      }}
    />
  );
}

export default function CrmPreviewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Crm />
    </Suspense>
  );
}
