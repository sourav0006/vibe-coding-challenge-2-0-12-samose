"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  const isActivate = pathname === "/activate";
  const isLogin = pathname === "/login";

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <Container size="xl">
        <div className="flex h-16 items-center justify-between">
          {/* Approved One Academy Brand Logo (Left) */}
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md"
            aria-label="One Academy Home"
          >
            <Logo size="md" />
          </Link>

          {/* Public Navigation Controls (Right) */}
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Portal Navigation">
            <Link
              href="/activate"
              className={cn(
                "px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                isActivate
                  ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/70 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              )}
            >
              Activate
            </Link>

            <Link
              href="/login"
              className={cn(
                "px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                isLogin
                  ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
                  : "bg-slate-900 text-white shadow-xs hover:bg-slate-800"
              )}
            >
              Sign In
            </Link>
          </nav>
        </div>
      </Container>
    </header>
  );
}
