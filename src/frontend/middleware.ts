import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Geschützte Routes definieren
const protectedRoutes = [
  '/bookings',
  '/admin', 
  '/profile'
];

// Öffentliche Routes (immer zugänglich)
const publicRoutes = [
  '/',
  '/login',
  '/register', 
  '/verify-email',
  '/api-test'
];

/**
 * Next.js Middleware für Route Protection
 * 
 * Schützt definierte Routes vor unauthentifizierten Zugriffen
 * und leitet auf Login-Seite mit Redirect-Parameter weiter.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Token aus Cookie oder Authorization Header
  const token = request.cookies.get('auth_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Prüfe ob Route geschützt ist
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // Geschützte Route ohne Token -> Login-Redirect
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authentifizierte Benutzer auf Login/Register -> Bookings weiterleiten
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/bookings', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Schütze alle Routes außer statische Assets und API-Routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};