import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("收到的訂單資料:", body);

    // 檢查必要資料
    if (!body.userId || !body.orderItems || body.orderItems.length === 0) {
      console.warn("缺少必要資料:", { userId: body.userId, orderItems: body.orderItems });
      return new Response("缺少必要資料", { status: 400 });
    }

    // 取得所有 menuItem 的價格
    const menuItemIds = body.orderItems.map(item => item.menuItemId);
    console.log("訂單的菜單項目 IDs:", menuItemIds);

    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, price: true }
    });

    console.log("資料庫中找到的菜單項目:", menuItems);

    // 檢查是否所有菜單項目都存在
    if (menuItems.length !== menuItemIds.length) {
      console.warn("訂單中有不存在的菜單項目");
      return new Response("訂單中有不存在的菜單項目", { status: 400 });
    }

    // 建立價格映射表
    const priceMap = {};
    menuItems.forEach(mi => {
      priceMap[mi.id] = mi.price;
    });

    // 計算總金額
    const totalAmount = body.orderItems.reduce((sum, item) => {
      const price = priceMap[item.menuItemId];
      if (price === undefined) {
        console.warn(`找不到菜單項目價格: ${item.menuItemId}`);
        return sum;
      }
      return sum + price * (item.quantity || 1);
    }, 0);

    console.log("計算出的總金額:", totalAmount);

    // 建立訂單與訂單項目
    const newOrder = await prisma.order.create({
      data: {
        customerId: body.userId,
        totalAmount,
        status: "PENDING",
        paymentStatus: false,
        completedAt: null,
        items: {
          create: body.orderItems.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity || 1,
            specialRequest: item.specialRequest || "",
          })),
        },
      },
      include: {
        items: true,
      },
    });

    console.log("訂單建立成功:", newOrder);

    return NextResponse.json(newOrder);

  } catch (error) {
    console.error("建立訂單發生錯誤:", error);
    return new Response("伺服器錯誤", { status: 500 });
  }
}
