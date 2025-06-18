import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        createdAt: true,
        isBanned: true,  // <-- 這裡新增 isBanned
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("取得使用者失敗:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
