'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

const HIDE_NAVBAR_PATHS = ['/dashboard', '/admin', '/login'];

function shouldHideNavbar(pathname: string): boolean {
  return HIDE_NAVBAR_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

export function NavbarVisibility() {
  const pathname = usePathname();

  if (shouldHideNavbar(pathname)) {
    return null;
  }

  return <Navbar />;
}
