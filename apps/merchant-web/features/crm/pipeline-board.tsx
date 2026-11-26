'use client';

import { Avatar } from '@krinly/ui/components/avatar';
import { IconButton } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import { PipelineBoard, PipelineCard, PipelineColumn } from '@krinly/ui/patterns/pipeline';
import type { StageTone } from '@krinly/ui/patterns/thread';
import { type Lead, STAGE_LABEL, type Stage } from '@/lib/preview/domain';
import { dayMonth, inr, inrCompact } from '@/lib/preview/format';
import type { CrmModel } from '@/lib/preview/crm-model';
import { SERVICES, TEAM } from '@/lib/preview/sample/scenario';
import { NextText } from './next-text';
import { StageMenu } from './stage-menu';

const COLUMN_TONE: Record<string, StageTone> = {
  new: 0,
  contacted: 1,
  interested: 2,
  ready: 3,
  booked: 4,
  lost: 'lost',
};

/** Keyboard-accessible pipeline: every stage change goes through the menu on each card, so it
 * works without a pointer. No drag-and-drop engine — a reliable menu is enough for this phase. */
export function PipelineBoardView({
  model,
  onOpenLead,
  onChangeStage,
  onLost,
}: {
  model: CrmModel;
  onOpenLead: (leadId: string) => void;
  onChangeStage: (lead: Lead, stage: Stage) => void;
  onLost: (lead: Lead) => void;
}) {
  return (
    <PipelineBoard label="Pipeline" className="mt-5">
      {model.viewColumns.map((col) => {
        const total = col.leads.reduce((sum, l) => sum + l.value, 0);
        return (
          <PipelineColumn
            key={col.stage}
            title={STAGE_LABEL[col.stage]}
            count={col.leads.length}
            summary={total ? inrCompact(total) : undefined}
            tone={COLUMN_TONE[col.stage] ?? 0}
          >
            {col.leads.map((lead) => (
              <PipelineCard
                key={lead.id}
                title={lead.latinName ?? lead.name}
                subtitle={`${SERVICES[lead.service].short}${
                  lead.eventDate !== undefined ? ` · ${dayMonth(lead.eventDate)}` : ''
                }`}
                value={lead.value ? inr(lead.value) : '—'}
                onOpen={() => {
                  onOpenLead(lead.id);
                }}
                meta={
                  col.stage !== 'booked' && col.stage !== 'lost' ? (
                    <NextText lead={lead} now={model.now} />
                  ) : null
                }
                footer={
                  <>
                    <Avatar name={TEAM[lead.owner].name} seed={lead.owner} size={22} />
                    <StageMenu
                      value={lead.stage}
                      align="end"
                      label={`Move ${lead.latinName ?? lead.name}`}
                      onSelect={(stage) => {
                        onChangeStage(lead, stage);
                      }}
                      onLost={() => {
                        onLost(lead);
                      }}
                    >
                      <IconButton
                        label={`Move ${lead.latinName ?? lead.name} to another stage`}
                        size="icon-sm"
                        variant="ghost"
                        className="relative z-[1]"
                      >
                        <Icon name="more" size={16} />
                      </IconButton>
                    </StageMenu>
                  </>
                }
              />
            ))}
          </PipelineColumn>
        );
      })}
    </PipelineBoard>
  );
}
