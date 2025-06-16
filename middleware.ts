// middleware.ts (請確保這個文件存在於你的專案根目錄或 src 目錄下)
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export { default } from "next-auth/middleware"; // 這是 NextAuth.js v4 的基本 middleware 導入方式

// 這是在 NextAuth.js v4 中處理路由保護和授權的推薦方式
export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userRole = token?.role as string | undefined; // 從 JWT 中獲取角色

    console.log(`Middleware: Path: ${req.nextUrl.pathname}, UserRole: ${userRole}`);

    const PROTECTED_ROUTES_AND_ROLES = {
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

    // 如果路徑受保護且沒有登入 (token 不存在或 role 為空)
    if (isCurrentPathProtected && !token) {
        console.log(`Middleware: Protected path "${req.nextUrl.pathname}" accessed without login. Redirecting to sign-in.`);
        const signInPage = new URL('/login', req.nextUrl.origin); // 你的登入頁面路徑
        signInPage.searchParams.set('callbackUrl', req.nextUrl.href);
        return NextResponse.redirect(signInPage);
    }

    // 如果路徑受保護且已登入，但角色不符合要求
    if (isCurrentPathProtected && token && userRole && !requiredRoles.includes(userRole)) {
        console.log(`Middleware: User with role "${userRole}" attempted to access protected path "${req.nextUrl.pathname}" (required: ${requiredRoles.join(', ')}). Redirecting to unauthorized.`);
        return NextResponse.redirect(new URL('/unauthorized', req.nextUrl.origin));
    }

    // 如果一切正常，允許請求繼續
    return NextResponse.next();
}

// 配置 middleware 應該匹配的路徑
export const config = {
    // 匹配所有路徑，除了 API 路由、靜態文件和 _next 內部文件
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};