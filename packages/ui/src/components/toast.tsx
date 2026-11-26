'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from 'react';
import { cn } from '../lib/utils';
import { Icon, type IconName } from './icon';

// Toasts confirm what just happened and offer Undo. They are a plain live region, not a Radix
// dismissable layer, so Escape keeps closing the open dialog or sheet instead of the toast.
//
// Modal dialogs trap focus and hide the rest of the page from assistive tech, so a toast raised
// from inside one would be unreachable (no keyboard Undo) and unannounced. Every Dialog and Sheet
// in this package renders a <ToastAnchor/>; toasts always render in the most recently mounted
// anchor, falling back to the page-level region.

type ToastTone = 'success' | 'info' | 'critical';

interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  action?: { label: string; onClick: () => void };
  /** Milliseconds; defaults to 6s, or 10s when there is an action. Paused on hover and focus. */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastState {
  items: readonly ToastItem[];
  anchors: readonly string[];
}

function createToastStore() {
  let state: ToastState = { items: [], anchors: [] };
  let nextId = 1;
  const listeners = new Set<() => void>();
  const set = (next: ToastState) => {
    state = next;
    listeners.forEach((l) => {
      l();
    });
  };
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    get: (): ToastState => state,
    add: (options: ToastOptions): number => {
      const id = nextId++;
      set({ ...state, items: [...state.items.slice(-2), { ...options, id }] });
      return id;
    },
    dismiss: (id: number) => {
      set({ ...state, items: state.items.filter((t) => t.id !== id) });
    },
    register: (anchor: string) => {
      set({ ...state, anchors: [...state.anchors, anchor] });
      return () => {
        set({ ...state, anchors: state.anchors.filter((a) => a !== anchor) });
      };
    },
  };
}

type ToastStore = ReturnType<typeof createToastStore>;

const ToastContext = createContext<ToastStore | null>(null);

const TONE: Record<ToastTone, { icon: IconName; className: string }> = {
  success: { icon: 'check', className: 'text-accent-strong' },
  info: { icon: 'info', className: 'text-info' },
  critical: { icon: 'alert', className: 'text-critical' },
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const duration = item.duration ?? (item.action ? 10_000 : 6000);
  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => {
      onDismiss(item.id);
    }, duration);
    return () => {
      window.clearTimeout(timer);
    };
  }, [paused, item.id, duration, onDismiss]);

  const tone = TONE[item.tone ?? 'success'];
  return (
    <li
      data-state="open"
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
      className="kr-pop pointer-events-auto flex w-full items-start gap-3 rounded-xl bg-surface px-4 py-3 text-sm text-ink shadow-floating ring-1 ring-line"
    >
      <span className={cn('mt-0.5', tone.className)} aria-hidden="true">
        <Icon name={tone.icon} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{item.title}</p>
        {item.description ? <p className="mt-0.5 text-ink-3">{item.description}</p> : null}
      </div>
      {item.action ? (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            onDismiss(item.id);
          }}
          className="rounded-md px-2 py-1 text-sm font-semibold text-ink underline underline-offset-4 hover:bg-canvas-2"
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

const ROOT = 'root';

/**
 * Where toasts render. Rendered by ToastProvider (page level) and inside every Dialog and Sheet;
 * render one yourself only inside a custom modal surface.
 */
function ToastAnchor({ className }: { className?: string }) {
  return <AnchorRegion className={className} />;
}

function AnchorRegion({ className, isRoot = false }: { className?: string; isRoot?: boolean }) {
  const store = useContext(ToastContext);
  const generated = useId();
  const id = isRoot ? ROOT : generated;
  useEffect(() => (store && !isRoot ? store.register(id) : undefined), [store, id, isRoot]);
  const state = useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    store?.get ?? emptyState,
    emptyState,
  );
  const active = (state.anchors.at(-1) ?? ROOT) === id;
  // The live region exists before content is inserted so screen readers announce new toasts.
  return (
    <section
      aria-label={isRoot ? 'Notifications' : 'Dialog notifications'}
      className={cn(
        'pointer-events-none fixed right-4 bottom-4 z-[70] w-[min(380px,calc(100vw-2rem))]',
        className,
      )}
    >
      <ol className="flex flex-col gap-2" aria-live="polite">
        {active && store
          ? state.items.map((item) => (
              <ToastCard key={item.id} item={item} onDismiss={store.dismiss} />
            ))
          : null}
      </ol>
    </section>
  );
}

const EMPTY: ToastState = { items: [], anchors: [] };
const emptyState = () => EMPTY;
const noopSubscribe = () => () => undefined;

function ToastProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createToastStore);
  return (
    <ToastContext value={store}>
      {children}
      <AnchorRegion isRoot />
    </ToastContext>
  );
}

/** Returns `toast(options)`, which shows a toast and returns its id. */
function useToast(): (options: ToastOptions) => number {
  const store = useContext(ToastContext);
  if (!store) throw new Error('useToast() must be used inside <ToastProvider>');
  return store.add;
}

export { ToastAnchor, ToastProvider, useToast };
export type { ToastOptions, ToastTone };
