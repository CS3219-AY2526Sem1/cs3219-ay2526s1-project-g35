import { ReactNode } from 'react';

function Navbar({ buttons }: { buttons?: ReactNode }) {
  return (
    <nav className="sticky top-0 w-full bg-background/90 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="px-4">{buttons}</div>
    </nav>
  );
}

export default Navbar;
