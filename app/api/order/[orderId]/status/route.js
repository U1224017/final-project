import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { getMqttClient } from "@/lib/mqttClient";
import {
  getKitchenReadyOrderTopic,
  getStaffCompletedOrderTopic,
} from "@/utils/mqttTopic";

const secret = process.env.NEXTAUTH_SECRET;

export async function PATCH(req, { params }) {
  const token = await getToken({ req, secret });

  if (!token || !["STAFF", "CHEF", "OWNER"].includes(token.role)) {
    return new Response("沒有權限", { status: 403 });
  }

  const { orderId } = params;
  const { status, paymentStatus } = await req.json();

  if (!orderId) {
    return new Response("缺少訂單 ID", { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return new Response("找不到訂單", { status: 404 });
    }

    const data = {};

    // ✅ 如果沒帶 status，但廚師只是想標記完成時間
    if (!status && order.status === "PREPARING" && order.completedAt === null) {
      data.completedAt = new Date();
    }

    // ✅ 若有給 status，處理狀態邏輯
    if (status) {
      if (status === "READY") {
        if (order.status !== "PREPARING") {
          return new Response("狀態必須為 PREPARING 才能轉為 READY", { status: 400 });
        }

        const isPaid = paymentStatus === true || order.paymentStatus === true;
        if (!isPaid) {
          return new Response("尚未確認付款，不能轉為 READY", { status: 400 });
        }

        const isDone =
          order.completedAt !== null || data.completedAt !== undefined;
        if (!isDone) {
          return new Response("尚未完成製作，不能轉為 READY", { status: 400 });
        }
      }

      data.status = status;
    }

    // ✅ 處理付款狀態
    if (paymentStatus !== undefined) {
      data.paymentStatus = paymentStatus;
    }

    // ✅ 明確轉為 COMPLETED 狀態時，也加上完成時間
    if (status === "COMPLETED") {
      data.completedAt = new Date();
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data,
    });

    // ✅ 發送 MQTT 通知
    if (status === "READY" || status === "COMPLETED") {
      const mqtt = await getMqttClient();
      const topic =
        status === "READY"
          ? getKitchenReadyOrderTopic(order.customerId)
          : getStaffCompletedOrderTopic(order.customerId);

      const payload = JSON.stringify({ orderId, status });

      mqtt.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error("❌ 發送 MQTT 通知失敗:", err);
        } else {
          console.log(`📢 已發送 ${status} 狀態通知至 ${topic}`);
        }
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("❌ 更新訂單狀態失敗:", err);
    return new Response("伺服器錯誤", { status: 500 });
  }
}
