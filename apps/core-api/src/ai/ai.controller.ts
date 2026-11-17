import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Optional,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ApiException } from '../http/errors.js';
import { ApiAuthenticated, ApiErrors } from '../http/openapi.decorators.js';
import type { OrgAccess } from '../http/request-context.js';
import { CurrentOrg } from '../organizations/current-org.decorator.js';
import { RequirePermission } from '../organizations/org-access.guard.js';
import { AiServiceClient } from './ai-service.client.js';

const EnquiryTriageBody = z.strictObject({
  channel: z.enum(['whatsapp', 'email', 'web', 'phone']),
  message: z.string().trim().min(1).max(4000),
});
type EnquiryTriageBody = z.infer<typeof EnquiryTriageBody>;

const EnquiryTriage = z.object({
  intent: z.string(),
  confidence: z.number(),
  summary: z.string(),
  outcome: z.enum(['propose_reply', 'needs_human_review']),
  proposedReply: z.string().nullable(),
  reviewReason: z.string().nullable(),
});

@ApiTags('ai')
@ApiAuthenticated()
@Controller('organizations/:id/ai')
export class AiController {
  constructor(@Optional() @Inject(AiServiceClient) private readonly ai: AiServiceClient | null) {}

  /** Returns a triage proposal for a customer message. Nothing is sent or stored. */
  @Post('enquiry-triage')
  @HttpCode(200)
  @RequirePermission('ai.use')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ standardSchema: EnquiryTriage })
  @ApiErrors(400, 403, 404, 502, 503, 504)
  async triage(
    @CurrentOrg() org: OrgAccess,
    @Body({ schema: EnquiryTriageBody }) body: EnquiryTriageBody,
    @Req() request: FastifyRequest,
  ): Promise<z.infer<typeof EnquiryTriage>> {
    if (!this.ai) {
      throw new ApiException(
        HttpStatus.SERVICE_UNAVAILABLE,
        'AI_DISABLED',
        'AI assistance is not enabled',
      );
    }
    const result = await this.ai.triage(
      { organization_id: org.organizationId, channel: body.channel, message: body.message },
      request.id,
    );
    return {
      intent: result.intent,
      confidence: result.confidence,
      summary: result.summary,
      outcome: result.outcome,
      proposedReply: result.proposed_reply,
      reviewReason: result.review_reason,
    };
  }
}
