import { type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  variant?: "emerald" | "sky" | "amber" | "indigo" | "purple" | "slate";
  href?: string;
  className?: string;
}

/**
 * Vintage Scoreboard KPI Card matching the Coach Overview design language.
 * Chamfered beveled cut corners, deep navy/slate-teal plaque (#132B32),
 * inset gold border frame line (#D5A64A), large Alfa Slab One numerals,
 * and Barlow Condensed uppercase metric labels.
 */
export function MetricCard({
  title,
  value,
  subtitle,
  badge,
  href,
  className,
}: MetricCardProps) {
  const content = (
    <div
      className={cn(
        "coach-kpi-card relative group flex flex-col items-center justify-center p-3.5 sm:p-4 min-h-[105px] transition-transform hover:-translate-y-0.5",
        className
      )}
    >
      {/* Vintage chamfered plaque SVG background with crisp vector cut corners */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-xs"
        preserveAspectRatio="none"
        viewBox="0 0 160 105"
      >
        {/* Outer dark teal/navy plaque with beveled cut corners */}
        <polygon
          points="10,2 150,2 158,10 158,95 150,103 10,103 2,95 2,10"
          fill="#132B32"
          stroke="#0D1E22"
          strokeWidth="1.5"
        />
        {/* Inset gold decorative frame line with matching cut corners */}
        <polygon
          points="13,6 147,6 154,13 154,92 147,99 13,99 6,92 6,13"
          fill="none"
          stroke="#D5A64A"
          strokeWidth="1.2"
          strokeOpacity="0.85"
        />
      </svg>

      <div className="relative z-10 w-full flex flex-col items-center text-center px-1">
        <div className="flex items-center justify-center gap-2">
          <span className="font-alfa text-2xl sm:text-3xl text-[#FFF9EF] tracking-tight leading-none group-hover:text-[#D5A64A] transition-colors">
            {value}
          </span>
          {badge && <div>{badge}</div>}
        </div>
        <div className="w-4/5 h-px bg-[#D5A64A]/40 my-2" />
        <span className="font-barlow-condensed text-[13px] sm:text-[14px] font-bold text-[#E9DCC5] uppercase tracking-wider leading-tight">
          {title}
        </span>
        {subtitle && (
          <span className="font-barlow-condensed text-[11px] text-[#A2BAC0] mt-1 line-clamp-1">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D95B24] rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return content;
}
