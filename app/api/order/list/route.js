
// app/api/order/list/route.js
import { getToken } from "next-auth/jwt";
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req) {
  // ✅ 使用風險寫法：只檢查是否有登入，不驗證角色
  const token = await getToken({ req, secret });

  if (!token?.id) {
    return new Response("請先登入", { status: 401 });
  }

  const userId = token.id;

  try {
    const orders = await prisma.order.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        status: true,
        totalAmount: true,
        paymentStatus: true,
        completedAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            specialRequest: true,
            menuItem: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("取得訂單列表錯誤:", error);
    return new Response("伺服器錯誤", { status: 500 });
  }
}