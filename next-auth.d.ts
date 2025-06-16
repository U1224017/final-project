// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

// 擴展 `next-auth` 模組的型別
declare module "next-auth" {
  // 擴展 Session 介面，讓 `session.user` 包含自定義屬性
  interface Session extends DefaultSession {
    user?: DefaultUser & {
      id?: string; // 從 JWT token 來的用戶 ID
      role?: "CUSTOMER" | "STAFF" | "CHEF" | "OWNER"; // 從 JWT token 來的用戶角色
      provider?: string; // 登入提供者
    };
  }

  // 擴展 User 介面，這影響到 `jwt` callback 中 `user` 的型別
  interface User extends DefaultUser {
    id?: string; // 可能從資料庫來的 ID
    role?: "CUSTOMER" | "STAFF" | "CHEF" | "OWNER";
    provider?: string;
  }
}

// 擴展 `next-auth/jwt` 模組的型別
declare module "next-auth/jwt" {
  // 擴展 JWT 介面，讓 `token` 包含自定義屬性
  interface JWT extends DefaultJWT {
    id?: string; // 用戶 ID
    role?: "CUSTOMER" | "STAFF" | "CHEF" | "OWNER"; // 用戶角色
    provider?: string; // 登入提供者
  }
}