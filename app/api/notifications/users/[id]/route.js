import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import prisma from "@/lib/prisma";

// DELETE /api/notifications/:id - 刪除通知
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notificationId = params.id;

  if (!notificationId) {
    return NextResponse.json({ error: "Missing notification ID" }, { status: 400 });
  }

  try {
    const deleted = await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });

    return NextResponse.json({ message: "Deleted successfully", deleted });
  } catch (err) {
    console.error("[DELETE /api/notifications/:id] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
