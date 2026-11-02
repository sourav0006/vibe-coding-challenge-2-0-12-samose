import React from "react";
import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  showTagline?: boolean;
}

export function Logo({ className, showTagline = false }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-base shadow-sm">
        <svg
          className="w-5 h-5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Sports academy crest / shield icon */}
          <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="font-bold tracking-tight text-base text-[var(--color-text-primary)] leading-tight">
          One<span className="text-[var(--color-primary)]">Academy</span>
        </span>
        {showTagline && (
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] font-medium">
            Sports Management
          </span>
        )}
      </div>
    </div>
  );
}
