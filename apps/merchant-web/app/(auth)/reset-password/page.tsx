import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@krinly/ui/components/card';
import type { Metadata } from 'next';
import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = { title: 'Choose a new password' };

// Reached through the emailed recovery link, which signs the user in (see /auth/confirm).
export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">Choose a new password</CardTitle>
        <CardDescription>You will stay signed in after saving.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
