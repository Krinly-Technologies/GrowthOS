'use server';

import type { FormState } from '@krinly/web-auth/actions';
import { serverCoreApi } from '@krinly/web-auth/server';
import { redirect } from 'next/navigation';
import { apiErrorMessage } from '@/lib/api';
import { formText } from '@/lib/form';

export async function createOrganization(
  _: FormState | undefined,
  form: FormData,
): Promise<FormState> {
  const api = await serverCoreApi();
  const { data, error } = await api.POST('/v1/organizations', {
    body: { name: formText(form, 'name'), slug: formText(form, 'slug') },
  });
  if (!data) return { error: apiErrorMessage(error) };
  redirect(`/o/${data.id}`);
}
