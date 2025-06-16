// lib/mqttClient.js
import mqtt from "mqtt";

let client = null;

export function getMqttClient() {
  if (!client) {
    client = mqtt.connect("wss://broker.emqx.io:8084/mqtt", {
      clientId: "kitchen-client-" + Math.random().toString(16).substr(2, 8),
      clean: true,
    });

    client.on("connect", () => {
      console.log("✅ MQTT connected");
    });

    client.on("error", (err) => {
      console.error("❌ MQTT error:", err);
    });
  }

  return client;
}