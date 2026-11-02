"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { PlayerReadinessDTO, CoachReadinessStats } from "@/lib/services";

export interface CoachReadinessViewProps {
  initialPlayers: PlayerReadinessDTO[];
  initialStats: CoachReadinessStats;
  sportsList: Array<{ id: string; name: string }>;
}

export function CoachReadinessView({
  initialPlayers,
  initialStats,
  sportsList,
}: CoachReadinessViewProps) {
  const [players] = useState<PlayerReadinessDTO[]>(initialPlayers);
  const [stats] = useState<CoachReadinessStats>(initialStats);

  // Filters and search
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "ready" | "not_ready">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"attendance" | "matches" | "name">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Selected player for explanation modal
  const [explainingPlayer, setExplainingPlayer] = useState<PlayerReadinessDTO | null>(null);

  // Filtered & sorted players
  const filteredPlayers = useMemo(() => {
    let result = [...players];

    if (selectedSport !== "all") {
      result = result.filter((p) => p.sportId === selectedSport);
    }

    if (selectedStatus !== "all") {
      result = result.filter((p) => p.readinessStatus === selectedStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
      );
    }

    const orderMultiplier = sortOrder === "desc" ? -1 : 1;
    result.sort((a, b) => {
      if (sortBy === "attendance") {
        const valA = a.numericAttendancePercentage ?? -1;
        const valB = b.numericAttendancePercentage ?? -1;
        if (valA !== valB) return (valA - valB) * orderMultiplier;
        return a.fullName.localeCompare(b.fullName);
      }
      if (sortBy === "matches") {
        if (a.finalizedMatchesPlayed !== b.finalizedMatchesPlayed) {
          return (a.finalizedMatchesPlayed - b.finalizedMatchesPlayed) * orderMultiplier;
        }
        return a.fullName.localeCompare(b.fullName);
      }
      return a.fullName.localeCompare(b.fullName) * orderMultiplier;
    });

    return result;
  }, [players, selectedSport, selectedStatus, searchQuery, sortBy, sortOrder]);

  const handleResetFilters = () => {
    setSelectedSport("all");
    setSelectedStatus("all");
    setSearchQuery("");
    setSortBy("name");
    setSortOrder("asc");
  };

  const hasActiveFilters =
    selectedSport !== "all" ||
    selectedStatus !== "all" ||
    searchQuery.trim() !== "" ||
    sortBy !== "name";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Readiness Engine
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Athlete Scouting Readiness
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Evaluate roster readiness based on closed practice attendance (≥ 75%) and finalized match participation (≥ 2 matches).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coach/players">
            <Button variant="outline" size="sm">
              Manage Players
            </Button>
          </Link>
          <Link href="/dashboard/coach/matches">
            <Button variant="outline" size="sm">
              Match Fixtures
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Active Players */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Active Roster
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {stats.totalPlayers}
              </span>
              <span className="text-xs text-slate-500">players</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Non-archived academy profiles
            </span>
          </CardContent>
        </Card>

        {/* Ready Players */}
        <Card className="border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 block">
              Ready for Scouting
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">
                {stats.totalReadyPlayers}
              </span>
              <span className="text-xs text-emerald-700 font-medium">qualified</span>
            </div>
            <span className="text-[11px] text-emerald-600 mt-0.5 block">
              Discoverable by Scouts
            </span>
          </CardContent>
        </Card>

        {/* Not Ready Players */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Developing
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-700">
                {stats.totalNotReadyPlayers}
              </span>
              <span className="text-xs text-slate-500">not ready</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Criteria pending completion
            </span>
          </CardContent>
        </Card>

        {/* Met Attendance Criterion */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Attendance Met
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {stats.meetingAttendanceCriterion}
              </span>
              <span className="text-xs text-slate-500">≥ 75%</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Closed practice attendance
            </span>
          </CardContent>
        </Card>

        {/* Met Match Criterion */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Matches Met
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {stats.meetingMatchCriterion}
              </span>
              <span className="text-xs text-slate-500">≥ 2 matches</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Finalized match records
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div>
              <label
                htmlFor="player-search"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1"
              >
                Search Player
              </label>
              <Input
                id="player-search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs"
              />
            </div>

            {/* Sport Filter */}
            <div>
              <label
                htmlFor="sport-filter"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1"
              >
                Sport
              </label>
              <Select
                id="sport-filter"
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full text-xs"
              >
                <option value="all">All Sports</option>
                {sportsList.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label
                htmlFor="status-filter"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1"
              >
                Readiness Status
              </label>
              <Select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as "all" | "ready" | "not_ready")
                }
                className="w-full text-xs"
              >
                <option value="all">All Statuses ({players.length})</option>
                <option value="ready">Ready ({stats.totalReadyPlayers})</option>
                <option value="not_ready">Not Ready ({stats.totalNotReadyPlayers})</option>
              </Select>
            </div>

            {/* Sort Controls */}
            <div>
              <label
                htmlFor="sort-by"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1"
              >
                Sort By
              </label>
              <div className="flex gap-2">
                <Select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "attendance" | "matches" | "name")
                  }
                  className="w-full text-xs"
                >
                  <option value="name">Player Name</option>
                  <option value="attendance">Attendance %</option>
                  <option value="matches">Matches Played</option>
                </Select>
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-slate-50 text-slate-700 hover:bg-slate-100"
                  title={`Sort ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Filtered: {filteredPlayers.length} of {players.length} players
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-emerald-700 hover:text-emerald-800 font-medium hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Players Readiness Table */}
      {filteredPlayers.length === 0 ? (
        <EmptyState
          title="No players found"
          description={
            hasActiveFilters
              ? "No players match the selected filter criteria. Try relaxing or resetting your filters."
              : "No active players registered in the academy."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Player
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Sport
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-center">
                    Attendance Rate
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-center">
                    Finalized Matches
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-center">
                    Avg Score
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-center">
                    Readiness Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlayers.map((player) => (
                  <tr
                    key={player.playerId}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div>
                        <Link
                          href={`/dashboard/coach/players/${player.playerId}`}
                          className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline"
                        >
                          {player.fullName}
                        </Link>
                        <p className="text-xs text-slate-400 font-mono">
                          {player.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {player.sportName}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <div>
                        <span
                          className={cn(
                            "font-bold text-sm",
                            player.attendanceCriterionMet
                              ? "text-emerald-700"
                              : "text-amber-700"
                          )}
                        >
                          {player.attendancePercentage}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {player.presentSessions} / {player.applicableClosedSessions} sessions
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span
                        className={cn(
                          "font-bold text-sm",
                          player.matchCriterionMet
                            ? "text-emerald-700"
                            : "text-amber-700"
                        )}
                      >
                        {player.finalizedMatchesPlayed}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">played</span>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {player.averageIndividualScore !== null ? (
                        <span className="font-semibold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {player.averageIndividualScore.toFixed(1)} / 10
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {player.isReady ? (
                        <Badge variant="success">Ready</Badge>
                      ) : (
                        <Badge variant="warning">Not Ready</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExplainingPlayer(player)}
                        className="text-xs h-8 text-slate-700 hover:bg-slate-100"
                      >
                        Readiness Breakdown &rarr;
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Explanation Modal */}
      {explainingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {explainingPlayer.fullName}
                  </h3>
                  {explainingPlayer.isReady ? (
                    <Badge variant="success">Ready for Scouting</Badge>
                  ) : (
                    <Badge variant="warning">Not Ready</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {explainingPlayer.sportName} &bull; Age {explainingPlayer.age}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExplainingPlayer(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Criterion 1: Attendance */}
              <div
                className={cn(
                  "p-3.5 rounded-lg border text-xs space-y-1.5",
                  explainingPlayer.attendanceCriterionMet
                    ? "bg-emerald-50/50 border-emerald-200"
                    : "bg-amber-50/50 border-amber-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">
                    Criterion 1: Attendance (≥ 75%)
                  </span>
                  {explainingPlayer.attendanceCriterionMet ? (
                    <span className="text-emerald-700 font-bold">Requirement Met ✓</span>
                  ) : (
                    <span className="text-amber-700 font-bold">Incomplete ✗</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Current Attendance Rate:</span>
                  <span className="font-bold text-slate-900">
                    {explainingPlayer.attendancePercentage}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Sessions Completed:</span>
                  <span>
                    {explainingPlayer.presentSessions} present of {explainingPlayer.applicableClosedSessions} closed sessions
                  </span>
                </div>
              </div>

              {/* Criterion 2: Matches */}
              <div
                className={cn(
                  "p-3.5 rounded-lg border text-xs space-y-1.5",
                  explainingPlayer.matchCriterionMet
                    ? "bg-emerald-50/50 border-emerald-200"
                    : "bg-amber-50/50 border-amber-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">
                    Criterion 2: Finalized Matches (≥ 2)
                  </span>
                  {explainingPlayer.matchCriterionMet ? (
                    <span className="text-emerald-700 font-bold">Requirement Met ✓</span>
                  ) : (
                    <span className="text-amber-700 font-bold">Incomplete ✗</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Finalized Matches Played:</span>
                  <span className="font-bold text-slate-900">
                    {explainingPlayer.finalizedMatchesPlayed} match(es)
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Average Performance Score:</span>
                  <span>
                    {explainingPlayer.averageIndividualScore !== null
                      ? `${explainingPlayer.averageIndividualScore.toFixed(1)} / 10`
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Reasons Summary */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-600">
                <span className="font-semibold text-slate-900 block">
                  Authoritative Evaluation Log:
                </span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {explainingPlayer.readinessReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>

              <div className="text-[11px] text-slate-400 text-center">
                Readiness is dynamically calculated from official closed sessions and finalized matches. Manual override is prohibited.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Link href={`/dashboard/coach/players/${explainingPlayer.playerId}`}>
                <Button variant="outline" size="sm" className="text-xs">
                  Open Player Profile &rarr;
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setExplainingPlayer(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
