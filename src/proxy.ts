import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

const authMiddleware = auth.middleware({
  loginUrl: '/sign-in',
});

const PUBLIC_FILE_PATTERN = /\.(?:svg|png|jpg|jpeg|gif|webp)$/i;

function isStaticOrPublicPath(pathname: string) {
  return (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname === '/favicon.ico' ||
    PUBLIC_FILE_PATTERN.test(pathname)
  );
}

function isProtectedPath(pathname: string) {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/');
}

function isBypassedPath(pathname: string) {
  return (
    pathname.startsWith('/api/') ||
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    isStaticOrPublicPath(pathname)
  );
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isBypassedPath(pathname)) {
    return NextResponse.next();
  }

  if (isProtectedPath(pathname)) {
    return authMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
