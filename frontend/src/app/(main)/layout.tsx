import Navbar from "@/components/ui/Navbar";
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "PeerPrep",
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
