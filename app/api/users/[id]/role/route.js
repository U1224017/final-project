import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req, { params }) {
  try {
    const userId = params.id;
    if (!userId) {
      return new Response("缺少 userId", { status: 400 });
    }

    const { role } = await req.json();
    if (!role) {
      return new Response("缺少 role 欄位", { status: 400 });
    }

    // 不允許更改 OWNER 權限（視你的需求）
    if (role === "OWNER") {
      return new Response("不能更改為 OWNER", { status: 403 });
    }

    // 更新使用者角色
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("更改使用者權限失敗:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
