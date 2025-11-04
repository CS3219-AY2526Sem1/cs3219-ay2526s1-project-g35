'use client';

import AdminNavbar from '@/components/ui/AdminNavbar';
import Navbar from '@/components/ui/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import '../globals.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, verifySession, user } = useAuth();
  const router = useRouter();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAuth = async () => {
      const isValid = await verifySession();
      if (!isValid) {
        router.replace('/login');
        return;
      }
    };

    checkAuth();
  }, [verifySession, router]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (user && !user.isAdmin) {
        router.replace('/home');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user && !user.isAdmin)) return null;

  return (
    <>
      <Navbar buttons={<AdminNavbar />} />
      <main>{children}</main>
    </>
  );
}
