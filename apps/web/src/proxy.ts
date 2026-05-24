import { NextResponse, type NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/targets', '/interview', '/history', '/reports', '/settings', '/help'];

export function proxy(request: NextRequest) {
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get('intervue_session')?.value);

  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/targets/:path*',
    '/interview/:path*',
    '/history/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/help/:path*',
  ],
};
