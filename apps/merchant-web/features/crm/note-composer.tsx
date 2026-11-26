'use client';

import { Button } from '@krinly/ui/components/button';
import { Textarea } from '@krinly/ui/components/input';
import { useId, useState } from 'react';

export function NoteComposer({
  onAddNote,
  placeholder = 'Add a note — what was said, what happens next…',
}: {
  onAddNote: (text: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!text.trim()) {
      setError('Write something before saving the note.');
      return;
    }
    onAddNote(text);
    setText('');
    setError(null);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <label htmlFor={id} className="sr-only">
        Add a note
      </label>
      <Textarea
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
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p id={`${id}-error`} className="text-xs text-critical" role={error ? 'alert' : undefined}>
          {error ?? <span className="text-ink-3">Ctrl + Enter to save</span>}
        </p>
        <Button type="submit" size="sm" shape="pill">
          Save note
        </Button>
      </div>
    </form>
  );
}
