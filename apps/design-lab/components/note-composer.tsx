'use client';

import { useId, useState } from 'react';
import { cn } from '@krinly/ui/lib/utils';
import { useLab } from '@/lib/store';
import { useToast } from './toast';

export function NoteComposer({
  leadId,
  className,
  buttonClassName,
  placeholder = 'Add a note — what was said, what happens next…',
}: {
  leadId: string;
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
}) {
  const { dispatch } = useLab();
  const notify = useToast();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  function save() {
    if (!text.trim()) {
      setError('Write something before saving the note.');
      return;
    }
    dispatch({ type: 'addNote', leadId, text });
    setText('');
    setError(null);
    notify({ title: 'Note added' });
  }

  return (
    <form
      className={cn('note-composer', className)}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <label htmlFor={id} className="sr-only">
        Add a note
      </label>
      <textarea
        id={id}
        value={text}
        rows={2}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            save();
          }
        }}
        className="block w-full resize-none rounded-lg border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-ink-3 focus-visible:border-ink focus-visible:outline-none aria-invalid:border-critical"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p id={`${id}-error`} className="text-xs text-critical" role={error ? 'alert' : undefined}>
          {error ?? <span className="text-ink-3">Ctrl + Enter to save</span>}
        </p>
        <button
          type="submit"
          className={cn(
            'h-8 rounded-lg bg-ink px-3 text-sm font-medium text-white hover:bg-ink-2 disabled:opacity-50',
            buttonClassName,
          )}
        >
          Save note
        </button>
      </div>
    </form>
  );
}
