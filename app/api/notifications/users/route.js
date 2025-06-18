// app/api/notifications/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/authOptions";
import { prisma } from "../../../../lib/prisma";

// ✅ 取得目前登入使用者的通知
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notifications);
  } catch (err) {
    console.error("[GET /api/notifications] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ✅ 新增通知
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { userId, orderId, message } = body;

  if (!userId || !orderId || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        orderId,
        message,
      },
    });

    return NextResponse.json(notification);
  } catch (err) {
    console.error("[POST /api/notifications] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
