import { Alert } from '@krinly/ui/components/alert';

export function FormMessage({
  error,
  message,
}: {
  error?: string | undefined;
  message?: string | undefined;
}) {
  if (error) return <Alert variant="destructive">{error}</Alert>;
  if (message) return <Alert>{message}</Alert>;
  return null;
}
