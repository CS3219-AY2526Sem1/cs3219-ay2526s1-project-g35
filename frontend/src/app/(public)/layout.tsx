'use client';

import LoginNavbar from '@/components/ui/LoginNavbar';
import Navbar from '@/components/ui/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect authenticated users (after successful login)
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/home');
    }
  }, [isAuthenticated, router]);

  // If authenticated, hide content while redirecting
  if (isAuthenticated) {
    return null;
  }

  // Not authenticated - show login/signup pages
  return (
    <>
      <Navbar buttons={<LoginNavbar />} />
      <main>{children}</main>
    </>
  );
}
