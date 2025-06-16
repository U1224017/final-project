// app/api/image/upload/route.js
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { imageUrl, description } = body;

    if (!imageUrl) {
      return new Response("缺少圖片網址", { status: 400 });
    }

    // 儲存圖片資料到資料庫（如果有圖片表）
    const saved = await prisma.image.create({
      data: {
        url: imageUrl,
        description: description || "",
      },
    });

    return NextResponse.json(saved);
  } catch (err) {
    console.error("❌ 儲存圖片網址失敗：", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
