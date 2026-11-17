import { describe, expect, it } from 'vitest';
import { AiServiceClient } from './ai-service.client.js';

const request = {
  organization_id: '00000000-0000-4000-8000-000000000001',
  channel: 'web' as const,
  message: 'hello',
};

function clientReturning(response: () => Response | Promise<Response>): AiServiceClient {
  return new AiServiceClient({
    baseUrl: 'http://ai.internal',
    serviceToken: 'token',
    timeoutMs: 1_000,
    fetch: () => Promise.resolve(response()),
  });
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('AiServiceClient', () => {
  it('rejects responses that break the contract instead of trusting them', async () => {
    const client = clientReturning(() =>
      json({ intent: 'approve_refund', confidence: 5, summary: 'x', outcome: 'execute' }),
    );
    await expect(client.triage(request, 'req-00000001')).rejects.toMatchObject({
      code: 'AI_INVALID_RESPONSE',
    });
  });

  it.each([
    [503, 'AI_DISABLED'],
    [504, 'AI_TIMEOUT'],
    [500, 'AI_SERVICE_ERROR'],
  ])('maps HTTP %i to %s', async (status, code) => {
    const client = clientReturning(() =>
      json({ error: { code: 'X', message: 'x', requestId: 'r' } }, status),
    );
    await expect(client.triage(request, 'req-00000001')).rejects.toMatchObject({ code });
  });

  it('maps network failures to AI_SERVICE_UNAVAILABLE', async () => {
    const client = clientReturning(() => {
      throw new TypeError('fetch failed');
    });
    await expect(client.triage(request, 'req-00000001')).rejects.toMatchObject({
      code: 'AI_SERVICE_UNAVAILABLE',
    });
  });
});
