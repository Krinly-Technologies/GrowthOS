import { serverCoreApi } from '@krinly/web-auth/server';
import { redirect } from 'next/navigation';
import { unwrap } from '@/lib/api';

/** Sends signed-in users to their first workspace, or to onboarding if they have none. */
export default async function HomePage() {
  const api = await serverCoreApi();
  const { organizations } = unwrap(await api.GET('/v1/me/organizations'));
  const first = organizations[0];
  redirect(first ? `/o/${first.id}` : '/onboarding');
}
