import { NextResponse } from 'next/server';

export function middleware(request) {
  // Check for the standard next-auth session cookie (works for both HTTP and HTTPS)
  const token = 
    request.cookies.get('next-auth.session-token') || 
    request.cookies.get('__Secure-next-auth.session-token') ||
    request.cookies.get('authjs.session-token') ||
    request.cookies.get('__Secure-authjs.session-token');

  const { pathname } = request.nextUrl;
  
  // Define routes that should redirect TO dashboard if the user IS logged in
  const isAuthPage = pathname === '/' || pathname === '/login' || pathname === '/register';

  // If the user IS logged in and tries to access an auth page or home page
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If there is no token, and they are trying to access a protected route (anything other than auth pages)
  if (!token && !isAuthPage) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every route EXCEPT API routes, static files, and Next.js internal files
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
