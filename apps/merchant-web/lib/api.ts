import { notFound } from 'next/navigation';
import { apiErrorMessage } from './api-messages';

export { apiErrorMessage };

/** Unwraps a core-api response in a Server Component: 404 renders the not-found page. */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.response.status === 404) notFound();
  if (result.data === undefined) {
    throw new Error(
      `core-api request failed (${result.response.status}): ${apiErrorMessage(result.error)}`,
    );
  }
  return result.data;
}
