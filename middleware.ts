import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { validateApiKey, extractAuthToken } from '@lib/auth';
import { getToken } from 'next-auth/jwt';
import { sessionName } from '@lib/constants';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Validate API routes `/api/admin/*`
  if (pathname.startsWith('/api/admin')) {
    const adminToken = await getToken({
      req,
      cookieName: sessionName,
    });

    if (!adminToken) {
      return unAuthorizedResponse({ message: 'Unauthorized' });
    }
  }

  // Validate API routes `/api/v1/*`
  if (pathname.startsWith('/api/v1')) {
    if (!validateApiKey(extractAuthToken(req))) {
      return unAuthorizedResponse({ message: 'Unauthorized' });
    }
  }

  return NextResponse.next();
}

// Send 401 response for unauthenticated requests
const unAuthorizedResponse = async (error: { message: string }) => {
  const response = JSON.stringify({ error });

  return new NextResponse(response, {
    status: 401,
    headers: { 'content-type': 'application/json' },
  });
};

// Limit the middleware to specific routes
export const config = {
  matcher: ['/api/admin/:path*', '/api/v1/:path*'],
};
