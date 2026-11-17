import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@krinly/ui/components/card';
import type { Metadata } from 'next';
import { AcceptInvitationForm } from './accept-form';

export const metadata: Metadata = { title: 'Join a workspace' };

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>You have been invited</CardTitle>
          <CardDescription>
            Accept to join the workspace with the role you were invited to. The invitation must have
            been sent to the email address you are signed in with.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInvitationForm token={token} />
        </CardContent>
      </Card>
    </main>
  );
}
