'use client';

import { useActionState, useState } from 'react';
import { FormField } from '@/components/form-field';
import { FormMessage } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';
import { createOrganization } from './actions';

const MAX_SLUG_LENGTH = 48;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, '');
}

export function OrganizationForm() {
  const [state, action] = useActionState(createOrganization, undefined);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);

  return (
    <form action={action} className="grid gap-4" noValidate>
      <FormField
        id="name"
        label="Business name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (!slugEdited) setSlug(slugify(e.target.value));
        }}
        minLength={2}
        maxLength={120}
        autoComplete="organization"
        required
      />
      <FormField
        id="slug"
        label="Workspace URL"
        value={slug}
        onChange={(e) => {
          setSlugEdited(true);
          setSlug(e.target.value.toLowerCase());
        }}
        pattern="[a-z0-9][a-z0-9-]{1,46}[a-z0-9]"
        hint="Lowercase letters, numbers and hyphens. You cannot change this later."
        required
      />
      <FormMessage error={state?.error} />
      <SubmitButton pendingLabel="Creating workspace…">Create workspace</SubmitButton>
    </form>
  );
}
