import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@krinly/ui/components/card';
import { safeNextPath } from '@krinly/web-auth/paths';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const safeNext = safeNextPath(next);
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">Sign in</CardTitle>
        <CardDescription>
          {safeNext !== '/'
            ? 'Sign in to continue to your workspace.'
            : 'Welcome back to your Krinly workspace.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm next={safeNext} linkError={error === 'link-invalid'} />
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <Link className="underline underline-offset-4" href="/forgot-password">
          Forgot your password?
        </Link>
        <p className="text-muted-foreground">
          New to Krinly?{' '}
          <Link className="text-foreground underline underline-offset-4" href="/signup">
            Create an account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
