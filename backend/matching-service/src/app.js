import WebSocket, { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8003;

const wss = new WebSocketServer({
  port: PORT,
  // Allow connections from any origin (for development)
  verifyClient: () => true,
});

let waitingQueue = [];
let activePairs = [];

const TIMEOUT_MS = 60000; // 1 minute

console.log(`Matching WebSocket server running on port ${PORT}`);

wss.on('connection', (ws) => {
  console.log('New connection');

  ws.on('message', (data) => {
    const msg = JSON.parse(data);

    if (msg.type === 'search') {
      const { topics, port, difficulty } = msg;

      // Create user entry
      const user = {
        ws,
        topics,
        port,
        difficulty, // e.g., 'Easy' | 'Medium' | 'Hard'
        connectedAt: Date.now(),
        timeoutId: null,
      };

      // Try to find best match
      if (waitingQueue.length === 0) {
        startTimeout(user);
        waitingQueue.push(user);
        return;
      }

      let bestMatch = null;
      let maxShared = 0;

      for (const candidate of waitingQueue) {
        // Only consider candidates with the same difficulty level
        if (candidate.difficulty !== user.difficulty) continue;
        const shared = countSharedTopics(user.topics, candidate.topics);
        if (shared > maxShared) {
          bestMatch = candidate;
          maxShared = shared;
        }
      }

      if (bestMatch && maxShared > 0) {
        // Remove matched user from queue
        waitingQueue = waitingQueue.filter((u) => u !== bestMatch);

        // Clear their timeout
        clearTimeout(bestMatch.timeoutId);

        // Store active pair
        activePairs.push([user, bestMatch]);

        // Notify both
        user.ws.send(
          JSON.stringify({
            type: 'match',
            partnerPort: bestMatch.port,
            sharedTopics: maxShared,
            difficulty: user.difficulty,
          }),
        );

        bestMatch.ws.send(
          JSON.stringify({
            type: 'match',
            partnerPort: user.port,
            sharedTopics: maxShared,
            difficulty: user.difficulty,
          }),
        );

        console.log(
          `Matched users [difficulty=${user.difficulty}] (shared ${maxShared} topics): ${user.port} <--> ${bestMatch.port}`,
        );
      } else {
        // No match found yet — queue silently
        startTimeout(user);
        waitingQueue.push(user);
      }
    }
  });

  ws.on('close', () => {
    // Remove from queue if still waiting
    waitingQueue = waitingQueue.filter((u) => u.ws !== ws);
    console.log('Connection closed');
  });
});

function countSharedTopics(a, b) {
  const setA = new Set(a);
  return b.filter((t) => setA.has(t)).length;
}

function startTimeout(user) {
  user.timeoutId = setTimeout(() => {
    // Remove from waiting queue if still there
    waitingQueue = waitingQueue.filter((u) => u !== user);
    try {
      user.ws.send(
        JSON.stringify({ type: 'timeout', message: 'No match found within 60 seconds.' }),
      );
      user.ws.close();
    } catch (e) {
      console.log('Error sending timeout:', e.message);
    }
    console.log(`User on port ${user.port} timed out`);
  }, TIMEOUT_MS);
}
