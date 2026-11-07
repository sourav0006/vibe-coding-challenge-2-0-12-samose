"use client";

import { useId, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarIcon,
  TrophyIcon,
  MessageSquareIcon,
  UserIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";
import { formatDateOnly, formatDateTime } from "@/lib/utils";
import type { PlayerDashboardOverviewDTO } from "@/lib/services";

export interface PlayerOverviewViewProps {
  overview: PlayerDashboardOverviewDTO;
}

/**
 * Reusable Vintage Scoreboard Card with Chamfered Corners, Alfa Slab One Numerals,
 * and Barlow Condensed Labels matching the Retro Sports Club design system.
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
      className="relative group flex flex-col items-center justify-center p-3 sm:p-3.5 min-h-[105px] transition-transform hover:-translate-y-0.5"
    >
      {/* Vintage chamfered plaque SVG background with cut corners */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-xs"
        preserveAspectRatio="none"
        viewBox="0 0 160 105"
      >
        <polygon
          points="10,2 150,2 158,10 158,95 150,103 10,103 2,95 2,10"
          fill="#132B32"
          stroke="#0D1E22"
          strokeWidth="1.5"
        />
        <polygon
          points="13,6 147,6 154,13 154,92 147,99 13,99 6,92 6,13"
          fill="none"
          stroke="#D5A64A"
          strokeWidth="1.2"
          strokeOpacity="0.85"
        />
      </svg>

      <div className="relative z-10 w-full flex flex-col items-center text-center px-1">
        <span className="font-alfa text-[22px] sm:text-[26px] md:text-[30px] text-[#FFF9EF] tracking-tight leading-none group-hover:text-[#D5A64A] transition-colors truncate max-w-full">
          {value}
        </span>
        <div className="w-4/5 h-px bg-[#D5A64A]/40 my-2" />
        <span className="font-barlow-condensed text-[12px] sm:text-[13px] font-bold text-[#E9DCC5] uppercase tracking-wider leading-tight">
          {label}
        </span>
      </div>
    </Link>
  );
}

export function PlayerOverviewView({ overview }: PlayerOverviewViewProps) {
  const { profile, attendance, matches, readiness, recentRemarks } = overview;
  const chartGradientId = useId();
  const [activeTrendIndex, setActiveTrendIndex] = useState<number | null>(null);

  // Formatted scoreboard values
  const attendanceRateFormatted =
    attendance.numericPercentage !== null
      ? `${attendance.numericPercentage.toFixed(1)}%`
      : attendance.attendancePercentage !== "N/A"
      ? attendance.attendancePercentage
      : "00.0%";

  const matchesPlayedFormatted = String(matches.finalizedMatchesPlayed).padStart(2, "0");

  const averageScoreFormatted =
    matches.averageScore !== null ? matches.averageScore.toFixed(1) : "—";

  const readinessStatusFormatted = readiness.status === "ready" ? "READY" : "DEVELOPING";

  // Build attendance trend points across applicable closed sessions
  const sortedSessions = [...(attendance.history || [])].sort(
    (a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
  );

  let presentCountSoFar = 0;
  const trendPoints = sortedSessions.map((session, idx) => {
    if (session.status === "present") presentCountSoFar++;
    const rate = Number(((presentCountSoFar / (idx + 1)) * 100).toFixed(1));
    return {
      sessionDate: formatDateOnly(session.sessionDate),
      rate,
      status: session.status,
    };
  });

  // Chart geometry
  const chartWidth = 520;
  const chartHeight = 170;
  const paddingX = 40;
  const paddingY = 24;

  const points = trendPoints.map((pt, idx) => {
    const x =
      trendPoints.length === 1
        ? chartWidth / 2
        : paddingX + (idx / (trendPoints.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (pt.rate / 100) * (chartHeight - paddingY * 2);
    return { x, y, pt, idx };
  });

  const linePath =
    points.length > 0
      ? points.reduce(
          (acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
          ""
        )
      : "";

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${
          points[0].x
        } ${chartHeight - paddingY} Z`
      : "";

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================= */}
      {/* SECTION A: BOLD COLLEGIATE WELCOME HERO & PLAYER CHARACTER */}
      {/* ========================================================= */}
      <section
        aria-label="Welcome Header"
        className="relative overflow-visible pt-4 pb-2"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          {/* Left: Two-Line Collegiate Heading & Athletic Ribbon */}
          <div className="space-y-3 z-10 max-w-xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[48px] font-alfa text-[#132B32] uppercase tracking-tight leading-[1.05]">
              <span className="block">WELCOME BACK,</span>
              <span className="block text-[#132B32]">{profile.fullName}!</span>
            </h1>

            {/* Vintage Ribbon Banner with Swallowtail Cuts */}
            <div className="relative inline-flex items-center h-7 sm:h-8 select-none">
              <svg
                viewBox="0 0 240 32"
                className="h-7 sm:h-8 w-auto text-[#3D2619] drop-shadow-xs"
                fill="currentColor"
                preserveAspectRatio="none"
              >
                <path d="M14,0 L226,0 L240,16 L226,32 L14,32 L0,16 Z" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-barlow-condensed font-bold text-[#D5A64A] text-xs sm:text-[13px] tracking-[0.22em] uppercase px-5">
                {profile.sportName.toUpperCase()} &bull; AGE {profile.age}
              </span>
            </div>
          </div>

          {/* Right: Retro Sunset Semicircle Graphic Behind Sized Player Character */}
          <div className="relative shrink-0 flex items-end justify-center self-center sm:self-end">
            {/* Concentric Striped Retro Sunset Arch */}
            <div className="relative w-52 sm:w-64 md:w-76 lg:w-84 h-28 sm:h-34 md:h-40 lg:h-44 flex items-end justify-center overflow-hidden">
              <svg
                viewBox="0 0 280 145"
                className="w-full h-auto drop-shadow-xs"
                fill="none"
              >
                <defs>
                  <clipPath id="playerSunsetArch">
                    <path d="M 10 145 A 130 130 0 0 1 270 145 Z" />
                  </clipPath>
                </defs>
                <g clipPath="url(#playerSunsetArch)">
                  <rect x="0" y="8" width="280" height="20" fill="#E26B39" />
                  <rect x="0" y="31" width="280" height="20" fill="#E87D4B" />
                  <rect x="0" y="54" width="280" height="20" fill="#EE905E" />
                  <rect x="0" y="77" width="280" height="20" fill="#F3A372" />
                  <rect x="0" y="100" width="280" height="20" fill="#F7B788" />
                  <rect x="0" y="123" width="280" height="25" fill="#FBCB9F" />
                </g>
              </svg>
            </div>

            {/* Player Character Foreground Image - Waist-Up Crop with Volleyball */}
            <div className="absolute bottom-0 w-36 sm:w-48 md:w-56 lg:w-64 h-32 sm:h-42 md:h-50 lg:h-56 overflow-hidden flex items-start justify-center pointer-events-none select-none z-10">
              <Image
                src="/images/player-character.png"
                alt="One Academy Athlete"
                width={1254}
                height={1254}
                priority
                className="w-[215%] h-[215%] max-w-none shrink-0 object-contain object-top drop-shadow-md -top-1 sm:-top-2 relative"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION B: 4 PROMINENT SCOREBOARD METRIC CARDS            */}
      {/* ========================================================= */}
      <section
        aria-label="Player Performance Scoreboard"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <ScoreboardCard
          label="Attendance"
          value={attendanceRateFormatted}
          href="/dashboard/player/attendance"
        />
        <ScoreboardCard
          label="Matches Played"
          value={matchesPlayedFormatted}
          href="/dashboard/player/matches"
        />
        <ScoreboardCard
          label="Average Score"
          value={averageScoreFormatted}
          href="/dashboard/player/matches"
        />
        <ScoreboardCard
          label="Scouting Readiness"
          value={readinessStatusFormatted}
          href="/dashboard/player"
        />
      </section>

      {/* ========================================================= */}
      {/* SECTION C: 3-COLUMN EDITORIAL ANALYTICS SECTION           */}
      {/* ========================================================= */}
      <section
        aria-label="Athletic Analytics"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {/* Card 1: Attendance Progress */}
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="font-alfa text-base sm:text-lg text-[#132B32] uppercase tracking-tight">
                Attendance Progress
              </h2>
              <span className="bg-[#E2F2E7] text-[#1F382B] border border-[#A6D5B4] font-barlow-condensed font-bold text-xs uppercase px-2 py-0.5 rounded">
                75% Benchmark
              </span>
            </div>
            <p className="text-xs text-[#5D6B6E] mb-3">
              Your practice session attendance across closed sessions.
            </p>

            {/* Interactive Line Chart */}
            <div className="relative bg-[#FAF5EC] rounded-lg border border-[#E8DEC9] p-2 overflow-hidden">
              {trendPoints.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-xs text-[#718E94]">
                  No closed sessions recorded yet.
                </div>
              ) : (
                <div className="relative">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-auto overflow-visible select-none"
                  >
                    <defs>
                      <linearGradient id={chartGradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D95B24" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#D95B24" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    {[100, 75, 50, 25, 0].map((val) => {
                      const y =
                        chartHeight - paddingY - (val / 100) * (chartHeight - paddingY * 2);
                      const isBenchmark = val === 75;
                      return (
                        <g key={val}>
                          <line
                            x1={paddingX}
                            y1={y}
                            x2={chartWidth - paddingX}
                            y2={y}
                            stroke={isBenchmark ? "#1F382B" : "#E2D7C3"}
                            strokeDasharray={isBenchmark ? "4 4" : undefined}
                            strokeWidth={isBenchmark ? 1.5 : 1}
                            strokeOpacity={isBenchmark ? 0.8 : 0.6}
                          />
                          <text
                            x={paddingX - 8}
                            y={y + 3}
                            textAnchor="end"
                            className="font-barlow-condensed text-[11px] font-semibold fill-[#718E94]"
                          >
                            {val}%
                          </text>
                        </g>
                      );
                    })}

                    {/* Shaded Area under Curve */}
                    {areaPath && <path d={areaPath} fill={`url(#${chartGradientId})`} />}

                    {/* Main Trend Line */}
                    {linePath && (
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#D95B24"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Data Points */}
                    {points.map((pt) => (
                      <g
                        key={pt.idx}
                        className="cursor-pointer"
                        onMouseEnter={() => setActiveTrendIndex(pt.idx)}
                        onMouseLeave={() => setActiveTrendIndex(null)}
                      >
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={activeTrendIndex === pt.idx ? 6 : 4}
                          fill="#D95B24"
                          stroke="#FFFDF8"
                          strokeWidth="2"
                          className="transition-all"
                        />
                      </g>
                    ))}

                    {/* Current latest point pill badge */}
                    {points.length > 0 && (
                      <g>
                        <rect
                          x={points[points.length - 1].x - 22}
                          y={points[points.length - 1].y - 24}
                          width="44"
                          height="18"
                          rx="4"
                          fill="#D95B24"
                        />
                        <text
                          x={points[points.length - 1].x}
                          y={points[points.length - 1].y - 11}
                          textAnchor="middle"
                          className="font-barlow-condensed text-[11px] font-bold fill-white"
                        >
                          {attendanceRateFormatted}
                        </text>
                      </g>
                    )}

                    {/* X-axis date labels */}
                    {points.map((pt, idx) => {
                      if (
                        points.length <= 4 ||
                        idx === 0 ||
                        idx === points.length - 1 ||
                        idx === Math.floor(points.length / 2)
                      ) {
                        return (
                          <text
                            key={idx}
                            x={pt.x}
                            y={chartHeight - 6}
                            textAnchor="middle"
                            className="font-barlow-condensed text-[11px] font-semibold fill-[#718E94]"
                          >
                            {pt.pt.sessionDate}
                          </text>
                        );
                      }
                      return null;
                    })}
                  </svg>
                </div>
              )}
            </div>

            {/* Attendance breakdown counters */}
            <div className="flex items-center justify-between text-[11px] font-medium text-[#5D6B6E] mt-3 pt-2.5 border-t border-[#EBE1D0]">
              <span>
                Present Sessions:{" "}
                <strong className="text-[#132B32]">{attendance.presentSessions}</strong>
              </span>
              <span>
                Absent Sessions:{" "}
                <strong className="text-[#132B32]">{attendance.absentSessions}</strong>
              </span>
              <span>
                Closed Sessions:{" "}
                <strong className="text-[#132B32]">
                  {attendance.totalApplicableClosedSessions}
                </strong>
              </span>
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-[#EBE1D0]">
            <Link
              href="/dashboard/player/attendance"
              className="inline-flex items-center gap-1.5 font-barlow-condensed text-xs font-bold text-[#D95B24] hover:underline uppercase tracking-wider"
            >
              <span>View Attendance History</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: Match Performance */}
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <h2 className="font-alfa text-base sm:text-lg text-[#132B32] uppercase tracking-tight mb-1">
              Match Performance
            </h2>
            <p className="text-xs text-[#5D6B6E] mb-4">
              Your individual performance in finalized matches.
            </p>

            {/* Performance Plaque & Stat Stack */}
            <div className="flex items-stretch gap-4">
              {/* Left Scoreboard Mini-Plaque */}
              <div className="bg-[#132B32] border border-[#D5A64A]/80 rounded-lg p-3 text-center min-w-[115px] flex flex-col items-center justify-center shadow-xs">
                <span className="font-alfa text-2xl text-[#FFF9EF] tracking-tight">
                  {matches.averageScore !== null ? `${matches.averageScore.toFixed(1)}` : "—"}
                </span>
                <span className="text-[11px] text-[#A2BAC0]">/ 10</span>
                <div className="w-4/5 h-px bg-[#D5A64A]/40 my-1.5" />
                <span className="font-barlow-condensed text-[11px] font-bold text-[#E9DCC5] uppercase tracking-wider">
                  Average Score
                </span>
              </div>

              {/* Right Statistics Box */}
              <div className="bg-[#FAF5EC] border border-[#E8DEC9] rounded-lg p-3 flex-1 flex flex-col justify-around text-xs">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-[#5D6B6E]">Top Score</span>
                  <span className="font-bold text-[#132B32]">
                    {matches.highestScore !== null ? `${matches.highestScore.toFixed(1)} / 10` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5 border-t border-[#EBE1D0]">
                  <span className="text-[#5D6B6E]">Matches Played</span>
                  <span className="font-bold text-[#132B32]">
                    {matches.finalizedMatchesPlayed}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5 border-t border-[#EBE1D0]">
                  <span className="text-[#5D6B6E]">Lowest Score</span>
                  <span className="font-bold text-[#132B32]">
                    {matches.lowestScore !== null ? `${matches.lowestScore.toFixed(1)} / 10` : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-[#EBE1D0]">
            <Link
              href="/dashboard/player/matches"
              className="inline-flex items-center gap-1.5 font-barlow-condensed text-xs font-bold text-[#D95B24] hover:underline uppercase tracking-wider"
            >
              <span>View Match History</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 3: Scouting Readiness */}
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <h2 className="font-alfa text-base sm:text-lg text-[#132B32] uppercase tracking-tight mb-1">
              Scouting Readiness
            </h2>
            <p className="text-[11px] text-[#5D6B6E] mb-3">
              Qualification benchmark: Attendance &ge; 75.0% AND Finalized Matches &ge; 2.
            </p>

            {/* Donut & Benchmark Checklist */}
            <div className="flex items-center gap-4 mb-3">
              {/* Donut Circle */}
              <div className="relative w-22 h-22 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background track */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="#EBE1D0"
                    strokeWidth="3.5"
                  />
                  {/* Active gauge ring */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke={readiness.status === "ready" ? "#1F382B" : "#D95B24"}
                    strokeWidth="3.5"
                    strokeDasharray="94.2"
                    strokeDashoffset={
                      readiness.status === "ready"
                        ? "0"
                        : readiness.attendanceCriterionMet || readiness.matchCriterionMet
                        ? "47.1"
                        : "75"
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
                  <span className="font-alfa text-[9px] uppercase tracking-tight text-[#132B32] leading-tight">
                    {readiness.status === "ready" ? "READY" : "IN DEV"}
                  </span>
                </div>
              </div>

              {/* Status Points */}
              <div className="flex-1 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        readiness.attendanceCriterionMet ? "bg-[#4ADE80]" : "bg-[#D95B24]"
                      }`}
                    />
                    <span className="text-[#132B32] font-medium text-[11px]">
                      Attendance &ge; 75.0%
                    </span>
                  </div>
                  <span className="font-bold text-[#132B32] text-[11px]">
                    {attendance.attendancePercentage}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        readiness.matchCriterionMet ? "bg-[#4ADE80]" : "bg-[#D95B24]"
                      }`}
                    />
                    <span className="text-[#132B32] font-medium text-[11px]">
                      Finalized Matches &ge; 2
                    </span>
                  </div>
                  <span className="font-bold text-[#132B32] text-[11px]">
                    {matches.finalizedMatchesPlayed} / 2
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom 2 Criteria Boxes */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#FAF5EC] border border-[#E8DEC9] rounded-lg p-2.5">
                <span className="font-barlow-condensed font-bold uppercase text-[10px] text-[#718E94] block">
                  Attendance Criterion
                </span>
                <span className="font-alfa text-sm text-[#132B32] block mt-0.5">
                  {attendance.presentSessions} / {attendance.totalApplicableClosedSessions}
                </span>
                <span className="text-[10px] text-[#5D6B6E] block mt-0.5">
                  {readiness.attendanceCriterionMet ? "Met \u2265 75.0% session attendance" : "Below 75.0% threshold"}
                </span>
              </div>

              <div className="bg-[#FAF5EC] border border-[#E8DEC9] rounded-lg p-2.5">
                <span className="font-barlow-condensed font-bold uppercase text-[10px] text-[#718E94] block">
                  Match Criterion
                </span>
                <span className="font-alfa text-sm text-[#132B32] block mt-0.5">
                  {matches.finalizedMatchesPlayed} / 2
                </span>
                <span className="text-[10px] text-[#5D6B6E] block mt-0.5">
                  {readiness.matchCriterionMet ? "Participated in \u2265 2 matches" : "Requires 2 matches"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-[#EBE1D0]">
            <span className="text-[11px] text-[#718E94]">
              {readiness.status === "ready"
                ? "Your profile is verified and visible to external scouts."
                : "Satisfy both benchmarks to unlock scout visibility."}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION D: RECENT ACTIVITY (MATCH & COACH FEEDBACK)       */}
      {/* ========================================================= */}
      <section
        aria-label="Recent Activity"
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {/* Card 1: Recent Match */}
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-alfa text-base sm:text-lg text-[#132B32] uppercase tracking-tight">
                Recent Match
              </h2>
              <Link
                href="/dashboard/player/matches"
                className="font-barlow-condensed text-xs font-bold text-[#D95B24] hover:underline uppercase tracking-wider inline-flex items-center gap-1"
              >
                <span>View All Matches</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            {matches.recentMatch ? (
              <div className="flex items-center justify-between gap-3 p-3 bg-[#FAF5EC] border border-[#E8DEC9] rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Volleyball/Sports Icon in round gold badge */}
                  <div className="w-9 h-9 rounded-full bg-[#F3E8D2] border border-[#D5A64A] text-[#132B32] flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-[#B8892E]"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                    >
                      <circle cx="12" cy="12" r="9" stroke="currentColor" />
                      <path d="M12 3a9 9 0 019 9M3 12a9 9 0 019 9M7.5 7.5a9 9 0 019 9" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-[#132B32] text-sm block truncate">
                      vs. {matches.recentMatch.opponentName}
                    </span>
                    <span className="text-xs text-[#5D6B6E] block">
                      {formatDateOnly(matches.recentMatch.matchDate)} &bull;{" "}
                      {matches.recentMatch.sportName}
                    </span>
                  </div>
                </div>

                <div className="bg-[#E2F2E7] text-[#1F382B] font-alfa text-sm px-2.5 py-1 rounded-md border border-[#A6D5B4] shrink-0">
                  {matches.recentMatch.score.toFixed(1)} / 10
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#718E94] bg-[#FAF5EC] rounded-lg border border-dashed border-[#E2D7C3]">
                No finalized match records on file yet.
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Recent Coach Feedback */}
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-alfa text-base sm:text-lg text-[#132B32] uppercase tracking-tight">
                Recent Coach Feedback
              </h2>
              <Link
                href="/dashboard/player/remarks"
                className="font-barlow-condensed text-xs font-bold text-[#D95B24] hover:underline uppercase tracking-wider inline-flex items-center gap-1"
              >
                <span>View All Feedback</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentRemarks.length > 0 ? (
              <div className="p-3.5 bg-[#FAF5EC] border border-[#E8DEC9] rounded-lg space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-[#D5A64A] font-serif text-3xl leading-none select-none">
                    &ldquo;
                  </span>
                  <p className="text-xs sm:text-sm text-[#132B32] italic leading-relaxed pt-1">
                    {recentRemarks[0].content}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#EBE1D0] text-[11px] text-[#718E94]">
                  Recorded on {formatDateTime(recentRemarks[0].createdAt)}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#718E94] bg-[#FAF5EC] rounded-lg border border-dashed border-[#E2D7C3]">
                No coach remarks recorded yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION E: QUICK OPERATIONS STRIP                         */}
      {/* ========================================================= */}
      <section
        aria-label="Quick Operations"
        className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-4 sm:p-5 shadow-xs"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="font-alfa text-base sm:text-lg text-[#132B32] uppercase tracking-tight">
              Quick Operations
            </h2>
            <p className="text-xs text-[#5D6B6E] mt-0.5">
              Important actions and shortcuts for your training journey.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard/player/attendance"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FAF5EC] hover:bg-[#F3E8D2] text-[#132B32] border border-[#E2D7C3] text-xs font-bold font-barlow-condensed uppercase tracking-wider transition-colors"
            >
              <CalendarIcon className="w-4 h-4 text-[#D95B24]" />
              <span>View Attendance</span>
            </Link>

            <Link
              href="/dashboard/player/matches"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FAF5EC] hover:bg-[#F3E8D2] text-[#132B32] border border-[#E2D7C3] text-xs font-bold font-barlow-condensed uppercase tracking-wider transition-colors"
            >
              <TrophyIcon className="w-4 h-4 text-[#D95B24]" />
              <span>View Match History</span>
            </Link>

            <Link
              href="/dashboard/player/remarks"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FAF5EC] hover:bg-[#F3E8D2] text-[#132B32] border border-[#E2D7C3] text-xs font-bold font-barlow-condensed uppercase tracking-wider transition-colors"
            >
              <MessageSquareIcon className="w-4 h-4 text-[#D95B24]" />
              <span>View Coach Feedback</span>
            </Link>

            {/* STRICTLY LAST ITEM: My Profile in forest-green */}
            <Link
              href="/dashboard/player/profile"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1F382B] hover:bg-[#162920] text-[#FFF9EF] border border-[#2E543E] text-xs font-bold font-barlow-condensed uppercase tracking-wider transition-colors"
            >
              <UserIcon className="w-4 h-4 text-[#4ADE80]" />
              <span>My Profile</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
