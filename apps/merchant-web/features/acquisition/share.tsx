'use client';

import { Button } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import { useToast } from '@krinly/ui/components/toast';
import { cn } from '@krinly/ui/lib/utils';
import { useState } from 'react';

/** Copies `value` and says so. Falls back to selecting the text when the clipboard is refused. */
export function CopyButton({
  value,
  what,
  size = 'sm',
  variant = 'outline',
  children,
  className,
}: {
  value: string;
  /** What was copied, for the confirmation: "Link copied". */
  what: string;
  size?: 'sm' | 'default';
  variant?: 'outline' | 'ghost' | 'brand';
  children?: React.ReactNode;
  className?: string;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant={variant}
      size={size}
      shape="pill"
      className={className}
      onClick={() => {
        void navigator.clipboard
          .writeText(value)
          .then(() => {
            setCopied(true);
            window.setTimeout(() => {
              setCopied(false);
            }, 2000);
            toast({ title: `${what} copied`, description: value });
          })
          .catch(() => {
            toast({
              title: 'Could not copy',
              description: 'Your browser refused clipboard access — select the text and copy it.',
              tone: 'critical',
            });
          });
      }}
    >
      <Icon name={copied ? 'check' : 'note'} size={15} />
      {children ?? (copied ? 'Copied' : 'Copy link')}
      <span className="sr-only">: {value}</span>
    </Button>
  );
}

/**
 * Hands the link to another app through the Web Share sheet where the browser has one, and
 * copies it where it does not. Nothing is sent anywhere by Krinly.
 */
export function ShareButton({ value, title }: { value: string; title: string }) {
  const toast = useToast();
  return (
    <Button
      variant="ghost"
      size="sm"
      shape="pill"
      onClick={() => {
        if (typeof navigator.share === 'function') {
          void navigator.share({ title, url: value }).catch(() => {
            // The person dismissed the share sheet; nothing to report.
          });
        } else {
          void navigator.clipboard.writeText(value).then(
            () => {
              toast({
                title: 'Link copied',
                description: 'This browser has no share sheet, so the link is on your clipboard.',
              });
            },
            () => {
              toast({ title: 'Could not share this link', tone: 'critical' });
            },
          );
        }
      }}
    >
      <Icon name="arrow-right" size={15} />
      Share
      <span className="sr-only">: {title}</span>
    </Button>
  );
}

/** A URL shown as what it is — a development address, never dressed up as a public link. */
export function DevUrl({ url, className }: { url: string; className?: string }) {
  return (
    <span className={cn('min-w-0', className)}>
      <code className="block truncate rounded-md bg-canvas px-2 py-1 text-[12.5px] text-ink-2">
        {url}
      </code>
    </span>
  );
}
