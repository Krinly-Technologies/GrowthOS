interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

/** Human-readable message from the core-api error contract. */
export function apiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const message = (error as ApiErrorBody | undefined)?.error?.message;
  return typeof message === 'string' ? message : fallback;
}
