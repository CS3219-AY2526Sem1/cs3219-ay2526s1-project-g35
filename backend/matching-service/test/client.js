import WebSocket from "ws";
import readline from "readline";

const SERVER_URL = "ws://localhost:8080"; // Change to hosting server url

const ws = new WebSocket(SERVER_URL);


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// When connected to the server
ws.on("open", () => {
  console.log("Connected to the server.");

  rl.question("Enter topics (comma-separated): ", (answer) => {
    const topics = answer.split(",").map(t => t.trim()).filter(Boolean);
    if (topics.length === 0) {
      console.log("No topics entered. Exiting.");
      rl.close();
      ws.close();
      return;
    }

    // Send topics to the server
    const message = {
      type: "search",
      topics,
      userId: Math.floor(Math.random() * 10000) + 4000 // Random port for demo
    };
    ws.send(JSON.stringify(message));
    console.log("📤 Sent topics:", topics);
  });
});

ws.on("message", (data) => {
  console.log("Message from server:", data.toString());
});

ws.on("error", (err) => {
  console.error("Connection error:", err.message);
});

ws.on("close", () => {
  console.log("Connection closed.");
  rl.close();
});
