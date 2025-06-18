import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log("Middleware token:", token);
    const userRole = token?.role;
    console.log(`Middleware Path: ${req.nextUrl.pathname}, UserRole: ${userRole}`);

    const PROTECTED_ROUTES_AND_ROLES: Record<string, string[]> = {
        '/admin': ['OWNER'],
        '/chef': ['CHEF', 'OWNER'],
        '/staff': ['STAFF', 'CHEF', 'OWNER'],
    };

    let isCurrentPathProtected = false;
    let requiredRoles: string[] = [];

    for (const pathPrefix in PROTECTED_ROUTES_AND_ROLES) {
        if (req.nextUrl.pathname.startsWith(pathPrefix)) {
            isCurrentPathProtected = true;
            requiredRoles = PROTECTED_ROUTES_AND_ROLES[pathPrefix];
            break;
        }
    }

    if (isCurrentPathProtected && !token) {
        console.log(`Middleware: Protected path "${req.nextUrl.pathname}" accessed without login. Redirecting to sign-in.`);
        const signInPage = new URL('/login', req.nextUrl.origin);
        signInPage.searchParams.set('callbackUrl', req.nextUrl.href);
        return NextResponse.redirect(signInPage);
    }

    if (isCurrentPathProtected && token && userRole && !requiredRoles.includes(userRole)) {
        console.log(`Middleware: User with role "${userRole}" attempted to access protected path "${req.nextUrl.pathname}" (required: ${requiredRoles.join(', ')}). Redirecting to unauthorized.`);
        return NextResponse.redirect(new URL('/unauthorized', req.nextUrl.origin));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
