"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Shield } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Standings' },
  { href: '/teams', label: 'Teams' },
  { href: '/players', label: 'Players' },
];

export function Header() {
  const pathname = usePathname();

  const NavLinks = ({ className }: { className?: string }) => (
    <nav className={cn('flex items-center gap-4 lg:gap-6', className)}>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname.startsWith(link.href) && link.href !== '/' || pathname === link.href ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="hidden font-bold font-headline sm:inline-block">Faustball Insights</span>
        </Link>

        <div className="hidden md:flex flex-1 items-center justify-between">
          <NavLinks />
          <div className="flex items-center space-x-2">
            <Button asChild variant="ghost">
              <Link href="/admin">Admin</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px]">
              <div className="flex h-full flex-col">
                <div className="mb-4 flex items-center border-b pb-4">
                  <Link href="/" className="flex items-center space-x-2">
                    <Shield className="h-6 w-6 text-primary" />
                    <span className="font-bold font-headline">Faustball Insights</span>
                  </Link>
                </div>
                <nav className="flex flex-col gap-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'text-lg font-medium transition-colors hover:text-primary',
                        pathname.startsWith(link.href) && link.href !== '/' || pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-2">
                   <Button asChild variant="outline">
                     <Link href="/admin">Admin Panel</Link>
                   </Button>
                   <Button asChild>
                     <Link href="/login">Login</Link>
                   </Button>
                 </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
