import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@krinly/ui/components/card';
import type { Metadata } from 'next';
import { OrganizationForm } from './organization-form';

export const metadata: Metadata = { title: 'Set up your business' };

export default function OnboardingPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set up your business</CardTitle>
          <CardDescription>
            Create a workspace for your business. You will be its owner and can invite your team
            next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationForm />
        </CardContent>
      </Card>
    </main>
  );
}
