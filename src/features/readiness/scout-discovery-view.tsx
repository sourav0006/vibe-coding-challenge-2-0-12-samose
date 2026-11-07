"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  UsersIcon,
  SearchIcon,
  StarIcon,
  TargetIcon,
  TrendingUpIcon,
  ArrowRightIcon,
  TrophyIcon,
} from "@/components/ui/icons";
import type { SafeScoutPlayerDTO } from "@/lib/services";

export interface ScoutDiscoveryViewProps {
  initialPlayers: SafeScoutPlayerDTO[];
  initialTotalReadyCount: number;
  initialAvailableSports: Array<{ id: string; name: string; count: number }>;
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
 * and Barlow Condensed Labels matching the Retro Sports Club design system.
 * Zero icons are displayed before numbers or text per Part 3 requirements.
 */
function ScoreboardCard({
  label,
  value,
  sublabel,
  href,
  isStatusCard,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  href?: string;
  isStatusCard?: boolean;
}) {
  const content = (
    <div className="relative group flex flex-col items-center justify-center p-3 sm:p-3.5 min-h-[105px] transition-transform hover:-translate-y-0.5">
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

      <div className="relative z-10 w-full flex flex-col items-center text-center px-2">
        {isStatusCard ? (
          <span className="font-alfa text-xs sm:text-sm md:text-base lg:text-[15px] text-[#FFF9EF] tracking-normal leading-tight group-hover:text-[#D5A64A] transition-colors truncate max-w-full">
            {value}
          </span>
        ) : (
          <span className="font-alfa text-[26px] sm:text-[30px] md:text-[34px] text-[#FFF9EF] tracking-tight leading-none group-hover:text-[#D5A64A] transition-colors truncate max-w-full">
            {value}
          </span>
        )}
        <div className="w-4/5 h-px bg-[#D5A64A]/40 my-2" />
        <span className="font-barlow-condensed text-[12px] sm:text-[13px] font-bold text-[#E9DCC5] uppercase tracking-wider leading-tight">
          {label}
        </span>
        {sublabel && (
          <span className="text-[10px] text-[#A2BAC0] font-medium mt-0.5 tracking-wider uppercase font-barlow-condensed">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

export function ScoutDiscoveryView({
  initialPlayers,
  initialTotalReadyCount,
  initialAvailableSports,
}: ScoutDiscoveryViewProps) {
  const players = initialPlayers;
  const totalReadyCount = initialTotalReadyCount;
  const availableSports = initialAvailableSports;

  // Determine top rated ready athlete
  const topRatedAthlete = useMemo(() => {
    if (players.length === 0) return null;
    const sorted = [...players].sort((a, b) => {
      const scoreA = a.averageIndividualScore ?? 0;
      const scoreB = b.averageIndividualScore ?? 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.finalizedMatchesPlayed - a.finalizedMatchesPlayed;
    });
    return sorted[0];
  }, [players]);

  // Featured athlete is the top rated player
  const featuredTalent = topRatedAthlete;

  // Maximum ready athlete count among sports for proportional progress bars
  const maxSportCount = useMemo(() => {
    if (availableSports.length === 0) return 1;
    return Math.max(...availableSports.map((s) => s.count), 1);
  }, [availableSports]);

  // Dominant sport with the most ready talent
  const dominantSport = useMemo(() => {
    if (availableSports.length === 0) return null;
    return [...availableSports].sort((a, b) => b.count - a.count)[0];
  }, [availableSports]);

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================= */}
      {/* SECTION A: BOLD COLLEGIATE WELCOME HERO & SCOUT CHARACTER */}
      {/* ========================================================= */}
      <section
        aria-label="Welcome Header"
        className="relative overflow-visible pt-0 pb-2 -mt-1 sm:-mt-2 lg:-mt-3"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-6">
          {/* Left: Two-Line Collegiate Headline & Athletic Ribbon vertically centered in hero area */}
          <div className="space-y-3 z-10 max-w-xl self-start sm:self-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[48px] font-alfa text-[#132B32] uppercase tracking-tight leading-[1.05]">
              <span className="block">DISCOVER THE NEXT</span>
              <span className="block text-[#132B32]">GENERATION</span>
            </h1>

            {/* Vintage Ribbon Banner with Swallowtail Cuts - single-line without clipping */}
            <div className="relative inline-flex items-center justify-center select-none h-7 sm:h-8 px-6 sm:px-8 w-fit max-w-full">
              <svg
                viewBox="0 0 280 32"
                className="absolute inset-0 w-full h-full text-[#3D2619] drop-shadow-xs"
                fill="currentColor"
                preserveAspectRatio="none"
              >
                <path d="M14,0 L266,0 L280,16 L266,32 L14,32 L0,16 Z" />
              </svg>
              <span className="relative z-10 font-barlow-condensed font-bold text-[#D5A64A] text-xs sm:text-[13px] tracking-[0.16em] uppercase whitespace-nowrap">
                TALENT SCOUTING • ONE ACADEMY
              </span>
            </div>
          </div>

          {/* Right: Retro Sunset Semicircle Graphic Behind Sized Scout Character */}
          <div className="relative shrink-0 flex items-start justify-center self-center sm:self-start h-44 sm:h-52 md:h-56 lg:h-64">
            {/* Concentric Striped Retro Sunset Arch */}
            <div className="relative w-56 sm:w-64 md:w-72 lg:w-80 h-28 sm:h-32 md:h-36 lg:h-40 flex items-end justify-center overflow-hidden mt-8 sm:mt-10 md:mt-12 lg:mt-14">
              <svg
                viewBox="0 0 280 145"
                className="w-full h-auto drop-shadow-xs"
                fill="none"
              >
                <defs>
                  <clipPath id="scoutSunsetArch">
                    <path d="M 10 145 A 130 130 0 0 1 270 145 Z" />
                  </clipPath>
                </defs>
                <g clipPath="url(#scoutSunsetArch)">
                  <rect x="0" y="8" width="280" height="20" fill="#E26B39" />
                  <rect x="0" y="31" width="280" height="20" fill="#E87D4B" />
                  <rect x="0" y="54" width="280" height="20" fill="#EE905E" />
                  <rect x="0" y="77" width="280" height="20" fill="#F3A372" />
                  <rect x="0" y="100" width="280" height="20" fill="#F7B788" />
                  <rect x="0" y="123" width="280" height="25" fill="#FBCB9F" />
                </g>
              </svg>
            </div>

            {/* Scout Character Foreground Image - Fully Visible with Binoculars, Hands, Shoulders and Torso */}
            <div className="absolute top-0 w-44 sm:w-52 md:w-56 lg:w-64 h-44 sm:h-52 md:h-56 lg:h-64 flex items-start justify-center pointer-events-none select-none z-10">
              <Image
                src="/images/scout-character.png"
                alt="One Academy Scout"
                fill
                sizes="(max-width: 640px) 176px, (max-width: 768px) 208px, (max-width: 1024px) 224px, 256px"
                priority
                className="object-contain object-top drop-shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION B: 4 PROMINENT SCOREBOARD METRIC CARDS (NO ICONS) */}
      {/* ========================================================= */}
      <section
        aria-label="Scouting Performance Scoreboard"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <ScoreboardCard
          label="READY ATHLETES"
          value={String(totalReadyCount).padStart(2, "0")}
          href="/dashboard/scout/discover"
        />
        <ScoreboardCard
          label="AVAILABLE SPORTS"
          value={String(availableSports.length).padStart(2, "0")}
          href="/dashboard/scout/discover"
        />
        <ScoreboardCard
          label="TOP RATED ATHLETE"
          value={
            topRatedAthlete?.averageIndividualScore !== null &&
            topRatedAthlete?.averageIndividualScore !== undefined
              ? topRatedAthlete.averageIndividualScore.toFixed(1)
              : "—"
          }
          href={topRatedAthlete ? `/dashboard/scout/players/${topRatedAthlete.id}` : "/dashboard/scout/discover"}
        />
        <ScoreboardCard
          label="SCOUTING READY"
          value="SCOUTING READY"
          sublabel="HIGH POTENTIAL TALENT"
          isStatusCard
          href="/dashboard/scout/discover"
        />
      </section>

      {/* ========================================================= */}
      {/* SECTION C: 2-COLUMN MAIN CONTENT (FEATURED & SPORTS)      */}
      {/* ========================================================= */}
      <section
        aria-label="Talent Discovery Highlights"
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        {/* Left Panel: Featured Talent */}
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-alfa text-base sm:text-lg text-[#132B32] uppercase tracking-tight">
                Featured Talent
              </h2>
              <Link
                href="/dashboard/scout/discover"
                className="font-barlow-condensed text-xs font-bold text-[#D95B24] hover:underline uppercase tracking-wider inline-flex items-center gap-1"
              >
                <span>View All Talents</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            {featuredTalent ? (
              <div className="p-4 bg-[#FAF5EC] border border-[#E8DEC9] rounded-xl space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Athlete Initials Card Box */}
                    <div className="relative w-14 h-14 rounded-lg bg-[#132B32] border border-[#D5A64A] text-[#FFF9EF] font-alfa text-lg flex items-center justify-center shrink-0 shadow-xs">
                      <span>{getInitials(featuredTalent.fullName)}</span>
                      <span className="absolute -top-2 -right-2 bg-[#D95B24] text-white text-[9px] font-bold font-barlow-condensed uppercase px-1.5 py-0.5 rounded shadow-xs">
                        Top Rated
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-[#132B32] text-base truncate">
                        {featuredTalent.fullName}
                      </h3>
                      <p className="text-xs text-[#5D6B6E]">
                        {featuredTalent.sportName} &bull; Age {featuredTalent.age}
                      </p>
                    </div>
                  </div>

                  {/* Profile Link Button */}
                  <Link
                    href={`/dashboard/scout/players/${featuredTalent.id}`}
                    aria-label={`View scouting profile for ${featuredTalent.fullName}`}
                    className="w-9 h-9 rounded-full bg-[#FFFDF8] hover:bg-[#F3E8D2] border border-[#E2D7C3] text-[#132B32] flex items-center justify-center transition-colors shrink-0 shadow-2xs"
                  >
                    <ArrowRightIcon className="w-4 h-4 text-[#D95B24]" />
                  </Link>
                </div>

                {/* 3 Metrics Row */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-[#FFFDF8] border border-[#EBE1D0] rounded-lg text-center">
                  <div>
                    <span className="font-alfa text-xl text-[#132B32] block">
                      {featuredTalent.averageIndividualScore !== null
                        ? featuredTalent.averageIndividualScore.toFixed(1)
                        : "—"}
                    </span>
                    <span className="font-barlow-condensed font-bold uppercase text-[10px] text-[#718E94] tracking-wider block mt-0.5">
                      Avg Score
                    </span>
                  </div>

                  <div>
                    <span className="font-alfa text-xl text-[#132B32] block">
                      {featuredTalent.finalizedMatchesPlayed}
                    </span>
                    <span className="font-barlow-condensed font-bold uppercase text-[10px] text-[#718E94] tracking-wider block mt-0.5">
                      Matches
                    </span>
                  </div>

                  <div>
                    <span className="font-alfa text-xl text-[#132B32] block">
                      {featuredTalent.attendancePercentage}
                    </span>
                    <span className="font-barlow-condensed font-bold uppercase text-[10px] text-[#718E94] tracking-wider block mt-0.5">
                      Attendance
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E2F2E7] text-[#1F382B] border border-[#A6D5B4]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                    <span>Scout Ready</span>
                  </span>
                  <Link
                    href={`/dashboard/scout/players/${featuredTalent.id}`}
                    className="font-barlow-condensed text-xs font-bold text-[#D95B24] hover:underline uppercase tracking-wider"
                  >
                    View Official Profile &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-[#718E94] bg-[#FAF5EC] rounded-lg border border-dashed border-[#E2D7C3]">
                <p className="font-bold text-[#132B32] text-sm">No ready athletes on file</p>
                <p className="mt-1">
                  Athletes will appear once they achieve &ge; 75.0% attendance and participate in &ge; 2 finalized fixtures.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Talent Discovery by Sport */}
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-alfa text-base sm:text-lg text-[#132B32] uppercase tracking-tight">
                Talent Discovery by Sport
              </h2>
              <Link
                href="/dashboard/scout/discover"
                className="font-barlow-condensed text-xs font-bold text-[#D95B24] hover:underline uppercase tracking-wider inline-flex items-center gap-1"
              >
                <span>View All Sports</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            {availableSports.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#718E94] bg-[#FAF5EC] rounded-lg border border-dashed border-[#E2D7C3]">
                <p className="font-bold text-[#132B32] text-sm">No sports with available talent</p>
                <p className="mt-1">
                  Disciplines will list here once athletes satisfy scouting readiness criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {availableSports.slice(0, 6).map((sport) => {
                  const pct = Math.min(100, Math.max(15, Math.round((sport.count / maxSportCount) * 100)));
                  return (
                    <Link
                      key={sport.id}
                      href={`/dashboard/scout/discover/${sport.id}`}
                      className="p-3 bg-[#FAF5EC] hover:bg-[#F3E8D2] border border-[#E8DEC9] rounded-xl text-center flex flex-col items-center justify-between transition-colors cursor-pointer group hover:-translate-y-0.5"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#FFFDF8] border border-[#E2D7C3] text-[#132B32] flex items-center justify-center mb-2 shadow-2xs group-hover:border-[#D5A64A]">
                        <TrophyIcon className="w-4 h-4 text-[#D95B24]" />
                      </div>
                      <span className="font-bold text-xs text-[#132B32] truncate max-w-full">
                        {sport.name}
                      </span>
                      <span className="font-barlow-condensed font-bold uppercase text-[11px] text-[#718E94] mt-0.5">
                        {sport.count} {sport.count === 1 ? "Athlete" : "Athletes"}
                      </span>
                      {/* Horizontal progress bar */}
                      <div className="w-full h-1.5 bg-[#EBE1D0] rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-[#D95B24] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION D: LOWER 2-COLUMN SECTION (TALENT & INSIGHTS)     */}
      {/* ========================================================= */}
      <section
        aria-label="Scouting Activity and Insights"
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        {/* Left Panel: Recently Added Talent */}
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-alfa text-base sm:text-lg text-[#132B32] uppercase tracking-tight">
                Recently Added Talent
              </h2>
              <Link
                href="/dashboard/scout/discover"
                className="font-barlow-condensed text-xs font-bold text-[#D95B24] hover:underline uppercase tracking-wider inline-flex items-center gap-1"
              >
                <span>View All Talents</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            {players.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#718E94] bg-[#FAF5EC] rounded-lg border border-dashed border-[#E2D7C3]">
                No verified ready athletes currently in roster.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF5EC] font-barlow-condensed font-bold uppercase tracking-wider text-[11px] text-[#132B32] border-b border-[#E2D7C3]">
                    <tr>
                      <th scope="col" className="px-3 py-2.5">Athlete</th>
                      <th scope="col" className="px-3 py-2.5">Sport</th>
                      <th scope="col" className="px-3 py-2.5 text-center">Score</th>
                      <th scope="col" className="px-3 py-2.5 text-center">Status</th>
                      <th scope="col" className="px-3 py-2.5 text-right">Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE1D0]">
                    {players.slice(0, 4).map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF5EC]/70 transition-colors">
                        <td className="px-3 py-2.5 font-bold text-[#132B32] whitespace-nowrap">
                          {p.fullName}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF5EC] border border-[#E8DEC9] text-[#132B32]">
                            {p.sportName}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <span className="font-alfa text-xs text-[#132B32]">
                            {p.averageIndividualScore !== null
                              ? `${p.averageIndividualScore.toFixed(1)} / 10`
                              : "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E2F2E7] text-[#1F382B] border border-[#A6D5B4]">
                            &bull; Ready
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <Link
                            href={`/dashboard/scout/players/${p.id}`}
                            aria-label={`View ${p.fullName}`}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FAF5EC] hover:bg-[#D95B24] text-[#132B32] hover:text-white transition-colors"
                          >
                            <ArrowRightIcon className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Top Scout Insights */}
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-alfa text-base sm:text-lg text-[#132B32] uppercase tracking-tight">
                Top Scout Insights
              </h2>
              <span className="font-barlow-condensed text-xs font-bold text-[#718E94] uppercase tracking-wider">
                Official Academy Analytics
              </span>
            </div>

            <div className="space-y-3">
              {/* Insight 1: Sport Talent Surge */}
              <div className="p-3 bg-[#FAF5EC] border border-[#E8DEC9] rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFFDF8] border border-[#D5A64A] text-[#D95B24] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <TrendingUpIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-[#132B32] block">
                    {dominantSport ? `${dominantSport.name} Talent Concentration` : "Sport Pool Diversity"}
                  </span>
                  <p className="text-xs text-[#5D6B6E] mt-0.5">
                    {dominantSport
                      ? `${dominantSport.name} currently leads academy scouting eligibility with ${dominantSport.count} qualified athletes.`
                      : "Sports roster will populate as coaches finalize player qualifications."}
                  </p>
                </div>
              </div>

              {/* Insight 2: Top Performer */}
              <div className="p-3 bg-[#FAF5EC] border border-[#E8DEC9] rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFFDF8] border border-[#D5A64A] text-[#D95B24] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <StarIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-[#132B32] block">
                    Top Rated Performer
                  </span>
                  <p className="text-xs text-[#5D6B6E] mt-0.5">
                    {featuredTalent
                      ? `${featuredTalent.fullName} holds the highest verified performance rating (${featuredTalent.averageIndividualScore?.toFixed(1)} / 10) across finalized fixtures.`
                      : "Verified performance ratings require at least 2 finalized match appearances."}
                  </p>
                </div>
              </div>

              {/* Insight 3: Active Talent Pool */}
              <div className="p-3 bg-[#FAF5EC] border border-[#E8DEC9] rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFFDF8] border border-[#D5A64A] text-[#D95B24] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <UsersIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-[#132B32] block">
                    Active Talent Pool
                  </span>
                  <p className="text-xs text-[#5D6B6E] mt-0.5">
                    {totalReadyCount > 0
                      ? `${totalReadyCount} verified athletes currently satisfy all official academy readiness benchmarks (\u2265 75% attendance and \u2265 2 finalized matches).`
                      : "Athletes are actively participating in practice sessions and fixtures to achieve readiness."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION E: QUICK ACTIONS                                  */}
      {/* ========================================================= */}
      <section
        aria-label="Quick Actions"
        className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-4 sm:p-5 shadow-xs"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="font-alfa text-base sm:text-lg text-[#132B32] uppercase tracking-tight">
              Quick Actions
            </h2>
            <p className="text-xs text-[#5D6B6E] mt-0.5">
              Find talent. Build tomorrow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard/scout/discover"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FAF5EC] hover:bg-[#F3E8D2] text-[#132B32] border border-[#E2D7C3] text-xs font-bold font-barlow-condensed uppercase tracking-wider transition-colors"
            >
              <SearchIcon className="w-4 h-4 text-[#D95B24]" />
              <span>Search Athletes</span>
            </Link>

            <Link
              href="/dashboard/scout/discover"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FAF5EC] hover:bg-[#F3E8D2] text-[#132B32] border border-[#E2D7C3] text-xs font-bold font-barlow-condensed uppercase tracking-wider transition-colors"
            >
              <UsersIcon className="w-4 h-4 text-[#D95B24]" />
              <span>View All Talents</span>
            </Link>

            <Link
              href="/dashboard/scout/discover"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FAF5EC] hover:bg-[#F3E8D2] text-[#132B32] border border-[#E2D7C3] text-xs font-bold font-barlow-condensed uppercase tracking-wider transition-colors"
            >
              <TrophyIcon className="w-4 h-4 text-[#D95B24]" />
              <span>Browse Sports</span>
            </Link>

            {/* Primary Action Button in Forest Green */}
            <Link
              href="/dashboard/scout/discover"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1F382B] hover:bg-[#162920] text-[#FFF9EF] border border-[#2E543E] text-xs font-bold font-barlow-condensed uppercase tracking-wider transition-colors"
            >
              <TargetIcon className="w-4 h-4 text-[#4ADE80]" />
              <span>Discover Ready Talent</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
