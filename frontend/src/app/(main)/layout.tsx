'use client';

import MainNavbar from '@/components/ui/MainNavbar';
import Navbar from '@/components/ui/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import '../globals.css';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, verifySession } = useAuth();
  const router = useRouter();
  const hasChecked = useRef(false);

  // Verify session once on mount for protected routes
  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAuth = async () => {
      const isValid = await verifySession();
      if (!isValid) {
        router.replace('/login');
      }
    };

    checkAuth();
  }, [verifySession, router]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading spinner during session verification
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, hide content while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated - show protected content
  return (
    <>
      <Navbar buttons={<MainNavbar />} />
      <main>{children}</main>
    </>
  );
}
