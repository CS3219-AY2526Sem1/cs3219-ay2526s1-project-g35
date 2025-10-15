import { MessagesSquare } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

function Navbar({ buttons }: { buttons?: ReactNode }) {
  return (
    <nav className="sticky top-0 w-full bg-background/90 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-xl font-bold text-primary tracking-widest flex gap-2 items-center"
          >
            <MessagesSquare className="w-8 h-8 inline-block" />
            <span>PeerPrep</span>
          </Link>

          {buttons}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
