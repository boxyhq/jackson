import type { NextFetchEvent, NextRequest } from 'next/server';
import { validateApiKey, extractAuthToken } from '@lib/auth';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest, ev: NextFetchEvent) {
  // Validate the API key
  if (!validateApiKey(extractAuthToken(req))) {
    return NextResponse.json({ data: null, error: { message: 'Unauthorized' } });
  }
}
