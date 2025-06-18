"use client";
import { useEffect, useState, useMemo } from "react";
import { useMqttClient } from "@/hooks/useMqttClient";
import { editOrderStatus, getKitchenOrders, editOrderCompletion } from "@/app/actions/order";
import { addNotification } from "@/app/actions/notification";
import { getKitchenOrderTopic } from "@/utils/mqttTopic";

export default function KitchenPage() {
    const topic = useMemo(() => getKitchenOrderTopic(), []);
    const { messages, publishMessage } = useMqttClient({
        subscribeTopics: [topic],
    });

    const [orders, setOrders] = useState([]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
            let data = await getKitchenOrders();
            if (!data) {
                alert("取得廚房訂單失敗");
                return;
            }

            setOrders(data);
            } catch (err) {
            alert("取得廚房訂單失敗");
            }
        };
        fetchOrders();
        }, []);
    useEffect(() => {
        if (messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];
        try {
            const newOrder = JSON.parse(lastMessage.payload);
            setOrders((prev) => {
                const exists = prev.some((order) => order.id === newOrder.id);
                return exists ? prev : [...prev, newOrder];
            });
        } catch (err) {
            console.error("無法解析 MQTT 訊息:", err);
        }
    }, [messages]);

    const handleCompleteOrder = async (orderId) => {
        try {
            // 標記為已完成（isCompleted = true）
            const completeRes = await editOrderCompletion(orderId);
            if (!completeRes) {
            alert("❌ 標記完成失敗！");
            return;
            }

            // 嘗試設為 READY（會判斷付款是否完成）
            const data = await editOrderStatus({ status: "READY" }, orderId);
            if (!data) {
            alert("❌ 設定為 READY 失敗（可能尚未付款）");
            return;
            }

            // 從 UI 移除該訂單
            setOrders((prev) => prev.filter((order) => order.id !== orderId));

            // 發送通知
            const orderToUpdate = orders.find((order) => order.id === orderId);
            const customerId = orderToUpdate?.customerId;

            if (!customerId) {
            alert("找不到顧客資料");
            return;
            }
            const message = `可領取訂單 ${orderId.slice(0, 8)}`;

            let notificationRes = await addNotification({ orderId, message }, customerId);
            if (!notificationRes) {
            const res = await fetch(`/api/notifications/users/${customerId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, message }),
            });
            if (!res.ok) {
                alert("傳送通知失敗");
                return;
            }
            notificationRes = await res.json();
            }

            const readyNotificationTopic = `nuu/shisa/beigo/notify/order${customerId}`;
            if (notificationRes?.id) {
            const messagePayload = JSON.stringify({
                type: "READY",
                message: `訂單 ${orderId.slice(0, 8)} 已準備好`,
                notificationId: notificationRes.id,
            });
            publishMessage(readyNotificationTopic, messagePayload);
            }
        } catch (error) {
            console.error("完成訂單失敗:", error);
        }
        };



    return (
        <main className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-extrabold mb-6 text-gray-800">
                👨‍🍳 廚房訂單看板
            </h1>
            {orders.length === 0 ? (
                <div className="text-center text-gray-500 mt-12 text-lg">
                    暫無待處理訂單 🍳
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map((order, idx) => (
                        <div
                            key={`${order.id}-${idx}`}
                            className="bg-white rounded-2xl shadow-md hover:shadow-lg transition duration-200 p-6 border border-gray-100"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">
                                        訂單 #{order.id.slice(0, 8)}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {new Date(order.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <ul className="space-y-2 text-sm">
                                    {order.items.map((item, idx) => (
                                        <li key={`${item.id}-${idx}`}>
                                            <div className="flex justify-between items-start">
                                                <span className="font-medium">
                                                    {item.menuItem.name} × {item.quantity}
                                                </span>
                                            </div>
                                            {item.specialRequest && (
                                                <div className="mt-1 text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                                                    <strong>備註：</strong> {item.specialRequest}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <button
                                onClick={() =>
                                    handleCompleteOrder(order.id)
                                }
                                className="mt-5 w-full bg-green-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-green-700 transition"
                            >
                                ✅ 標記為已完成
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}

