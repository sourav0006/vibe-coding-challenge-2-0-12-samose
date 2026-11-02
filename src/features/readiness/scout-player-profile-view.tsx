"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateOnly } from "@/lib/utils";
import type { ScoutPlayerProfileDTO } from "@/lib/services";

export interface ScoutPlayerProfileViewProps {
  profile: ScoutPlayerProfileDTO;
}

export function ScoutPlayerProfileView({ profile }: ScoutPlayerProfileViewProps) {
  const { player, attendance, matches } = profile;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/scout"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Talent Discovery
        </Link>
      </div>

      {/* Header Card */}
      <Card className="border border-emerald-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-emerald-50/70 via-white to-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {player.fullName}
              </h1>
              <Badge variant="success" size="md">
                Scouting Ready
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Discipline: <span className="font-semibold text-slate-800">{player.sportName}</span> &bull; Age:{" "}
              <span className="font-semibold text-slate-800">{player.age}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Verified Official Profile
            </span>
          </div>
        </div>

        {/* High-Level Performance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/50">
          <div className="p-4 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Attendance
            </span>
            <span className="text-xl font-bold text-emerald-700 mt-0.5 block">
              {attendance.attendancePercentage}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {attendance.presentSessions} / {attendance.applicableClosedSessions} closed sessions
            </span>
          </div>

          <div className="p-4 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Finalized Matches
            </span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">
              {matches.totalFinalizedMatches}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Official fixtures
            </span>
          </div>

          <div className="p-4 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Avg Rating
            </span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">
              {matches.averageIndividualScore !== null
                ? `${matches.averageIndividualScore.toFixed(1)} / 10`
                : "—"}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Performance mean
            </span>
          </div>

          <div className="p-4 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Peak Rating
            </span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">
              {matches.highestIndividualScore !== null
                ? `${matches.highestIndividualScore.toFixed(1)} / 10`
                : "—"}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Highest score recorded
            </span>
          </div>
        </div>
      </Card>

      {/* Match History Table */}
      <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/60">
          <CardTitle className="text-base font-bold text-slate-900">
            Verified Match History &amp; Individual Scoring
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Only finalized academy matches contribute to official scouting records. Scores reflect individual technical performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {matches.history.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No finalized matches on record.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th scope="col" className="py-3 px-5">Match Date</th>
                    <th scope="col" className="py-3 px-5">Sport</th>
                    <th scope="col" className="py-3 px-5">Opponent</th>
                    <th scope="col" className="py-3 px-5 text-center">Individual Score</th>
                    <th scope="col" className="py-3 px-5 text-center">Rating Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matches.history.map((record) => (
                    <tr key={record.matchId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5 font-semibold text-slate-900 whitespace-nowrap">
                        {formatDateOnly(record.matchDate)}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {record.sportName}
                        </span>
                      </td>
                      <td className="py-3 px-5 font-medium text-slate-900 whitespace-nowrap">
                        vs. {record.opponentName}
                      </td>
                      <td className="py-3 px-5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {record.score.toFixed(1)} / 10
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center whitespace-nowrap">
                        {record.score >= 8.0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            Outstanding
                          </span>
                        ) : record.score >= 6.0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                            Competent
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
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
        </CardContent>
      </Card>
    </div>
  );
}
