"use client";

import { useEffect, useState, useRef, useId, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import {
  SearchIcon,
  CalendarIcon,
  SwordsIcon,
  ActivityIcon,
  PlusIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";
import { formatDateOnly, cn } from "@/lib/utils";
import type {
  CoachStats,
  RecentPlayerItem,
  RecentMatchItem,
  AttendanceTrendItem,
  CoachReadinessStats,
} from "@/lib/services";

export interface CoachOverviewViewProps {
  initialStats?: CoachStats | null;
  initialRecentPlayers?: RecentPlayerItem[] | null;
  initialRecentMatches?: RecentMatchItem[] | null;
  initialAttendanceTrend?: AttendanceTrendItem[] | null;
  initialReadinessStats?: CoachReadinessStats | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Reusable Vintage Scoreboard Card with Chamfered Corners, Alfa Slab One Numerals,
 * and Barlow Condensed Labels
 */
function ScoreboardCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link
      href={href}
      prefetch={true}
      className="coach-animate-card relative group flex flex-col items-center justify-center p-3 sm:p-3.5 min-h-[105px] transition-transform hover:-translate-y-0.5"
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
        <span className="font-alfa text-[28px] sm:text-[32px] md:text-[34px] text-[#FFF9EF] tracking-tight leading-none group-hover:text-[#D5A64A] transition-colors">
          {value}
        </span>
        <div className="w-4/5 h-px bg-[#D5A64A]/40 my-2" />
        <span className="font-barlow-condensed text-[13px] sm:text-[14px] font-bold text-[#E9DCC5] uppercase tracking-wider leading-tight">
          {label}
        </span>
      </div>
    </Link>
  );
}

export function CoachOverviewView({
  initialStats = null,
  initialRecentPlayers = null,
  initialRecentMatches = null,
  initialAttendanceTrend = null,
  initialReadinessStats = null,
}: CoachOverviewViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartGradientId = useId();

  const [stats, setStats] = useState<CoachStats | null>(initialStats);
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayerItem[] | null>(initialRecentPlayers);
  const [recentMatches, setRecentMatches] = useState<RecentMatchItem[] | null>(initialRecentMatches);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendItem[] | null>(
    initialAttendanceTrend
  );
  const [readinessStats, setReadinessStats] = useState<CoachReadinessStats | null>(
    initialReadinessStats
  );

  const [loading, setLoading] = useState(!initialStats);
  const [error, setError] = useState<string | null>(null);

  // Hover state for interactive attendance trend chart
  const [activeTrendIndex, setActiveTrendIndex] = useState<number | null>(null);

  // Hydration-safe external store subscription for dynamic greeting and date
  // Deterministic server snapshot ("Welcome back, Coach!") prevents any SSR hydration mismatch
  const greeting = useSyncExternalStore(
    () => () => {},
    () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good morning, Coach!";
      if (hour < 17) return "Good afternoon, Coach!";
      return "Good evening, Coach!";
    },
    () => "Welcome back, Coach!"
  );

  const dateDisplay = useSyncExternalStore(
    () => () => {},
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    () => "Thu, Nov 5, 2026"
  );

  // Fetch updated dashboard data on client refresh
  const fetchDashboardData = async () => {
    try {
      setError(null);
      const res = await fetch("/api/coach/dashboard/stats");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load dashboard data");
      }
      setStats(json.data.stats);
      setRecentPlayers(json.data.recentPlayers);
      setRecentMatches(json.data.recentMatches || []);
      setAttendanceTrend(json.data.attendanceTrend || []);
      setReadinessStats(json.data.readinessStats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Synchronize state when server component props update
  const [prevStats, setPrevStats] = useState(initialStats);
  if (initialStats && initialStats !== prevStats) {
    setPrevStats(initialStats);
    setStats(initialStats);
    setRecentPlayers(initialRecentPlayers);
    setRecentMatches(initialRecentMatches);
    setAttendanceTrend(initialAttendanceTrend);
    setReadinessStats(initialReadinessStats);
  }

  // Client-side background fetch on mount/navigation to ensure zero stale metrics
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialStats) {
        return;
      }
    }
    let ignore = false;
    fetch("/api/coach/dashboard/stats")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) {
          if (json.success) {
            setStats(json.data.stats);
            setRecentPlayers(json.data.recentPlayers);
            setRecentMatches(json.data.recentMatches || []);
            setAttendanceTrend(json.data.attendanceTrend || []);
            setReadinessStats(json.data.readinessStats || null);
          } else if (!initialStats) {
            setError(json.error || "Failed to load dashboard data");
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          if (!initialStats) setError(err instanceof Error ? err.message : "Failed to load dashboard");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [initialStats]);

  // Subtle GSAP entrance animation for dashboard cards
  useGSAP(
    () => {
      if (!stats) return;
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      gsap.fromTo(
        ".coach-animate-card",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.32, stagger: 0.03, ease: "power2.out" }
      );
    },
    { dependencies: [stats], scope: containerRef }
  );

  // Readiness figures
  const totalEvaluatedPlayers = readinessStats?.totalPlayers ?? stats?.activePlayers ?? 0;
  const readyCount = readinessStats?.totalReadyPlayers ?? stats?.scoutReadyCount ?? 0;
  const developingCount = readinessStats?.totalNotReadyPlayers ?? (totalEvaluatedPlayers - readyCount);
  const readyPercent =
    totalEvaluatedPlayers > 0 ? Math.round((readyCount / totalEvaluatedPlayers) * 100) : 0;
  const developingPercent = totalEvaluatedPlayers > 0 ? 100 - readyPercent : 0;

  // Formatted scoreboard values with vintage leading zero formatting
  const totalPlayersFormatted = String(stats?.totalPlayers ?? 0).padStart(2, "0");
  const activePlayersFormatted = String(stats?.activePlayers ?? 0).padStart(2, "0");
  const avgAttendanceFormatted =
    stats?.averageAttendanceRate !== undefined && stats.averageAttendanceRate !== null
      ? `${stats.averageAttendanceRate.toFixed(1)}%`
      : "00.0%";
  const finalMatchesFormatted = String(stats?.totalMatches ?? 0).padStart(2, "0");
  const readyCountFormatted = String(readyCount).padStart(2, "0");
  const pendingActivationsFormatted = String(stats?.pendingActivations ?? 0).padStart(2, "0");

  // Chart 1 Attendance Trend geometry calculations
  const trendPoints = attendanceTrend || [];
  const chartWidth = 560;
  const chartHeight = 190;
  const paddingX = 42;
  const paddingY = 28;

  const points = trendPoints.map((pt, idx) => {
    const x =
      trendPoints.length === 1
        ? chartWidth / 2
        : paddingX + (idx / (trendPoints.length - 1)) * (chartWidth - paddingX * 2);
    // Y: 0% at bottom (chartHeight - paddingY), 100% at top (paddingY)
    const y = chartHeight - paddingY - (pt.attendanceRate / 100) * (chartHeight - paddingY * 2);
    return { x, y, pt, idx };
  });

  const linePath =
    points.length > 0
      ? points.reduce((acc, curr, i) => `${acc} ${i === 0 ? "M" : "L"} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`, "")
      : "";

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(chartHeight - paddingY).toFixed(1)} L ${points[0].x.toFixed(1)} ${(chartHeight - paddingY).toFixed(1)} Z`
      : "";

  // Active callout point for Attendance Velocity: hovered or latest point
  const calloutPoint =
    activeTrendIndex !== null && points[activeTrendIndex]
      ? points[activeTrendIndex]
      : points.length > 0
      ? points[points.length - 1]
      : null;

  // Two-line collegiate welcome heading layout matching the reference image
  const greetingParts = greeting.toUpperCase().split(",");
  const greetingLine1 = greetingParts[0] ? `${greetingParts[0].trim()},` : "GOOD EVENING,";
  const greetingLine2 = greetingParts[1] ? greetingParts[1].trim() : "COACH!";

  return (
    <div ref={containerRef} className="space-y-6 pb-12">
      {/* ========================================================= */}
      {/* SECTION A: BOLD COLLEGIATE WELCOME HERO & COACH CHARACTER */}
      {/* ========================================================= */}
      <section
        aria-label="Welcome Header"
        className="coach-animate-card relative overflow-visible pt-4 pb-2"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          {/* Left: Two-Line Visibly Bolder Collegiate Heading & Ribbon Banner */}
          <div className="space-y-3 z-10 max-w-xl">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-alfa text-[#132B32] uppercase tracking-tight leading-[1.05]">
                <span className="block">{greetingLine1}</span>
                <span className="block">{greetingLine2}</span>
              </h1>
            </div>

            {/* Vintage Mahogany Ribbon Banner with Cutout Swallowtail Ends */}
            <div className="relative inline-flex items-center h-7 sm:h-8 select-none">
              <svg
                viewBox="0 0 240 32"
                className="h-7 sm:h-8 w-auto text-[#3D2619] drop-shadow-xs"
                fill="currentColor"
                preserveAspectRatio="none"
              >
                {/* Vintage ribbon flag shape with swallowtail cuts */}
                <path d="M14,0 L226,0 L240,16 L226,32 L14,32 L0,16 Z" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-barlow-condensed font-bold text-[#D5A64A] text-xs sm:text-[13px] tracking-[0.22em] uppercase px-5">
                {dateDisplay.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Right: Retro Sunset Semicircle Graphic Behind Sized Coach Character */}
          <div className="relative shrink-0 flex items-end justify-center self-center sm:self-end">
            {/* Concentric Striped Retro Sunset Arch */}
            <div className="relative w-52 sm:w-64 md:w-76 lg:w-84 h-28 sm:h-34 md:h-40 lg:h-44 flex items-end justify-center overflow-hidden">
              <svg
                viewBox="0 0 280 145"
                className="w-full h-auto drop-shadow-xs"
                fill="none"
              >
                <defs>
                  <clipPath id="retroSunsetArch">
                    <path d="M 10 145 A 130 130 0 0 1 270 145 Z" />
                  </clipPath>
                </defs>
                <g clipPath="url(#retroSunsetArch)">
                  {/* 6 horizontal retro gradient stripes with fine gaps */}
                  <rect x="0" y="8" width="280" height="20" fill="#E26B39" />
                  <rect x="0" y="31" width="280" height="20" fill="#E87D4B" />
                  <rect x="0" y="54" width="280" height="20" fill="#EE905E" />
                  <rect x="0" y="77" width="280" height="20" fill="#F3A372" />
                  <rect x="0" y="100" width="280" height="20" fill="#F7B788" />
                  <rect x="0" y="123" width="280" height="25" fill="#FBCB9F" />
                </g>
              </svg>
            </div>

            {/* Coach Character Foreground Image - Enlarged Waist-Up Crop */}
            <div className="absolute bottom-0 w-36 sm:w-48 md:w-56 lg:w-64 h-32 sm:h-42 md:h-50 lg:h-56 overflow-hidden flex items-start justify-center pointer-events-none select-none z-10">
              <div className="relative w-[215%] h-[215%] shrink-0 -top-1 sm:-top-2">
                <Image
                  src="/images/coach-character.png"
                  alt="One Academy Coach"
                  fill
                  sizes="(max-width: 640px) 240px, (max-width: 768px) 320px, 400px"
                  priority
                  className="object-contain object-top drop-shadow-md"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={fetchDashboardData} className="text-red-700 hover:bg-red-100 text-xs font-semibold">
            Retry
          </Button>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION B: 6 FRAMED VINTAGE SCOREBOARD CARDS               */}
      {/* ========================================================= */}
      <section aria-label="Academy Statistics">
        {loading && !stats ? (
          <LoadingState message="Loading academy metrics..." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
            {/* 1. Total Players */}
            <ScoreboardCard
              label="TOTAL PLAYERS"
              value={totalPlayersFormatted}
              href="/dashboard/coach/players"
            />

            {/* 2. Active Players */}
            <ScoreboardCard
              label="ACTIVE PLAYERS"
              value={activePlayersFormatted}
              href="/dashboard/coach/players?status=active"
            />

            {/* 3. Average Attendance */}
            <ScoreboardCard
              label="AVG ATTENDANCE"
              value={avgAttendanceFormatted}
              href="/dashboard/coach/sessions"
            />

            {/* 4. Finalized Matches */}
            <ScoreboardCard
              label="FINAL MATCHES"
              value={finalMatchesFormatted}
              href="/dashboard/coach/matches?status=finalized"
            />

            {/* 5. Scout-Ready Players */}
            <ScoreboardCard
              label="SCOUT-READY"
              value={readyCountFormatted}
              href="/dashboard/coach/readiness?status=ready"
            />

            {/* 6. Pending Setup */}
            <ScoreboardCard
              label="PENDING SETUP"
              value={pendingActivationsFormatted}
              href="/dashboard/coach/players?status=pending"
            />
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* SECTION C: PERFORMANCE ANALYTICS (2 Distinctive Columns)  */}
      {/* ========================================================= */}
      <section aria-label="Performance Analytics">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: ATTENDANCE VELOCITY */}
          <div className="coach-animate-card bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#EAE0CF]">
                <div>
                  <h3 className="font-alfa text-lg sm:text-[20px] tracking-tight text-[#132B32]">
                    ATTENDANCE VELOCITY
                  </h3>
                  <p className="text-xs text-[#665C52] mt-0.5 font-sans">
                    Chronological attendance rate across closed practice sessions.
                  </p>
                </div>
                <span className="font-barlow-condensed font-bold text-[11px] text-[#1F5A38] bg-[#E7F3EC] border border-[#99C7AB] px-2.5 py-1 rounded-full whitespace-nowrap tracking-wider uppercase">
                  75% TARGET BENCHMARK
                </span>
              </div>

              {/* Chart Graphic Area */}
              <div className="py-4">
                {trendPoints.length > 0 ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <svg
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                        className="w-full h-44 overflow-visible"
                        role="img"
                        aria-label="Attendance Trend Chart"
                      >
                        <defs>
                          <linearGradient id={chartGradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#D95B24" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#FFFDF8" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Grid lines */}
                        {[0, 25, 50, 75, 100].map((percent) => {
                          const y =
                            chartHeight - paddingY - (percent / 100) * (chartHeight - paddingY * 2);
                          const is75 = percent === 75;
                          return (
                            <g key={percent}>
                              <line
                                x1={paddingX}
                                y1={y}
                                x2={chartWidth - paddingX}
                                y2={y}
                                stroke={is75 ? "#6B8289" : "#E8DDCB"}
                                strokeDasharray={is75 ? "4 4" : "2 2"}
                                strokeWidth={is75 ? "1.5" : "0.8"}
                              />
                              <text
                                x={paddingX - 8}
                                y={y + 3.5}
                                textAnchor="end"
                                className="text-[10px] fill-[#7A6D5F] font-mono font-medium"
                              >
                                {percent}%
                              </text>
                            </g>
                          );
                        })}

                        {/* Area Fill */}
                        <path d={areaPath} fill={`url(#${chartGradientId})`} />

                        {/* Burnt Orange Trend Line */}
                        <path
                          d={linePath}
                          fill="none"
                          stroke="#D95B24"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Points with hover interaction */}
                        {points.map((p) => {
                          const isHovered = activeTrendIndex === p.idx;
                          return (
                            <g key={p.pt.sessionId}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={isHovered ? 6 : 4.5}
                                className={cn(
                                  "transition-all cursor-pointer fill-[#D95B24] stroke-[#FFFDF8] stroke-2",
                                  isHovered && "fill-[#132B32] stroke-[#D5A64A]"
                                )}
                                onMouseEnter={() => setActiveTrendIndex(p.idx)}
                                onMouseLeave={() => setActiveTrendIndex(null)}
                              />
                              {/* X-axis date labels */}
                              <text
                                x={p.x}
                                y={chartHeight - 8}
                                textAnchor="middle"
                                className="text-[11px] font-barlow-condensed fill-[#7A6D5F] font-semibold select-none"
                              >
                                {p.pt.dateLabel}
                              </text>
                            </g>
                          );
                        })}

                        {/* Callout Tag on Hovered or Latest Point */}
                        {calloutPoint && (
                          <g
                            transform={`translate(${calloutPoint.x}, ${calloutPoint.y - 28})`}
                            className="pointer-events-none select-none transition-all duration-150"
                          >
                            {/* Callout pill body */}
                            <rect
                              x="-26"
                              y="-12"
                              width="52"
                              height="22"
                              rx="5"
                              fill="#D95B24"
                              filter="drop-shadow(0 1px 2px rgba(0,0,0,0.15))"
                            />
                            {/* Downward triangle pointer */}
                            <polygon points="-4,10 4,10 0,14" fill="#D95B24" />
                            {/* Callout percentage text */}
                            <text
                              x="0"
                              y="3"
                              textAnchor="middle"
                              className="fill-white font-bold text-[11px] font-mono"
                            >
                              {calloutPoint.pt.attendanceRate.toFixed(1)}%
                            </text>
                          </g>
                        )}
                      </svg>
                    </div>

                    {/* Chart Details summary */}
                    <div className="pt-2 flex items-center justify-between text-xs text-[#7A6D5F] border-t border-[#EAE0CF]/60 font-barlow-condensed font-medium">
                      <span>Hover data points to inspect session attendance records.</span>
                      <span className="font-bold text-[#132B32]">
                        {trendPoints.length} closed session{trendPoints.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-9 text-center text-xs text-[#7A6D5F] bg-[#F5EBD8]/40 rounded-xl border border-dashed border-[#E2D7C3]">
                    <CalendarIcon className="w-6 h-6 text-[#A89F91] mx-auto mb-1.5" />
                    <p className="font-semibold text-[#132B32]">No closed practice sessions recorded yet.</p>
                    <p className="mt-0.5 text-[#7A6D5F] text-[11px]">
                      Close practice sessions in Sessions to track historical attendance velocity.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 text-right border-t border-[#EAE0CF]">
              <Link
                href="/dashboard/coach/sessions"
                prefetch={true}
                className="inline-flex items-center gap-1 font-barlow-condensed font-bold text-xs sm:text-[13px] tracking-wide text-[#D95B24] hover:text-[#B84617] transition-colors"
              >
                <span>View All Sessions</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: SCOUTING READINESS DISTRIBUTION */}
          <div className="coach-animate-card bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#EAE0CF]">
                <div>
                  <h3 className="font-alfa text-lg sm:text-[20px] tracking-tight text-[#132B32]">
                    SCOUTING READINESS DISTRIBUTION
                  </h3>
                  <p className="text-xs text-[#665C52] mt-0.5 font-sans">
                    Qualification benchmark: Attendance ≥ 75.0% AND Finalized Matches ≥ 2.
                  </p>
                </div>
                <span className="font-barlow-condensed font-bold text-xs text-[#594B3C] bg-[#F1E6D3] border border-[#DACBB4] px-2.5 py-1 rounded-full whitespace-nowrap tracking-wide">
                  {totalEvaluatedPlayers} Active Athlete{totalEvaluatedPlayers === 1 ? "" : "s"}
                </span>
              </div>

              {/* Donut Chart & Legend */}
              <div className="py-4 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
                  {/* Circular Donut Ring with Center Fraction */}
                  <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      {/* Background circle track */}
                      <circle
                        cx="60"
                        cy="60"
                        r="46"
                        fill="none"
                        stroke="#EAE0CF"
                        strokeWidth="14"
                      />
                      {/* Developing arc (orange) */}
                      <circle
                        cx="60"
                        cy="60"
                        r="46"
                        fill="none"
                        stroke="#D95B24"
                        strokeWidth="14"
                        strokeDasharray={2 * Math.PI * 46}
                        strokeDashoffset={2 * Math.PI * 46 * (1 - (totalEvaluatedPlayers > 0 ? 1 : 0))}
                      />
                      {/* Ready arc (green) */}
                      {readyPercent > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          fill="none"
                          stroke="#1F5A38"
                          strokeWidth="14"
                          strokeDasharray={2 * Math.PI * 46}
                          strokeDashoffset={2 * Math.PI * 46 * (1 - readyPercent / 100)}
                        />
                      )}
                    </svg>

                    {/* Donut Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="font-alfa text-2xl text-[#132B32] leading-none">
                        {readyCount}/{totalEvaluatedPlayers}
                      </span>
                      <span className="font-barlow-condensed font-bold text-xs text-[#665C52] uppercase tracking-widest mt-1">
                        READY
                      </span>
                    </div>
                  </div>

                  {/* Donut Legend */}
                  <div className="flex-1 w-full space-y-2 text-xs font-barlow-condensed">
                    <div className="flex items-center justify-between text-xs sm:text-[13px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1F5A38]" />
                        <span className="font-semibold text-[#132B32]">Ready for Scouts ({readyCount})</span>
                      </div>
                      <span className="font-bold text-[#132B32]">{readyPercent}%</span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-[13px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#D95B24]" />
                        <span className="font-semibold text-[#132B32]">In Development ({developingCount})</span>
                      </div>
                      <span className="font-bold text-[#132B32]">{developingPercent}%</span>
                    </div>
                  </div>
                </div>

                {/* Sub-Criteria Completion Cards */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-[#F7EFE0] border border-[#E5D9C4]">
                    <span className="font-barlow-condensed text-[13px] sm:text-[14px] font-bold text-[#132B32] uppercase tracking-wider block">
                      ATTENDANCE CRITERION
                    </span>
                    <div className="text-2xl font-alfa text-[#1F5A38] mt-1">
                      {readinessStats?.meetingAttendanceCriterion ?? 0} / {totalEvaluatedPlayers}
                    </div>
                    <span className="font-barlow-condensed text-xs sm:text-[13px] text-[#665C52] font-medium block mt-0.5">
                      Met ≥ 75.0% session attendance
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F7EFE0] border border-[#E5D9C4]">
                    <span className="font-barlow-condensed text-[13px] sm:text-[14px] font-bold text-[#132B32] uppercase tracking-wider block">
                      MATCH CRITERION
                    </span>
                    <div className="text-2xl font-alfa text-[#132B32] mt-1">
                      {readinessStats?.meetingMatchCriterion ?? 0} / {totalEvaluatedPlayers}
                    </div>
                    <span className="font-barlow-condensed text-xs sm:text-[13px] text-[#665C52] font-medium block mt-0.5">
                      Participated in ≥ 2 matches
                    </span>
                  </div>
                </div>

                {/* Official Rule Note */}
                <div className="font-barlow-condensed text-xs text-[#665C52] leading-relaxed">
                  <strong>Rule:</strong> Athletes unlock scout visibility only upon satisfying both requirements simultaneously.
                </div>
              </div>
            </div>

            <div className="pt-3 text-right border-t border-[#EAE0CF]">
              <Link
                href="/dashboard/coach/readiness"
                prefetch={true}
                className="inline-flex items-center gap-1 font-barlow-condensed font-bold text-xs sm:text-[13px] tracking-wide text-[#D95B24] hover:text-[#B84617] transition-colors"
              >
                <span>View Scouting Board</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION D: RECENT ACADEMY ACTIVITY                        */}
      {/* ========================================================= */}
      <section aria-label="Recent Academy Activity" className="space-y-3">
        <h2 className="text-xl sm:text-[22px] font-alfa text-[#132B32] tracking-tight">
          RECENT ACADEMY ACTIVITY
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Card 1: RECENTLY ADDED PLAYERS */}
          <div className="coach-animate-card bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-start">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE0CF]">
              <h3 className="font-alfa text-sm sm:text-[15px] tracking-tight text-[#132B32]">
                RECENTLY ADDED PLAYERS
              </h3>
              <Link
                href="/dashboard/coach/players"
                prefetch={true}
                className="font-barlow-condensed font-bold text-xs sm:text-[13px] tracking-wide text-[#D95B24] hover:text-[#B84617] transition-colors"
              >
                View All Players &rarr;
              </Link>
            </div>

            <div className="pt-2 divide-y divide-[#EAE0CF]/60">
              {recentPlayers && recentPlayers.slice(0, 3).length > 0 ? (
                recentPlayers.slice(0, 3).map((player) => {
                  const initials = getInitials(player.fullName);
                  return (
                    <div key={player.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#EEDDC5] text-[#132B32] font-serif font-bold flex items-center justify-center text-xs shrink-0 border border-[#DACBB4]">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/coach/players/${player.id}`}
                            prefetch={true}
                            className="text-xs font-bold text-[#132B32] hover:text-[#D95B24] truncate block"
                          >
                            {player.fullName}
                          </Link>
                          <span className="text-[11px] font-barlow-condensed text-[#7A6D5F] font-medium">
                            {player.sportName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {player.status === "active" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-barlow-condensed font-bold bg-[#E5F4EB] text-[#1F5A38] border border-[#99C7AB]/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1F5A38]" />
                            <span>Active</span>
                          </span>
                        ) : player.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-barlow-condensed font-bold bg-[#FFF4DE] text-[#9A6700] border border-[#F0D08A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#9A6700]" />
                            <span>Pending</span>
                          </span>
                        ) : (
                          <Badge variant="default" size="sm">Archived</Badge>
                        )}
                        <Link
                          href={`/dashboard/coach/players/${player.id}`}
                          prefetch={true}
                          className="text-[#8C7F70] hover:text-[#132B32] p-1"
                          title="View Profile"
                        >
                          <ArrowRightIcon className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-[#7A6D5F]">
                  No players registered yet.
                </div>
              )}
            </div>
          </div>

          {/* Card 2: RECENT MATCH FIXTURES (Tightly Spaced, Natural Top Alignment) */}
          <div className="coach-animate-card bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-start">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE0CF]">
              <h3 className="font-alfa text-sm sm:text-[15px] tracking-tight text-[#132B32]">
                RECENT MATCH FIXTURES
              </h3>
              <Link
                href="/dashboard/coach/matches"
                prefetch={true}
                className="font-barlow-condensed font-bold text-xs sm:text-[13px] tracking-wide text-[#D95B24] hover:text-[#B84617] transition-colors"
              >
                View All Matches &rarr;
              </Link>
            </div>

            <div className="pt-2 divide-y divide-[#EAE0CF]/60">
              {recentMatches && recentMatches.slice(0, 2).length > 0 ? (
                recentMatches.slice(0, 2).map((match) => (
                  <div key={match.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/coach/matches/${match.id}`}
                          prefetch={true}
                          className="text-xs font-bold text-[#132B32] hover:text-[#D95B24] truncate"
                        >
                          {match.title || `vs. ${match.opponentName}`}
                        </Link>
                        <span className="text-[10px] font-barlow-condensed font-bold uppercase tracking-wider text-[#284457] bg-[#E3EAF0] border border-[#C5D5E2] px-2 py-0.5 rounded-full">
                          {match.sportName}
                        </span>
                      </div>
                      <div className="text-[11px] font-barlow-condensed font-medium text-[#7A6D5F] mt-0.5">
                        vs. {match.opponentName} • {formatDateOnly(match.matchDate)} • {match.participantCount} athletes
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {match.averageScore !== null ? (
                        <span className="font-alfa text-xs text-[#132B32] bg-[#F7EFE0] px-2.5 py-1 rounded-lg border border-[#DACBB4]">
                          {match.averageScore.toFixed(1)} / 10
                        </span>
                      ) : (
                        <Badge variant="warning" size="sm">Draft</Badge>
                      )}
                      <Link
                        href={`/dashboard/coach/matches/${match.id}`}
                        prefetch={true}
                        className="text-[#8C7F70] hover:text-[#132B32] p-1"
                        title="View match summary"
                      >
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-[#7A6D5F]">
                  No finalized matches recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION E: QUICK OPERATIONS (5 Distinct Actions)          */}
      {/* ========================================================= */}
      <section aria-label="Quick Actions" className="coach-animate-card">
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h3 className="font-alfa text-sm sm:text-[15px] text-[#132B32] tracking-wider uppercase">
                QUICK OPERATIONS
              </h3>
              <p className="text-xs text-[#7A6D5F] font-sans">
                Direct shortcuts to academy management workflows.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* 1. Add Player */}
              <Link href="/dashboard/coach/players/new" prefetch={true}>
                <Button
                  size="sm"
                  className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold text-sm h-9 px-4 rounded-xl shadow-xs gap-1.5 cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>+ Add Player</span>
                </Button>
              </Link>

              {/* 2. Create Session */}
              <Link href="/dashboard/coach/sessions/new" prefetch={true}>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-[#FFF9EF] hover:bg-[#F5EBD8] text-[#132B32] font-barlow-condensed font-bold text-sm h-9 px-3.5 border border-[#DACBB4] rounded-xl gap-1.5 cursor-pointer"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-[#132B32]" />
                  <span>Create Session</span>
                </Button>
              </Link>

              {/* 3. Schedule Match */}
              <Link href="/dashboard/coach/matches/new" prefetch={true}>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-[#FFF9EF] hover:bg-[#F5EBD8] text-[#132B32] font-barlow-condensed font-bold text-sm h-9 px-3.5 border border-[#DACBB4] rounded-xl gap-1.5 cursor-pointer"
                >
                  <SwordsIcon className="w-3.5 h-3.5 text-[#132B32]" />
                  <span>Schedule Match</span>
                </Button>
              </Link>

              {/* 4. Manage Scouts */}
              <Link href="/dashboard/coach/scouts" prefetch={true}>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-[#FFF9EF] hover:bg-[#F5EBD8] text-[#132B32] font-barlow-condensed font-bold text-sm h-9 px-3.5 border border-[#DACBB4] rounded-xl gap-1.5 cursor-pointer"
                >
                  <SearchIcon className="w-3.5 h-3.5 text-[#132B32]" />
                  <span>Manage Scouts</span>
                </Button>
              </Link>

              {/* 5. View Readiness */}
              <Link href="/dashboard/coach/readiness" prefetch={true}>
                <Button
                  size="sm"
                  className="bg-[#1B4D3E] hover:bg-[#143B30] text-white font-barlow-condensed font-bold text-sm h-9 px-4 rounded-xl shadow-xs gap-1.5 cursor-pointer"
                >
                  <ActivityIcon className="w-3.5 h-3.5 text-white" />
                  <span>View Readiness</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
