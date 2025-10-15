import MainNavbar from '@/components/ui/MainNavbar';
import Navbar from '@/components/ui/Navbar';
import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'PeerPrep',
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar buttons={<MainNavbar />} />
      <main>{children}</main>
    </>
  );
}
