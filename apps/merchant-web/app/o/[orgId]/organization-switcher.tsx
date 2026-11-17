'use client';

import { useRouter } from 'next/navigation';

const NEW_ORGANIZATION = '__new__';

export function OrganizationSwitcher({
  currentId,
  organizations,
}: {
  currentId: string;
  organizations: { id: string; name: string }[];
}) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="organization-switcher" className="sr-only">
        Switch workspace
      </label>
      <select
        id="organization-switcher"
        className="h-8 rounded-md border border-input bg-background px-2 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
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
      </select>
    </div>
  );
}
