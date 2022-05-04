import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const method = req.method;
  const path = req.nextUrl.pathname;
  const url = req.url;

  console.log({
    method,
    path,
    url,
    //query: req.query,
  });

  return NextResponse.next();
}
