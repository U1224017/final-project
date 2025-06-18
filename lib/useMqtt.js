// lib/useMqtt.js
"use client";
import { useEffect } from "react";
import { getMqttClient } from "./mqttClient";

export function useMqtt({ topic, onMessage }) {
  useEffect(() => {
    const client = getMqttClient();
    if (!topic) return;

    const handleMessage = (t, message) => {
      if (typeof onMessage === "function" && t === topic) {
        try {
          const payload = JSON.parse(message.toString());
          onMessage(payload);
        } catch (err) {
          console.error("❌ 無法解析 MQTT 訊息:", err);
        }
      }
    };

    client.subscribe(topic, (err) => {
      if (err) console.error("❌ 訂閱失敗:", err);
      else console.log("📡 已訂閱主題:", topic);
    });

    client.on("message", handleMessage);

    return () => {
      client.unsubscribe(topic);
      client.removeListener("message", handleMessage);
      console.log("🧹 清除 MQTT 訂閱:", topic);
    };
  }, [topic, onMessage]);
}
