'use client';

import { Dialog } from 'radix-ui';
import { type ReactNode, useRef } from 'react';
import { cn } from '@krinly/ui/lib/utils';
import { useConceptScope } from './concept';

export const SheetRoot = Dialog.Root;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;
export const SheetClose = Dialog.Close;

/**
 * Side sheet on desktop, full-screen sheet below 640px. Radix provides the focus trap, Esc to
 * close and focus return. Concepts style it through `className`.
 */
export function SheetContent({
  children,
  className,
  overlayClassName,
  label,
}: {
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  /** Accessible description when the sheet has no visible description. */
  label?: string;
}) {
  const scope = useConceptScope();
  const returnTo = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        {...scope}
        className={cn('lab-overlay fixed inset-0 z-50 bg-[rgb(17_28_45/0.32)]', overlayClassName)}
      />
      <Dialog.Content
        {...scope}
        {...(label ? {} : { 'aria-describedby': undefined })}
        onOpenAutoFocus={(e) => {
          // Remember the opener (sheets open from URL state, not a Dialog.Trigger), then focus the
          // panel itself — still inside the focus trap — rather than its first button.
          returnTo.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
        onCloseAutoFocus={(e) => {
          const target = returnTo.current;
          if (target?.isConnected && target !== document.body) {
            e.preventDefault();
            target.focus();
          }
        }}
        className={cn(
          'lab-sheet fixed inset-0 z-50 flex flex-col bg-surface text-ink outline-none sm:inset-y-0 sm:right-0 sm:left-auto',
          className,
        )}
      >
        {label ? <Dialog.Description className="sr-only">{label}</Dialog.Description> : null}
        {children}
        <div data-lab-announcer aria-live="polite" className="sr-only" />
      </Dialog.Content>
    </Dialog.Portal>
  );
}

/** Centred dialog for short forms and confirmations. */
export function DialogContent({
  children,
  className,
  title,
  description,
}: {
  children: ReactNode;
  className?: string;
  title: string;
  description?: ReactNode;
}) {
  const scope = useConceptScope();
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        {...scope}
        className="lab-overlay fixed inset-0 z-50 bg-[rgb(17_28_45/0.36)]"
      />
      <Dialog.Content
        {...scope}
        {...(description ? {} : { 'aria-describedby': undefined })}
        className={cn(
          'lab-pop lab-dialog fixed top-1/2 left-1/2 z-50 max-h-[calc(100svh-2rem)] w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line bg-surface p-6 text-ink shadow-[0_24px_64px_-20px_rgb(17_28_45/0.45)] outline-none',
          className,
        )}
      >
        <Dialog.Title className="lab-dialog-title text-lg font-semibold tracking-tight">
          {title}
        </Dialog.Title>
        {description ? (
          <Dialog.Description className="mt-1.5 text-sm leading-relaxed text-ink-3">
            {description}
          </Dialog.Description>
        ) : null}
        <div className="mt-5">{children}</div>
        <div data-lab-announcer aria-live="polite" className="sr-only" />
      </Dialog.Content>
    </Dialog.Portal>
  );
}
