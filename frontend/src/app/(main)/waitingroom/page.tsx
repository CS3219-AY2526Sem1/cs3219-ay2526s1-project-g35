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
    partnerPort: number;
    sharedTopics: number;
    questionId: string;
  } | null>(null);
  const timerRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const hasConnected = useRef(false);
  const autoNavRef = useRef<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

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
      const wsUrl = process.env.NEXT_PUBLIC_MATCHING_WS_URL || 'ws://localhost:8004';
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
        port: searchData.port,
      };

      ws.send(JSON.stringify(message));
    };

    ws.onerror = () => {
      // Don't immediately show timeout, let onclose handle it
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'match') {
        setMatchData(data);
        setMatchFound(true);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      } else if (data.type === 'timeout') {
        setTimedOut(true);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    };

    ws.onclose = () => {
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

          <Link href="/home" className="text-sm underline text-muted-foreground">
            Cancel
          </Link>
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
              <AlertDialogTitle>Match Found! 🎉</AlertDialogTitle>
              <AlertDialogDescription>
                We found you a match! You&apos;ll be paired with someone at port{' '}
                {matchData?.partnerPort}.
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
    </div>
  );
}
