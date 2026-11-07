"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export interface AuthHeaderProps {
  currentPage: "login" | "activate";
}

export function AuthHeader({ currentPage }: AuthHeaderProps) {
  const isLogin = currentPage === "login";

  return (
    <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
      {/* Left: Brand Logo & Wordmark */}
      <Link
        href="/"
        className="inline-flex items-center gap-2.5 transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D95B24] rounded-lg"
        title="One Academy Home"
      >
        <Logo size="md" variant="dark" />
      </Link>

      {/* Right: Auth Action Links */}
      <nav aria-label="Authentication navigation" className="flex items-center gap-2 sm:gap-4">
        <Link
          href="/support"
          className="text-xs sm:text-sm font-bold font-barlow-condensed uppercase tracking-wider text-[#11262C] hover:text-[#D95B24] transition-colors px-2 py-1"
        >
          Support
        </Link>
        {isLogin ? (
          <>
            <Link
              href="/activate"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("oa:reset-activation"));
                }
              }}
              className="text-xs sm:text-sm font-bold font-barlow-condensed uppercase tracking-wider text-[#11262C] hover:text-[#D95B24] transition-colors px-2 py-1"
            >
              Activate
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 rounded-full font-barlow-condensed font-bold text-xs sm:text-sm tracking-wider uppercase bg-[#8B1E1E] hover:bg-[#721818] text-[#FFF9EF] shadow-2xs transition-colors"
            >
              Sign In
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold font-barlow-condensed uppercase tracking-wider text-[#11262C] hover:text-[#D95B24] transition-colors px-2 py-1"
            >
              Sign In
            </Link>
            <Link
              href="/activate"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("oa:reset-activation"));
                }
              }}
              className="px-5 py-2 rounded-full font-barlow-condensed font-bold text-xs sm:text-sm tracking-wider uppercase bg-[#8B1E1E] hover:bg-[#721818] text-[#FFF9EF] shadow-2xs transition-colors"
            >
              Activate
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

