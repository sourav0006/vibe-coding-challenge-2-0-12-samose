"use client";

import Link from "next/link";
import { TrophyIcon, ArrowRightIcon, UsersIcon } from "@/components/ui/icons";

export interface TalentDiscoveryViewProps {
  availableSports: Array<{ id: string; name: string; count: number }>;
  totalReadyCount: number;
}

export function TalentDiscoveryView({
  availableSports,
  totalReadyCount,
}: TalentDiscoveryViewProps) {
  const maxSportCount = Math.max(
    ...availableSports.map((s) => s.count),
    1
  );

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* ========================================================= */}
      {/* PAGE HEADER: RETRO SPORTS EDITORIAL STYLING               */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E2D7C3]">
        <div className="space-y-1">
          <span className="font-barlow-condensed text-xs font-bold uppercase tracking-widest text-[#D95B24]">
            Official Academy Talent Workspace
          </span>
          <h1 className="font-alfa text-3xl sm:text-4xl text-[#132B32] uppercase tracking-tight">
            Talent Discovery
          </h1>
          <p className="text-xs sm:text-sm text-[#5D6B6E] max-w-2xl">
            Explore verified, scouting-ready athletes across academy sports. Select a discipline below to review qualified player dossiers.
          </p>
        </div>

        {/* Summary Metric Counters */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="px-3.5 py-1.5 rounded-lg bg-[#FAF5EC] border border-[#E8DEC9] text-center">
            <span className="font-barlow-condensed text-[10px] font-bold uppercase tracking-wider text-[#718E94] block">
              Ready Athletes
            </span>
            <span className="font-alfa text-lg text-[#132B32] block leading-none mt-0.5">
              {totalReadyCount}
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-lg bg-[#FAF5EC] border border-[#E8DEC9] text-center">
            <span className="font-barlow-condensed text-[10px] font-bold uppercase tracking-wider text-[#718E94] block">
              Active Sports
            </span>
            <span className="font-alfa text-lg text-[#D95B24] block leading-none mt-0.5">
              {availableSports.length}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* COMPACT READINESS CRITERIA POLICY NOTICE                  */}
      {/* ========================================================= */}
      <div className="bg-[#FAF5EC] border border-[#E8DEC9] rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#1F382B] text-[#FFF9EF] flex items-center justify-center shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
          </div>
          <p className="text-xs text-[#5D6B6E] leading-relaxed">
            <strong className="text-[#132B32] font-bold">Official Academy Policy:</strong> Only athletes meeting the dual qualification criteria (<strong className="text-[#1F382B] font-semibold">&ge; 75.0% session attendance</strong> and <strong className="text-[#1F382B] font-semibold">&ge; 2 finalized match appearances</strong>) are published to the Scout Portal.
          </p>
        </div>

        <Link
          href="/dashboard/scout"
          className="shrink-0 text-xs font-bold font-barlow-condensed uppercase tracking-wider text-[#D95B24] hover:underline hidden sm:inline-flex items-center gap-1"
        >
          <span>Dashboard Overview</span>
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ========================================================= */}
      {/* SPORT SELECTION SECTION: DISCOVER BY DISCIPLINE           */}
      {/* ========================================================= */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-alfa text-lg sm:text-xl text-[#132B32] uppercase tracking-tight">
              Select a Sport to Discover Talent
            </h2>
            <p className="text-xs text-[#718E94] mt-0.5">
              Sports containing at least one scouting-ready athlete. Click a card to open its roster.
            </p>
          </div>
        </div>

        {availableSports.length === 0 ? (
          <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-12 text-center shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#FAF5EC] border border-[#E2D7C3] text-[#718E94] flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <UsersIcon className="w-6 h-6 text-[#D95B24]" />
            </div>
            <h3 className="font-alfa text-base text-[#132B32] uppercase tracking-tight">
              No Scouting-Ready Athletes Currently Available
            </h3>
            <p className="text-xs text-[#5D6B6E] max-w-md mx-auto mt-1 leading-relaxed">
              Athletes unlock official scout visibility upon meeting the academy&apos;s dual readiness benchmark (&ge; 75% attendance and &ge; 2 finalized matches). Check back as academy training sessions and fixtures conclude.
            </p>
            <div className="mt-5">
              <Link
                href="/dashboard/scout"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#132B32] hover:bg-[#1B3B44] text-[#FFF9EF] font-barlow-condensed font-bold uppercase tracking-wider text-xs transition-colors shadow-2xs"
              >
                &larr; Return to Scout Overview
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {availableSports.map((sport) => {
              const pct = Math.min(
                100,
                Math.max(15, Math.round((sport.count / maxSportCount) * 100))
              );

              return (
                <Link
                  key={sport.id}
                  href={`/dashboard/scout/discover/${sport.id}`}
                  className="group bg-[#FFFDF8] hover:bg-[#FAF5EC] border border-[#E2D7C3] hover:border-[#D5A64A] rounded-xl p-5 transition-all duration-200 hover:-translate-y-1 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Top row: Sport badge & Arrow indicator */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-lg bg-[#FAF5EC] group-hover:bg-[#FFFDF8] border border-[#E2D7C3] group-hover:border-[#D5A64A] flex items-center justify-center transition-colors shadow-2xs">
                        <TrophyIcon className="w-5 h-5 text-[#D95B24]" />
                      </div>

                      <span className="w-8 h-8 rounded-full bg-[#FAF5EC] group-hover:bg-[#D95B24] border border-[#E2D7C3] group-hover:border-[#D95B24] text-[#132B32] group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                        <ArrowRightIcon className="w-4 h-4" />
                      </span>
                    </div>

                    {/* Sport name & Count */}
                    <h3 className="font-alfa text-xl text-[#132B32] group-hover:text-[#D95B24] uppercase tracking-tight transition-colors">
                      {sport.name}
                    </h3>
                    <p className="font-barlow-condensed font-bold uppercase text-xs text-[#718E94] mt-1">
                      <span className="text-[#D95B24] font-extrabold text-sm mr-1">
                        {sport.count}
                      </span>
                      {sport.count === 1 ? "Eligible Athlete" : "Eligible Athletes"}
                    </p>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-5 pt-4 border-t border-[#EBE1D0]">
                    <div className="flex items-center justify-between text-[10px] font-barlow-condensed font-bold uppercase tracking-wider text-[#718E94] mb-1.5">
                      <span>Talent Pool Share</span>
                      <span>{pct}% of max</span>
                    </div>
                    <div className="w-full h-2 bg-[#EBE1D0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D95B24] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

