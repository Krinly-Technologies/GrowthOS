import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorSchema>;
type ErrorDetail = NonNullable<ApiErrorBody['error']['details']>[number];

/** An error with a stable machine-readable code, safe to show to API clients. */
export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: string,
    message: string,
    readonly details?: ErrorDetail[],
  ) {
    super(message, status);
  }
}

/** Maps Standard Schema (Zod) validation issues to the API error contract. */
export function validationException(issues: readonly StandardSchemaV1.Issue[]): ApiException {
  return new ApiException(
    HttpStatus.BAD_REQUEST,
    'VALIDATION_FAILED',
    'Request validation failed',
    issues.map((issue) => ({
      path: (issue.path ?? [])
        .map((segment) => String(typeof segment === 'object' ? segment.key : segment))
        .join('.'),
      message: issue.message,
    })),
  );
}

const STATUS_CODES: Partial<Record<number, string>> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  429: 'RATE_LIMITED',
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ApiErrorBody['error'] = {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId: request.id,
    };

    if (exception instanceof ApiException) {
      status = exception.getStatus();
      body = { code: exception.code, message: exception.message, requestId: request.id };
      if (exception.details) body.details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      body = {
        code: STATUS_CODES[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST'),
        message: status >= 500 ? body.message : exception.message,
        requestId: request.id,
      };
    }

    if (status >= 500) {
      this.logger.error({ err: exception, requestId: request.id }, 'Unhandled request error');
    }
    void reply.status(status).send({ error: body } satisfies ApiErrorBody);
  }
}
