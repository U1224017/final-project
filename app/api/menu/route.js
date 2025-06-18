// D:\113-2\Breakfast-final-project\app\api\menu\route.js

import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// 取得所有菜單項目
export async function GET() {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("❌ 讀取菜單失敗：", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// 新增菜單項目
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, description, price, imageUrl, isAvailable } = body;

    if (!name || !price) {
      return new Response("缺少必要欄位：name 或 price", { status: 400 });
    }

    const newItem = await prisma.menuItem.create({
      data: {
        name,
        description: description || "",
        price: parseFloat(price),
        imageUrl: imageUrl || null,
        isAvailable: isAvailable ?? true, // 預設為 true
      },
    });

    return NextResponse.json(newItem);
  } catch (err) {
    console.error("❌ 新增菜單失敗：", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// ✅ 編輯（更新）菜單項目
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, name, description, price, imageUrl, isAvailable } = body;

    if (!id || !name || price === undefined) {
      return new Response("缺少必要欄位", { status: 400 });
    }

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        description: description || "",
        price: parseFloat(price),
        imageUrl: imageUrl || null,
        isAvailable: isAvailable ?? true,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (err) {
    console.error("❌ 更新菜單失敗：", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
