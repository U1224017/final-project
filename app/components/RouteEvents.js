"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RouterEvents() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const start = () => setLoading(true);
    const end = () => setLoading(false);

    router.events?.on("routeChangeStart", start);
    router.events?.on("routeChangeComplete", end);
    router.events?.on("routeChangeError", end);

    return () => {
      router.events?.off("routeChangeStart", start);
      router.events?.off("routeChangeComplete", end);
      router.events?.off("routeChangeError", end);
    };
  }, [router]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-white/70 z-[9999] flex items-center justify-center">
      <div className="text-gray-700 text-lg font-semibold">頁面切換中...</div>
    </div>
  );
}