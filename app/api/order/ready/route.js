// app/api/order/ready/route.js

import { prisma } from "../../../../lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req) {
  const token = await getToken({ req, secret });

  if (!token || !["STAFF", "CHEF","OWNER"].includes(token.role)) {
    return new Response("沒有權限", { status: 403 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "READY",       // ✅ READY 狀態
        paymentStatus: true,   // ✅ 確保已付款
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        customer: {
          select: { id: true, name: true },
        },
        items: {
          select: {
            specialRequest: true,
            menuItem: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("❌ 查詢 READY 訂單錯誤:", error);
    return new Response("伺服器錯誤", { status: 500 });
  }
}
