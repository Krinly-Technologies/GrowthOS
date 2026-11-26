'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useConcept } from './concept';
import { Icon } from './icons';

// A deliberately simple live region. (Radix Toast is a dismissable layer, so the newest toast
// would swallow Escape and stop it closing an open drawer — keyboard users press Esc twice.)

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  concept?: string;
}

type Notify = (toast: Omit<ToastItem, 'id'>) => void;

const ToastContext = createContext<Notify | null>(null);

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => {
      onDismiss(item.id);
    }, 5000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [paused, item.id, onDismiss]);

  return (
    <li
      data-concept={item.concept}
      role="status"
      onMouseEnter={() => {
        setPaused(true);
      }}
      onMouseLeave={() => {
        setPaused(false);
      }}
      onFocus={() => {
        setPaused(true);
      }}
      onBlur={() => {
        setPaused(false);
      }}
      className="lab-pop pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-[0_12px_32px_-12px_rgb(17_28_45/0.35)]"
      data-state="open"
    >
      <span className="mt-0.5 text-growth" aria-hidden="true">
        <Icon name="check" size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{item.title}</p>
        {item.description ? <p className="mt-0.5 text-ink-3">{item.description}</p> : null}
      </div>
      {item.action ? (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            onDismiss(item.id);
          }}
          className="rounded-md px-2 py-1 text-sm font-medium text-ink underline underline-offset-4 hover:bg-canvas-2"
        >
          {item.action.label}
          <span className="sr-only">: {item.title}</span>
        </button>
      ) : null}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => {
          onDismiss(item.id);
        }}
        className="rounded-md p-1 text-ink-3 hover:bg-canvas-2 hover:text-ink"
      >
        <Icon name="close" size={14} />
      </button>
    </li>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const notify = useCallback<Notify>((toast) => {
    // Modal sheets hide everything outside them from assistive tech (including this region), so
    // the message is also announced from a live region inside any open sheet or dialog.
    const message = toast.description ? `${toast.title}. ${toast.description}` : toast.title;
    document.querySelectorAll<HTMLElement>('[data-lab-announcer]').forEach((el) => {
      el.textContent = '';
      window.setTimeout(() => {
        el.textContent = message;
      }, 60);
    });
    setItems((current) => [...current.slice(-2), { ...toast, id: (current.at(-1)?.id ?? 0) + 1 }]);
  }, []);
  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext value={notify}>
      {children}
      <section
        aria-label="Notifications"
        className="pointer-events-none fixed right-4 bottom-20 z-[60] w-[min(380px,calc(100vw-2rem))] sm:bottom-4"
      >
        <ol className="flex flex-col gap-2" aria-live="polite">
          {items.map((item) => (
            <ToastCard key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </ol>
      </section>
    </ToastContext>
  );
}

/** Notify, styled with the calling screen's concept. */
export function useToast(): Notify {
  const notify = useContext(ToastContext);
  const concept = useConcept();
  const scoped = useCallback<Notify>(
    (toast) => {
      notify?.(concept ? { ...toast, concept: concept === 'g' ? 'b' : concept } : toast);
    },
    [notify, concept],
  );
  if (!notify) throw new Error('useToast() must be used inside <ToastProvider>');
  return scoped;
}
