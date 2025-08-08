import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 需要认证的路径
  const protectedPaths = ['/matches', '/profile', '/feedback'];
  
  // 检查是否是受保护的路径
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));
  
  // 检查用户是否已登录（通过session token）
  const sessionToken = request.cookies.get('next-auth.session-token') || 
                      request.cookies.get('__Secure-next-auth.session-token');
  
  // 如果是受保护的路径且用户未登录，重定向到登录页
  if (isProtected && !sessionToken) {
    const url = new URL('/auth', request.url);
    return NextResponse.redirect(url);
  }
  
  // 如果用户已登录且访问认证页，重定向到matches页
  if (sessionToken && pathname === '/auth') {
    const url = new URL('/matches', request.url);
    return NextResponse.redirect(url);
  }
  
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
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};