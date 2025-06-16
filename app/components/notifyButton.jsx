// app/components/notifyButton.jsx
"use client";

import { useEffect, useRef, useState } from "react";
// import useUser from "@/hooks/useUser"; // ✨ 移除這行，不再需要 useUser
import useNotifications from "@/hooks/useNotifications"; // 保持這行
import { deleteNotification } from "@/app/actions/notification"; // 保持這行

// ✨ 修改：NotifyButton 現在接受 userId 作為 props
export default function NotifyButton({ userId }) {
    const [showNotify, setShowNotify] = useState(false);
    // ✨ 修改：直接將 userId 傳遞給 useNotifications
    // useNotifications 內部將負責處理 userId 是否存在的邏輯
    const { notifications, unreadCount, setNotifications } = useNotifications(userId);
    const wrapperRef = useRef(null);

    useEffect(() => {
        // ✨ 修改：這裡的 loading 檢查現在應該由 userId 是否存在來判斷，
        // 因為 useNotifications 內部已經處理了載入狀態
        // 如果 userId 不存在，則直接返回，不需監聽點擊外部事件，因為按鈕根本不應該出現
        if (!userId) {
            return;
        }

        const handleClickOutside = (event) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target)
            ) {
                setShowNotify(false);
            }
        };

        if (showNotify) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showNotify, userId]); // ✨ 依賴中加入 userId

    const handelClickNotificationButton = async () => {
        // ✨ 增加安全檢查：如果 userId 不存在，則直接返回
        if (!userId) {
            alert("用戶未登入，無法操作通知。");
            return;
        }

        setShowNotify((prev) => !prev);

        // 如果要標記為已讀，確保有通知才操作
        if (notifications.length > 0) {
            setNotifications(
                notifications.map((n) => {
                    return { ...n, read: true };
                })
            );

            try {
                // ✨ 修改：使用 userId 而不是 user.id
                const response = await fetch(
                    `/api/notifications/users/${userId}/isRead`,
                    {
                        method: "PATCH",
                    }
                );
                if (!response.ok) {
                    alert("切換已讀通知失敗");
                }
            } catch (err) {
                alert("錯誤：" + err.message); // 更友善地顯示錯誤訊息
            }
        }
    };

    const handleDeleteNotification = async (nId) => {
        // ✨ 增加安全檢查：如果 userId 不存在，則直接返回
        if (!userId) {
            alert("用戶未登入，無法刪除通知。");
            return;
        }

        // 這裡你的程式碼使用了 deleteNotification(nId) 和 fetch /api/notifications/${nId} 兩種方式
        // 建議只保留一種，通常是 API route 方式。
        // 如果 deleteNotification 是一個 Server Action，它應該是獨立且最終的。
        // 為了簡單起見，我會假設你最終透過 API route 處理，或者 deleteNotification 內部會調用 API。

        try {
            const data = await deleteNotification(nId); // 這是 Server Action
            if (!data || data.error) { // 檢查 Server Action 的結果
                 // 如果 Server Action 失敗，可以選擇呼叫 API route 作為備用或只依賴一個
                const response = await fetch(`/api/notifications/${nId}`, {
                    method: "DELETE",
                });
                if (!response.ok) {
                    alert("刪除通知失敗");
                    return;
                }
            }
        } catch (err) {
            alert("刪除通知錯誤：" + err.message);
            return;
        }
        
        setNotifications(notifications.filter((n) => n.id !== nId));
    };

    // ✨ 關鍵修改：只有當 userId 存在時才渲染整個按鈕組件
    // 如果沒有 userId，代表用戶未登入或會話仍在載入，此時不應該顯示通知按鈕
    if (!userId) {
        return null;
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                aria-label="查看通知"
                className="relative focus:outline-none"
                onClick={handelClickNotificationButton}
            >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-400 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showNotify && (
                <div className="fixed right-1/12 top-16 w-80 bg-white/90 backdrop-blur-md text-black rounded-xl shadow-2xl border border-gray-200 z-[9999]">
                    {notifications.length > 0 ? (
                        <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                            {notifications.map((n) => (
                                <li
                                    key={n.id}
                                    className="px-4 py-3 hover:bg-gray-100 transition"
                                >
                                    <div className="font-semibold flex justify-between text-gray-800">
                                        <p>{n.title}</p>
                                        <button
                                            onClick={() =>
                                                handleDeleteNotification(n.id)
                                            }
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                borderRadius: "50%",
                                            }}
                                            className="flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-gray-200 border border-gray-300 transition cursor-pointer shadow-sm"
                                            aria-label="刪除通知"
                                            title="刪除"
                                        >
                                            X
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-800">
                                        {n.content}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {n.time}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-5 text-center text-gray-500 text-sm">
                            目前沒有通知
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}