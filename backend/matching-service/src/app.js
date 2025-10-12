import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

let waitingQueue = [];
let activePairs = [];

wss.on("connection", (ws) => {
  console.log("New connection");

  ws.on("message", (data) => {
    const msg = JSON.parse(data);
    if (msg.type === "search") {
      const { topics, userId } = msg;

      // Create user entry
      const user = { ws, topics, userId, connectedAt: Date.now() };

      if (waitingQueue.length === 0) {
        waitingQueue.push(user);
        return;
      }

      let bestMatch = null;
      let maxShared = 0;

      // Find the first waiting user with the most shared topics
      for (const candidate of waitingQueue) {
        const shared = countSharedTopics(user.topics, candidate.topics);
        if (shared > maxShared) {
          bestMatch = candidate;
          maxShared = shared;
        }
      }

      if (bestMatch && maxShared > 0) {
        // Remove matched user from queue
        waitingQueue = waitingQueue.filter((u) => u !== bestMatch);

        // Store the active pair
        activePairs.push([user, bestMatch]);

        // Notify both users
        user.ws.send(
          JSON.stringify({
            type: "match",
            partnerId: bestMatch.userId,
            sharedTopics: maxShared,
          })
        );

        bestMatch.ws.send(
          JSON.stringify({
            type: "match",
            partnerId: user.userId,
            sharedTopics: maxShared,
          })
        );

        console.log(
          `Matched users (shared ${maxShared} topics): ${user.userId}, ${bestMatch.userId}`
        );
      } else {
        waitingQueue.push(user);
      }
    }
  });

  ws.on("close", () => {
    // Remove from queue if still waiting
    waitingQueue = waitingQueue.filter((u) => u.ws !== ws);
    console.log("Connection closed");
  });
});

function countSharedTopics(a, b) {
  const setA = new Set(a);
  return b.filter((t) => setA.has(t)).length;
}

console.log("Matching WebSocket server running on port 8080");
