'use client';

import { Card, CardTitle } from '@krinly/ui/components/card';
import { useToast } from '@krinly/ui/components/toast';
import { useState } from 'react';
import type { Payment, SourceId } from '@/lib/preview/domain';
import { inr } from '@/lib/preview/format';
import {
  type AttentionGroup,
  type AttentionItem,
  buildAttention,
  type TodayModel,
} from '@/lib/preview/today-model';
import { DaySection } from './day';
import { FlowSection } from './flow';
import { TodayHero } from './hero';
import { MoneySection } from './money';
import {
  LeadGroupSheet,
  LeadSheet,
  ReviewPaymentsDialog,
  SourceSheet,
  VerifiedPaymentsSheet,
  VerifyPaymentDialog,
} from './records';
import { SourcesSection } from './sources';
import { ActionQueue } from './up-next';

/**
 * Today: what needs the owner now, how much verified money came in, how the current cohort is
 * moving, the shape of the day, and where customers came from.
 *
 * Everything the screen shows arrives as one view-model, and every mutation goes out through a
 * callback — so connecting it to a real API means replacing the caller, not this screen.
 */
export function TodayDashboard({
  model,
  acquisitionHref,
  onVerifyPayment,
  onUndo,
}: {
  model: TodayModel;
  acquisitionHref: string;
  onVerifyPayment: (paymentId: string) => void;
  onUndo?: () => void;
}) {
  const toast = useToast();
  const items = buildAttention(model);
  const [queueOpen, setQueueOpen] = useState(false);
  const [group, setGroup] = useState<AttentionGroup | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [source, setSource] = useState<SourceId | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [verifying, setVerifying] = useState<Payment | null>(null);
  const [showVerified, setShowVerified] = useState(false);

  const openReview = () => {
    const only = model.awaiting.payments[0];
    if (model.awaiting.payments.length === 1 && only) setVerifying(only);
    else if (model.awaiting.payments.length > 0) setReviewing(true);
    else toast({ title: 'Nothing is waiting to be verified', tone: 'info' });
  };

  const act = (item: AttentionItem) => {
    if (item.action.kind === 'verify') openReview();
    else setGroup(item.action.group);
  };

  const confirmVerify = (payment: Payment) => {
    setVerifying(null);
    onVerifyPayment(payment.id);
    toast({
      title: `${inr(payment.amount)} verified`,
      description: 'It now counts as revenue for today.',
      ...(onUndo ? { action: { label: 'Undo', onClick: onUndo } } : {}),
    });
  };

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <TodayHero
        model={model}
        items={items}
        onAct={act}
        onReviewPayments={openReview}
        onOpenGroup={setGroup}
        queueOpen={queueOpen}
        onToggleQueue={() => {
          setQueueOpen((open) => !open);
        }}
      />

      {queueOpen ? (
        <Card id="today-action-queue" padding="md" aria-labelledby="queue-heading">
          <CardTitle id="queue-heading" className="text-base">
            Everything that needs you, in order
          </CardTitle>
          <ActionQueue items={items} onAct={act} />
        </Card>
      ) : null}

      <MoneySection
        model={model}
        onReviewPayments={openReview}
        onShowPayments={() => {
          setShowVerified(true);
        }}
      />
      <DaySection model={model} onOpenLead={setLeadId} />
      <FlowSection model={model} />
      <SourcesSection model={model} acquisitionHref={acquisitionHref} onDrillSource={setSource} />

      <LeadGroupSheet
        group={group}
        model={model}
        onOpenLead={(id) => {
          setGroup(null);
          setLeadId(id);
        }}
        onClose={() => {
          setGroup(null);
        }}
      />
      <LeadSheet
        lead={leadId ? model.byId.get(leadId) : undefined}
        model={model}
        onClose={() => {
          setLeadId(null);
        }}
      />
      <SourceSheet
        source={source}
        model={model}
        onOpenLead={(id) => {
          setSource(null);
          setLeadId(id);
        }}
        onClose={() => {
          setSource(null);
        }}
      />
      <VerifiedPaymentsSheet
        open={showVerified}
        model={model}
        onClose={() => {
          setShowVerified(false);
        }}
      />
      <ReviewPaymentsDialog
        open={reviewing}
        model={model}
        onPick={(payment) => {
          setReviewing(false);
          setVerifying(payment);
        }}
        onClose={() => {
          setReviewing(false);
        }}
      />
      <VerifyPaymentDialog
        payment={verifying}
        model={model}
        onConfirm={confirmVerify}
        onClose={() => {
          setVerifying(null);
        }}
      />
    </div>
  );
}
