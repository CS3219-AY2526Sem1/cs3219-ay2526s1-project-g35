'use client';

import { Button } from '@/components/ui/button';
import { MessagesSquare } from 'lucide-react';
import Link from 'next/link';
import ModeToggle from './ModeToggle';

function LoginNavbar() {
  return (
    <div className="flex items-center justify-between h-16">
      <Link
        href="/login"
        className="text-xl font-bold text-primary tracking-widest flex gap-2 items-center"
      >
        <MessagesSquare className="w-8 h-8 inline-block" />
        <span>PeerPrep</span>
      </Link>
      <div className="flex items-center gap-4">
        <ModeToggle />
        <Button variant="ghost" className="flex items-center" asChild>
          <Link href="/signup">
            <span className="hidden lg:inline">Sign Up</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
export default LoginNavbar;
