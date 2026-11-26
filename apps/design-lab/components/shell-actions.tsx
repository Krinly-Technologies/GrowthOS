'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { type Concept, useLab } from '@/lib/store';
import { CommandMenu, type CommandAction } from './command-menu';
import { ConceptProvider } from './concept';
import { NewLeadDialog, RecordPaymentDialog, ShortcutsDialog } from './dialogs';

interface ShellActions {
  openNewLead: () => void;
  openRecordPayment: (leadId?: string) => void;
  openCommand: () => void;
  openShortcuts: () => void;
}

const ShellActionsContext = createContext<ShellActions | null>(null);

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * Shared by both concept shells: owns the quick-create dialogs, the command menu, the shortcuts
 * sheet and the global keyboard shortcuts. Concepts only differ in how they present them.
 */
export function ShellActionsProvider({
  concept,
  children,
}: {
  concept: Concept;
  children: ReactNode;
}) {
  const router = useRouter();
  const { dispatch } = useLab();
  const [newLead, setNewLead] = useState(false);
  const [payment, setPayment] = useState<{ open: boolean; leadId?: string }>({ open: false });
  const [command, setCommand] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommand((open) => !open);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === '[') {
        e.preventDefault();
        dispatch({ type: 'toggleCollapsed', concept });
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcuts(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [concept, dispatch]);

  const onAction = useCallback(
    (action: CommandAction) => {
      if (action === 'new-lead') setNewLead(true);
      else if (action === 'record-payment') setPayment({ open: true });
      else if (action === 'shortcuts') setShortcuts(true);
      else dispatch({ type: 'toggleCollapsed', concept });
    },
    [concept, dispatch],
  );

  const actions = useMemo<ShellActions>(
    () => ({
      openNewLead: () => {
        setNewLead(true);
      },
      openRecordPayment: (leadId?: string) => {
        setPayment(leadId ? { open: true, leadId } : { open: true });
      },
      openCommand: () => {
        setCommand(true);
      },
      openShortcuts: () => {
        setShortcuts(true);
      },
    }),
    [],
  );

  return (
    <ConceptProvider concept={concept}>
      <ShellActionsContext value={actions}>
        {children}
        <NewLeadDialog
          open={newLead}
          onOpenChange={setNewLead}
          onCreated={(leadId) => {
            router.push(`/${concept}/leads?lead=${leadId}`);
          }}
        />
        <RecordPaymentDialog
          open={payment.open}
          {...(payment.leadId ? { leadId: payment.leadId } : {})}
          onOpenChange={(open) => {
            setPayment(open ? payment : { open: false });
          }}
        />
        <CommandMenu
          open={command}
          onOpenChange={setCommand}
          concept={concept}
          onAction={onAction}
        />
        <ShortcutsDialog open={shortcuts} onOpenChange={setShortcuts} />
      </ShellActionsContext>
    </ConceptProvider>
  );
}

export function useShellActions(): ShellActions {
  const value = useContext(ShellActionsContext);
  if (!value) throw new Error('useShellActions() must be used inside <ShellActionsProvider>');
  return value;
}
