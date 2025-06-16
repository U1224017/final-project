'use client';

import { Suspense } from "react";
import LoginContent from "./LoginContext";

export default function LoginClientWrapper() {
  return (
    <Suspense fallback={<div className="text-center mt-10">載入登入畫面中...</div>}>
      <LoginContent />
    </Suspense>
  );
}