'use server';

import type { FormState } from '@krinly/web-auth/actions';
import { serverCoreApi } from '@krinly/web-auth/server';
import { redirect } from 'next/navigation';
import { apiErrorMessage } from '@/lib/api';
import { formText } from '@/lib/form';

export async function acceptInvitation(
  _: FormState | undefined,
  form: FormData,
): Promise<FormState> {
  const api = await serverCoreApi();
  const { data, error } = await api.POST('/v1/invitations/{token}/accept', {
    params: { path: { token: formText(form, 'token') } },
  });
  if (!data) return { error: apiErrorMessage(error) };
  redirect(`/o/${data.organizationId}`);
}
