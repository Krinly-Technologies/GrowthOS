import type { Metadata } from 'next';
import { ModuleStub } from '@/components/module-stub';
import { moduleFromSlug } from '@/lib/modules';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string }>;
}): Promise<Metadata> {
  const { module } = await params;
  return { title: `${moduleFromSlug(module)?.label ?? 'Not found'} · Concept A` };
}

export default async function ModuleAPage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  return <ModuleStub slug={module} concept="a" />;
}
