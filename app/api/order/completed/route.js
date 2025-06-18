// app/api/order/completed/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: { status: "COMPLETED" },
      include: {
        customer: true,
        items: {
          include: { menuItem: true },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (err) {
    console.error("❌ 讀取完成訂單失敗:", err);
    return new Response("伺服器錯誤", { status: 500 });
  }
}
