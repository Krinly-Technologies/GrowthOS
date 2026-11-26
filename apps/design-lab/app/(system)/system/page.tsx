import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLabEnabled } from '@/lib/lab-guard';
import { Showcase } from './showcase';

export const metadata: Metadata = { title: 'Krinly design system' };

export default async function SystemPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isLabEnabled()) notFound();
  const { theme } = await searchParams;
  return <Showcase initialTheme={theme === 'dark' ? 'dark' : 'light'} />;
}
