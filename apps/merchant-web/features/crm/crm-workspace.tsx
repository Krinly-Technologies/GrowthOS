'use client';

import { Button } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import { SearchField } from '@krinly/ui/components/input';
import { SegmentedControl } from '@krinly/ui/components/tabs';
import { FilterToolbar } from '@krinly/ui/patterns/filter-toolbar';
import { useEffect, useRef, useState } from 'react';
import {
  type MemberId,
  type NextActionKind,
  type Stage,
  STAGE_LABEL,
  STAGES,
} from '@/lib/preview/domain';
import { inrCompact, plural } from '@/lib/preview/format';
import type { CrmModel } from '@/lib/preview/crm-model';
import { SAVED_VIEWS } from '@/lib/preview/selectors';
import { MEMBER_IDS, SOURCE_IDS, SOURCES, TEAM } from '@/lib/preview/sample/scenario';
import type { LeadDraft } from '@/lib/preview/store';
import { FilterMenu } from './filter-menu';
import { LeadDetailSheet } from './lead-detail';
import { LeadFormDialog } from './lead-form-dialog';
import { LeadsList } from './leads-list';
import { LostDialog } from './lost-dialog';
import { PipelineBoardView } from './pipeline-board';

export interface CrmActions {
  createLead: (draft: LeadDraft) => void;
  updateLead: (leadId: string, draft: LeadDraft) => void;
  changeStage: (leadId: string, to: Stage) => void;
  reopenLead: (leadId: string) => void;
  markLost: (leadId: string, reason: string) => void;
  assignOwner: (leadId: string, owner: MemberId) => void;
  addNote: (leadId: string, text: string) => void;
  logCall: (leadId: string) => void;
  completeFollowUp: (leadId: string) => void;
  setFollowUp: (leadId: string, label: string, due: number, kind: NextActionKind) => void;
}

/**
 * CRM: leads, their journey through the pipeline, and the work that follows — switching between
 * a structured list and a pipeline board, filtering, and the actions that move a lead forward.
 *
 * Everything on screen comes from one `model`, and every mutation goes out through `actions` —
 * so connecting this to a real API means replacing the caller in the page, not this screen.
 */
export function CrmWorkspace({ model, actions }: { model: CrmModel; actions: CrmActions }) {
  const [text, setText] = useState(model.query.q);
  const [prevQ, setPrevQ] = useState(model.query.q);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keep the field in sync when the query changes from outside this component (Back, Clear all),
  // without calling setState from an effect: adjust during render, React's recommended pattern.
  if (model.query.q !== prevQ) {
    setPrevQ(model.query.q);
    setText(model.query.q);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
      )
        return;
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const editingLead = editing ? model.byId.get(editing) : null;

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hidden font-display text-[28px] leading-tight md:block">Leads</h1>
          <p className="text-sm text-ink-3">
            {plural(model.openCount, 'open lead')} · {inrCompact(model.openValue)} in play
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl
            label="Layout"
            value={model.query.view}
            onValueChange={(view) => {
              model.setQuery({ view });
            }}
            options={[
              {
                value: 'list',
                label: (
                  <>
                    <Icon name="list" size={15} />
                    List
                  </>
                ),
              },
              {
                value: 'board',
                label: (
                  <>
                    <Icon name="board" size={15} />
                    Pipeline
                  </>
                ),
              },
            ]}
          />
          <Button
            variant="brand"
            shape="pill"
            onClick={() => {
              setCreating(true);
            }}
          >
            <Icon name="plus" size={16} />
            New lead
          </Button>
        </div>
      </header>

      <nav aria-label="Smart views" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {SAVED_VIEWS.map((view) => {
          const active = model.query.saved === view.id;
          return (
            <button
              key={view.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                model.setQuery({ saved: view.id });
              }}
              className={
                active
                  ? 'inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-semibold whitespace-nowrap text-white'
                  : 'inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-surface px-4 text-[13.5px] font-semibold whitespace-nowrap text-ink-2 shadow-ring hover:text-ink'
              }
            >
              {view.label}
              <span
                className={
                  active
                    ? 'tnum rounded-full bg-white/15 px-1.5 text-xs text-mint'
                    : 'tnum rounded-full bg-canvas px-1.5 text-xs text-ink-3'
                }
              >
                {model.counts[view.id]}
              </span>
            </button>
          );
        })}
      </nav>

      <FilterToolbar
        start={
          <SearchField
            ref={searchRef}
            label="Search leads"
            placeholder="Search by name, phone or area"
            shortcut="/"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              model.setQuery({ q: e.target.value });
            }}
          />
        }
        filters={
          <>
            <FilterMenu
              label="Source"
              options={SOURCE_IDS.map((s) => ({ value: s, label: SOURCES[s].label }))}
              selected={model.query.sources}
              onChange={(sources) => {
                model.setQuery({ sources });
              }}
            />
            <FilterMenu
              label="Owner"
              options={MEMBER_IDS.map((id) => ({ value: id, label: TEAM[id].name }))}
              selected={model.query.owners}
              onChange={(owners) => {
                model.setQuery({ owners });
              }}
            />
            <FilterMenu
              label="Stage"
              options={STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] }))}
              selected={model.query.stages}
              onChange={(stages) => {
                model.setQuery({ stages });
              }}
            />
          </>
        }
        resultSummary={plural(model.filtered.length, 'lead')}
        active={
          model.hasFilters
            ? [
                {
                  key: 'filters',
                  label: 'Filters applied',
                  removeLabel: 'Clear all filters',
                  onRemove: model.clearFilters,
                },
              ]
            : []
        }
        onClearAll={model.hasFilters ? model.clearFilters : undefined}
      />

      {model.query.view === 'board' ? (
        <PipelineBoardView
          model={model}
          onOpenLead={model.openLead}
          onChangeStage={(lead, stage) => {
            actions.changeStage(lead.id, stage);
          }}
          onLost={(lead) => {
            model.setLostLead(lead);
          }}
        />
      ) : (
        <LeadsList model={model} onOpenLead={model.openLead} onClearFilters={model.clearFilters} />
      )}

      <LeadDetailSheet
        lead={model.selected}
        model={model}
        onClose={model.closeLead}
        onEdit={(lead) => {
          setEditing(lead.id);
        }}
        onChangeStage={(lead, stage) => {
          actions.changeStage(lead.id, stage);
        }}
        onReopen={(lead) => {
          actions.reopenLead(lead.id);
        }}
        onLost={(lead) => {
          model.setLostLead(lead);
        }}
        onAssignOwner={(lead, owner) => {
          actions.assignOwner(lead.id, owner);
        }}
        onAddNote={(lead, noteText) => {
          actions.addNote(lead.id, noteText);
        }}
        onLogCall={(lead) => {
          actions.logCall(lead.id);
        }}
        onCompleteFollowUp={(lead) => {
          actions.completeFollowUp(lead.id);
        }}
        onSetFollowUp={(lead, label, due, kind) => {
          actions.setFollowUp(lead.id, label, due, kind);
        }}
      />

      <LeadFormDialog
        open={creating}
        lead={null}
        onSave={actions.createLead}
        onClose={() => {
          setCreating(false);
        }}
      />
      <LeadFormDialog
        open={Boolean(editingLead)}
        lead={editingLead ?? null}
        onSave={(draft) => {
          if (editing) actions.updateLead(editing, draft);
        }}
        onClose={() => {
          setEditing(null);
        }}
      />

      <LostDialog
        lead={model.lostLead}
        onConfirm={(reason) => {
          if (model.lostLead) actions.markLost(model.lostLead.id, reason);
          model.setLostLead(null);
        }}
        onClose={() => {
          model.setLostLead(null);
        }}
      />
    </div>
  );
}
