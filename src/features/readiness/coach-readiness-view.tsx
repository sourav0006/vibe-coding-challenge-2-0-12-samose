"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import {
  ActivityIcon,
  CheckCircleIcon,
  CalendarIcon,
  SwordsIcon,
  SearchIcon,
  ArrowRightIcon,
  CloseIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { PlayerReadinessDTO, CoachReadinessStats } from "@/lib/services";

export interface CoachReadinessViewProps {
  initialPlayers: PlayerReadinessDTO[];
  initialStats: CoachReadinessStats;
  sportsList: Array<{ id: string; name: string }>;
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

export function CoachReadinessView({
  initialPlayers,
  initialStats,
  sportsList,
}: CoachReadinessViewProps) {
  const [fetchedData, setFetchedData] = useState<{
    players: PlayerReadinessDTO[];
    stats: CoachReadinessStats;
  } | null>(null);

  const players = fetchedData?.players ?? initialPlayers;
  const stats = fetchedData?.stats ?? initialStats;

  // Client-side refresh on mount/navigation to guarantee zero stale state
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialPlayers && initialPlayers.length > 0) {
        return;
      }
    }
    let isMounted = true;
    fetch("/api/coach/readiness?limit=100")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success && json.data) {
          setFetchedData({
            players: json.data,
            stats: json.stats ?? initialStats,
          });
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [initialStats, initialPlayers]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2D7C3]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-barlow-condensed font-bold tracking-wider uppercase bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E]">
              <ActivityIcon className="w-3.5 h-3.5 text-[#4ADE80]" />
              SCOUTING READINESS ENGINE
            </span>
            <span className="text-xs font-barlow-condensed font-semibold text-[#665C52]">
              • {stats.totalReadyPlayers} SCOUT-QUALIFIED
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-alfa text-[#132B32] uppercase tracking-tight leading-tight mt-1">
            Athlete Scouting Readiness
          </h1>
          <p className="text-xs sm:text-sm text-[#665C52]">
            Dynamic qualification pipeline based on closed practice attendance (≥ 75%) and finalized match participation (≥ 2 matches).
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/dashboard/coach/players" prefetch={true}>
            <Button variant="outline" size="sm" className="font-barlow-condensed font-bold text-xs h-9 px-3.5 border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl cursor-pointer">
              Manage Players
            </Button>
          </Link>
          <Link href="/dashboard/coach/matches" prefetch={true}>
            <Button variant="outline" size="sm" className="font-barlow-condensed font-bold text-xs h-9 px-3.5 border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl cursor-pointer">
              Match Fixtures
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <MetricCard
          title="ACTIVE ROSTER"
          value={String(stats.totalPlayers).padStart(2, "0")}
          subtitle="Academy profiles"
        />

        <MetricCard
          title="SCOUT READY"
          value={String(stats.totalReadyPlayers).padStart(2, "0")}
          subtitle="Discoverable by scouts"
        />

        <MetricCard
          title="DEVELOPING"
          value={String(stats.totalNotReadyPlayers).padStart(2, "0")}
          subtitle="Criteria pending"
        />

        <MetricCard
          title="ATTENDANCE MET"
          value={String(stats.meetingAttendanceCriterion).padStart(2, "0")}
          subtitle="≥ 75% closed sessions"
        />

        <MetricCard
          title="MATCHES MET"
          value={String(stats.meetingMatchCriterion).padStart(2, "0")}
          subtitle="≥ 2 finalized matches"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* Search Input */}
          <div>
            <label className="block text-xs font-barlow-condensed font-bold text-[#132B32] uppercase tracking-wider mb-1">
              Search Player
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A6D5F]">
                <SearchIcon className="w-3.5 h-3.5" />
              </div>
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
              />
            </div>
          </div>

          {/* Sport Filter */}
          <div>
            <label className="block text-xs font-barlow-condensed font-bold text-[#132B32] uppercase tracking-wider mb-1">
              Sport
            </label>
            <Select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full text-xs bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
              options={[
                { value: "all", label: "All Sports" },
                ...sportsList.map((sport) => ({
                  value: sport.id,
                  label: sport.name,
                })),
              ]}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-barlow-condensed font-bold text-[#132B32] uppercase tracking-wider mb-1">
              Readiness Status
            </label>
            <Select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as "all" | "ready" | "not_ready")
              }
              className="w-full text-xs bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
              options={[
                { value: "all", label: `All Statuses (${players.length})` },
                { value: "ready", label: `Ready (${stats.totalReadyPlayers})` },
                { value: "not_ready", label: `Developing (${stats.totalNotReadyPlayers})` },
              ]}
            />
          </div>

          {/* Sort Controls */}
          <div>
            <label className="block text-xs font-barlow-condensed font-bold text-[#132B32] uppercase tracking-wider mb-1">
              Sort By
            </label>
            <div className="flex gap-2">
              <Select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "attendance" | "matches" | "name")
                }
                className="w-full text-xs bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
                options={[
                  { value: "name", label: "Player Name" },
                  { value: "attendance", label: "Attendance %" },
                  { value: "matches", label: "Matches Played" },
                ]}
              />
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3 py-1.5 text-xs font-barlow-condensed font-bold border border-[#DACBB4] rounded-xl bg-[#FFF9EF] text-[#132B32] hover:bg-[#F5EBD8] transition-colors shadow-2xs cursor-pointer shrink-0"
                title={`Sort ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
              >
                {sortOrder === "asc" ? "↑ ASC" : "↓ DESC"}
              </button>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-[#E2D7C3] flex items-center justify-between text-xs">
            <span className="text-[#665C52] font-barlow-condensed font-semibold">
              Filtered: {filteredPlayers.length} of {players.length} athletes
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[#D95B24] hover:text-[#B84617] font-barlow-condensed font-bold text-xs hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

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
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="font-barlow-condensed font-bold rounded-xl">
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5EBD8] border-b border-[#E2D7C3] text-[#132B32] font-barlow-condensed font-bold uppercase tracking-wider text-xs sm:text-[13px]">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Player</th>
                  <th scope="col" className="py-3.5 px-4">Sport</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Attendance Rate (≥ 75%)</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Finalized Matches (≥ 2)</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Avg Score</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Readiness Status</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE0CF]/60 text-[#132B32]">
                {filteredPlayers.map((player) => {
                  const initials = getInitials(player.fullName);

                  return (
                    <tr
                      key={player.playerId}
                      className="hover:bg-[#F5EBD8]/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#132B32] text-[#D5A64A] font-alfa flex items-center justify-center text-xs shrink-0 border border-[#D5A64A]/30">
                            {initials}
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/coach/players/${player.playerId}`}
                              prefetch={true}
                              className="font-bold text-[#132B32] hover:text-[#D95B24] transition-colors text-sm"
                            >
                              {player.fullName}
                            </Link>
                            <p className="text-[11px] text-[#665C52] font-mono">
                              {player.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-barlow-condensed font-bold uppercase tracking-wider bg-[#E5F4EB] text-[#1F5A38] border border-[#C2E4CD]">
                          {player.sportName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "font-bold text-xs px-2.5 py-0.5 rounded-full font-mono",
                                player.attendanceCriterionMet
                                  ? "text-[#1F5A38] bg-[#E5F4EB] border border-[#C2E4CD]"
                                  : "text-[#9A6700] bg-[#FFF4DE] border border-[#FAD79A]"
                              )}
                            >
                              {player.attendancePercentage}
                            </span>
                            {player.attendanceCriterionMet && (
                              <CheckCircleIcon className="w-3.5 h-3.5 text-[#1F5A38]" />
                            )}
                          </div>
                          <p className="text-[10px] text-[#7A6D5F] mt-0.5 font-mono">
                            {player.presentSessions} of {player.applicableClosedSessions} closed sessions
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "font-bold text-xs px-2.5 py-0.5 rounded-full font-mono",
                                player.matchCriterionMet
                                  ? "text-[#1F5A38] bg-[#E5F4EB] border border-[#C2E4CD]"
                                  : "text-[#9A6700] bg-[#FFF4DE] border border-[#FAD79A]"
                              )}
                            >
                              {player.finalizedMatchesPlayed} / 2 matches
                            </span>
                            {player.matchCriterionMet && (
                              <CheckCircleIcon className="w-3.5 h-3.5 text-[#1F5A38]" />
                            )}
                          </div>
                          <p className="text-[10px] text-[#7A6D5F] mt-0.5">
                            {player.matchCriterionMet ? "Requirement met" : "Needs more fixtures"}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {player.averageIndividualScore !== null ? (
                          <span className="font-alfa text-xs text-[#132B32] bg-[#F5EBD8] px-2.5 py-0.5 rounded-lg border border-[#E2D7C3]">
                            {player.averageIndividualScore.toFixed(1)} / 10
                          </span>
                        ) : (
                          <span className="text-[#A39687] font-mono">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {player.isReady ? (
                          <Badge variant="success" size="sm" dot>Scout Ready</Badge>
                        ) : (
                          <Badge variant="warning" size="sm" dot>Developing</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExplainingPlayer(player)}
                          className="text-xs font-barlow-condensed font-bold h-8 px-3 text-[#132B32] border-[#DACBB4] hover:bg-[#F5EBD8] rounded-xl cursor-pointer"
                        >
                          <span>Breakdown</span>
                          <ArrowRightIcon className="w-3 h-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Explanation Modal */}
      {explainingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-[#FFFDF8] rounded-2xl shadow-xl max-w-lg w-full border border-[#E2D7C3] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#E2D7C3] bg-[#F5EBD8] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-alfa text-[#132B32] uppercase tracking-wide">
                    {explainingPlayer.fullName}
                  </h3>
                  {explainingPlayer.isReady ? (
                    <Badge variant="success" size="sm" dot>Ready for Scouting</Badge>
                  ) : (
                    <Badge variant="warning" size="sm" dot>Developing</Badge>
                  )}
                </div>
                <p className="text-xs text-[#665C52] mt-0.5">
                  {explainingPlayer.sportName} • Age {explainingPlayer.age}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExplainingPlayer(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#7A6D5F] hover:text-[#132B32] hover:bg-[#EAE0CF] transition-colors cursor-pointer"
                title="Close modal"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Criterion 1: Attendance */}
              <div
                className={cn(
                  "p-4 rounded-xl border text-xs space-y-2",
                  explainingPlayer.attendanceCriterionMet
                    ? "bg-[#E5F4EB] border-[#C2E4CD]"
                    : "bg-[#FFF4DE] border-[#FAD79A]"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-barlow-condensed font-bold uppercase tracking-wider text-sm text-[#132B32] flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-[#7A6D5F]" />
                    Criterion 1: Attendance (≥ 75%)
                  </span>
                  {explainingPlayer.attendanceCriterionMet ? (
                    <span className="text-[#1F5A38] font-barlow-condensed font-bold uppercase tracking-wider bg-[#FFF9EF] px-2.5 py-0.5 rounded-full text-[11px] border border-[#C2E4CD]">Requirement Met ✓</span>
                  ) : (
                    <span className="text-[#9A6700] font-barlow-condensed font-bold uppercase tracking-wider bg-[#FFF9EF] px-2.5 py-0.5 rounded-full text-[11px] border border-[#FAD79A]">Incomplete ✗</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[#665C52]">
                  <span className="font-barlow-condensed font-bold uppercase tracking-wider text-xs">Current Attendance Rate:</span>
                  <span className="font-mono font-bold text-[#132B32] text-sm">
                    {explainingPlayer.attendancePercentage}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#665C52]">
                  <span className="font-barlow-condensed font-bold uppercase tracking-wider text-xs">Sessions Completed:</span>
                  <span className="font-mono font-medium text-[#132B32]">
                    {explainingPlayer.presentSessions} present of {explainingPlayer.applicableClosedSessions} closed sessions
                  </span>
                </div>
              </div>

              {/* Criterion 2: Matches */}
              <div
                className={cn(
                  "p-4 rounded-xl border text-xs space-y-2",
                  explainingPlayer.matchCriterionMet
                    ? "bg-[#E5F4EB] border-[#C2E4CD]"
                    : "bg-[#FFF4DE] border-[#FAD79A]"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-barlow-condensed font-bold uppercase tracking-wider text-sm text-[#132B32] flex items-center gap-1.5">
                    <SwordsIcon className="w-4 h-4 text-[#7A6D5F]" />
                    Criterion 2: Finalized Matches (≥ 2)
                  </span>
                  {explainingPlayer.matchCriterionMet ? (
                    <span className="text-[#1F5A38] font-barlow-condensed font-bold uppercase tracking-wider bg-[#FFF9EF] px-2.5 py-0.5 rounded-full text-[11px] border border-[#C2E4CD]">Requirement Met ✓</span>
                  ) : (
                    <span className="text-[#9A6700] font-barlow-condensed font-bold uppercase tracking-wider bg-[#FFF9EF] px-2.5 py-0.5 rounded-full text-[11px] border border-[#FAD79A]">Incomplete ✗</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[#665C52]">
                  <span className="font-barlow-condensed font-bold uppercase tracking-wider text-xs">Finalized Matches Played:</span>
                  <span className="font-mono font-bold text-[#132B32] text-sm">
                    {explainingPlayer.finalizedMatchesPlayed} match(es)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#665C52]">
                  <span className="font-barlow-condensed font-bold uppercase tracking-wider text-xs">Average Performance Score:</span>
                  <span className="font-alfa text-xs text-[#132B32]">
                    {explainingPlayer.averageIndividualScore !== null
                      ? `${explainingPlayer.averageIndividualScore.toFixed(1)} / 10`
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Reasons Summary */}
              <div className="p-3.5 bg-[#F5EBD8] border border-[#E2D7C3] rounded-xl text-xs space-y-1.5 text-[#132B32]">
                <span className="font-barlow-condensed font-bold uppercase tracking-wider block text-xs">
                  Authoritative Evaluation Log:
                </span>
                <ul className="list-disc pl-4 space-y-1 font-mono text-[11px] text-[#665C52]">
                  {explainingPlayer.readinessReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>

              <div className="text-[11px] text-[#7A6D5F] text-center font-mono">
                Readiness is dynamically calculated from official closed sessions and finalized matches. Manual override is prohibited.
              </div>
            </div>

            <div className="p-4 bg-[#F5EBD8] border-t border-[#E2D7C3] flex items-center justify-between">
              <Link href={`/dashboard/coach/players/${explainingPlayer.playerId}`} prefetch={true}>
                <Button variant="outline" size="sm" className="font-barlow-condensed font-bold text-xs border-[#DACBB4] text-[#132B32] hover:bg-[#FFF9EF] rounded-xl">
                  <span>Open Player Profile</span>
                  <ArrowRightIcon className="w-3 h-3 ml-1" />
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setExplainingPlayer(null)}
                className="bg-[#132B32] hover:bg-[#1C3E49] text-white text-xs font-barlow-condensed font-bold uppercase tracking-wider px-4 rounded-xl"
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
