'use client';

import {
  Dialog as DialogPrimitive,
  DropdownMenu as Menu,
  Popover as PopoverPrimitive,
  Tooltip as TooltipPrimitive,
} from 'radix-ui';
import { type ComponentProps, type ReactNode, useRef } from 'react';
import { cn } from '../lib/utils';
import { Icon } from './icon';
import { ToastAnchor } from './toast';

// Overlays are Radix primitives with Krinly styling. Radix provides the focus trap, Escape, focus
// return and outside-click handling; these wrappers add the toast anchor, sizing and motion.

const overlayClass = 'kr-overlay fixed inset-0 z-50 bg-overlay';

/* ── Dialog ─────────────────────────────────────────────────────────────── */

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

/** Centred dialog for short forms and confirmations. Always has a visible title. */
function DialogContent({
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClass} />
      <DialogPrimitive.Content
        {...(description ? {} : { 'aria-describedby': undefined })}
        // Centred with margins, not transforms, so fixed children (toasts) stay viewport-relative.
        className={cn(
          'kr-pop fixed inset-0 z-50 m-auto flex h-fit max-h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-y-auto rounded-2xl bg-surface p-6 text-ink shadow-overlay outline-none',
          size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-[480px]',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <DialogPrimitive.Title className="font-display text-lg font-semibold tracking-tight">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close
            aria-label="Close"
            className="-mt-1 -mr-2 rounded-full p-1.5 text-ink-3 hover:bg-canvas-2 hover:text-ink"
          >
            <Icon name="close" size={18} />
          </DialogPrimitive.Close>
        </div>
        {description ? (
          <DialogPrimitive.Description className="mt-1.5 text-sm leading-relaxed text-ink-3">
            {description}
          </DialogPrimitive.Description>
        ) : null}
        {children ? <div className="mt-5">{children}</div> : null}
        {footer ? <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div> : null}
        <ToastAnchor />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/* ── Sheet ──────────────────────────────────────────────────────────────── */

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetTitle = DialogPrimitive.Title;
const SheetDescription = DialogPrimitive.Description;

/**
 * Detail panel. `docked` sits flush to the right edge; `floating` is inset with a radius (B+).
 * Below 640px both become a full-screen sheet. Works with or without a SheetTrigger: when opened
 * from state (e.g. a URL parameter) focus still returns to the element that had it.
 */
function SheetContent({
  children,
  variant = 'docked',
  width = 'md',
  label,
  className,
}: {
  children: ReactNode;
  variant?: 'docked' | 'floating';
  width?: 'sm' | 'md' | 'lg';
  /** Accessible description when the sheet has no visible SheetDescription. */
  label?: string;
  className?: string;
}) {
  const returnTo = useRef<HTMLElement | null>(null);
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClass} />
      <DialogPrimitive.Content
        {...(label ? {} : { 'aria-describedby': undefined })}
        onOpenAutoFocus={(e) => {
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
          'kr-sheet fixed inset-0 z-50 flex flex-col overflow-hidden bg-surface text-ink outline-none sm:left-auto',
          variant === 'floating'
            ? 'sm:inset-y-3 sm:right-3 sm:rounded-2xl sm:shadow-overlay'
            : 'sm:inset-y-0 sm:right-0 sm:shadow-overlay',
          width === 'sm' ? 'sm:w-[400px]' : width === 'lg' ? 'sm:w-[640px]' : 'sm:w-[520px]',
          'sm:max-w-[calc(100vw-1.5rem)]',
          className,
        )}
      >
        {label ? (
          <DialogPrimitive.Description className="sr-only">{label}</DialogPrimitive.Description>
        ) : null}
        {children}
        <ToastAnchor />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/* ── Popover ────────────────────────────────────────────────────────────── */

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverClose = PopoverPrimitive.Close;

function PopoverContent({
  className,
  align = 'start',
  sideOffset = 6,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(
          'kr-pop z-50 max-h-[var(--radix-popover-content-available-height)] w-72 overflow-y-auto rounded-xl bg-surface p-3 text-sm text-ink shadow-floating ring-1 ring-line outline-none',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

/* ── Tooltip ────────────────────────────────────────────────────────────── */

const TooltipProvider = TooltipPrimitive.Provider;

/**
 * Supplementary text on hover and keyboard focus. Never put essential information or
 * interactive content in a tooltip; icon-only buttons still need their own `aria-label`.
 */
function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className="kr-pop z-[80] max-w-64 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-surface"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/* ── Dropdown menu ──────────────────────────────────────────────────────── */

const DropdownMenu = Menu.Root;
const DropdownMenuTrigger = Menu.Trigger;
const DropdownMenuGroup = Menu.Group;
const DropdownMenuRadioGroup = Menu.RadioGroup;

function DropdownMenuContent({
  className,
  align = 'start',
  sideOffset = 6,
  ...props
}: ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(
          'kr-pop z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-48 overflow-y-auto rounded-xl bg-surface p-1.5 text-sm text-ink shadow-floating ring-1 ring-line',
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  );
}

const itemClass =
  'relative flex min-h-9 cursor-default items-center gap-2.5 rounded-lg px-2.5 py-1.5 outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-canvas-2 [&_svg]:shrink-0 [&_svg]:text-ink-3';

function DropdownMenuItem({
  className,
  tone,
  ...props
}: ComponentProps<typeof Menu.Item> & { tone?: 'critical' }) {
  return (
    <Menu.Item
      className={cn(
        itemClass,
        tone === 'critical' && 'text-critical [&_svg]:text-critical',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof Menu.RadioItem>) {
  return (
    <Menu.RadioItem className={cn(itemClass, 'pr-8', className)} {...props}>
      {children}
      <Menu.ItemIndicator className="absolute right-2.5">
        <Icon name="check" size={16} />
      </Menu.ItemIndicator>
    </Menu.RadioItem>
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof Menu.CheckboxItem>) {
  return (
    <Menu.CheckboxItem className={cn(itemClass, 'pr-8', className)} {...props}>
      {children}
      <Menu.ItemIndicator className="absolute right-2.5">
        <Icon name="check" size={16} />
      </Menu.ItemIndicator>
    </Menu.CheckboxItem>
  );
}

function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof Menu.Label>) {
  return (
    <Menu.Label
      className={cn('px-2.5 pt-2 pb-1 text-xs font-bold text-ink-3', className)}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof Menu.Separator>) {
  return <Menu.Separator className={cn('my-1.5 h-px bg-line', className)} {...props} />;
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  Tooltip,
  TooltipProvider,
};
