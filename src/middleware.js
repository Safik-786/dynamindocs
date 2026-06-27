import { NextResponse } from 'next/server';

export function middleware(request) {
  // Check for the standard next-auth session cookie (works for both HTTP and HTTPS)
  const token = 
    request.cookies.get('next-auth.session-token') || 
    request.cookies.get('__Secure-next-auth.session-token') ||
    request.cookies.get('authjs.session-token') ||
    request.cookies.get('__Secure-authjs.session-token');

  // If there is no token, redirect the user to the login page
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    
    // Preserve the original URL so they can be redirected back after successful login
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    
    return NextResponse.redirect(loginUrl);
  }

  // Allow the request to proceed if authenticated
  return NextResponse.next();
}

// Specify which routes should be protected by this middleware
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/document/:path*', 
    '/rbac/:path*', 
    '/users/:path*'
  ],
};
