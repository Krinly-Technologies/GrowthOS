import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@krinly/ui/components/card';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SignupForm } from './signup-form';

export const metadata: Metadata = { title: 'Create account' };

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>We will email you a link to verify your address.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Already have an account?&nbsp;
        <Link className="text-foreground underline underline-offset-4" href="/login">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
