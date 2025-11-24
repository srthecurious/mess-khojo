ˆX'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  Menu,
  BookOpen,
  LogOut,
  Timer,
  ListChecks,
  ClipboardList,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter, usePathname } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Logo } from '@/components/ui/logo';
import { PomodoroProvider } from '@/context/pomodoro-context';
import InstallPwaButton from '@/components/install-pwa-button';
import '@/app/loader.css';

function DashboardNav() {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const getInitials = (email?: string | null) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <TooltipProvider>
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6 z-10">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Logo className="h-8 w-auto" />
          </Link>
          <Link
            href="/dashboard"
            className="text-foreground transition-colors hover:text-foreground"
          >
            Dashboard
          </Link>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/pomodoro-timer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Timer className="h-5 w-5" />
                <span className="sr-only">Pomodoro Timer</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pomodoro Timer</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/syllabus-tracker"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <ListChecks className="h-5 w-5" />
                <span className="sr-only">Syllabus Tracker</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Syllabus Tracker</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/mock-tests"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <ClipboardList className="h-5 w-5" />
                <span className="sr-only">Mock Tests</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mock Tests</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/study-arena"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <BookOpen className="h-5 w-5" />
                <span className="sr-only">Study Arena</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Study Arena</p>
            </TooltipContent>
          </Tooltip>
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Main navigation menu for the application
            </SheetDescription>
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Logo className="h-8 w-auto" />
              </Link>
              <Link href="/dashboard" className="hover:text-foreground flex items-center gap-4">
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>
              <Link
                href="/pomodoro-timer"
                className="flex items-center gap-4 text-muted-foreground hover:text-foreground"
              >
                <Timer className="h-5 w-5" />
                Pomodoro Timer
              </Link>
              <Link
                href="/syllabus-tracker"
                className="flex items-center gap-4 text-muted-foreground hover:text-foreground"
              >
                <ListChecks className="h-5 w-5" />
                Syllabus Tracker
              </Link>
              <Link
                href="/mock-tests"
                className="flex items-center gap-4 text-muted-foreground hover:text-foreground"
              >
                <ClipboardList className="h-5 w-5" />
                Mock Tests
              </Link>
              <Link
                href="/study-arena"
                className="flex items-center gap-4 text-muted-foreground hover:text-foreground"
              >
                <BookOpen className="h-5 w-5" />
                Study Arena
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <InstallPwaButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src={user?.photoURL || ''} alt="User avatar" />
                  <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.isAnonymous ? 'Anonymous User' : user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
}

const protectedRoutes = ['/dashboard', '/pomodoro-timer', '/syllabus-tracker', '/mock-tests', '/study-arena'];

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) {
      return; // Do nothing while loading
    }

    if (!user && protectedRoutes.includes(pathname)) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router, pathname]);

  // While the user status is being checked, display a global loading indicator.
  if (isUserLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
        <div className="loader">
          <div className="truckWrapper">
            <div className="truckBody">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 130 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M104.24,59.37H14.78a4,4,0,0,1-4-4V16.89a4,4,0,0,1,4-4H91.56a13.7,13.7,0,0,1,12.68,8.22L116,47.45V55.37a4,4,0,0,1-4,4ZM18.78,51.37H99.19v-26H18.78Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M91.56,12.89h-76.78a4,4,0,0,0-4,4V29.11H99.19V21.11A8.22,8.22,0,0,0,91.56,12.89Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            <div className="truckTires">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" fill="currentColor"></circle>
                <circle cx="12" cy="12" r="4" fill="var(--background)"></circle>
              </svg>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" fill="currentColor"></circle>
                <circle cx="12" cy="12" r="4" fill="var(--background)"></circle>
              </svg>
            </div>
            <div className="road"></div>
            <svg
              className="lampPost"
              width="40"
              height="90"
              viewBox="0 0 40 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5 90V10H35V0L25 10H5" stroke="currentColor" strokeWidth="3" />
            </svg>
          </div>
        </div>
      </main>
    );
  }

  // If loading is complete but there is no user, and we are on a protected route,
  // render nothing while the redirect happens.
  if (!user && protectedRoutes.includes(pathname)) {
    return null;
  }

  // If the user is authenticated, show the dashboard layout.
  if (user) {
    return (
      <PomodoroProvider>
        <div className="flex min-h-screen w-full flex-col bg-background">
          <DashboardNav />
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {children}
          </main>
        </div>
      </PomodoroProvider>
    );
  }

  // Fallback for public routes that don't need the dashboard layout (e.g., /login)
  return <>{children}</>;
}
À *cascade08ÀÞ*cascade08Þò# *cascade08ò#É%*cascade08É%ˆX *cascade08"(5d61d427a222e017a17c122ac4c4c05a08fc51202>file:///c:/Apps/NEETrack/NEETrack/src/app/%28app%29/layout.tsx:!file:///c:/Apps/NEETrack/NEETrack