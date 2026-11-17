import { HttpStatus, Logger } from '@nestjs/common';
import type { AiServiceComponents, AiServicePaths } from '@krinly/contracts';
import createClient from 'openapi-fetch';
import { z } from 'zod';
import { ApiException } from '../http/errors.js';
import { REQUEST_ID_HEADER } from '../http/request-context.js';

type TriageRequest = AiServiceComponents['schemas']['TriageRequest'];
type TriageResultContract = AiServiceComponents['schemas']['TriageResult'];

/**
 * Runtime validation of the AI service's response. Annotated with the generated contract type,
 * so it fails to compile if the Python contract changes without this schema following.
 */
export const TriageResultSchema: z.ZodType<TriageResultContract> = z.strictObject({
  intent: z.enum(['booking_request', 'price_enquiry', 'support', 'complaint', 'spam', 'other']),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  outcome: z.enum(['propose_reply', 'needs_human_review']),
  proposed_reply: z.string().max(1000).nullable(),
  review_reason: z.string().nullable(),
});

export interface AiServiceClientOptions {
  baseUrl: string;
  serviceToken: string;
  timeoutMs: number;
  /** Override for tests; defaults to the global fetch. */
  fetch?: typeof globalThis.fetch;
}

/**
 * Calls the internal AI service over the private network. Its output is a proposal: it is
 * validated here, and nothing it returns authorizes a business mutation.
 */
export class AiServiceClient {
  private readonly logger = new Logger(AiServiceClient.name);
  private readonly client: ReturnType<typeof createClient<AiServicePaths>>;

  constructor(private readonly options: AiServiceClientOptions) {
    this.client = createClient<AiServicePaths>({
      baseUrl: options.baseUrl,
      headers: { authorization: `Bearer ${options.serviceToken}` },
      ...(options.fetch ? { fetch: options.fetch } : {}),
    });
  }

  async triage(request: TriageRequest, requestId: string): Promise<TriageResultContract> {
    const result = await this.client
      .POST('/internal/v1/enquiries/triage', {
        body: request,
        headers: { [REQUEST_ID_HEADER]: requestId },
        signal: AbortSignal.timeout(this.options.timeoutMs),
      })
      .catch((error: unknown) => {
        this.logger.warn({ err: error, requestId }, 'AI service unreachable or timed out');
        throw new ApiException(
          HttpStatus.BAD_GATEWAY,
          'AI_SERVICE_UNAVAILABLE',
          'AI service is unavailable',
        );
      });

    const { response } = result;
    if (!response.ok) {
      this.logger.warn(
        { status: response.status, error: result.error, requestId },
        'AI service error',
      );
      if (response.status === 503) {
        throw new ApiException(
          HttpStatus.SERVICE_UNAVAILABLE,
          'AI_DISABLED',
          'AI assistance is not enabled',
        );
      }
      if (response.status === 504) {
        throw new ApiException(HttpStatus.GATEWAY_TIMEOUT, 'AI_TIMEOUT', 'AI assistance timed out');
      }
      throw new ApiException(
        HttpStatus.BAD_GATEWAY,
        'AI_SERVICE_ERROR',
        'AI service request failed',
      );
    }

    const parsed = TriageResultSchema.safeParse(result.data);
    if (!parsed.success) {
      this.logger.error(
        { issues: parsed.error.issues, requestId },
        'AI service broke its contract',
      );
      throw new ApiException(
        HttpStatus.BAD_GATEWAY,
        'AI_INVALID_RESPONSE',
        'AI service returned an invalid response',
      );
    }
    return parsed.data;
  }
}
