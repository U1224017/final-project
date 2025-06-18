"use client";

import { useEffect, useState } from "react";
import { useMqttClient } from "@/hooks/useMqttClient";
import { editOrderStatus, getPendingOrders, deleteOrder } from "@/app/actions/order";
import { addNotification } from "@/app/actions/notification";
import {
    getOrderCheckoutTopic,
    getCustomerCancelOrderTopic,
    getNotificationTopicByUserId,
    getOrderToKitchenTopic
} from "@/utils/mqttTopic";

export default function PendingOrdersPage() {
    const [orders, setOrders] = useState([]);
    const { messages, publishMessage } = useMqttClient({
        subscribeTopics: [
            getOrderCheckoutTopic(),
            getCustomerCancelOrderTopic("#"),
        ],
    });

    useEffect(() => {
        const getOrders = async () => {
            try {
                let data = await getPendingOrders();
                if (!data) {
                    const response = await fetch(`/api/order`);
                    if (!response.ok) {
                        alert("獲取訂單失敗");
                        return;
                    }
                    data = await response.json();
                }
                setOrders(data.map(order => ({ ...order, uiAccepted: false })));
            } catch (err) {
                console.error("獲取訂單失敗:", err);
                alert("獲取訂單失敗");
            }
        };
        getOrders();
    }, []);

    useEffect(() => {
        if (messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];
        const topic = lastMessage.topic;

        const isCheckoutOrder = topic === getOrderCheckoutTopic();
        const isCancelOrder = topic.startsWith(getCustomerCancelOrderTopic(""));

        if (isCheckoutOrder) {
            try {
                const newOrder = JSON.parse(lastMessage.payload);
                setOrders((prev) =>
                    prev.some((order) => order.id === newOrder.id)
                        ? prev
                        : [{ ...newOrder, uiAccepted: false }, ...prev]
                );
            } catch (err) {
                console.error("無法解析新訂單的 MQTT 訊息:", err);
            }
        }

        if (isCancelOrder) {
            try {
                const payload = JSON.parse(lastMessage.payload);
                setOrders((prev) => prev.filter((order) => order.id !== payload.orderId));
            } catch (err) {
                console.error("無法解析取消訂單的 MQTT 訊息:", err);
            }
        }
    }, [messages]);

    const updateOrderStatus = (orderId, updates) => {
        setOrders((prev) =>
            prev.map((order) =>
                order.id === orderId ? { ...order, ...updates } : order
            )
        );
    };

    const handleAcceptOrder = async (orderId) => {
        const acceptedOrder = orders.find((order) => order.id === orderId);
        if (!acceptedOrder) return;

        if (!acceptedOrder.paymentStatus) {
            alert("請先確認顧客已付款！");
            return;
        }

        try {
            const data = await editOrderStatus({ status: "PREPARING" }, orderId);
            if (!data) throw new Error("修改訂單狀態失敗");

            updateOrderStatus(orderId, { status: "PREPARING" });

            const message = `訂單 ${orderId.slice(0, 8)} 商家已接單，正在準備中`;
            const customerId = acceptedOrder.customerId;

            const notificationRes = await addNotification({ orderId, message }, customerId);
            if (!notificationRes) throw new Error("傳送通知失敗");

            const notifyTopic = getNotificationTopicByUserId(customerId);
            publishMessage(notifyTopic, JSON.stringify({
                notificationId: notificationRes.id,
                message,
            }));

            const kitchenTopic = getOrderToKitchenTopic();
            const kitchenPayload = JSON.stringify({
                orderId: acceptedOrder.id,
                items: acceptedOrder.items.map((item) => ({
                    name: item.menuItem.name,
                    quantity: item.quantity,
                    specialRequest: item.specialRequest,
                })),
                totalAmount: acceptedOrder.totalAmount,
                createdAt: acceptedOrder.createdAt,
            });
            publishMessage(kitchenTopic, kitchenPayload);

        } catch (error) {
            console.error("接受訂單失敗:", error);
            alert(`❌ 接受訂單失敗：${error.message}`);
        }
    };

    const handleConfirmPayment = async (orderId) => {
        try {
            const res = await editOrderStatus({ paymentStatus: true }, orderId);
            if (!res) throw new Error("更新付款狀態失敗");

            updateOrderStatus(orderId, { paymentStatus: true });

            const order = orders.find((o) => o.id === orderId);
            if (!order) return;

            const message = `訂單 ${orderId.slice(0, 8)} 已確認付款`;
            const customerId = order.customerId;

            const notificationRes = await addNotification({ orderId, message }, customerId);
            if (!notificationRes) throw new Error("傳送通知失敗");

            const topic = getNotificationTopicByUserId(customerId);
            publishMessage(topic, JSON.stringify({
                message,
                notificationId: notificationRes.id
            }));

        } catch (err) {
            console.error("確認付款失敗:", err);
            alert(`❌ 確認付款失敗：${err.message}`);
        }
    };

    const handleDeleteOrder = async (orderId, customerId) => {
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("✅");

            setOrders((prev) => prev.filter((order) => order.id !== orderId));
            alert("✅ 已刪除訂單");

            const message = `訂單 ${orderId.slice(0, 8)} 已被商家取消`;
            const notifyRes = await addNotification({ orderId, message }, customerId);
            if (notifyRes) {
                const topic = getNotificationTopicByUserId(customerId);
                publishMessage(topic, JSON.stringify({
                    notificationId: notifyRes.id,
                    message,
                }));
            }

            const kitchenTopic = getOrderToKitchenTopic();
            publishMessage(kitchenTopic, JSON.stringify({
                type: "CANCEL_ORDER",
                orderId
            }));

        } catch (err) {
            console.error("刪除訂單錯誤:", err);
            alert("已刪除" + err.message);
        }
    };

    const renderOrderActions = (order) => {
        const isLocallyAccepted = order.uiAccepted;

        if (order.status === "PENDING" && !isLocallyAccepted) {
            return (
                <div className="flex gap-3">
                    <button
                        onClick={() => updateOrderStatus(order.id, { uiAccepted: true })}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                    >
                        接受訂單
                    </button>
                    <button
                        onClick={() => {
                            if (confirm("確定要刪除此訂單嗎？")) {
                                handleDeleteOrder(order.id, order.customerId);
                            }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                    >
                        刪除訂單
                    </button>
                </div>
            );
        }

        if (order.status === "PENDING" && isLocallyAccepted) {
            return (
                <div className="flex gap-3">
                    <button
                        onClick={() => handleConfirmPayment(order.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                        disabled={order.paymentStatus}
                    >
                        {order.paymentStatus ? "已確認付款" : "確認付款"}
                    </button>
                    <button
                        onClick={() => handleAcceptOrder(order.id)}
                        className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition"
                    >
                        標記為製作中
                    </button>
                    <button
                        onClick={() => {
                            if (confirm("確定要刪除此訂單嗎？")) {
                                handleDeleteOrder(order.id, order.customerId);
                            }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                    >
                        刪除訂單
                    </button>
                </div>
            );
        }

        if (order.status === "READY") {
            return (
                <p className="text-green-600 font-semibold">餐點已完成，等待取餐</p>
            );
        }

        return null;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 px-4 sm:px-6 py-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-center sm:text-left text-gray-800">
                    進行中訂單
                </h1>

                {orders.length === 0 ? (
                    <p className="text-gray-500 text-center sm:text-left">
                        目前沒有進行中的訂單。
                    </p>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order, idx) => (
                            <div
                                key={`${order.id}-${idx}`}
                                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                            >
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">
                                            訂單 #{order.id.slice(0, 8)}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-sm font-semibold mt-2 sm:mt-0">
                                        狀態：
                                        <span className={`px-2 py-1 rounded-full text-white ${
                                            order.status === 'PENDING' ? 'bg-gray-500' :
                                            order.status === 'PREPARING' ? 'bg-blue-500' :
                                            order.status === 'READY' ? 'bg-green-500' : 'bg-red-500'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-3 space-y-1">
                                    <p className="text-gray-700">
                                        <strong>總金額：</strong> ${order.totalAmount.toFixed(2)}
                                    </p>
                                    <p className="text-gray-700">
                                        <strong>顧客：</strong> {order.customer.name}
                                    </p>
                                    <p className="text-gray-700">
                                        <strong>付款狀態：</strong>
                                        <span className={order.paymentStatus ? "text-green-600" : "text-red-600"}>
                                            {order.paymentStatus ? "已付款" : "未付款"}
                                        </span>
                                    </p>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-semibold mb-2 text-gray-700">
                                        餐點內容：
                                    </h4>
                                    <ul className="space-y-2">
                                        {order.items.map((item, idx) => (
                                            <li
                                                key={`${item.id}-${idx}`}
                                                className="flex justify-between text-sm text-gray-600"
                                            >
                                                <span>
                                                    {item.menuItem.name} × {item.quantity}
                                                    {item.specialRequest && (
                                                        <span className="block text-xs text-gray-400">
                                                            備註：{item.specialRequest}
                                                        </span>
                                                    )}
                                                </span>
                                                <span>
                                                    ${(item.menuItem.price * item.quantity).toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-6 flex flex-col sm:flex-row justify-end items-center gap-3">
                                    {renderOrderActions(order)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
