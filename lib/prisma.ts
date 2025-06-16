// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

// --- Prisma: Singleton ---
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// --- Supabase ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Supabase 環境變數未設定");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
