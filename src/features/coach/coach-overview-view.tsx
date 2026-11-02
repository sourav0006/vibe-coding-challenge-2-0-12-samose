"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateOnly } from "@/lib/utils";
import type { CoachStats, RecentPlayerItem, RecentMatchItem } from "@/lib/services";

export interface CoachOverviewViewProps {
  initialStats?: CoachStats | null;
  initialRecentPlayers?: RecentPlayerItem[] | null;
  initialRecentMatches?: RecentMatchItem[] | null;
}

export function CoachOverviewView({
  initialStats = null,
  initialRecentPlayers = null,
  initialRecentMatches = null,
}: CoachOverviewViewProps) {
  const router = useRouter();
  const [stats, setStats] = useState<CoachStats | null>(initialStats);
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayerItem[] | null>(initialRecentPlayers);
  const [recentMatches, setRecentMatches] = useState<RecentMatchItem[] | null>(initialRecentMatches);
  const [loading, setLoading] = useState(!initialStats);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/coach/dashboard/stats");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load dashboard data");
      }
      setStats(json.data.stats);
      setRecentPlayers(json.data.recentPlayers);
      setRecentMatches(json.data.recentMatches || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    if (!initialStats) {
      fetch("/api/coach/dashboard/stats")
        .then((res) => res.json())
        .then((json) => {
          if (!ignore) {
            if (json.success) {
              setStats(json.data.stats);
              setRecentPlayers(json.data.recentPlayers);
              setRecentMatches(json.data.recentMatches || []);
            } else {
              setError(json.error || "Failed to load dashboard data");
            }
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!ignore) {
            setError(err instanceof Error ? err.message : "Failed to load dashboard");
            setLoading(false);
          }
        });
    }
    return () => {
      ignore = true;
    };
  }, [initialStats]);

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
            Coach Dashboard
          </span>
          <h1 className="text-2xl font-black text-[var(--color-text-primary)] tracking-tight">
            Academy Overview
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            {todayFormatted} &bull; Academy Operations &amp; Performance Control
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchDashboardData}
            disabled={loading}
            className="text-xs"
          >
            Refresh Metrics
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={fetchDashboardData} className="text-red-700 hover:bg-red-100">
            Retry
          </Button>
        </div>
      )}

      {/* Statistics Cards */}
      {loading && !stats ? (
        <LoadingState message="Loading academy metrics..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Total Players */}
          <Card className="hover:shadow-xs transition-shadow bg-white border border-slate-200">
            <CardHeader className="pb-1 pt-3.5 px-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Total Players
              </span>
            </CardHeader>
            <CardContent className="px-4 pb-3.5">
              <div className="text-2xl font-bold text-slate-900">
                {stats?.totalPlayers ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Registered profiles
              </p>
            </CardContent>
          </Card>

          {/* Active Players */}
          <Card className="hover:shadow-xs transition-shadow bg-white border border-slate-200">
            <CardHeader className="pb-1 pt-3.5 px-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Active Players
              </span>
            </CardHeader>
            <CardContent className="px-4 pb-3.5">
              <div className="text-2xl font-bold text-emerald-600">
                {stats?.activePlayers ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Roster ready
              </p>
            </CardContent>
          </Card>

          {/* Total Sports */}
          <Card className="hover:shadow-xs transition-shadow bg-white border border-slate-200">
            <CardHeader className="pb-1 pt-3.5 px-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Active Sports
              </span>
            </CardHeader>
            <CardContent className="px-4 pb-3.5">
              <div className="text-2xl font-bold text-slate-900">
                {stats?.totalSports ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Disciplines offered
              </p>
            </CardContent>
          </Card>

          {/* Pending Activations */}
          <Card className="hover:shadow-xs transition-shadow bg-white border border-slate-200">
            <CardHeader className="pb-1 pt-3.5 px-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Pending Setup
              </span>
            </CardHeader>
            <CardContent className="px-4 pb-3.5">
              <div className="text-2xl font-bold text-amber-600">
                {stats?.pendingActivations ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Passcodes awaiting setup
              </p>
            </CardContent>
          </Card>

          {/* Phase 7: Finalized Matches */}
          <Card className="hover:shadow-xs transition-shadow bg-white border border-slate-200">
            <CardHeader className="pb-1 pt-3.5 px-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Finalized Matches
              </span>
            </CardHeader>
            <CardContent className="px-4 pb-3.5">
              <div className="text-2xl font-bold text-emerald-700">
                {stats?.totalMatches ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Locked fixtures
              </p>
            </CardContent>
          </Card>

          {/* Phase 7: Player Participations */}
          <Card className="hover:shadow-xs transition-shadow bg-white border border-slate-200">
            <CardHeader className="pb-1 pt-3.5 px-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Participations
              </span>
            </CardHeader>
            <CardContent className="px-4 pb-3.5">
              <div className="text-2xl font-bold text-slate-900">
                {stats?.totalParticipations ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Player scores recorded
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions Bar */}
      <Card variant="bordered" className="bg-[var(--color-background-subtle)]/60">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                Academy Quick Actions
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Direct pathways for player onboarding, practice roll-calls, and match score sheets.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/dashboard/coach/players/new">
                <Button size="sm" variant="primary" className="text-xs h-9">
                  + Add Player
                </Button>
              </Link>
              <Link href="/dashboard/coach/sessions/new">
                <Button size="sm" variant="secondary" className="text-xs h-9">
                  + New Session
                </Button>
              </Link>
              <Link href="/dashboard/coach/matches/new">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                  + Schedule Match
                </Button>
              </Link>
              <Link href="/dashboard/coach/matches">
                <Button size="sm" variant="outline" className="text-xs h-9">
                  Manage Matches
                </Button>
              </Link>
              <Link href="/dashboard/coach/readiness">
                <Button size="sm" variant="outline" className="text-xs h-9 text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                  Scouting Readiness &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Matches Section (Phase 7) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recent Match Fixtures
            </h2>
            <p className="text-xs text-slate-500">
              Official academy matches, participant rosters, and individual scoring.
            </p>
          </div>
          <Link href="/dashboard/coach/matches">
            <span className="text-xs font-semibold text-emerald-700 hover:underline">
              View All Matches &rarr;
            </span>
          </Link>
        </div>

        {recentMatches && recentMatches.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th scope="col" className="py-2.5 px-4">Date</th>
                    <th scope="col" className="py-2.5 px-4">Sport</th>
                    <th scope="col" className="py-2.5 px-4">Opponent</th>
                    <th scope="col" className="py-2.5 px-4 text-center">Status</th>
                    <th scope="col" className="py-2.5 px-4 text-center">Participants</th>
                    <th scope="col" className="py-2.5 px-4 text-center">Avg Score</th>
                    <th scope="col" className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentMatches.map((match) => (
                    <tr key={match.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {formatDateOnly(match.matchDate)}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {match.sportName}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        vs. {match.opponentName}
                      </td>
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        {match.status === "finalized" ? (
                          <Badge variant="success" size="sm">Finalized</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Draft</Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{match.participantCount}</span> players
                      </td>
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        {match.averageScore !== null ? (
                          <span className="font-semibold text-emerald-700">
                            {match.averageScore.toFixed(1)} / 10
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <Link href={`/dashboard/coach/matches/${match.id}`}>
                          <Button size="sm" variant="ghost" className="text-xs h-7 px-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50">
                            {match.status === "finalized" ? "View Summary →" : "Enter Scores →"}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No match fixtures scheduled yet. Click <Link href="/dashboard/coach/matches/new" className="text-emerald-700 font-semibold underline">Schedule Match</Link> to create your first fixture.
          </div>
        )}
      </div>

      {/* Recent Players Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              Recently Created Players
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Latest additions to your sports academy rosters.
            </p>
          </div>
          <Link href="/dashboard/coach/players">
            <span className="text-xs font-semibold text-[var(--color-primary)] hover:underline">
              View All Players &rarr;
            </span>
          </Link>
        </div>

        {recentPlayers && recentPlayers.length > 0 ? (
          <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-background-subtle)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)] uppercase font-semibold">
                  <tr>
                    <th scope="col" className="py-3 px-4">Player</th>
                    <th scope="col" className="py-3 px-4">Email</th>
                    <th scope="col" className="py-3 px-4">Sport</th>
                    <th scope="col" className="py-3 px-4">Account Status</th>
                    <th scope="col" className="py-3 px-4">Date Created</th>
                    <th scope="col" className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
                  {recentPlayers.map((player) => {
                    const createdDateFormatted = new Date(player.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <tr key={player.id} className="hover:bg-[var(--color-background-subtle)]/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[var(--color-text-primary)]">
                          {player.fullName}
                        </td>
                        <td className="py-3 px-4 text-[var(--color-text-secondary)] font-mono text-[11px]">
                          {player.email}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--color-background-subtle)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
                            {player.sportName}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {player.status === "active" ? (
                            <Badge variant="success" size="sm" dot>Active</Badge>
                          ) : player.status === "pending" ? (
                            <Badge variant="warning" size="sm" dot>Pending</Badge>
                          ) : (
                            <Badge variant="default" size="sm">Archived</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[var(--color-text-muted)] text-[11px]">
                          {createdDateFormatted}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/dashboard/coach/players/${player.id}`}>
                            <Button size="sm" variant="ghost" className="text-xs h-7 px-2">
                              View Profile &rarr;
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No Players Created Yet"
            description="Your academy currently has no players registered. Start by creating player accounts for your sports teams."
            action={
              <Button size="sm" variant="primary" onClick={() => router.push("/dashboard/coach/players/new")}>
                Create First Player
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
