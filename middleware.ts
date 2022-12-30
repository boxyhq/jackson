import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { validateApiKey, extractAuthToken } from '@lib/auth';
import { getToken } from 'next-auth/jwt';
import { sessionName } from '@lib/constants';
import type { ApiResponse } from 'types';
import type { SetupLink } from '@boxyhq/saml-jackson';

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

  // Validate API routes `/api/setup/*`
  if (pathname.startsWith('/api/setup')) {
    const setupLinkToken = pathname.split('/')[3];

    if (setupLinkToken) {
      const rawResponse = await fetch(`${process.env.EXTERNAL_URL}/api/setup/${setupLinkToken}`);

      const response: ApiResponse<SetupLink> = await rawResponse.json();

      if (!rawResponse.ok && 'error' in response) {
        return unAuthorizedResponse({ message: response.error.message });
      }
    }
  }

  // Validate API routes `/api/v1/*`
  if (pathname.startsWith('/api/v1')) {
    if (!validateApiKey(extractAuthToken(req))) {
      return unAuthorizedResponse({ message: 'Invalid API key' });
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

// Limit the middleware to paths starting with `/api/`
export const config = {
  matcher: '/api/:function*',
};
