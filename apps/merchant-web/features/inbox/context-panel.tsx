'use client';

import { Icon } from '@krinly/ui/components/icon';
import { Money } from '@krinly/ui/patterns/money';
import { InfoGrid, NextAction } from '@krinly/ui/patterns/signals';
import { ActivityTimeline } from '@krinly/ui/patterns/timeline';
import { StagePill } from '@krinly/ui/patterns/thread';
import Link from 'next/link';
import type { Conversation } from '@/lib/preview/inbox';
import { dueInfo, fullDate, inDays, weekdayDayMonth } from '@/lib/preview/format';
import { timelineFor } from '@/lib/preview/selectors';
import type { LabData, MemberId } from '@/lib/preview/domain';
import { SERVICES, SOURCES } from '@/lib/preview/sample/scenario';
import { OwnerMenu } from '@/features/crm/owner-menu';
import { activityIcon, actorName, channelText, SOURCE_ICON } from '@/features/crm/lead-bits';

const STAGE_TONE: Record<string, 0 | 1 | 2 | 3 | 4 | 'lost'> = {
  new: 0,
  contacted: 1,
  interested: 2,
  ready: 3,
  booked: 4,
  lost: 'lost',
};

/** Linked CRM context: stage, value, requirements, owner, source and recent activity. */
export function ContextPanel({
  conversation,
  data,
  now,
  onAssignOwner,
}: {
  conversation: Conversation | undefined;
  data: LabData;
  now: number;
  onAssignOwner: (leadId: string, owner: MemberId) => void;
}) {
  if (!conversation) return null;
  const { lead } = conversation;
  const due = lead.next ? dueInfo(lead.next.due, now) : null;
  const activity = timelineFor(data, lead.id).slice(0, 6);

  return (
    <div className="grid gap-4 p-4">
      <div>
        <p className="text-xs font-semibold text-ink-3">Stage</p>
        <div className="mt-1.5 flex items-center gap-2">
          <StagePill
            label={lead.stage === 'lost' ? 'Lost' : stageLabel(lead.stage)}
            tone={STAGE_TONE[lead.stage] ?? 0}
          />
          <Link
            href={`/preview/crm?lead=${lead.id}`}
            className="text-[12.5px] font-semibold text-accent-strong underline-offset-2 hover:underline"
          >
            Open CRM record
          </Link>
        </div>
      </div>

      <InfoGrid
        columns={1}
        className="gap-3.5"
        items={[
          {
            label: 'Commercial value',
            value: lead.value ? <Money amount={lead.value} /> : 'Not quoted',
          },
          {
            label: lead.eventLabel,
            value:
              lead.eventDate !== undefined
                ? `${fullDate(lead.eventDate)} (${inDays(lead.eventDate, now)})`
                : 'Date not set',
          },
          { label: 'Interested in', value: SERVICES[lead.service].label },
          {
            label: 'Source',
            value: (
              <>
                <Icon
                  name={SOURCE_ICON[lead.source]}
                  size={13}
                  className="mr-1 inline -translate-y-px text-ink-3"
                />
                {SOURCES[lead.source].label}
                {lead.sourceDetail ? (
                  <span className="block text-xs font-normal text-ink-3">{lead.sourceDetail}</span>
                ) : null}
              </>
            ),
          },
          {
            label: 'Owner',
            value: (
              <OwnerMenu
                owner={lead.owner}
                onAssign={(owner) => {
                  onAssignOwner(lead.id, owner);
                }}
              />
            ),
          },
        ]}
      />

      {lead.next ? (
        <div>
          <p className="text-xs font-semibold text-ink-3">Follow-up</p>
          <NextAction
            className="mt-1.5 w-full bg-canvas"
            label={lead.next.label}
            due={due?.label}
            state={
              due?.tone === 'overdue' ? 'overdue' : due?.tone === 'today' ? 'today' : 'upcoming'
            }
          />
        </div>
      ) : null}

      <div>
        <p className="text-xs font-semibold text-ink-3">Recent activity</p>
        <ActivityTimeline
          className="mt-2"
          label="Recent activity"
          items={activity.map((a) => ({
            id: a.id,
            icon: activityIcon(a),
            title: a.text,
            meta: `${actorName(a, lead)}${a.channel ? ` · ${channelText(a)}` : ''} · ${weekdayDayMonth(a.at)}`,
            highlight: a.by === 'customer',
          }))}
        />
      </div>
    </div>
  );
}

function stageLabel(stage: string): string {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}
