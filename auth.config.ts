// auth.config.ts
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
// @ts-ignore
import type { NextAuthConfig } from "next-auth";

const params = {
    prompt: "consent",
    access_type: "offline",
    response_type: "code",
};

const authOptions = {
    providers: [
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            authorization: {
                params: params,
            },
        }),
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: params,
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.role = (user as any).role; // 假設 user 介面中有 role 屬性
                token.sub = user.id; // 將 user.id 存入 token.sub
            }
            if (account) {
                token.provider = account.provider;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session?.user) {
                session.user.role = token.role as string;
                session.user.id = token.sub as string;
                session.user.provider = token.provider as string;
            }
            return session;
        },
        // --- 新增的 authorized 回調函數 ---
        async authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user; // 檢查用戶是否登入
            // 根據你的應用程式邏輯定義哪些路徑需要保護
            // 例如，所有 '/admin' 開頭的路徑都需要登入
            const isProtectedRoute = nextUrl.pathname.startsWith('/admin'); 

            if (isProtectedRoute && !isLoggedIn) {
                // 如果是受保護路徑且未登入，則返回 false，NextAuth.js 會自動重定向到登入頁
                return false;
            }
            // 對於其他情況（已登入的受保護路徑，或非受保護路徑），允許訪問
            return true;
        },
        // ------------------------------------
    },
    // --- 新增的 pages 設定 ---
    pages: {
        signIn: "/auth/signin", // 指向你自訂的登入頁面
        // 你也可以在這裡設定其他自訂頁面，例如 signOut, error, verifyRequest
    },
    // -------------------------
    // debug 模式可以在開發環境中開啟，以便排查問題
    // debug: process.env.NODE_ENV === "development",
};

export default authOptions as NextAuthConfig;