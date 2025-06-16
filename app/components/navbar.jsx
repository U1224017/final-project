// app/components/navbar.jsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
// ✨ 移除這行：import { useEffect, useState } from "react";
// ✨ 移除這行：import useUser from "@/hooks/useUser"; // 不再需要 useUser hook

import NotifyButton from "@/app/components/notifyButton"; // 通知按鈕保持不變

export default function Navbar() {
    // 直接從 useSession 獲取 session 數據和狀態
    const { data: session, status } = useSession(); // status: "loading" | "authenticated" | "unauthenticated"

    // ✨ 移除所有與 useUser 和 sessionStorage 相關的 useEffect 和 state
    // const { user, setUser } = useUser();
    // const [isLogin, setIsLogin] = useState(...)
    // useEffect(() => { ... }, [session, status]);

    const getRoleLinks = () => {
        // 直接從 session.user 獲取角色，並進行安全檢查
        const userRole = session?.user?.role;

        if (!userRole) return []; // 如果沒有角色（例如未登入或仍在載入），返回空陣列

        // 根據角色返回對應的導覽連結
        switch (userRole) {
            case "CUSTOMER":
                return [
                    { href: "/menu", name: "菜單" },
                    { href: "/orders", name: "我的訂單" },
                ];
            case "STAFF":
                return [
                    { href: "/orders/pending", name: "等待中的訂單" },
                    { href: "/orders/ready", name: "完成的訂單" },
                ];
            case "CHEF":
                return [{ href: "/kitchen", name: "廚房訂單" }];
            case "OWNER":
                return [
                    { href: "/admin/menu", name: "菜單管理" },
                    { href: "/admin/users", name: "使用者管理" },
                    { href: "/admin/orders/pending", name: "等待中的訂單" },
                    { href: "/admin/orders/completed", name: "完成的訂單" },
                    { href: "/admin/orders/kitchen", name: "廚房訂單" },
                ];
            default:
                return [];
        }
    };

    const handelSignOut = () => {
        // 只需要調用 signOut() 即可，NextAuth.js 會處理 session 的清除
        signOut({ callbackUrl: "/login" }); // 登出後跳轉到登入頁
        // ✨ 移除手動清除 sessionStorage 和 setUser 的邏輯
        // sessionStorage.removeItem("user");
        // setUser(null);
        // setIsLogin(false);
    };

    // 判斷是否已登入和載入狀態
    const isAuthenticated = status === "authenticated";
    const isLoading = status === "loading";

    return (
        <nav className="sticky top-0 z-50 bg-gradient-to-r from-orange-400 via-pink-500 to-red-500 text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center overflow-x-auto">
                <Link
                    href="/"
                    className="text-2xl font-bold tracking-wide hover:opacity-90 transition-opacity duration-300"
                    aria-label="前往首頁"
                >
                    🍽 網路早餐訂餐系統
                </Link>

                <div className="flex flex-wrap items-center gap-4">
                    {isLoading ? ( // 如果正在載入 session，顯示載入訊息
                        <span className="text-sm">載入中...</span>
                    ) : isAuthenticated ? ( // 如果已認證（登入）
                        <>
                            {getRoleLinks().map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-white font-medium hover:underline hover:text-yellow-200 transition duration-300"
                                    aria-label={link.name}
                                >
                                    {link.name}
                                </Link>
                            ))}

                            <span className="hidden sm:inline-block font-semibold">
                                {/* ✨ 使用可選鏈來安全訪問 user.name 或 user.email */}
                                您好，{session?.user?.name || session?.user?.email}
                            </span>

                            {/* ✨ 關鍵修改：只有當 session.user.id 存在時才渲染 NotifyButton ✨ */}
                            {session.user?.id && <NotifyButton userId={session.user.id} />}

                            <button
                                onClick={handelSignOut}
                                className="bg-white text-pink-600 font-semibold px-3 py-1.5 rounded-md hover:bg-gray-100 transition duration-300"
                                aria-label="登出帳號"
                            >
                                登出
                            </button>
                        </>
                    ) : ( // 如果未認證（未登入）
                        <Link
                            href="/login"
                            className="bg-white text-pink-600 font-semibold px-4 py-1.5 rounded-md hover:bg-gray-100 transition duration-300"
                            aria-label="登入帳號"
                        >
                            登入
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}