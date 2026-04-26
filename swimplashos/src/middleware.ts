import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For now, this is a placeholder. 
  // In a real implementation, we would check for a Firebase session cookie.
  // For the purpose of this MVP, we will rely on client-side protection in the layout
  // until the session cookie logic is implemented.
  
  const path = request.nextUrl.pathname;
  
  // If the path is under (dashboard), we would check auth
  // if (path.startsWith('/dashboard') || path.startsWith('/students') || ...) {
  //   ...
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
