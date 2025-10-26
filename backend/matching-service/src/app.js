import WebSocket, { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8004;

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*', // Allow all origins for development/testing
  credentials: false,
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Collaboration service client
const collaborationServiceClient = axios.create({
  baseURL: process.env.COLLABORATION_SERVICE_URL || 'http://localhost:8002',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const wss = new WebSocketServer({
  port: 8005, // Use different port for WebSocket to avoid conflict with HTTP
  // Allow connections from any origin (for development)
  verifyClient: () => true,
});

let waitingQueue = [];
let activePairs = [];

const TIMEOUT_MS = 60000; // 1 minute

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'MatchingService',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    stats: {
      waitingUsers: waitingQueue.length,
      activePairs: activePairs.length,
    },
  });
});

// API endpoint to handle session ready notification from collaboration service
app.post('/api/sessions/ready', (req, res) => {
  try {
    const { sessionId, userIds, questionId } = req.body;
    console.log(`Session ${sessionId} is ready for users: ${userIds.join(', ')}`);
    
    // Find the matched pair and notify them
    const pair = activePairs.find(p => 
      p[0].userId === userIds[0] && p[1].userId === userIds[1] ||
      p[0].userId === userIds[1] && p[1].userId === userIds[0]
    );
    
    if (pair) {
      const [user1, user2] = pair;
      
      // Notify both users that session is ready
      try {
        user1.ws.send(JSON.stringify({
          type: 'session-ready',
          sessionId,
          questionId,
          partnerUserId: user2.userId,
          partnerUsername: user2.username,
        }));
        
        user2.ws.send(JSON.stringify({
          type: 'session-ready',
          sessionId,
          questionId,
          partnerUserId: user1.userId,
          partnerUsername: user1.username,
        }));
        
        console.log(`Notified users ${user1.userId} and ${user2.userId} that session ${sessionId} is ready`);
      } catch (error) {
        console.error('Error notifying users:', error);
      }
    }
    
    res.json({ success: true, message: 'Users notified' });
  } catch (error) {
    console.error('Error handling session ready:', error);
    res.status(500).json({ error: error.message });
  }
});

wss.on('connection', (ws) => {
  console.log('New connection');

  ws.on('message', async (data) => {
    const msg = JSON.parse(data);

    if (msg.type === 'search') {
      const { topics, difficulty, userId, username } = msg;

      // Create user entry
      const user = {
        ws,
        topics,
        difficulty, // e.g., 'Easy' | 'Medium' | 'Hard'
        userId,
        username,
        connectedAt: Date.now(),
        timeoutId: null,
      };

      // Try to find best match
      if (waitingQueue.length === 0) {
        startTimeout(user);
        waitingQueue.push(user);
        console.log(`User ${userId} added to waiting queue`);
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

        // Create collaboration session
        try {
          const sessionResponse = await collaborationServiceClient.post('/api/sessions/matched', {
            userIds: [user.userId, bestMatch.userId],
            questionId: '68ebb93667c84a099513124d', // Default question ID for now
          });

          if (sessionResponse.data.success) {
            const sessionId = sessionResponse.data.sessionId;
            console.log(`Created collaboration session ${sessionId} for users ${user.userId} and ${bestMatch.userId}`);
            
            // Notify both users about the match
            user.ws.send(JSON.stringify({
              type: 'match',
              sessionId,
              partnerUserId: bestMatch.userId,
              partnerUsername: bestMatch.username,
              sharedTopics: maxShared,
              difficulty: user.difficulty,
            }));

            bestMatch.ws.send(JSON.stringify({
              type: 'match',
              sessionId,
              partnerUserId: user.userId,
              partnerUsername: user.username,
              sharedTopics: maxShared,
              difficulty: user.difficulty,
            }));

            console.log(
              `Matched users [difficulty=${user.difficulty}] (shared ${maxShared} topics): ${user.userId} <--> ${bestMatch.userId}`,
            );
          } else {
            console.error('Failed to create collaboration session:', sessionResponse.data.error);
            // Fallback: notify users about match failure
            user.ws.send(JSON.stringify({
              type: 'match-error',
              error: 'Failed to create collaboration session',
            }));
            bestMatch.ws.send(JSON.stringify({
              type: 'match-error',
              error: 'Failed to create collaboration session',
            }));
          }
        } catch (error) {
          console.error('Error creating collaboration session:', error);
          // Fallback: notify users about match failure
          user.ws.send(JSON.stringify({
            type: 'match-error',
            error: 'Failed to create collaboration session',
          }));
          bestMatch.ws.send(JSON.stringify({
            type: 'match-error',
            error: 'Failed to create collaboration session',
          }));
        }
      } else {
        // No match found yet — queue silently
        startTimeout(user);
        waitingQueue.push(user);
        console.log(`User ${userId} added to waiting queue`);
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
    console.log(`User ${user.userId} timed out`);
  }, TIMEOUT_MS);
}

// Start HTTP server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Matching Service Started                 ║
╠════════════════════════════════════════════╣
║   HTTP Port: ${PORT.toString().padEnd(36)}║
║   WebSocket Port: 8005                    ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(27)}║
╚════════════════════════════════════════════╝
  `);
});

console.log('Matching WebSocket server running on port 8005');
