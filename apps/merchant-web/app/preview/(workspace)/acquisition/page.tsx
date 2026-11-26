'use client';

import { Skeleton } from '@krinly/ui/components/feedback';
import { Suspense } from 'react';
import {
  AcquisitionWorkspace,
  parseAcquisitionTab,
} from '@/features/acquisition/acquisition-workspace';
import { useAcquisitionModel } from '@/lib/preview/acquisition-model';
import { usePreview } from '@/lib/preview/store';
import { useParam } from '@/lib/preview/url-state';

function Acquisition() {
  const { dispatch } = usePreview();
  const model = useAcquisitionModel();
  const { value: tab, setValue: setTab } = useParam('tab', 'overview');
  const { value: form, setValue: setForm } = useParam('form', '');

  return (
    <AcquisitionWorkspace
      model={model}
      tab={parseAcquisitionTab(tab)}
      onTabChange={(next) => {
        setTab(next, 'push');
      }}
      editingFormId={form === '' ? null : form}
      onEditForm={(formId) => {
        setForm(formId ?? '', 'push');
      }}
      actions={{
        toggleSource: (sourceId) => {
          dispatch({ type: 'toggleSource', sourceId });
        },
        addSource: (label) => {
          dispatch({ type: 'addSource', label });
        },
        createForm: (draft) => {
          dispatch({ type: 'createForm', draft });
        },
        updateForm: (formId, draft) => {
          dispatch({ type: 'updateForm', formId, draft });
        },
        toggleForm: (formId) => {
          dispatch({ type: 'toggleForm', formId });
        },
        createLink: (draft) => {
          dispatch({ type: 'createLink', draft });
        },
        toggleLink: (linkId) => {
          dispatch({ type: 'toggleLink', linkId });
        },
      }}
    />
  );
}

export default function AcquisitionPreviewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Acquisition />
    </Suspense>
  );
}
