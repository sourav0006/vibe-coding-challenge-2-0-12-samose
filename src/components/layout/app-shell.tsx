"use client";

import React, { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/models";

export interface AppShellProps {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
  children: ReactNode;
  title?: string;
  description?: string;
  badge?: ReactNode;
}

const roleBadgeVariants: Record<UserRole, "success" | "info" | "default"> = {
  coach: "success",
  player: "info",
  scout: "default",
};

export function AppShell({ user, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const dashboardPath = `/dashboard/${user.role}`;

  const coachNavItems = [
    {
      label: "Overview",
      href: "/dashboard/coach",
      active: pathname === "/dashboard/coach",
    },
    {
      label: "Players",
      href: "/dashboard/coach/players",
      active: pathname.startsWith("/dashboard/coach/players"),
    },
    {
      label: "Sports",
      href: "/dashboard/coach/sports",
      active: pathname.startsWith("/dashboard/coach/sports"),
    },
    {
      label: "Sessions",
      href: "/dashboard/coach/sessions",
      active: pathname.startsWith("/dashboard/coach/sessions"),
    },
    {
      label: "Matches",
      href: "/dashboard/coach/matches",
      active: pathname.startsWith("/dashboard/coach/matches"),
    },
    {
      label: "Readiness",
      href: "/dashboard/coach/readiness",
      active: pathname.startsWith("/dashboard/coach/readiness"),
    },
  ];

  const scoutNavItems = [
    {
      label: "Overview",
      href: "/dashboard/scout",
      active: pathname === "/dashboard/scout",
    },
    {
      label: "Discover Players",
      href: "/dashboard/scout#discover",
      active: pathname.startsWith("/dashboard/scout/players"),
    },
  ];

  const playerNavItems = [
    {
      label: "Overview",
      href: "/dashboard/player",
      active: pathname === "/dashboard/player",
    },
    {
      label: "My Profile",
      href: "/dashboard/player/profile",
      active: pathname.startsWith("/dashboard/player/profile"),
    },
    {
      label: "Attendance",
      href: "/dashboard/player/attendance",
      active: pathname.startsWith("/dashboard/player/attendance"),
    },
    {
      label: "Match History",
      href: "/dashboard/player/matches",
      active: pathname.startsWith("/dashboard/player/matches"),
    },
    {
      label: "Coach Feedback",
      href: "/dashboard/player/remarks",
      active: pathname.startsWith("/dashboard/player/remarks"),
    },
  ];

  const defaultNavItems = [
    {
      label: "Overview",
      href: dashboardPath,
      active: pathname === dashboardPath,
    },
  ];

  const navItems =
    user.role === "coach"
      ? coachNavItems
      : user.role === "scout"
      ? scoutNavItems
      : user.role === "player"
      ? playerNavItems
      : defaultNavItems;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-[var(--color-border)] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-background-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              {mobileMenuOpen ? (
                <CloseIcon className="w-5 h-5" />
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>

            <Link href={dashboardPath} className="flex items-center gap-2">
              <Logo showTagline />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[var(--color-border)]">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors",
                    item.active
                      ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background-subtle)]"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right utility items */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-[var(--color-border)]">
              <span className="text-xs text-[var(--color-text-secondary)]">Signed in as</span>
              <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate max-w-[160px]">
                {user.email}
              </span>
            </div>

            <Badge variant={roleBadgeVariants[user.role]} size="sm" dot>
              {user.role.toUpperCase()}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              isLoading={loggingOut}
              onClick={handleLogout}
              className="text-xs h-8 px-3"
            >
              Log Out
            </Button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--color-border)] bg-white px-4 py-3 space-y-2">
            <div className="pb-2 border-b border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)]">
              Signed in as: <strong className="text-[var(--color-text-primary)]">{user.email}</strong>
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    item.active
                      ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-background-subtle)]"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
        {children}
      </main>

      {/* Dashboard Footer */}
      <footer className="w-full bg-white border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)]">
        One Academy • Single-Academy Sports Management System • Authenticated Session
      </footer>
    </div>
  );
}
