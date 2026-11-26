'use client';

import { Select } from '@krinly/ui/components/input';
import { useRouter } from 'next/navigation';

const NEW_ORGANIZATION = '__new__';

export function WorkspaceSwitcher({
  currentId,
  organizations,
  className,
}: {
  currentId: string;
  organizations: { id: string; name: string }[];
  className?: string;
}) {
  const router = useRouter();
  return (
    <div className={className}>
      <label htmlFor="workspace-switcher" className="sr-only">
        Switch workspace
      </label>
      <Select
        id="workspace-switcher"
        value={currentId}
        onChange={(e) => {
          router.push(e.target.value === NEW_ORGANIZATION ? '/onboarding' : `/o/${e.target.value}`);
        }}
      >
        {organizations.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
        <option value={NEW_ORGANIZATION}>+ New workspace</option>
      </Select>
    </div>
  );
}
