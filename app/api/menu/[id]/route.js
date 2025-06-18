import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PUT(req, { params }) {
  try {
    const id = params.id; // 如果你的 id 是字串（像 Supabase UUID），不用 parseInt

    if (!id) {
      return new Response("缺少 id", { status: 400 });
    }

    const body = await req.json();
    const { name, description, price, imageUrl, isAvailable } = body;

    if (!name || price === undefined) {
      return new Response("缺少必要欄位", { status: 400 });
    }

    const updatedItem = await prisma.menuItem.update({
      where: { id: id },
      data: {
        name,
        description,
        price,
        imageUrl,
        isAvailable,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (err) {
    console.error("❌ 更新菜單失敗：", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
