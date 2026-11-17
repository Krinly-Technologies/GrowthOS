import { updateSession } from '@krinly/web-auth/proxy';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  return updateSession(request, {
    publicPaths: ['/login', '/signup', '/forgot-password', '/auth'],
    signInPath: '/login',
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
