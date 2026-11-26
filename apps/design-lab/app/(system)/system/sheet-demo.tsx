'use client';

import { Avatar } from '@krinly/ui/components/avatar';
import { Button, IconButton } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@krinly/ui/components/overlay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@krinly/ui/components/tabs';
import { useToast } from '@krinly/ui/components/toast';
import { Money, VerificationStatus } from '@krinly/ui/patterns/money';
import { InfoGrid, NextAction } from '@krinly/ui/patterns/signals';
import { ThreadStepper } from '@krinly/ui/patterns/thread';
import { ActivityTimeline } from '@krinly/ui/patterns/timeline';
import { useState } from 'react';
import { STEPS } from './sample';

/** A record detail panel composed only from shared parts (the app supplies the data and rules). */
export function SheetDemo() {
  const toast = useToast();
  const [current, setCurrent] = useState(2);
  const [variant, setVariant] = useState<'floating' | 'docked'>('floating');
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          shape="pill"
          onClick={() => {
            setVariant('floating');
          }}
        >
          Open sheet
        </Button>
      </SheetTrigger>
      <SheetContent variant={variant} label="Lead details">
        <div className="on-brand bg-brand px-5 pt-4 pb-5 text-on-brand sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name="Asha Menon" size={40} />
              <div className="min-w-0">
                <SheetTitle className="truncate font-display text-xl font-semibold">
                  Asha Menon
                </SheetTitle>
                <p className="truncate text-[13px] text-on-brand-2">
                  Instagram ads · enquired 3 days ago
                </p>
              </div>
            </div>
            <SheetClose asChild>
              <IconButton label="Close" variant="on-brand" shape="pill" size="icon-sm">
                <Icon name="close" />
              </IconButton>
            </SheetClose>
          </div>
          <ThreadStepper
            className="mt-5"
            tone="on-brand"
            label="Stage"
            steps={STEPS}
            current={current}
            onSelect={(step, index) => {
              const before = current;
              setCurrent(index);
              toast({
                title: `Moved to ${step.label}`,
                action: {
                  label: 'Undo',
                  onClick: () => {
                    setCurrent(before);
                  },
                },
              });
            }}
          />
        </div>
        <div className="grid flex-1 content-start gap-5 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-canvas p-3">
            <NextAction label="Send the quotation" due="Today 4 pm" state="today" />
            <Button size="sm" shape="pill" variant="brand">
              Do it now
            </Button>
          </div>
          <Tabs defaultValue="activity">
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="pt-4">
              <ActivityTimeline
                label="Activity"
                items={[
                  {
                    id: 'suggest',
                    icon: 'assistant',
                    highlight: true,
                    title: 'Suggestion: offer a trial on Saturday',
                    meta: 'Assistant · a proposal — nothing changes until you apply it',
                    body: (
                      <div className="flex gap-2">
                        <Button size="sm" shape="pill">
                          Apply
                        </Button>
                        <Button size="sm" shape="pill" variant="ghost">
                          Dismiss
                        </Button>
                      </div>
                    ),
                  },
                  {
                    id: 'pay',
                    icon: 'payments',
                    title: (
                      <>
                        Advance of <Money amount={15000} className="font-semibold" /> recorded
                      </>
                    ),
                    meta: 'Rahul · yesterday 6:10 pm',
                  },
                  {
                    id: 'msg',
                    icon: 'message',
                    title: 'Asha: “Is 14 Dec available for the trial?”',
                    meta: 'WhatsApp · 2 days ago',
                  },
                  {
                    id: 'new',
                    icon: 'leads',
                    title: 'Enquiry from Instagram ads',
                    meta: '3 days ago',
                  },
                ]}
              />
            </TabsContent>
            <TabsContent value="details" className="pt-4">
              <InfoGrid
                items={[
                  { label: 'Phone', value: '+91 98•••• ••21' },
                  { label: 'Event date', value: 'Sat 19 Dec 2026' },
                  { label: 'Quoted', value: <Money amount={85000} /> },
                  {
                    label: 'Advance',
                    value: (
                      <span className="flex flex-wrap items-center gap-2">
                        <Money amount={15000} /> <VerificationStatus verified={false} />
                      </span>
                    ),
                  },
                  { label: 'Owner', value: 'Rahul Verma' },
                  {
                    label: 'Address',
                    value:
                      'A very long address line that wraps instead of overflowing the panel, 4th Cross, Jayanagar',
                  },
                ]}
              />
            </TabsContent>
          </Tabs>
          <p className="text-[12.5px] text-ink-3">
            Sheet variant:{' '}
            <button
              type="button"
              className="font-semibold underline underline-offset-4"
              onClick={() => {
                setVariant((v) => (v === 'floating' ? 'docked' : 'floating'));
              }}
            >
              {variant} (switch)
            </button>
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
