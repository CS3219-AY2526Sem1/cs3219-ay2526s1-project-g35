'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

export default function WaitingRoomPage(): React.ReactElement {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [matchData, setMatchData] = useState<{
    sessionId: string;
    partnerUserId: string;
    partnerUsername: string;
    sharedTopics: number;
    difficulty: string;
  } | null>(null);
  const timerRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const hasConnected = useRef(false);
  const autoNavRef = useRef<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  // Track who initiated the disconnect so we don't show timeout alert incorrectly
  const closedByClientRef = useRef(false);
  const closedByServerMessageRef = useRef(false);
  // Show alert if server says the user is already queuing elsewhere
  const [alreadyQueuing, setAlreadyQueuing] = useState(false);
  const [serverNotice, setServerNotice] = useState<string | null>(null);

  // Auto-redirect to session after 5 seconds once a match is found
  useEffect(() => {
    if (matchFound) {
      setCountdown(5);
      // start countdown interval
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);

      autoNavRef.current = window.setTimeout(() => {
        router.push('/session');
      }, 5000);
    }
    return () => {
      if (autoNavRef.current) {
        clearTimeout(autoNavRef.current);
        autoNavRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [matchFound, router]);

  useEffect(() => {
    // Get search data from sessionStorage
    const searchDataStr = sessionStorage.getItem('matchingSearch');
    if (!searchDataStr) {
      setTimeout(() => router.push('/home'), 0);
      return;
    }

    // Prevent double connection in development (React StrictMode)
    if (hasConnected.current) {
      return;
    }
    hasConnected.current = true;

    const searchData = JSON.parse(searchDataStr);

    // Connect to matching service
    let ws: WebSocket;
    try {
      const wsUrl = process.env.NEXT_PUBLIC_MATCHING_WS_URL || 'ws://localhost:8003';
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
    } catch {
      setTimedOut(true);
      return;
    }

    ws.onopen = () => {
      // Send search request
      const message = {
        type: 'search',
        topics: searchData.topics,
        difficulty: searchData.difficulty,
        userId: searchData.userId,
        username: searchData.username,
      };

      console.log('Sending search message:', message);
      ws.send(JSON.stringify(message));
    };

    ws.onerror = () => {
      // Don't immediately show timeout, let onclose handle it
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message from matching service:', data);

      if (data.type === 'match') {
        setMatchData(data);
        setMatchFound(true);
        // Store session ID and user ID for the session page
        sessionStorage.setItem('collaborationSessionId', data.sessionId);
        sessionStorage.setItem('matchedUserId', searchData.userId);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      } else if (
        data.type === 'already-queuing' ||
        (data.type === 'disconnect' && data.reason === 'duplicate-user')
      ) {
        // Server indicates the user is already queued elsewhere
        closedByServerMessageRef.current = true;
        setServerNotice(
          data.message ||
            'You are already queuing on another device or tab. Please close it first.',
        );
        setAlreadyQueuing(true);
        if (wsRef.current) {
          try {
            wsRef.current.close(1000, 'Server disconnect');
          } catch {}
          wsRef.current = null;
        }
      } else if (data.type === 'timeout') {
        setTimedOut(true);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    };

    ws.onclose = (ev: CloseEvent) => {
      // Avoid showing the timeout alert for client-initiated or graceful server closes
      const isNormalClose = ev.code === 1000;
      const isMatchClose = isNormalClose && ev.reason === 'Match found';
      if (closedByClientRef.current || closedByServerMessageRef.current || isMatchClose) {
        return;
      }
      if (!matchFound && !timedOut) {
        setTimedOut(true);
      }
    };

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // Only close WebSocket if we're actually leaving or if connection failed
      if (wsRef.current && (matchFound || timedOut)) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [router, matchFound, timedOut]);

  const handleReturnHome = () => {
    // clear timer and navigate
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    router.push('/home');
  };

  const handleCancel = () => {
    // Clear any pending timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (autoNavRef.current) {
      clearTimeout(autoNavRef.current);
      autoNavRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Proactively disconnect from matching-service
    if (wsRef.current) {
      try {
        closedByClientRef.current = true;
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }

    // Navigate home
    router.push('/home');
  };

  return (
    <div className="min-h-(--hscreen) flex flex-col items-center justify-center bg-background px-6 py-12">
      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        .ring-anim {
          animation: pulseRing 2s cubic-bezier(0.4,0,0.2,1) infinite;
        }
      `}</style>

      <div className="w-full max-w-4xl text-center">
        <h1 className="text-4xl font-bold text-foreground">Finding you a match</h1>
        <p className="text-lg text-muted-foreground mt-2">This might take a while...</p>

        <div className="mt-12 flex flex-col items-center gap-8">
          <div className="relative w-56 h-56 flex items-center justify-center">
            {/* center circle */}
            <div className="absolute w-22 h-22 rounded-full bg-muted z-10"></div>
            {/* middle ring */}
            <div className="absolute w-22 h-22 rounded-full border-8 border-muted-foreground/30 ring-anim"></div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="text-sm underline text-muted-foreground"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Alert dialog shows after timeout */}
      <AlertDialog
        open={timedOut}
        onOpenChange={(open: boolean) => {
          if (!open) setTimedOut(false);
        }}
      >
        <AlertDialogPortal>
          <AlertDialogOverlay />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unfortunately, we couldn’t find a match :(</AlertDialogTitle>
              <AlertDialogDescription>Try again shortly!</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction asChild>
                <Button onClick={handleReturnHome}>Return to home</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>

      {/* Alert dialog shows when match is found */}
      <AlertDialog
        open={matchFound}
        onOpenChange={(open: boolean) => {
          if (!open) setMatchFound(false);
        }}
      >
        <AlertDialogPortal>
          <AlertDialogOverlay />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Match Found!</AlertDialogTitle>
              <AlertDialogDescription>
                We found you a match! You&apos;ll be paired with {matchData?.partnerUsername}.
                {matchData?.sharedTopics && matchData.sharedTopics > 0 && (
                  <> You have {matchData.sharedTopics} topic(s) in common!</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <div className="text-sm text-muted-foreground">
                Starting session in {countdown ?? 5}s…
              </div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>

      {/* Alert dialog shows when server reports user already queuing elsewhere */}
      <AlertDialog
        open={alreadyQueuing}
        onOpenChange={(open: boolean) => {
          if (!open) setAlreadyQueuing(false);
        }}
      >
        <AlertDialogPortal>
          <AlertDialogOverlay />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>You are already queuing</AlertDialogTitle>
              <AlertDialogDescription>
                {serverNotice ||
                  'This account is already in the waiting queue on another device or tab.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction asChild>
                <Button
                  onClick={() => {
                    // ensure ws is closed and go home
                    if (wsRef.current) {
                      try {
                        wsRef.current.close();
                      } catch {}
                      wsRef.current = null;
                    }
                    handleReturnHome();
                  }}
                >
                  Return to home
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>
    </div>
  );
}
