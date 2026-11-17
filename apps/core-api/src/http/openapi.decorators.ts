import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ApiErrorSchema } from './errors.js';

/** Documents the error responses a route can return, all using the shared error contract. */
export const ApiErrors = (...statuses: number[]) =>
  applyDecorators(
    ...statuses.map((status) => ApiResponse({ status, standardSchema: ApiErrorSchema })),
  );

/** Bearer-authenticated route: documents the auth scheme and the 401 it can return. */
export const ApiAuthenticated = () => applyDecorators(ApiBearerAuth(), ApiErrors(401));
