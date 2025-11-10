'use client';

import LoginNavbar from '@/components/ui/LoginNavbar';
import Navbar from '@/components/ui/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;
    const targetPath = user?.isAdmin ? '/admin/home' : '/home';
    router.replace(targetPath);
  }, [isAuthenticated, user, router]);

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
