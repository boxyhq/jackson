import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { validateApiKey, extractAuthToken } from '@lib/auth';
import { getToken } from 'next-auth/jwt';
import { sessionName } from '@lib/constants';
// import jackson from '@lib/jackson';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Validate API routes `/api/admin/*`
  if (pathname.startsWith('/api/admin')) {
    const adminToken = await getToken({
      req,
      cookieName: sessionName,
    });

    if (!adminToken) {
      return unAuthorizedResponse();
    }
  }

  // Validate API routes `/api/setup/*`
  // if (pathname.startsWith('/api/setup')) {
  //   // const { setupLinkController } = await jackson();

  //   const setupLinkToken = pathname.split('/')[3];

  //   // const setupLink = await setupLinkController.getByToken(setupLinkToken);

  //   // if (!setupLink) {
  //   //   return unAuthorizedResponse();
  //   // }
  // }

  if (pathname.startsWith('/api/v1')) {
    if (!validateApiKey(extractAuthToken(req))) {
      return unAuthorizedResponse();
    }
  }

  return NextResponse.next();
}

// Send 401 response for unauthenticated requests
const unAuthorizedResponse = async () => {
  const response = JSON.stringify({ error: { message: 'Unauthorized' } });

  return new NextResponse(response, {
    status: 401,
    headers: { 'content-type': 'application/json' },
  });
};

// Limit the middleware to paths starting with `/api/`
export const config = {
  matcher: '/api/:function*',
};
