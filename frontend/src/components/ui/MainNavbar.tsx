'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import ModeToggle from './ModeToggle';

function DesktopNavbar() {
  const [user, setMockUser] = useState<{
    email?: string;
    username?: string;
  } | null>(null);

  const pathName = usePathname();

  //TODO: to update to actual checks during integration
  useEffect(() => {
    const loadUser = () => {
      try {
        const raw = sessionStorage.getItem('mockUser'); // <-- use sessionStorage
        if (raw) {
          setMockUser(JSON.parse(raw));
        } else {
          setMockUser(null);
        }
      } catch {
        sessionStorage.removeItem('mockUser');
        setMockUser(null);
      }
    };

    loadUser();

    // same-window custom event from login
    window.addEventListener('mockUserChanged', loadUser);

    // storage event for changes from other tabs/windows
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'mockUser') loadUser();
    };
    window.addEventListener('storage', onStorage);

    // clear session key on unload (helps keep storage clean during dev)
    const onBeforeUnload = () => {
      sessionStorage.removeItem('mockUser');
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('mockUserChanged', loadUser);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  return (
    <div className="hidden md:flex items-center gap-4">
      {pathName === '/session' && (
        <div className="flex items-center gap-4 mr-16">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Partner 1</span>
          </div>
          <Button variant="destructive">Leave Session</Button>
        </div>
      )}
      <ModeToggle />
      {user ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full" size="icon">
                <Link href={`/profile/${user.username ?? user.email}`}>
                  <UserIcon className="w-4 h-4" />
                </Link>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" align="end" sideOffset={10}>
              <DropdownMenuItem asChild>
                <Link href="/profile">Manage Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/history">History</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <Button variant="ghost" className="flex items-center" asChild>
          <Link href="/signup">
            <span className="hidden lg:inline">Sign Up</span>
          </Link>
        </Button>
      )}
    </div>
  );
}
export default DesktopNavbar;
