// app/actions/order.js

export const addOrder = async (body) => {
  const response = await fetch("/api/order/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("送出訂單失敗");
  }

  return response.json();
};

// 其他函式目前先保留 null，未來可以實作
export const getCustomerOrder = async (customerId) => {
  return null;
};
export async function editOrderStatus({ status, paymentStatus }, orderId) {
  console.log("➡️ 呼叫 editOrderStatus", { status, paymentStatus, orderId });
  try {
    // 獲取目前訂單資料
    const orderRes = await fetch(`/api/order/${orderId}`);
    if (!orderRes.ok) return null;
    const order = await orderRes.json();

    // 根據條件判斷是否可以更新為 READY 狀態
    if (status === "READY") {
      if (!(order.paymentStatus === true && order.completedAt)) {
        console.warn("❌ 無法更新為 READY：尚未完成付款或尚未標記完成");
        return null;
      }
    }

    const body = {};
    if (status !== undefined) body.status = status;
    if (paymentStatus !== undefined) body.paymentStatus = paymentStatus;

    const res = await fetch(`/api/order/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ 更新失敗：", res.status, errorText);
    return null;
  }
    return await res.json();
  } catch (error) {
    console.error("❌ 修改訂單狀態失敗:", error);
    return null;
  }
};

export const getPendingOrders = async () => {
  const response = await fetch(`/api/order?status=PENDING,PREPARING`);
  if (!response.ok) {
    console.error("❌ 無法取得訂單", response.status);
    return null;
  }
  return await response.json();
};
export const getKitchenOrders = async () => {
  const response = await fetch("/api/kitchen");
  if (!response.ok) {
    console.error("❌ 無法取得廚房訂單", response.status);
    return null;
  }
  return await response.json();
};
export const getReadyOrders = async () => {
  return null;
};
export const getOrderById = async () => {
  return null;
};

export async function editOrderCompletion(orderId) {
  try {
    const res = await fetch(`/api/order/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // ⚠️ 不傳 status，只是為了觸發 completedAt 設定
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("❌ 完成訂單失敗:", err);
    return null;
  }
}

// app/actions/order.js
export async function deleteOrder(orderId) {
  const res = await fetch(`/api/order/${orderId}`, {
    method: "DELETE",
  });
  if (!res.ok) return null;
  return await res.json();
}
