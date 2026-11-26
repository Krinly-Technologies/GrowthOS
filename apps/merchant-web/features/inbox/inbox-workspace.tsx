'use client';

import { IconButton } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import { Sheet, SheetContent, SheetTitle } from '@krinly/ui/components/overlay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@krinly/ui/components/tabs';
import { cn } from '@krinly/ui/lib/utils';
import { useEffect, useRef, useState } from 'react';
import type { LabData, MemberId } from '@/lib/preview/domain';
import type { InboxModel } from '@/lib/preview/inbox-model';
import { AiAssistPanel } from './ai-assist-panel';
import { ConversationList } from './conversation-list';
import { ContextPanel } from './context-panel';
import { MessageThread } from './message-thread';

// The shared shell's banner (the development-preview notice) and header have no fixed height, so
// a viewport-minus-fixed-chrome calc drifts. Measuring the container's own offset is the only way
// to reliably fill "the rest of the screen" above the mobile bottom nav without drift or overlap.
function useFillRemainingHeight() {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{ height: string } | undefined>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const top = el.getBoundingClientRect().top;
      const mobile = window.innerWidth < 768; // Tailwind `md`
      const bottomNav = mobile ? 'calc(64px + env(safe-area-inset-bottom))' : '0px';
      setStyle({ height: `calc(100svh - ${top.toString()}px - ${bottomNav})` });
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
    };
  }, []);

  return { ref, style };
}

export interface InboxActions {
  sendReply: (leadId: string, text: string) => void;
  assign: (leadId: string, owner: MemberId | null) => void;
  assignOwner: (leadId: string, owner: MemberId) => void;
  resolve: (leadId: string) => void;
  reopen: (leadId: string) => void;
  regenerateSuggestion: (leadId: string) => void;
  dismissSuggestion: (leadId: string) => void;
  escalateSuggestion: (leadId: string) => void;
  approveStage: (leadId: string) => void;
}

/**
 * Unified inbox: a three-panel desktop layout (conversations, workspace, customer context +
 * AI assist), collapsing to a list-then-conversation flow below `lg`. Everything on screen comes
 * from one `model`, and every mutation goes out through `actions`.
 */
export function InboxWorkspace({
  model,
  data,
  actions,
}: {
  model: InboxModel;
  data: LabData;
  actions: InboxActions;
}) {
  const [rightOpen, setRightOpen] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<'assist' | 'context' | null>(null);
  const selected = model.selected;
  const { ref: fillRef, style: fillStyle } = useFillRemainingHeight();

  return (
    <div
      ref={fillRef}
      style={fillStyle}
      className="flex h-[70vh] min-h-[420px] overflow-hidden rounded-2xl bg-surface shadow-ring"
    >
      <div
        className={cn(
          'w-full shrink-0 border-r border-line md:w-[320px]',
          selected ? 'hidden md:flex' : 'flex',
        )}
      >
        <ConversationList model={model} className="w-full" />
      </div>

      <div className={cn('min-w-0 flex-1', selected ? 'flex' : 'hidden md:flex')}>
        <div className="flex min-h-0 w-full flex-col">
          {selected ? (
            <div className="flex items-center gap-1 border-b border-line px-2 py-1.5 md:hidden">
              <IconButton
                label="Back to conversations"
                variant="ghost"
                size="icon-sm"
                onClick={model.closeConversation}
              >
                <Icon name="chevron-left" size={18} />
              </IconButton>
            </div>
          ) : null}
          <MessageThread
            conversation={selected}
            now={model.now}
            onSendReply={actions.sendReply}
            onAssign={actions.assign}
            onResolve={actions.resolve}
            onReopen={actions.reopen}
            onOpenAssist={() => {
              setMobilePanel('assist');
            }}
            onOpenContext={() => {
              setMobilePanel('context');
            }}
          />
        </div>
      </div>

      {selected ? (
        <div
          className={cn(
            'hidden shrink-0 flex-col border-l border-line xl:flex',
            rightOpen ? 'w-[360px]' : 'w-11',
          )}
        >
          {rightOpen ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-end border-b border-line p-1.5">
                <IconButton
                  label="Collapse panel"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setRightOpen(false);
                  }}
                >
                  <Icon name="panel" size={16} />
                </IconButton>
              </div>
              <Tabs defaultValue="assist" className="flex min-h-0 flex-1 flex-col">
                <TabsList className="mx-4 mt-3 self-start">
                  <TabsTrigger value="assist">AI assist</TabsTrigger>
                  <TabsTrigger value="context">Customer</TabsTrigger>
                </TabsList>
                <TabsContent value="assist" className="min-h-0 flex-1 overflow-y-auto">
                  <AiAssistPanel
                    conversation={selected}
                    onAccept={actions.sendReply}
                    onSendEdited={actions.sendReply}
                    onRegenerate={actions.regenerateSuggestion}
                    onDismiss={actions.dismissSuggestion}
                    onEscalate={actions.escalateSuggestion}
                    onApproveStage={actions.approveStage}
                  />
                </TabsContent>
                <TabsContent value="context" className="min-h-0 flex-1 overflow-y-auto">
                  <ContextPanel
                    conversation={selected}
                    data={data}
                    now={model.now}
                    onAssignOwner={actions.assignOwner}
                  />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setRightOpen(true);
              }}
              aria-label="Expand customer and AI panel"
              className="flex h-full flex-col items-center gap-2 py-4 text-ink-3 hover:text-ink"
            >
              <Icon name="chevron-left" size={16} />
            </button>
          )}
        </div>
      ) : null}

      <Sheet
        open={mobilePanel !== null}
        onOpenChange={(open) => {
          if (!open) setMobilePanel(null);
        }}
      >
        {selected ? (
          <SheetContent variant="floating" width="md" label="AI assist and customer details">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <SheetTitle className="font-display text-base font-semibold">
                {mobilePanel === 'context' ? 'Customer' : 'AI assist'}
              </SheetTitle>
            </div>
            <Tabs
              value={mobilePanel ?? 'assist'}
              onValueChange={(v) => {
                setMobilePanel(v === 'context' ? 'context' : 'assist');
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList className="mx-4 mt-3 self-start">
                <TabsTrigger value="assist">AI assist</TabsTrigger>
                <TabsTrigger value="context">Customer</TabsTrigger>
              </TabsList>
              <TabsContent value="assist" className="min-h-0 flex-1 overflow-y-auto">
                <AiAssistPanel
                  conversation={selected}
                  onAccept={actions.sendReply}
                  onSendEdited={actions.sendReply}
                  onRegenerate={actions.regenerateSuggestion}
                  onDismiss={actions.dismissSuggestion}
                  onEscalate={actions.escalateSuggestion}
                  onApproveStage={actions.approveStage}
                />
              </TabsContent>
              <TabsContent value="context" className="min-h-0 flex-1 overflow-y-auto">
                <ContextPanel
                  conversation={selected}
                  data={data}
                  now={model.now}
                  onAssignOwner={actions.assignOwner}
                />
              </TabsContent>
            </Tabs>
          </SheetContent>
        ) : null}
      </Sheet>
    </div>
  );
}
