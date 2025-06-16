"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";

export default function AccountPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>載入中...</p>;
  if (status === "unauthenticated") return <p>請先登入。</p>;

  const user = session.user;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">帳號資料</h1>

      {user?.image && (
        <Image
          src={user.image}
          alt="使用者頭像"
          width={80}
          height={80}
          className="rounded-full"
        />
      )}

      <div className="text-center space-y-2">
        <p><strong>名稱：</strong>{user.name}</p>
        <p><strong>Email：</strong>{user.email}</p>
        <p><strong>角色：</strong>{user.role}</p>
        <p><strong>ID：</strong>{user.id}</p>
      </div>
    </div>
  );
}