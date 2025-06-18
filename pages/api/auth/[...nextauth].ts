import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../../../lib/prisma";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials ?? {};

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || user.password !== password) {
          throw new Error("帳號或密碼錯誤");
        }

        if (user.isBanned) {
          throw new Error("AccessDenied");
        }

        return user;
      },
    }),
  ],

  callbacks: {
    // 新增 jwt callback，登入時從資料庫抓 role 並放進 token
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.id = dbUser.id;
        }
      }
      return token;
    },

    // 修改 session callback，從 token 取 role 放入 session.user
    async session({ session, token }) {
      if (!session?.user) return session;

      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.isBanned = token.isBanned as boolean;

      return session;
    },

    async signIn({ user }) {
      try {
        if (!user?.email) return false;

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "未命名",
              password: "", // OAuth 無密碼
              role: "CUSTOMER",
              isBanned: false,
            },
          });
          return true;
        }

        if (existingUser.isBanned) {
          console.log("❌ 此帳號已被停權");
          throw new Error("AccessDenied");
        }

        return true;
      } catch (error) {
        console.error("signIn error:", error);
        return false;
      }
    },

    async redirect({ url, baseUrl }) {
      if (!url) return baseUrl;

      try {
        let cleanUrl = url.replace(/[\n\r\t\s]/g, "");
        cleanUrl = encodeURI(cleanUrl);

        if (cleanUrl.includes("/api/auth/error")) {
          return `${baseUrl}/login?error=AccessDenied`;
        }

        if (cleanUrl.startsWith("/")) {
          return new URL(cleanUrl, baseUrl).toString();
        }

        return new URL(cleanUrl).toString();
      } catch {
        return baseUrl;
      }
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.AUTH_SECRET,
};

export default NextAuth(authOptions);
