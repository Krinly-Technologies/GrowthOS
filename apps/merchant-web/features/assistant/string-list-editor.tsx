'use client';

import { Button, IconButton } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import { Input } from '@krinly/ui/components/input';
import { useState } from 'react';

/** Add, edit and remove a short ordered list of plain-text items (questions, conditions). */
export function StringListEditor({
  items,
  onChange,
  addLabel,
  placeholder,
}: {
  items: readonly string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  return (
    <div className="grid gap-2">
      {items.map((item, i) => (
        <div key={`${i}-${item}`} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            className="min-w-0 flex-1"
          />
          <IconButton
            label="Remove"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              onChange(items.filter((_, j) => j !== i));
            }}
          >
            <Icon name="close" size={14} />
          </IconButton>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim() !== '') {
              e.preventDefault();
              onChange([...items, draft.trim()]);
              setDraft('');
            }
          }}
          className="min-w-0 flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          disabled={draft.trim() === ''}
          onClick={() => {
            onChange([...items, draft.trim()]);
            setDraft('');
          }}
        >
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
