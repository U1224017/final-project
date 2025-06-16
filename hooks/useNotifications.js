// hooks/useNotifications.js
"use client";

import { useEffect, useState, useCallback } from "react"; // ✨ 新增 useCallback
// ✨ 移除這行：import useUser from "./useUser"; // 不再需要 useUser hook
import { useMqttClient } from "@/hooks/useMqttClient";
import { getUserNotification } from "@/app/actions/notification";
import { getOrderStatusWildcardTopic } from "@/utils/mqttTopic";

// ✨ 修改：useNotifications 現在接受 userId 作為參數
export default function useNotifications(userId) {
    // 移除 useUser 相關的 state
    // const { user, loading: userLoading } = useUser();
    
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [topic, setTopic] = useState("");

    // MQTT 訂閱的主題現在依賴於傳入的 userId
    const { messages } = useMqttClient({
        subscribeTopics: userId ? [getOrderStatusWildcardTopic(userId)] : [], // ✨ 修改：訂閱主題基於 userId
    });

    // 提取通知載入邏輯到 useCallback 函數中
    const fetchNotifications = useCallback(async () => {
        // ✨ 關鍵檢查：如果 userId 不存在，則直接返回
        if (!userId) {
            setNotifications([]); // 清空通知
            setUnreadCount(0);
            setLoading(false); // 停止載入狀態
            return;
        }

        setLoading(true);
        // 設定 MQTT topic
        setTopic(getOrderStatusWildcardTopic(userId)); // ✨ 修改：設定 topic 依賴 userId

        try {
            // action
            let data = await getUserNotification(userId);
            if (!data) {
                // api (作為備用或主要方式)
                const response = await fetch(
                    `/api/notifications/users/${userId}`
                );
                if (!response.ok) {
                    console.error("取得使用者通知失敗");
                    setLoading(false);
                    return;
                }
                data = await response.json();
            }

            const formedData = data.map((item) => {
                return {
                    id: item.id,
                    title: "訂單",
                    type: "order",
                    content: item.message,
                    read: item.isRead,
                    time: new Date(item.createdAt).toLocaleString("sv"),
                };
            });
            setNotifications(formedData);
            setUnreadCount(formedData.filter((n) => !n.read).length);
            setLoading(false);
        } catch (error) {
            console.error("載入通知時發生錯誤:", error);
            setLoading(false);
        }
    }, [userId]); // ✨ 依賴於 userId

    // 初始載入通知的 useEffect
    useEffect(() => {
        // ✨ 移除 userLoading 和 user.id 的檢查，因為現在直接依賴 userId props
        fetchNotifications(); // ✨ 調用提取出來的 fetchNotifications
    }, [fetchNotifications]); // ✨ 依賴於 fetchNotifications

    // 當收到新的 MQTT 訊息時更新通知
    useEffect(() => {
        // ✨ 增加安全檢查：如果 userId 不存在，則不處理 MQTT 訊息
        if (!userId || messages.length === 0) {
            return;
        }
        try {
            const lastMessage = messages[messages.length - 1];
            // 確認消息是否為字串，並嘗試解析
            const newOrder = JSON.parse(lastMessage.payload.toString()); // ✨ 確保 payload 是字串

            setNotifications((prev) => {
                // 防止重複添加相同的通知 (如果 MQTT 有可能重發)
                if (prev.some(n => n.id === newOrder.id)) {
                    return prev;
                }
                // 假設 newOrder 已經是與 formedData 相同格式的物件
                return [newOrder, ...prev];
            });
            setUnreadCount((prev) => prev + 1);
        } catch (err) {
            console.error("無法解析 MQTT 訊息:", err);
        }
    }, [messages, userId]); // ✨ 依賴中加入 userId

    const notificationSetter = (notifications) => {
        setNotifications(notifications);
        const unreadCount = notifications.filter(
            (n) => n.read === false
        ).length;
        setUnreadCount(unreadCount);
    };

    return {
        notifications,
        setNotifications: notificationSetter,
        unreadCount,
        loading,
        // 如果外部組件需要，也可以暴露 fetchNotifications
        fetchNotifications 
    };
}