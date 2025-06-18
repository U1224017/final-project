// mqtt-sub.js
const mqtt = require("mqtt");

const client = mqtt.connect("wss://broker.emqx.io:8084/mqtt");

client.on("connect", () => {
  console.log("✅ Connected");
  client.subscribe("nuu/shisa/orders/#", (err) => {
    if (err) {
      console.error("❌ Subscribe error:", err);
    } else {
      console.log("📡 Subscribed to nuu/shisa/orders/#");
    }
  });
});

client.on("message", (topic, message) => {
  console.log(`📩 ${topic}: ${message.toString()}`);
});
