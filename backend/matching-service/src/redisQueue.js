/*
 * AI Assistance Disclosure:
 * Tool: ChatGPT / Claude (via Cursor), Date: 2025-11-08
 * Scope: Redis queue implementation using lists and sets, topic-based matching algorithm,
 *        FIFO queue structure, timeout handling, best-match selection algorithm
 * Author review: Redis patterns implemented and integrated with matching service,
 *                tested with multiple concurrent users by Wong Zenwei (zeotheburrito)
 */

import { createClient } from 'redis';

let client;
const queuedSetKey = 'matching:queuedUsers';
const metaPrefix = 'matching:meta:'; // meta:{userId} => JSON { topics, username, difficulty, connectedAt }
const queuePrefix = 'matching:queue:'; // queue:{difficulty} => list of userIds (oldest at index 0)

// Local timers for users connected to this instance so we can notify on timeout
const localTimers = new Map();
let TIMEOUT_MS = 60000;

export async function connect(options = {}) {
  const redisUrl = options.redisUrl || 'redis://127.0.0.1:6381';
  TIMEOUT_MS = options.timeoutMs || TIMEOUT_MS;
  client = createClient({ url: redisUrl });
  client.on('error', (err) => console.error('Redis client error', err));
  await client.connect();
  console.log(`Connected to Redis at ${redisUrl}`);
}

function metaKey(userId) {
  return `${metaPrefix}${userId}`;
}

function queueKey(difficulty) {
  return `${queuePrefix}${difficulty}`;
}

export async function enqueueUser(user, notifyTimeout) {
  // user: { userId, topics, difficulty, username }
  const { userId, topics, difficulty, username } = user;
  // Add to dedupe set
  await client.sAdd(queuedSetKey, userId);
  // Push to queue for difficulty (FIFO: RPUSH, earliest at index 0)
  await client.rPush(queueKey(difficulty), userId);
  // Store metadata with TTL slightly longer than timeout to allow lookup
  const meta = JSON.stringify({ topics, username, difficulty, connectedAt: Date.now() });
  await client.set(metaKey(userId), meta, { EX: Math.ceil((TIMEOUT_MS + 5000) / 1000) });

  // Local timeout only matters for users connected to this instance
  if (typeof notifyTimeout === 'function') {
    const t = setTimeout(async () => {
      try {
        // Attempt to remove user from Redis queue
        await removeUser(userId);
      } catch (e) {
        console.error('Error removing timed-out user from Redis:', e);
      }
      notifyTimeout(userId);
    }, TIMEOUT_MS);
    localTimers.set(userId, t);
  }
}

export async function removeUser(userId) {
  // Remove metadata and from queued set; remove from all difficulty lists is best-effort
  try {
    const metaStr = await client.get(metaKey(userId));
    if (metaStr) {
      const meta = JSON.parse(metaStr);
      const qk = queueKey(meta.difficulty);
      await client.lRem(qk, 0, userId);
    } else {
      // Try removing from common difficulties if meta missing
      const diffs = ['Easy', 'Medium', 'Hard'];
      for (const d of diffs) {
        await client.lRem(queueKey(d), 0, userId);
      }
    }
    await client.sRem(queuedSetKey, userId);
    await client.del(metaKey(userId));
  } finally {
    // Clear local timer if present
    const t = localTimers.get(userId);
    if (t) {
      clearTimeout(t);
      localTimers.delete(userId);
    }
  }
}

function countShared(a, b) {
  const setA = new Set(a || []);
  return (b || []).filter((t) => setA.has(t)).length;
}

export async function tryFindMatchFor(user) {
  // user: { userId, topics, difficulty, username }
  const { userId, topics, difficulty } = user;
  const qk = queueKey(difficulty);
  const list = await client.lRange(qk, 0, -1); // oldest first

  if (!list || list.length === 0) return null;

  let best = null;
  let maxShared = 0;

  for (const candidateId of list) {
    if (candidateId === userId) continue;
    const metaStr = await client.get(metaKey(candidateId));
    if (!metaStr) continue;
    const meta = JSON.parse(metaStr);
    const shared = countShared(topics, meta.topics);
    if (shared > maxShared) {
      best = {
        userId: candidateId,
        username: meta.username,
        topics: meta.topics,
        difficulty: meta.difficulty,
      };
      maxShared = shared;
    }
  }

  if (best && maxShared > 0) {
    // Remove both from list and queued set and delete meta
    // Note: This is not atomic across multiple instances. A Lua script would be safer for production.
    await client.lRem(qk, 0, best.userId);
    await client.lRem(qk, 0, userId);
    await client.sRem(queuedSetKey, best.userId);
    await client.sRem(queuedSetKey, userId);
    await client.del(metaKey(best.userId));
    await client.del(metaKey(userId));

    // Clear any local timers
    const t1 = localTimers.get(best.userId);
    if (t1) {
      clearTimeout(t1);
      localTimers.delete(best.userId);
    }
    const t2 = localTimers.get(userId);
    if (t2) {
      clearTimeout(t2);
      localTimers.delete(userId);
    }

    return { ...best, sharedTopics: maxShared };
  }

  return null;
}

export async function getWaitingCount() {
  // Sum lengths of all difficulty queues
  const diffs = ['Easy', 'Medium', 'Hard'];
  let total = 0;
  for (const d of diffs) {
    const len = await client.lLen(queueKey(d));
    total += len;
  }
  return total;
}

export default {
  connect,
  enqueueUser,
  removeUser,
  tryFindMatchFor,
  getWaitingCount,
};
