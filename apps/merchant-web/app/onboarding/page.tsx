import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@krinly/ui/components/card';
import type { Metadata } from 'next';
import { Wordmark } from '@/components/wordmark';
import { OrganizationForm } from './organization-form';

export const metadata: Metadata = { title: 'Set up your business' };

export default function OnboardingPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Wordmark />
        </div>
        <Card>
          <CardHeader>
            <CardTitle as="h1">Welcome to Krinly</CardTitle>
            <CardDescription>
              Set up a workspace for your business — it takes a moment. You will be its owner and
              can invite your team right after.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
