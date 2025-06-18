import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req, context) {
  const { orderId } = context.params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return new Response("找不到訂單", { status: 404 });
  }

  return NextResponse.json(order);
}
