"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRightIcon, UsersIcon, SearchIcon } from "@/components/ui/icons";
import type { SafeScoutPlayerDTO } from "@/lib/services";

export interface SportTalentDiscoveryViewProps {
  sport: {
    id: string;
    name: string;
  };
  initialPlayers: SafeScoutPlayerDTO[];
  totalReadyCount: number;
}

export function SportTalentDiscoveryView({
  sport,
  initialPlayers,
  totalReadyCount,
}: SportTalentDiscoveryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return initialPlayers;
    const q = searchQuery.toLowerCase().trim();
    return initialPlayers.filter((p) => p.fullName.toLowerCase().includes(q));
  }, [initialPlayers, searchQuery]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* ========================================================= */}
      {/* TOP NAVIGATION: BACK TO ALL SPORTS                        */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/scout/discover"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold font-barlow-condensed uppercase tracking-wider text-[#132B32] bg-[#FFFDF8] hover:bg-[#FAF5EC] border border-[#E2D7C3] transition-colors shadow-2xs"
        >
          <svg
            className="w-4 h-4 text-[#D95B24]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to All Sports
        </Link>

        <span className="font-barlow-condensed text-[11px] font-bold uppercase tracking-widest text-[#718E94]">
          {sport.name} &bull; {initialPlayers.length} of {totalReadyCount ?? initialPlayers.length} Academy Ready Athletes
        </span>
      </div>

      {/* ========================================================= */}
      {/* PAGE HEADER: SPORT-SPECIFIC READY ATHLETES                */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E2D7C3]">
        <div className="space-y-1">
          <span className="font-barlow-condensed text-xs font-bold uppercase tracking-widest text-[#D95B24]">
            Official Scouting Roster
          </span>
          <h1 className="font-alfa text-2xl sm:text-3xl md:text-4xl text-[#132B32] uppercase tracking-tight">
            {sport.name} &mdash; Ready Athletes
          </h1>
          <p className="text-xs sm:text-sm text-[#5D6B6E] max-w-2xl">
            Explore verified athletes who meet the academy&apos;s official scouting criteria in {sport.name}.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-barlow-condensed uppercase tracking-wider bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
            <span>{initialPlayers.length} Verified Athletes</span>
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEARCH AND FILTERS BAR                                    */}
      {/* ========================================================= */}
      <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="w-4 h-4 text-[#718E94] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search athlete in ${sport.name} by name...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF5EC] border border-[#E2D7C3] text-xs text-[#132B32] placeholder-[#718E94] focus:outline-none focus:ring-2 focus:ring-[#D95B24]"
          />
        </div>

        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="text-xs font-bold font-barlow-condensed uppercase tracking-wider text-[#D95B24] hover:underline px-2 cursor-pointer"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* ATHLETE ROSTER GRID                                       */}
      {/* ========================================================= */}
      {filteredPlayers.length === 0 ? (
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-[#FAF5EC] border border-[#E2D7C3] text-[#718E94] flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <UsersIcon className="w-6 h-6 text-[#D95B24]" />
          </div>
          <h3 className="font-alfa text-base text-[#132B32] uppercase tracking-tight">
            {searchQuery ? "No Athletes Found Matching Your Search" : `No Ready Athletes in ${sport.name}`}
          </h3>
          <p className="text-xs text-[#5D6B6E] max-w-md mx-auto mt-1 leading-relaxed">
            {searchQuery
              ? `No scouting-ready athletes in ${sport.name} match "${searchQuery}". Try a different spelling or clear the filter.`
              : `There are currently no athletes registered in ${sport.name} who satisfy the dual readiness benchmark (\u2265 75% attendance and \u2265 2 finalized matches).`}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 rounded-lg bg-[#FAF5EC] hover:bg-[#F3E8D2] text-[#132B32] border border-[#E2D7C3] font-barlow-condensed font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            ) : null}
            <Link
              href="/dashboard/scout/discover"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#132B32] hover:bg-[#1B3B44] text-[#FFF9EF] font-barlow-condensed font-bold uppercase tracking-wider text-xs transition-colors shadow-2xs"
            >
              &larr; View All Sports
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-5 shadow-xs hover:shadow-sm transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                {/* Header Row: Name, Age, Status */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#EBE1D0]">
                  <div className="min-w-0">
                    <h3 className="font-alfa text-lg text-[#132B32] uppercase tracking-tight truncate">
                      {player.fullName}
                    </h3>
                    <p className="font-barlow-condensed font-bold uppercase text-xs text-[#5D6B6E] mt-0.5">
                      <span className="text-[#D95B24]">{player.sportName}</span> &bull; Age {player.age}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-barlow-condensed uppercase tracking-wider bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                    <span>Scouting Ready</span>
                  </span>
                </div>

                {/* 3 Metric Scoreboard Plaques */}
                <div className="grid grid-cols-3 gap-2 py-3">
                  <div className="bg-[#FAF5EC] border border-[#E8DEC9] rounded-lg p-2.5 text-center">
                    <span className="font-alfa text-base sm:text-lg text-[#1F382B] block leading-none">
                      {player.attendancePercentage}
                    </span>
                    <span className="font-barlow-condensed font-bold uppercase text-[10px] text-[#718E94] tracking-wider block mt-1">
                      Attendance
                    </span>
                  </div>

                  <div className="bg-[#FAF5EC] border border-[#E8DEC9] rounded-lg p-2.5 text-center">
                    <span className="font-alfa text-base sm:text-lg text-[#132B32] block leading-none">
                      {player.finalizedMatchesPlayed}
                    </span>
                    <span className="font-barlow-condensed font-bold uppercase text-[10px] text-[#718E94] tracking-wider block mt-1">
                      Matches
                    </span>
                  </div>

                  <div className="bg-[#FAF5EC] border border-[#E8DEC9] rounded-lg p-2.5 text-center">
                    <span className="font-alfa text-base sm:text-lg text-[#D95B24] block leading-none">
                      {player.averageIndividualScore !== null
                        ? player.averageIndividualScore.toFixed(1)
                        : "—"}
                    </span>
                    <span className="font-barlow-condensed font-bold uppercase text-[10px] text-[#718E94] tracking-wider block mt-1">
                      Avg Score
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button: View Scouting Profile */}
              <div className="pt-3 border-t border-[#EBE1D0]">
                <Link
                  href={`/dashboard/scout/players/${player.id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-[#FAF5EC] hover:bg-[#132B32] text-[#132B32] hover:text-[#FFF9EF] border border-[#E2D7C3] hover:border-[#132B32] font-barlow-condensed font-bold uppercase tracking-wider text-xs transition-colors shadow-2xs group"
                >
                  <span>View Scouting Profile</span>
                  <ArrowRightIcon className="w-3.5 h-3.5 text-[#D95B24] group-hover:text-[#FFF9EF] transition-colors" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
