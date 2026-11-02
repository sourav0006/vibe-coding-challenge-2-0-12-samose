"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { PlayerDashboardOverviewDTO } from "@/lib/services";

export interface PlayerOverviewViewProps {
  overview: PlayerDashboardOverviewDTO;
}

export function PlayerOverviewView({ overview }: PlayerOverviewViewProps) {
  const { profile, attendance, matches, readiness, recentRemarks } = overview;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            One Academy Athlete Portal
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {profile.fullName}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Discipline: <span className="font-semibold text-slate-700">{profile.sportName}</span> &bull; Age:{" "}
            <span className="font-semibold text-slate-700">{profile.age}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            Active Athlete
          </Badge>
          <Badge
            variant={readiness.status === "ready" ? "success" : "default"}
            size="md"
          >
            {readiness.status === "ready" ? "Scouting Ready" : "Developing"}
          </Badge>
        </div>
      </div>

      {/* Progress Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Attendance Card */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Attendance Record
              </span>
              <Badge
                variant={
                  attendance.numericPercentage !== null && attendance.numericPercentage >= 75
                    ? "success"
                    : "default"
                }
                size="sm"
              >
                {attendance.attendancePercentage}
              </Badge>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 mt-1">
              {attendance.attendancePercentage}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Visual progress bar towards 75% benchmark */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Current Attendance</span>
                <span>Requirement: 75%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-500 ${
                    attendance.numericPercentage !== null && attendance.numericPercentage >= 75
                      ? "bg-emerald-600"
                      : "bg-amber-500"
                  }`}
                  style={{
                    width: `${Math.min(100, attendance.numericPercentage ?? 0)}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Present Sessions</span>
                <span className="font-bold text-slate-800">{attendance.presentSessions}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Closed Sessions</span>
                <span className="font-bold text-slate-800">{attendance.totalApplicableClosedSessions}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard/player/attendance"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                View Complete Attendance History &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Match Performance Card */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Match Performance
              </span>
              <Badge
                variant={matches.finalizedMatchesPlayed >= 2 ? "success" : "default"}
                size="sm"
              >
                {matches.finalizedMatchesPlayed} {matches.finalizedMatchesPlayed === 1 ? "Match" : "Matches"}
              </Badge>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 mt-1">
              {matches.averageScore !== null ? `${matches.averageScore} / 10` : "No Matches"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Matches Played</span>
                <span className="font-bold text-slate-800">{matches.finalizedMatchesPlayed}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Average Score</span>
                <span className="font-bold text-slate-800">
                  {matches.averageScore !== null ? matches.averageScore : "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Top Score</span>
                <span className="font-bold text-emerald-700">
                  {matches.highestScore !== null ? matches.highestScore : "—"}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Only official fixtures finalized by academy coaches contribute to performance ratings.
            </p>

            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/dashboard/player/matches"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                View Match Fixtures &amp; Scores &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Official Readiness Card */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Scouting Readiness
              </span>
              <Badge
                variant={readiness.status === "ready" ? "success" : "default"}
                size="sm"
              >
                {readiness.status === "ready" ? "READY" : "NOT READY"}
              </Badge>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 mt-1">
              {readiness.status === "ready" ? "Scout Discoverable" : "In Development"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Criteria Checklist */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">1. Attendance &ge; 75.0%</span>
                {readiness.attendanceCriterionMet ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    ✓ Requirement Met
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold flex items-center gap-1">
                    ✕ Below 75%
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">2. Finalized Matches &ge; 2</span>
                {readiness.matchCriterionMet ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    ✓ Requirement Met
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold flex items-center gap-1">
                    ✕ Requires 2 Matches
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              {readiness.status === "ready"
                ? "Congratulations! Your verified records qualify your profile for external scout discovery."
                : "Continue attending practice sessions and participating in matches to achieve scout readiness."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Readiness Explanation Section */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Readiness Status Explanation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-slate-600">
          <p>
            Official scouting readiness requires simultaneous fulfillment of two verified benchmarks:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-semibold text-slate-800">
                Attendance Benchmark (&ge; 75%):{" "}
              </span>
              {attendance.attendancePercentage === "N/A" ? (
                <span>There are not yet enough applicable closed practice sessions to calculate an official attendance percentage.</span>
              ) : readiness.attendanceCriterionMet ? (
                <span className="text-emerald-700 font-medium">
                  {attendance.attendancePercentage} &mdash; Requirement satisfied ({attendance.presentSessions} of {attendance.totalApplicableClosedSessions} sessions attended).
                </span>
              ) : (
                <span className="text-amber-700 font-medium">
                  {attendance.attendancePercentage} &mdash; Below the required 75.0% threshold ({attendance.presentSessions} of {attendance.totalApplicableClosedSessions} sessions attended).
                </span>
              )}
            </li>
            <li>
              <span className="font-semibold text-slate-800">
                Match Participation Benchmark (&ge; 2 matches):{" "}
              </span>
              {readiness.matchCriterionMet ? (
                <span className="text-emerald-700 font-medium">
                  {matches.finalizedMatchesPlayed} finalized matches &mdash; Requirement satisfied.
                </span>
              ) : (
                <span className="text-amber-700 font-medium">
                  {matches.finalizedMatchesPlayed} finalized match(es) &mdash; Below the required minimum of 2 finalized matches.
                </span>
              )}
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Coach Feedback & Remarks Preview */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Recent Coach Feedback
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Confidential pointers, tactical guidance, and encouragement from academy coaching staff.
              </p>
            </div>
            <Link
              href="/dashboard/player/remarks"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              View All Feedback &rarr;
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentRemarks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="font-medium text-slate-700">No feedback yet</p>
              <p className="mt-1">Your coach&apos;s feedback will appear here as they review your training and match performances.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRemarks.map((remark) => (
                <div
                  key={remark.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60"
                >
                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {remark.content}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Recorded on {formatDateTime(remark.createdAt)}</span>
                    {remark.updatedAt && remark.updatedAt !== remark.createdAt && (
                      <span className="text-amber-600 font-medium">
                        (edited {formatDateTime(remark.updatedAt)})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
