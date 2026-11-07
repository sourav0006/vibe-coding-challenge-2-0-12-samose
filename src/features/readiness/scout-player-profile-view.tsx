"use client";

import Link from "next/link";
import { formatDateOnly } from "@/lib/utils";
import type { ScoutPlayerProfileDTO } from "@/lib/services";

export interface ScoutPlayerProfileViewProps {
  profile: ScoutPlayerProfileDTO;
}

export function ScoutPlayerProfileView({ profile }: ScoutPlayerProfileViewProps) {
  const { player, attendance, matches } = profile;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/scout"
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
          Back to Talent Discovery
        </Link>
        <span className="font-barlow-condensed text-[11px] font-bold uppercase tracking-widest text-[#718E94]">
          Verified Scouting Record
        </span>
      </div>

      {/* Header Profile Card */}
      <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#E2D7C3]">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-alfa text-2xl sm:text-3xl text-[#132B32] uppercase tracking-tight">
                {player.fullName}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-barlow-condensed uppercase tracking-wider bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E]">
                <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
                Scouting Ready
              </span>
            </div>
            <p className="font-barlow-condensed text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#5D6B6E] mt-1.5">
              Discipline: <span className="font-bold text-[#D95B24]">{player.sportName}</span> &bull; Age:{" "}
              <span className="font-bold text-[#132B32]">{player.age}</span> &bull; Status:{" "}
              <span className="font-bold text-[#1F382B]">Verified Athlete</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold font-barlow-condensed uppercase tracking-wider bg-[#FAF5EC] border border-[#E8DEC9] text-[#132B32]">
              Official One Academy Dossier
            </span>
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-5">
          <div className="bg-[#FAF5EC] border border-[#E8DEC9] rounded-lg p-3.5 text-center">
            <span className="font-barlow-condensed text-[11px] font-bold uppercase tracking-wider text-[#718E94] block">
              Attendance
            </span>
            <span className="font-alfa text-xl sm:text-2xl text-[#1F382B] mt-1 block">
              {attendance.attendancePercentage}
            </span>
            <span className="text-[11px] text-[#718E94] mt-0.5 block">
              {attendance.presentSessions} / {attendance.applicableClosedSessions} closed sessions
            </span>
          </div>

          <div className="bg-[#FAF5EC] border border-[#E8DEC9] rounded-lg p-3.5 text-center">
            <span className="font-barlow-condensed text-[11px] font-bold uppercase tracking-wider text-[#718E94] block">
              Finalized Matches
            </span>
            <span className="font-alfa text-xl sm:text-2xl text-[#132B32] mt-1 block">
              {matches.totalFinalizedMatches}
            </span>
            <span className="text-[11px] text-[#718E94] mt-0.5 block">
              Official fixtures
            </span>
          </div>

          <div className="bg-[#FAF5EC] border border-[#E8DEC9] rounded-lg p-3.5 text-center">
            <span className="font-barlow-condensed text-[11px] font-bold uppercase tracking-wider text-[#718E94] block">
              Avg Rating
            </span>
            <span className="font-alfa text-xl sm:text-2xl text-[#D95B24] mt-1 block">
              {matches.averageIndividualScore !== null
                ? `${matches.averageIndividualScore.toFixed(1)} / 10`
                : "—"}
            </span>
            <span className="text-[11px] text-[#718E94] mt-0.5 block">
              Performance mean
            </span>
          </div>

          <div className="bg-[#FAF5EC] border border-[#E8DEC9] rounded-lg p-3.5 text-center">
            <span className="font-barlow-condensed text-[11px] font-bold uppercase tracking-wider text-[#718E94] block">
              Peak Rating
            </span>
            <span className="font-alfa text-xl sm:text-2xl text-[#132B32] mt-1 block">
              {matches.highestIndividualScore !== null
                ? `${matches.highestIndividualScore.toFixed(1)} / 10`
                : "—"}
            </span>
            <span className="text-[11px] text-[#718E94] mt-0.5 block">
              Highest score recorded
            </span>
          </div>
        </div>
      </div>

      {/* Match History Table */}
      <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[#E2D7C3] bg-[#FAF5EC]">
          <h2 className="font-alfa text-sm sm:text-base text-[#132B32] uppercase tracking-tight">
            Verified Match History &amp; Individual Scoring
          </h2>
          <p className="text-xs text-[#5D6B6E] mt-0.5">
            Only finalized academy matches contribute to official scouting records. Scores reflect individual technical performance.
          </p>
        </div>

        <div>
          {matches.history.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#718E94]">
              No finalized matches on record.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#5D6B6E]">
                <thead className="bg-[#FAF5EC] border-b border-[#E2D7C3] font-barlow-condensed text-[11px] uppercase font-bold text-[#718E94] tracking-wider">
                  <tr>
                    <th scope="col" className="py-3 px-5">Match Date</th>
                    <th scope="col" className="py-3 px-5">Sport</th>
                    <th scope="col" className="py-3 px-5">Opponent</th>
                    <th scope="col" className="py-3 px-5 text-center">Individual Score</th>
                    <th scope="col" className="py-3 px-5 text-center">Rating Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2D7C3]">
                  {matches.history.map((record) => (
                    <tr key={record.matchId} className="hover:bg-[#FAF5EC]/70 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-[#132B32] whitespace-nowrap">
                        {formatDateOnly(record.matchDate)}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-barlow-condensed uppercase tracking-wider bg-[#FAF5EC] border border-[#E8DEC9] text-[#132B32]">
                          {record.sportName}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-[#132B32] whitespace-nowrap">
                        vs. {record.opponentName}
                      </td>
                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-alfa bg-[#1F382B] text-[#FFF9EF]">
                          {record.score.toFixed(1)} / 10
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
                        {record.score >= 8.0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-barlow-condensed uppercase tracking-wider bg-[#E2F2E7] text-[#1F382B] border border-[#A6D5B4]">
                            ★ Outstanding
                          </span>
                        ) : record.score >= 6.0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-barlow-condensed uppercase tracking-wider bg-[#EBF2F7] text-[#164E63] border border-[#BAE6FD]">
                            Competent
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-barlow-condensed uppercase tracking-wider bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]">
                            Developing
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
