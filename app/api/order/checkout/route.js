// app/api/order/checkout/route.js
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req) {
  try {
    const token = await getToken({ req });
    const customerId = token?.id;

    if (!customerId) {
      return new Response("未授權的使用者", { status: 401 });
    }

    const body = await req.json();

    if (!Array.isArray(body.orderItems) || body.orderItems.length === 0) {
      return new Response("缺少訂單項目", { status: 400 });
    }

    for (const item of body.orderItems) {
      if (!item.menuItemId) {
        return new Response("訂單項目缺少 menuItemId", { status: 400 });
      }
      if (!item.quantity || item.quantity < 1) {
        return new Response("訂單項目數量不正確", { status: 400 });
      }
    }

    const menuItemIds = body.orderItems.map(i => i.menuItemId);

    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, price: true, isAvailable: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      return new Response("訂單中有不存在的菜單項目", { status: 400 });
    }

    if (menuItems.some(mi => mi.isAvailable === false)) {
      return new Response("訂單中包含不可用的菜單項目", { status: 400 });
    }

    const priceMap = {};
    menuItems.forEach(mi => {
      priceMap[mi.id] = mi.price;
    });

    const totalAmount = body.orderItems.reduce((sum, item) => {
      return sum + (priceMap[item.menuItemId] ?? 0) * item.quantity;
    }, 0);

    const newOrder = await prisma.order.create({
      data: {
        customerId, // ✅ 改為從 token 拿的 id
        totalAmount,
        items: {
          create: body.orderItems.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            specialRequest: item.specialRequest || "",
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(newOrder);
  } catch (error) {
    console.error("❌ 建立訂單錯誤:", error);
    return new Response("伺服器錯誤", { status: 500 });
  }
}
