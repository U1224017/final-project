import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req, context) {
  try {
    const { params } = context;
    const userId = params?.id;

    if (!userId) {
      return new Response("缺少使用者 ID", { status: 400 });
    }

    const { isBanned } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isBanned },
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error("❌ 停權更新失敗", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
