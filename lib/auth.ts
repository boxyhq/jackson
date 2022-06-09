import env from '@lib/env';

export const validateApiKey = (token: string | null) => {
  if (!token) {
    return false;
  }

  return env.apiKeys.includes(token);
};

export const extractAuthToken = (req): string | null => {
  let authHeader = '';

  if (typeof req.headers.get === 'function') {
    // For Next.js middleware (NextRequest) https://nextjs.org/docs/advanced-features/middleware
    authHeader = req.headers.get('authorization') || '';
  } else {
    authHeader = req.headers.authorization || '';
  }

  const parts = authHeader.split(' ');

  return parts.length > 1 ? parts[1] : null;
};
