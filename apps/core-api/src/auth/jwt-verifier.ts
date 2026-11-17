import { errors, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { z } from 'zod';
import type { AuthUser } from '../http/request-context.js';

export const JWT_KEYS = Symbol('JWT_KEYS');

const AccessTokenClaims = z.object({
  sub: z.uuid(),
  email: z.email(),
  role: z.literal('authenticated'),
  is_anonymous: z.literal(false).optional(),
});

export class InvalidTokenError extends Error {}

/**
 * Verifies Supabase Auth access tokens: signature against the project's JWKS (asymmetric keys
 * only), issuer, audience, expiry, and the claims this API depends on.
 */
export class JwtVerifier {
  private readonly issuer: string;

  constructor(
    private readonly keys: JWTVerifyGetKey,
    supabaseUrl: string,
  ) {
    this.issuer = new URL('/auth/v1', supabaseUrl).toString();
  }

  async verify(token: string): Promise<AuthUser> {
    try {
      const { payload } = await jwtVerify(token, this.keys, {
        issuer: this.issuer,
        audience: 'authenticated',
        algorithms: ['ES256', 'RS256'],
        requiredClaims: ['exp', 'sub'],
      });
      const claims = AccessTokenClaims.parse(payload);
      return { id: claims.sub, email: claims.email.toLowerCase() };
    } catch (error) {
      // An unreachable key set is an outage, not a bad token.
      if (error instanceof errors.JWKSTimeout) throw error;
      if (error instanceof errors.JOSEError || error instanceof z.ZodError) {
        throw new InvalidTokenError(error.message);
      }
      throw error;
    }
  }
}
