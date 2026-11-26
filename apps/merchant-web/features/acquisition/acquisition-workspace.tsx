'use client';

import { Icon } from '@krinly/ui/components/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@krinly/ui/components/tabs';
import type { AcquisitionModel } from '@/lib/preview/acquisition-model';
import type { FormDraft, LinkDraft } from '@/lib/preview/store';
import { FormEditor } from './form-editor';
import { FormsPanel } from './forms-panel';
import { LinksPanel } from './links-panel';
import { AcquisitionOverview } from './overview';
import { SourcesPanel } from './sources-panel';

const TABS = [
  { value: 'overview', label: 'Overview', icon: 'growth' },
  { value: 'sources', label: 'Sources', icon: 'layers' },
  { value: 'forms', label: 'Forms', icon: 'panel' },
  { value: 'links', label: 'Links & QR', icon: 'megaphone' },
] as const;

export type AcquisitionTab = (typeof TABS)[number]['value'];

export function parseAcquisitionTab(value: string | null): AcquisitionTab {
  return TABS.find((tab) => tab.value === value)?.value ?? 'overview';
}

export interface AcquisitionActions {
  toggleSource: (sourceId: string) => void;
  addSource: (label: string) => void;
  createForm: (draft: FormDraft) => void;
  updateForm: (formId: string, draft: FormDraft) => void;
  toggleForm: (formId: string) => void;
  createLink: (draft: LinkDraft) => void;
  toggleLink: (linkId: string) => void;
}

/**
 * The acquisition workspace: understand where customers come from (Overview), say how each
 * source is recorded (Sources), capture enquiries without typing (Forms), and attribute a
 * campaign (Links & QR).
 *
 * All data arrives as one view-model and every change leaves through `actions`, so the screens
 * connect to a real API by replacing the caller.
 */
export function AcquisitionWorkspace({
  model,
  tab,
  onTabChange,
  editingFormId,
  onEditForm,
  actions,
}: {
  model: AcquisitionModel;
  tab: AcquisitionTab;
  onTabChange: (tab: AcquisitionTab) => void;
  /** A form id, `'new'`, or null when the list is showing. */
  editingFormId: string | null;
  onEditForm: (formId: string | null) => void;
  actions: AcquisitionActions;
}) {
  const editing =
    editingFormId === null
      ? null
      : editingFormId === 'new'
        ? { form: undefined }
        : { form: model.forms.find((f) => f.id === editingFormId) };

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Acquisition</h1>
        <p className="mt-1 max-w-[76ch] text-sm text-ink-2">
          Where your customers come from, how each source is recorded, and the forms and links that
          bring enquiries in without anybody typing them.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(next) => {
          onTabChange(parseAcquisitionTab(next));
          onEditForm(null);
        }}
        className="grid min-w-0 gap-5 sm:gap-6"
      >
        <TabsList aria-label="Acquisition sections">
          {TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value} className="gap-1.5">
              <Icon name={item.icon} size={15} className="hidden sm:inline" />
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="min-w-0">
          <AcquisitionOverview model={model} />
        </TabsContent>

        <TabsContent value="sources" className="min-w-0">
          <SourcesPanel model={model} onToggle={actions.toggleSource} onAdd={actions.addSource} />
        </TabsContent>

        <TabsContent value="forms" className="min-w-0">
          {editing ? (
            <FormEditor
              form={editing.form}
              model={model}
              onSave={(draft) => {
                if (editing.form) actions.updateForm(editing.form.id, draft);
                else actions.createForm(draft);
                onEditForm(null);
              }}
              onCancel={() => {
                onEditForm(null);
              }}
            />
          ) : (
            <FormsPanel
              model={model}
              onNew={() => {
                onEditForm('new');
              }}
              onEdit={onEditForm}
              onToggle={actions.toggleForm}
            />
          )}
        </TabsContent>

        <TabsContent value="links" className="min-w-0">
          <LinksPanel model={model} onCreate={actions.createLink} onToggle={actions.toggleLink} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
