"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

export interface PublicShellProps {
  children: React.ReactNode;
  activeNav?: "legal" | "support" | "activation-help";
}

export function PublicShell({ children, activeNav }: PublicShellProps) {
  return (
    <div className="min-h-screen bg-[#F4EBD8] text-[#11262C] flex flex-col relative selection:bg-[#D95B24] selection:text-white">
      {/* Vintage Top Navigation Header */}
      <header className="relative z-20 w-full border-b border-[#E2D7C3] bg-[#F4EBD8]/90 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Brand Wordmark */}
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D95B24] rounded-lg"
            title="One Academy Home"
          >
            <Logo size="md" variant="dark" />
          </Link>

          {/* Navigation Links */}
          <nav
            aria-label="Public portal navigation"
            className="flex items-center gap-2 sm:gap-4 font-barlow-condensed font-semibold text-xs sm:text-sm uppercase tracking-wider"
          >
            <Link
              href="/legal"
              className={cn(
                "px-2.5 py-1.5 rounded-md transition-colors",
                activeNav === "legal"
                  ? "text-[#D95B24] font-bold"
                  : "text-[#11262C] hover:text-[#D95B24]"
              )}
            >
              Privacy &amp; Terms
            </Link>
            <Link
              href="/support"
              className={cn(
                "px-2.5 py-1.5 rounded-md transition-colors",
                activeNav === "support"
                  ? "text-[#D95B24] font-bold"
                  : "text-[#11262C] hover:text-[#D95B24]"
              )}
            >
              Support
            </Link>
            <Link
              href="/activate"
              className={cn(
                "px-2.5 py-1.5 rounded-md transition-colors hidden xs:inline-block",
                activeNav === "activation-help"
                  ? "text-[#D95B24] font-bold"
                  : "text-[#11262C] hover:text-[#D95B24]"
              )}
            >
              Activate
            </Link>
            <Link
              href="/login"
              className="ml-1 sm:ml-2 px-4 py-1.5 rounded-full font-barlow-condensed font-bold text-xs sm:text-sm tracking-wider uppercase bg-[#8B1E1E] hover:bg-[#721818] text-[#FFF9EF] shadow-2xs transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>

      {/* Public Footer */}
      <footer className="relative z-10 w-full py-6 text-xs text-[#718E94] border-t border-[#E2D7C3] bg-[#EFE4CF]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-medium text-center sm:text-left">
            &copy; 2026 One Academy &bull; Single-Academy Sports Management System
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-center sm:text-right font-medium">
            <Link
              href="/legal"
              className="hover:text-[#11262C] transition-colors underline-offset-4 hover:underline"
            >
              Privacy &amp; Terms
            </Link>
            <span>&bull;</span>
            <Link
              href="/support"
              className="hover:text-[#11262C] transition-colors underline-offset-4 hover:underline"
            >
              Contact &amp; Support
            </Link>
            <span>&bull;</span>
            <Link
              href="/activate/help"
              className="hover:text-[#11262C] transition-colors underline-offset-4 hover:underline"
            >
              Activation Help
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

