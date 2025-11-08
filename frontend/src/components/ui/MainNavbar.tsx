'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useAuth } from '@/contexts/AuthContext';
import socketService from '@/services/socketService';
import { MessagesSquare, UserIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ModeToggle from './ModeToggle';

function MainNavbar() {
  const { user, logout } = useAuth();
  const pathName = usePathname();
  const router = useRouter();
  const [isInSession, setIsInSession] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [partnerRole, setPartnerRole] = useState<string>('Partner 1');

  useEffect(() => {
    // Check if user is in a session
    setIsInSession(pathName === '/session');

    // Determine partner role based on userId stored in sessionStorage
    if (pathName === '/session') {
      const matchedUserId = sessionStorage.getItem('matchedUserId');
      if (matchedUserId) {
        // Use a simple hash of userId to determine if user is Partner 1 or 2
        const hash = matchedUserId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        setPartnerRole(hash % 2 === 0 ? 'Partner 1' : 'Partner 2');
      }
    }
  }, [pathName]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLeaveSessionClick = () => {
    setShowLeaveDialog(true);
  };

  const handleConfirmLeaveSession = async () => {
    try {
      // Leave the session via socket service
      await socketService.leaveSession();
      console.log('Left session successfully');

      // Disconnect from socket
      socketService.disconnect();

      // Close dialog
      setShowLeaveDialog(false);

      // Redirect to home page
      router.push('/home');
    } catch (error) {
      console.error('Failed to leave session:', error);
      // Redirect anyway
      setShowLeaveDialog(false);
      router.push('/home');
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
      {isInSession && (
        <>
          <div className="flex items-center gap-4 mr-16">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{partnerRole}</span>
            </div>
            <Button variant="destructive" onClick={handleLeaveSessionClick}>
              Leave Session
            </Button>
          </div>
          <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave Session?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to leave this session? Your partner will be notified and
                  you&apos;ll be disconnected from the collaboration.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmLeaveSession}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Leave
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
      <div className="flex items-center gap-4">
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="rounded-full w-10 h-10 p-0 overflow-hidden"
              size="icon"
            >
              {user?.profile?.avatar ? (
                <Image
                  src={user.profile.avatar}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44" align="end" sideOffset={10}>
            <DropdownMenuItem asChild>
              <Link href={`/profile?${user?.username ?? user?.email}`}>Manage Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/history">History</Link>
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
