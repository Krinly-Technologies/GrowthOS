import { Button } from '@krinly/ui/components/button';

const MERCHANT_APP_URL = process.env.NEXT_PUBLIC_MERCHANT_APP_URL ?? 'http://localhost:3000';

const JOURNEY = [
  ['Enquiry', 'Every customer message, from every channel, in one place.'],
  ['Sales', 'AI-assisted replies that your team approves before anything is sent.'],
  ['Booking & payment', 'Turn conversations into confirmed bookings and collected payments.'],
  ['Verified revenue', 'Know which efforts produced real, paid revenue.'],
] as const;

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-10 px-4 py-16">
      <header className="grid gap-4">
        <p className="text-sm font-medium text-primary">Krinly GrowthOS</p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          From first enquiry to verified revenue.
        </h1>
        <p className="text-lg text-muted-foreground">
          Krinly brings acquisition, messaging, selling, bookings and payments together for growing
          Indian businesses.
        </p>
        <div>
          <Button asChild size="lg">
            <a href={`${MERCHANT_APP_URL}/signup`}>Get started</a>
          </Button>
        </div>
      </header>
      <section aria-labelledby="journey-heading" className="grid gap-4">
        <h2 id="journey-heading" className="text-sm font-medium text-muted-foreground">
          How it fits together
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2">
          {JOURNEY.map(([title, text]) => (
            <li key={title} className="rounded-lg border p-4">
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
