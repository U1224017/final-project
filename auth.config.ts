import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
// @ts-ignore
import type { NextAuthConfig } from "next-auth";
import { prisma } from "./lib/prisma"

const params = {
  prompt: "consent",
  access_type: "offline",
  response_type: "code",
};

const authOptions = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params },
    }),
  ],

  // ✅ 必加，middleware 才能拿到 role
  session: {
    strategy: "jwt",
  },

callbacks: {
    async jwt({ token, user }) {
        console.log("JWT callback - token:", token);
        console.log("JWT callback - user:", user);
        if (user?.email) {
            const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
            console.log("JWT callback - dbUser:", dbUser);
            token.role = dbUser?.role ?? "CUSTOMER";
        }
        console.log("JWT callback - final token:", token);
        return token;
        },
    async session({ session, token }) {
        console.log("Session callback - session:", session);
        console.log("Session callback - token:", token);
        if (token?.role) {
            session.user.role = token.role;
        }
        console.log("Session callback - final session:", session);
        return session;
        }
    }
};
export default authOptions as NextAuthConfig;