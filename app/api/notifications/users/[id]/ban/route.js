import { prisma } from "../../../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  const { id } = params;

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return new Response("使用者不存在", { status: 404 });

    const updated = await prisma.user.update({
      where: { id },
      data: { isBanned: !existing.isBanned },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("❌ 停權操作失敗：", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}