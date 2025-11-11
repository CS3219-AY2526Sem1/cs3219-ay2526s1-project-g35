/*
 * AI Assistance Disclosure:
 * Tool: Claude 3.5 Sonnet (via Cursor), Date: 2025-11-11
 * Scope: Fixed fetchQuestionId to use plural 'topics' parameter with comma-separated values
 *        instead of singular 'topic' to match question-service API expectations
 * Author review: Parameter format validated, tested end-to-end matching flow,
 *                verified by Johannsen Lum
 */

import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import axios from 'axios';
import dotenv from 'dotenv';
import redisQueue from './redisQueue.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8003;
const SERVICE_NAME = process.env.SERVICE_NAME || 'matching-service';
const SERVICE_JWT_SECRET = process.env.JWT_SECRET;
const SERVICE_JWT_OPTIONS = {
  expiresIn: process.env.SERVICE_JWT_TTL || '5m',
  issuer: process.env.SERVICE_JWT_ISSUER || SERVICE_NAME,
  audience: process.env.SERVICE_JWT_AUDIENCE || 'question-service',
};
const SERVICE_JWT_DEFAULT_PAYLOAD = {
  id: process.env.SERVICE_JWT_SUBJECT || `${SERVICE_NAME}-internal`,
  username: process.env.SERVICE_JWT_USERNAME || SERVICE_NAME,
  email:
    process.env.SERVICE_JWT_EMAIL ||
    `${SERVICE_NAME.replace(/[^a-z0-9]/gi, '-')}@internal.peerprep`,
  service: SERVICE_NAME,
  internal: true,
};
let jwtWarningLogged = false;

const createServiceJwt = (payloadOverrides = {}) => {
  if (!SERVICE_JWT_SECRET) {
    if (!jwtWarningLogged) {
      console.error(
        'JWT_SECRET is not configured for matching service. Unable to authenticate with question service.',
      );
      jwtWarningLogged = true;
    }
    return null;
  }

  try {
    return jwt.sign(
      {
        ...SERVICE_JWT_DEFAULT_PAYLOAD,
        ...payloadOverrides,
      },
      SERVICE_JWT_SECRET,
      SERVICE_JWT_OPTIONS,
    );
  } catch (error) {
    console.error('Failed to generate service JWT token:', error.message);
    return null;
  }
};

const QUESTION_SERVICE_BASE_URL =
  process.env.QUESTION_SERVICE_URL || 'http://question-service:8001';
const DEFAULT_TOPICS = ['Algorithms'];
const QUESTION_FETCH_ERROR_MESSAGE = 'Unable to retrieve a coding question. Please try again.';

const fetchQuestionId = async ({ topics, difficulty, userId }) => {
  const topicsToTry = Array.isArray(topics) && topics.length > 0 ? topics : DEFAULT_TOPICS;

  try {
    // Join all topics as comma-separated string for the question service
    const topicsParam = topicsToTry.join(',');

    console.log(`Trying to get question for topics="${topicsParam}", difficulty="${difficulty}"`);

    const serviceToken = createServiceJwt({
      scope: 'question:random',
      topics: topicsParam,
      difficulty,
      subjectUserId: userId,
    });

    const requestConfig = {
      params: { topics: topicsParam, difficulty },
      headers: {},
    };

    if (serviceToken) {
      requestConfig.headers.Authorization = `Bearer ${serviceToken}`;
      requestConfig.headers.Cookie = `accessToken=${serviceToken}`;
    } else {
      console.warn('Service JWT unavailable when requesting random question');
    }

    const response = await axios.get(
      `${QUESTION_SERVICE_BASE_URL}/api/questions/random`,
      requestConfig,
    );

    if (response.data.success && response.data.questionId) {
      console.log(
        `Found question for topics "${topicsParam}" and difficulty "${difficulty}": ${response.data.questionId}`,
      );
      return response.data.questionId;
    }
  } catch (error) {
    console.warn(
      `Could not get question for topics "${topicsToTry.join(',')}":`,
      error.message || error,
    );
  }

  return null;
};

const sendMatchError = (participants, message) => {
  for (const participant of participants) {
    if (!participant?.ws) continue;
    const socket = participant.ws;
    if (socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(
          JSON.stringify({
            type: 'match-error',
            error: message,
          }),
        );
      } catch (error) {
        console.error('Error sending match-error message:', error);
      }
      try {
        socket.close(1011, 'Match error');
      } catch (error) {
        console.error('Error closing socket after match-error:', error);
      }
    }
  }
};

const removeActivePair = (user, partner) => {
  activePairs = activePairs.filter(
    ([first, second]) =>
      !((first === user && second === partner) || (first === partner && second === user)),
  );
};

const handleQuestionFetchFailure = (user, partner) => {
  console.error(
    `Unable to retrieve question for users ${user.userId} and ${partner.userId}. Aborting match.`,
  );
  sendMatchError([user, partner], QUESTION_FETCH_ERROR_MESSAGE);
  removeActivePair(user, partner);
};

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: '*', // Allow all origins for development/testing
    credentials: false,
  }),
);
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

// Create HTTP server and attach Express app
const server = http.createServer(app);

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({
  server,
  // Allow connections from any origin (for development)
  verifyClient: () => true,
});

let waitingQueue = [];
let activePairs = [];
// Track connected userIds to prevent multiple simultaneous searches per account
const connectedUsers = new Map(); // userId -> ws

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
    const pair = activePairs.find(
      (p) =>
        (p[0].userId === userIds[0] && p[1].userId === userIds[1]) ||
        (p[0].userId === userIds[1] && p[1].userId === userIds[0]),
    );

    if (pair) {
      const [user1, user2] = pair;

      // Notify both users that session is ready
      try {
        user1.ws.send(
          JSON.stringify({
            type: 'session-ready',
            sessionId,
            questionId,
            partnerUserId: user2.userId,
            partnerUsername: user2.username,
          }),
        );

        user2.ws.send(
          JSON.stringify({
            type: 'session-ready',
            sessionId,
            questionId,
            partnerUserId: user1.userId,
            partnerUsername: user1.username,
          }),
        );

        console.log(
          `Notified users ${user1.userId} and ${user2.userId} that session ${sessionId} is ready`,
        );
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

      // If this userId is already connected from another device/tab, reject this connection
      if (connectedUsers.has(userId) && connectedUsers.get(userId) !== ws) {
        try {
          ws.send(
            JSON.stringify({
              type: 'already-queuing',
              reason: 'duplicate-user',
              message:
                'You are already searching or matched from another device or tab. Close that session to try again.',
            }),
          );
        } catch (e) {}
        try {
          ws.close(1000, 'Duplicate user connection');
        } catch (e) {}
        return;
      }

      // Mark this ws as belonging to userId and remember mapping
      ws.userId = userId; // attach for cleanup on close
      connectedUsers.set(userId, ws);

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
      // Try Redis-backed matching first. If Redis is unavailable or matching fails, fall back to in-memory queue.
      try {
        // Ensure redis is connected (connect is idempotent if already connected)
        // Attempt to find a match in Redis
        const match = await redisQueue.tryFindMatchFor({ userId, topics, difficulty, username });

        if (match) {
          // match: { userId: candidateId, username, topics, difficulty, sharedTopics }
          const bestMatchUserId = match.userId;
          const bestMatchWs = connectedUsers.get(bestMatchUserId);
          const bestMatch = {
            ws: bestMatchWs,
            topics: match.topics,
            difficulty: match.difficulty,
            userId: bestMatchUserId,
            username: match.username,
          };

          // Store active pair
          activePairs.push([user, bestMatch]);

          // Proceed to create collaboration session (same flow as before)
          const questionId = await fetchQuestionId({
            topics: user.topics,
            difficulty: user.difficulty,
            userId: user.userId,
          });

          if (!questionId) {
            handleQuestionFetchFailure(user, bestMatch);
            return;
          }

          try {
            const sessionResponse = await collaborationServiceClient.post('/api/sessions/matched', {
              userIds: [user.userId, bestMatch.userId],
              questionId,
            });

            if (sessionResponse.data.success) {
              const sessionId = sessionResponse.data.sessionId;
              console.log(
                `Created collaboration session ${sessionId} for users ${user.userId} and ${bestMatch.userId}`,
              );

              // Notify both users about the match if their ws is available locally
              try {
                if (user.ws && user.ws.readyState === 1) {
                  user.ws.send(
                    JSON.stringify({
                      type: 'match',
                      sessionId,
                      partnerUserId: bestMatch.userId,
                      partnerUsername: bestMatch.username,
                      sharedTopics: match.sharedTopics,
                      difficulty: user.difficulty,
                    }),
                  );
                }

                if (bestMatch.ws && bestMatch.ws.readyState === 1) {
                  bestMatch.ws.send(
                    JSON.stringify({
                      type: 'match',
                      sessionId,
                      partnerUserId: user.userId,
                      partnerUsername: user.username,
                      sharedTopics: match.sharedTopics,
                      difficulty: user.difficulty,
                    }),
                  );
                }
              } catch (error) {
                console.error('Error notifying matched users:', error);
              }

              // Close sockets after small delay if they're open locally
              setTimeout(() => {
                if (user.ws && user.ws.readyState === 1) user.ws.close(1000, 'Match found');
                if (bestMatch.ws && bestMatch.ws.readyState === 1)
                  bestMatch.ws.close(1000, 'Match found');
              }, 500);
            } else {
              console.error('Failed to create collaboration session:', sessionResponse.data.error);
              if (user.ws && user.ws.readyState === 1) {
                user.ws.send(
                  JSON.stringify({
                    type: 'match-error',
                    error: 'Failed to create collaboration session',
                  }),
                );
                user.ws.close(1000, 'Match error');
              }
              if (bestMatch.ws && bestMatch.ws.readyState === 1) {
                bestMatch.ws.send(
                  JSON.stringify({
                    type: 'match-error',
                    error: 'Failed to create collaboration session',
                  }),
                );
                bestMatch.ws.close(1000, 'Match error');
              }
            }
          } catch (error) {
            console.error('Error creating collaboration session:', error);
            try {
              if (user.ws && user.ws.readyState === 1)
                user.ws.send(
                  JSON.stringify({
                    type: 'match-error',
                    error: 'Failed to create collaboration session',
                  }),
                );
              if (bestMatch.ws && bestMatch.ws.readyState === 1)
                bestMatch.ws.send(
                  JSON.stringify({
                    type: 'match-error',
                    error: 'Failed to create collaboration session',
                  }),
                );
            } catch (e) {
              console.error('Error sending match-error messages:', e);
            }
          }

          return;
        }

        // No match found in Redis — enqueue user
        await redisQueue.enqueueUser({ userId, topics, difficulty, username }, (timedOutUserId) => {
          // Notify local ws about timeout if still connected
          try {
            const localWs = connectedUsers.get(timedOutUserId);
            if (localWs && localWs.readyState === 1) {
              localWs.send(
                JSON.stringify({ type: 'timeout', message: 'No match found within 60 seconds.' }),
              );
              localWs.close();
            }
          } catch (e) {
            console.error('Error notifying timed out user locally:', e);
          }
        });

        console.log(`User ${userId} enqueued in Redis`);
        return;
      } catch (redisErr) {
        console.error(
          'Redis error during match/enqueue, falling back to in-memory queue:',
          redisErr.message || redisErr,
        );
        // Fall through to original in-memory behavior
      }

      // Fallback in-memory behavior (original logic)
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

        // Get a random question from question service based on shared topics
        const questionId = await fetchQuestionId({
          topics: user.topics,
          difficulty: user.difficulty,
          userId: user.userId,
        });

        if (!questionId) {
          handleQuestionFetchFailure(user, bestMatch);
          return;
        }

        // Create collaboration session
        try {
          const sessionResponse = await collaborationServiceClient.post('/api/sessions/matched', {
            userIds: [user.userId, bestMatch.userId],
            questionId,
          });

          if (sessionResponse.data.success) {
            const sessionId = sessionResponse.data.sessionId;
            console.log(
              `Created collaboration session ${sessionId} for users ${user.userId} and ${bestMatch.userId}`,
            );

            // Notify both users about the match
            user.ws.send(
              JSON.stringify({
                type: 'match',
                sessionId,
                partnerUserId: bestMatch.userId,
                partnerUsername: bestMatch.username,
                sharedTopics: maxShared,
                difficulty: user.difficulty,
              }),
            );

            bestMatch.ws.send(
              JSON.stringify({
                type: 'match',
                sessionId,
                partnerUserId: user.userId,
                partnerUsername: user.username,
                sharedTopics: maxShared,
                difficulty: user.difficulty,
              }),
            );

            console.log(
              `Matched users [difficulty=${user.difficulty}] (shared ${maxShared} topics): ${user.userId} <--> ${bestMatch.userId}`,
            );

            // Close WebSocket connections after successful match
            // Give a small delay to ensure messages are sent
            setTimeout(() => {
              if (user.ws.readyState === 1) {
                // 1 = OPEN
                user.ws.close(1000, 'Match found');
                console.log(`Closed WebSocket for user ${user.userId}`);
              }
              if (bestMatch.ws.readyState === 1) {
                bestMatch.ws.close(1000, 'Match found');
                console.log(`Closed WebSocket for user ${bestMatch.userId}`);
              }
            }, 500);
          } else {
            console.error('Failed to create collaboration session:', sessionResponse.data.error);
            // Fallback: notify users about match failure
            user.ws.send(
              JSON.stringify({
                type: 'match-error',
                error: 'Failed to create collaboration session',
              }),
            );
            bestMatch.ws.send(
              JSON.stringify({
                type: 'match-error',
                error: 'Failed to create collaboration session',
              }),
            );

            // Close connections after sending error
            setTimeout(() => {
              if (user.ws.readyState === 1) {
                user.ws.close(1000, 'Match error');
              }
              if (bestMatch.ws.readyState === 1) {
                bestMatch.ws.close(1000, 'Match error');
              }
            }, 500);
          }
        } catch (error) {
          console.error('Error creating collaboration session:', error);
          // Fallback: notify users about match failure
          user.ws.send(
            JSON.stringify({
              type: 'match-error',
              error: 'Failed to create collaboration session',
            }),
          );
          bestMatch.ws.send(
            JSON.stringify({
              type: 'match-error',
              error: 'Failed to create collaboration session',
            }),
          );

          // Close connections after sending error
          setTimeout(() => {
            if (user.ws.readyState === 1) {
              user.ws.close(1000, 'Match error');
            }
            if (bestMatch.ws.readyState === 1) {
              bestMatch.ws.close(1000, 'Match error');
            }
          }, 500);
        }
      } else {
        // No match found yet — queue silently (in-memory fallback)
        startTimeout(user);
        waitingQueue.push(user);
        console.log(`User ${userId} added to waiting queue`);
      }
    }
  });

  ws.on('close', () => {
    // Remove mapping for this userId if set
    if (ws.userId && connectedUsers.get(ws.userId) === ws) {
      connectedUsers.delete(ws.userId);
    }
    // Try to remove from Redis queue as well (best-effort)
    if (ws.userId) {
      try {
        redisQueue.removeUser(ws.userId).catch((e) => {
          // Log but ignore errors during cleanup
          console.warn('Failed to remove user from Redis on close:', e.message || e);
        });
      } catch (e) {
        // noop
      }
    }
    // Find and remove user from waiting queue
    const userIndex = waitingQueue.findIndex((u) => u.ws === ws);
    if (userIndex !== -1) {
      const user = waitingQueue[userIndex];
      // Clear timeout if exists
      if (user.timeoutId) {
        clearTimeout(user.timeoutId);
        user.timeoutId = null;
      }
      waitingQueue.splice(userIndex, 1);
      console.log(`User ${user.userId || 'unknown'} disconnected and removed from queue`);
    } else {
      console.log('Connection closed');
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
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

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Matching Service Started                 ║
╠════════════════════════════════════════════╣
║   HTTP Port: ${PORT.toString().padEnd(36)} ║
║   WebSocket Port: ${PORT}                  ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(27)}║
╚════════════════════════════════════════════╝
  `);
});

// Attempt to connect to Redis (best-effort). Redis URL should come from docker-compose via REDIS_URL env var.
redisQueue
  .connect({
    redisUrl: process.env.REDIS_URL || 'redis://matching-service-redis:6381',
    timeoutMs: TIMEOUT_MS,
  })
  .catch((err) =>
    console.warn('Could not connect to Redis for matching service:', err.message || err),
  );

console.log('Matching WebSocket server running on port ' + PORT);
