'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useAuth } from '@/contexts/AuthContext';
import { MessagesSquare, UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ModeToggle from './ModeToggle';

function MainNavbar() {
  const { user, logout } = useAuth();
  const pathName = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex items-center justify-between h-16">
      <Link
        href="/home"
        className="text-xl font-bold text-primary tracking-widest flex gap-2 items-center"
      >
        <MessagesSquare className="w-8 h-8 inline-block" />
        <span>PeerPrep</span>
      </Link>
      {pathName === '/session' && (
        <div className="flex items-center gap-4 mr-16">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Partner 1</span>
          </div>
          <Button variant="destructive">Leave Session</Button>
        </div>
      )}
      <div className="flex items-center gap-4">
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-full" size="icon">
              <UserIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44" align="end" sideOffset={10}>
            <DropdownMenuItem asChild>
              <Link href={`/profile/${user?.username ?? user?.email}`}>Manage Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/history">History</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
export default MainNavbar;
