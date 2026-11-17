import {
  type CanActivate,
  type ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { ApiException } from '../http/errors.js';
import { IS_PUBLIC } from './auth.decorators.js';
import { InvalidTokenError, JwtVerifier } from './jwt-verifier.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(JwtVerifier) private readonly verifier: JwtVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', 'Missing bearer token');
    }
    try {
      request.user = await this.verifier.verify(token);
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        throw new ApiException(
          HttpStatus.UNAUTHORIZED,
          'UNAUTHENTICATED',
          'Invalid or expired token',
        );
      }
      throw error;
    }
    return true;
  }
}
