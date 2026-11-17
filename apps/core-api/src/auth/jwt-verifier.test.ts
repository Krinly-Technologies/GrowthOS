import { randomUUID } from 'node:crypto';
import { createLocalJWKSet, exportJWK, generateKeyPair, type JWTPayload, SignJWT } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { InvalidTokenError, JwtVerifier } from './jwt-verifier.js';

const SUPABASE_URL = 'https://project-ref.supabase.co';
const ISSUER = `${SUPABASE_URL}/auth/v1`;

let verifier: JwtVerifier;
let sign: (
  claims: JWTPayload,
  options?: { issuer?: string; audience?: string; expiresIn?: string },
) => Promise<string>;
let signWithUnknownKey: (claims: JWTPayload) => Promise<string>;

const userClaims = () => ({
  sub: randomUUID(),
  email: 'Owner@Example.com',
  role: 'authenticated',
  is_anonymous: false,
});

beforeAll(async () => {
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const other = await generateKeyPair('ES256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'key-1', alg: 'ES256' };
  verifier = new JwtVerifier(createLocalJWKSet({ keys: [jwk] }), SUPABASE_URL);

  sign = (claims, options = {}) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
      .setIssuer(options.issuer ?? ISSUER)
      .setAudience(options.audience ?? 'authenticated')
      .setIssuedAt()
      .setExpirationTime(options.expiresIn ?? '5m')
      .sign(privateKey);

  signWithUnknownKey = (claims) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
      .setIssuer(ISSUER)
      .setAudience('authenticated')
      .setExpirationTime('5m')
      .sign(other.privateKey);
});

describe('JwtVerifier', () => {
  it('accepts a valid Supabase access token and normalises the email', async () => {
    const claims = userClaims();
    await expect(verifier.verify(await sign(claims))).resolves.toEqual({
      id: claims.sub,
      email: 'owner@example.com',
    });
  });

  it.each([
    ['expired', () => sign(userClaims(), { expiresIn: '-1m' })],
    ['wrong issuer', () => sign(userClaims(), { issuer: 'https://evil.example/auth/v1' })],
    ['wrong audience', () => sign(userClaims(), { audience: 'anon' })],
    ['anonymous user', () => sign({ ...userClaims(), is_anonymous: true })],
    ['service role', () => sign({ ...userClaims(), role: 'service_role' })],
    ['non-uuid subject', () => sign({ ...userClaims(), sub: 'admin' })],
    ['signed by an unknown key', () => signWithUnknownKey(userClaims())],
  ])('rejects a token that is %s', async (_, makeToken) => {
    await expect(verifier.verify(await makeToken())).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects symmetric (HS256) tokens even with a matching kid', async () => {
    const token = await new SignJWT(userClaims())
      .setProtectedHeader({ alg: 'HS256', kid: 'key-1' })
      .setIssuer(ISSUER)
      .setAudience('authenticated')
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode('a-shared-secret-of-sufficient-length!!'));
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(InvalidTokenError);
  });
});
