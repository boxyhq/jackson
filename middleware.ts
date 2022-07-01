// eslint-disable-next-line
import type { NextRequest } from 'next/server';
// eslint-disable-next-line
import { NextResponse } from 'next/server';
import { validateApiKey, extractAuthToken } from '@lib/auth';

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith('/api/v1')) {
    if (!validateApiKey(extractAuthToken(req))) {
      return NextResponse.rewrite(new URL('/api/v1/unauthenticated', req.nextUrl));
    }
  }

  return NextResponse.next();
}
