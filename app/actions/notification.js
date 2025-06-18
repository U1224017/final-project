// app/actions/notification.js (修正後)
"use server"; // ✨ 必須有這行，將其標記為 Server Actions

import { prisma } from '@/lib/prisma'; // ✨ 導入具名導出的 prisma 客戶端

export const addNotification = async (body, userId) => {
    try {
        // ✨ 這裡應該是添加通知到資料庫的邏輯
        if (!userId || !body || !body.message || !body.orderId || !body.title || !body.type) {
            throw new Error("Missing notification data or userId.");
        }
        const newNotification = await prisma.notification.create({
            data: {
                userId: userId,
                orderId: body.orderId, // 假設 body 包含 orderId
                message: body.message,
                // 其他欄位如 isRead 會有 default 值
                // title 和 type 需要在你的 Notification model 中定義或處理
            }
        });
        return { success: true, notification: newNotification };
    } catch (error) {
        console.error("Failed to add notification (Server Action):", error);
        return { error: error.message };
    }
};

export const getUserNotification = async (userId) => {
    try {
        if (!userId) throw new Error("User ID is required for fetching notifications.");

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return notifications;
    } catch (error) {
        console.error("Failed to get user notifications (Server Action):", error);
        return []; // ⚠️ 回傳空陣列，避免前端崩潰
    }
};


export const deleteNotification = async (notificationId) => {
    try {
        // ✨ 這裡應該是從資料庫刪除通知的邏輯
        if (!notificationId) {
            throw new Error("Notification ID is required for deleting.");
        }
        await prisma.notification.delete({
            where: { id: notificationId },
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to delete notification (Server Action):", error);
        // 如果是找不到通知的錯誤，可以更精確地處理
        if (error.code === 'P2025') {
            return { error: "Notification not found." };
        }
        return { error: error.message };
    }
};