export function LabDisabled() {
  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-xl font-semibold">The design lab is turned off</h1>
      <p className="text-sm text-ink-3">
        This is a development-only prototype with fictional data. It renders only under{' '}
        <code>next dev</code> with an explicit opt-in, and never in a production build.
      </p>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-2">
        <li>
          <code>cp apps/design-lab/.env.example apps/design-lab/.env.local</code>
        </li>
        <li>
          <code>pnpm --filter @krinly/design-lab lab</code>
        </li>
        <li>
          Open <code>http://localhost:3010</code>
        </li>
      </ol>
    </main>
  );
}
