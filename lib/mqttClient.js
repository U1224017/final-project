import mqtt from "mqtt";

let client = null;

export function getMqttClient() {
  if (!client) {
    client = mqtt.connect("wss://broker.emqx.io:8084/mqtt");

    client.on("connect", () => {
      console.log("✅ MQTT Connected");
    });

    client.on("error", (err) => {
      console.error("❌ MQTT Connection Error:", err);
    });
  }

  return client;
}
