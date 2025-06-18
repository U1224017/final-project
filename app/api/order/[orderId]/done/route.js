export async function PATCH(req, { params }) {
  const orderId = params.orderId;

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) return NextResponse.json({ error: "找不到訂單" }, { status: 404 });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { completedAt: new Date() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ 標記完成錯誤:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
