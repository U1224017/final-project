// app/api/kitchen/route.js

import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "PREPARING", // ✅ 僅顯示已被接受的訂單
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        customer: true,
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("❌ 無法取得廚房訂單:", error);
    return NextResponse.json(
      { error: "無法取得廚房訂單" },
      { status: 500 }
    );
  }
}
