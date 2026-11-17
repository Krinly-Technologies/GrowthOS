import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';
import { ENV, type Env } from '../config.js';
import { AuthGuard } from './auth.guard.js';
import { JWT_KEYS, JwtVerifier } from './jwt-verifier.js';

@Module({
  providers: [
    {
      provide: JWT_KEYS,
      inject: [ENV],
      useFactory: (env: Env): JWTVerifyGetKey =>
        createRemoteJWKSet(new URL('/auth/v1/.well-known/jwks.json', env.SUPABASE_URL)),
    },
    {
      provide: JwtVerifier,
      inject: [JWT_KEYS, ENV],
      useFactory: (keys: JWTVerifyGetKey, env: Env) => new JwtVerifier(keys, env.SUPABASE_URL),
    },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
