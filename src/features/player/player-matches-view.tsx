"use client";

import { useState } from "react";
import { formatDateOnly } from "@/lib/utils";
import type { PlayerMatchHistoryResult } from "@/lib/services";

export interface PlayerMatchesViewProps {
  initialData: PlayerMatchHistoryResult;
}

function StatScoreboardCard({
  label,
  value,
  sublabel,
  highlight,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  highlight?: boolean;
}) {
  return (
    <div className="relative group flex flex-col items-center justify-center p-3.5 min-h-[96px] shadow-xs">
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-xs"
        preserveAspectRatio="none"
        viewBox="0 0 160 100"
      >
        <polygon
          points="8,2 152,2 158,8 158,92 152,98 8,98 2,92 2,8"
          fill="#132B32"
          stroke="#0D1E22"
          strokeWidth="1.5"
        />
        <polygon
          points="11,5 149,5 155,11 155,89 149,95 11,95 5,89 5,11"
          fill="none"
          stroke="#D5A64A"
          strokeWidth="1.2"
          strokeOpacity="0.85"
        />
      </svg>

      <div className="relative z-10 w-full flex flex-col items-center text-center px-1">
        <span
          className={`font-alfa text-2xl sm:text-3xl tracking-tight leading-none truncate max-w-full ${
            highlight ? "text-[#4ADE80]" : "text-[#FFF9EF]"
          }`}
        >
          {value}
        </span>
        <div className="w-3/4 h-px bg-[#D5A64A]/40 my-1.5" />
        <span className="font-barlow-condensed text-xs font-bold text-[#E9DCC5] uppercase tracking-wider leading-tight">
          {label}
        </span>
        {sublabel && (
          <span className="text-[10px] text-[#A2BAC0] font-medium mt-0.5">{sublabel}</span>
        )}
      </div>
    </div>
  );
}

export function PlayerMatchesView({ initialData }: PlayerMatchesViewProps) {
  const [data, setData] = useState<PlayerMatchHistoryResult>(initialData);
  const [loadingPage, setLoadingPage] = useState(false);

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > data.pagination.totalPages) return;
    setLoadingPage(true);
    try {
      const res = await fetch(`/api/player/matches?page=${newPage}&limit=${data.pagination.limit}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      }
    } catch {
      // Ignore network error
    } finally {
      setLoadingPage(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-[#E2D7C3]">
        <div>
          <span className="font-barlow-condensed text-xs font-bold uppercase tracking-widest text-[#D95B24]">
            Official Competition Records
          </span>
          <h1 className="font-alfa text-2xl sm:text-3xl md:text-4xl text-[#132B32] uppercase tracking-tight mt-1">
            Match History &amp; Performance
          </h1>
          <p className="text-xs sm:text-sm text-[#5D6B6E] mt-0.5">
            Verified individual performance ratings recorded by academy coaching staff in finalized fixtures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-barlow-condensed uppercase tracking-wider bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                data.totalMatchesPlayed >= 2 ? "bg-[#4ADE80]" : "bg-[#D95B24]"
              }`}
            />
            <span>
              {data.totalMatchesPlayed} Finalized {data.totalMatchesPlayed === 1 ? "Match" : "Matches"}
            </span>
          </span>
        </div>
      </div>

      {/* Summary Scoreboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatScoreboardCard
          label="Matches Played"
          value={String(data.totalMatchesPlayed).padStart(2, "0")}
          sublabel="Finalized Fixtures"
        />
        <StatScoreboardCard
          label="Average Score"
          value={data.averageScore !== null ? `${data.averageScore.toFixed(1)}` : "—"}
          sublabel="/ 10 Scale"
          highlight={data.averageScore !== null && data.averageScore >= 7.5}
        />
        <StatScoreboardCard
          label="Top Score"
          value={data.highestScore !== null ? `${data.highestScore.toFixed(1)}` : "—"}
          sublabel="Peak Rating"
        />
        <StatScoreboardCard
          label="Lowest Score"
          value={data.lowestScore !== null ? `${data.lowestScore.toFixed(1)}` : "—"}
          sublabel="Lowest Rating"
        />
      </div>

      {/* Match History Table Card */}
      <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl overflow-hidden shadow-xs">
        <div className="border-b border-[#E2D7C3] bg-[#FAF5EC] px-5 py-3.5 flex items-center justify-between">
          <h2 className="font-alfa text-sm sm:text-base text-[#132B32] uppercase tracking-tight">
            Finalized Fixtures ({data.pagination.total})
          </h2>
          <span className="font-barlow-condensed text-xs text-[#718E94] uppercase tracking-wider">
            Official 0–10 performance evaluation scale
          </span>
        </div>

        <div>
          {data.history.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#718E94]">
              <p className="font-bold text-[#132B32] text-sm">No finalized matches on record</p>
              <p className="mt-1">
                Once coaches finalize matches with your individual performance evaluation, they will be recorded here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5EC] font-barlow-condensed font-bold uppercase tracking-wider text-xs text-[#132B32] border-b border-[#E2D7C3]">
                  <tr>
                    <th scope="col" className="px-5 py-3">Match Date</th>
                    <th scope="col" className="px-5 py-3">Discipline</th>
                    <th scope="col" className="px-5 py-3">Opponent</th>
                    <th scope="col" className="px-5 py-3 text-right">Individual Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE1D0]">
                  {data.history.map((record) => (
                    <tr
                      key={record.matchId}
                      className="hover:bg-[#FAF5EC]/70 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold text-[#132B32]">
                        {formatDateOnly(record.matchDate)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#FAF5EC] border border-[#E8DEC9] text-[#132B32]">
                          {record.sportName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-[#132B32]">
                        vs. {record.opponentName}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded font-alfa text-xs bg-[#E2F2E7] text-[#1F382B] border border-[#A6D5B4]">
                          {record.score.toFixed(1)} / 10
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Bar */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#E2D7C3] bg-[#FAF5EC] text-xs text-[#5D6B6E]">
              <span className="font-barlow-condensed font-semibold uppercase tracking-wider">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(data.pagination.page - 1)}
                  disabled={data.pagination.page <= 1 || loadingPage}
                  className="px-3 py-1.5 rounded-lg bg-[#FFFDF8] border border-[#E2D7C3] font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32] hover:bg-[#F3E8D2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(data.pagination.page + 1)}
                  disabled={data.pagination.page >= data.pagination.totalPages || loadingPage}
                  className="px-3 py-1.5 rounded-lg bg-[#FFFDF8] border border-[#E2D7C3] font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32] hover:bg-[#F3E8D2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
