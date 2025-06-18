export async function DELETE(req, { params }) {
  const orderId = params.id;

  try {
    // 先檢查訂單是否存在
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: '找不到該訂單' }, { status: 404 });
    }

    // 先刪除關聯的 OrderItem
    await prisma.orderItem.deleteMany({
      where: { orderId },
    });

    // 再刪除關聯的 Notification
    await prisma.notification.deleteMany({
      where: { orderId },
    });

    // 最後刪除 Order 本身
    const deletedOrder = await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ success: true, deletedOrder });
  } catch (error) {
    console.error('刪除失敗:', error);
    return NextResponse.json({ error: '伺服器錯誤，刪除失敗' }, { status: 500 });
  }
}