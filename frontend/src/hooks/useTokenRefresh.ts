/**
 * Token Refresh Hook
 *
 * Automatically extends user session by resetting token TTL based on user activity.
 * Combines activity detection with periodic refresh and idle detection.
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import authService from '@/services/auth.service';

const CONFIG = {
  MIN_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes

  ACTIVITY_DEBOUNCE: 2000, // 2 seconds

  PERIODIC_INTERVAL: 10 * 60 * 1000, // 10 minutes

  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
};

// Events that indicate user activity
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
] as const;

export function useTokenRefresh() {
  const lastRefreshRef = useRef<number>(0);
  const lastActivityRef = useRef<number>(Date.now());
  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const periodicIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  /**
   * Core token refresh function
   */
  const refreshToken = useCallback(async (reason: 'activity' | 'periodic' = 'activity') => {
    const now = Date.now();

    const timeSinceLastRefresh = now - lastRefreshRef.current;
    if (timeSinceLastRefresh < CONFIG.MIN_REFRESH_INTERVAL) {
      console.log(
        `[Token Refresh] Skipped - too soon (${Math.round(timeSinceLastRefresh / 1000)}s ago)`,
      );
      return;
    }

    const timeSinceLastActivity = now - lastActivityRef.current;
    if (timeSinceLastActivity > CONFIG.IDLE_TIMEOUT) {
      console.log(
        `[Token Refresh] Skipped - user idle for ${Math.round(timeSinceLastActivity / 60000)} minutes`,
      );
      return;
    }

    try {
      await authService.resetTTL();
      lastRefreshRef.current = now;
      console.log(
        `[Token Refresh] ✓ Success (${reason}) - Next refresh available in ${CONFIG.MIN_REFRESH_INTERVAL / 60000}min`,
      );
    } catch (error) {
      console.error('[Token Refresh] ✗ Failed:', error);
    }
  }, []);

  /**
   * Debounced activity handler - prevents too many API calls
   */
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    activityTimeoutRef.current = setTimeout(() => {
      refreshToken('activity');
    }, CONFIG.ACTIVITY_DEBOUNCE);
  }, [refreshToken]);

  useEffect(() => {
    console.log('[Token Refresh] Hook initialized');

    refreshToken('activity');

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    periodicIntervalRef.current = setInterval(() => {
      refreshToken('periodic');
    }, CONFIG.PERIODIC_INTERVAL);

    return () => {
      console.log('[Token Refresh] Hook cleanup');

      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      if (periodicIntervalRef.current) {
        clearInterval(periodicIntervalRef.current);
      }
    };
  }, [handleActivity, refreshToken]);
}
