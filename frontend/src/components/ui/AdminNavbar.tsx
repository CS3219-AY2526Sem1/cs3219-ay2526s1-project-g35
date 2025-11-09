'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import ModeToggle from '@/components/ui/ModeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { MessagesSquare, UserIcon } from 'lucide-react';
import Link from 'next/link';

function AdminNavbar() {
  const { logout } = useAuth();

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
        href="/admin/home"
        className="text-xl font-bold text-primary tracking-widest flex gap-2 items-center"
      >
        <MessagesSquare className="w-8 h-8 inline-block" />
        <span>PeerPrep</span>
      </Link>

      <div className="flex items-center gap-4">
        <ModeToggle />
        <span className="text-sm text-muted-foreground">Admin</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-full" size="icon">
              <UserIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="end" sideOffset={10}>
            <DropdownMenuItem asChild>
              <Link href="/admin/accounts">Manage Users</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/questions">Question Bank</Link>
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

export default AdminNavbar;
