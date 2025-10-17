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
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // start 60s timer
    timerRef.current = window.setTimeout(() => setTimedOut(true), 2_000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

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
    </div>
  );
}
