import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@krinly/ui/components/card';
import { safeNextPath } from '@krinly/web-auth/paths';
import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Krinly Operations</CardTitle>
          <CardDescription>Restricted to authorised Krinly staff.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={safeNextPath(next)} />
        </CardContent>
      </Card>
    </main>
  );
}
