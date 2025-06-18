import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req) {
  const token = await getToken({ req, secret });

  if (!token?.id) {
    return new Response("請先登入", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const statuses = statusParam ? statusParam.split(",") : ["PENDING"];

    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: statuses,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
        totalAmount: true,
        paymentStatus: true,
        completedAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
    console.error("獲取訂單錯誤:", error);
    return new Response("伺服器錯誤", { status: 500 });
  }
}