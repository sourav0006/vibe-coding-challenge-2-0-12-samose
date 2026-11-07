"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import {
  SwordsIcon,
  PlusIcon,
  CalendarIcon,
  UsersIcon,
  SearchIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";
import { formatDateOnly, cn } from "@/lib/utils";
import type { MatchListItemDTO } from "@/lib/services";

export interface SportOption {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface MatchListViewProps {
  initialMatches: MatchListItemDTO[];
  initialPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  sportsList: SportOption[];
}

export function MatchListView({
  initialMatches,
  initialPagination,
  sportsList,
}: MatchListViewProps) {
  const [matches, setMatches] = useState<MatchListItemDTO[]>(initialMatches);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize when server component props update
  const [prevInitialMatches, setPrevInitialMatches] = useState(initialMatches);
  if (initialMatches !== prevInitialMatches) {
    setPrevInitialMatches(initialMatches);
    setMatches(initialMatches);
    setPagination(initialPagination);
  }

  // Filters
  const [sportFilter, setSportFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "finalized">("all");
  const [searchOpponent, setSearchOpponent] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const fetchMatches = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (sportFilter !== "all") params.set("sportId", sportFilter);
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (searchOpponent.trim()) params.set("search", searchOpponent.trim());
        if (startDateFilter) params.set("startDate", startDateFilter);
        if (endDateFilter) params.set("endDate", endDateFilter);
        params.set("page", pageToLoad.toString());
        params.set("limit", "20");

        const res = await fetch(`/api/coach/matches?${params.toString()}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to load matches.");
        }

        setMatches(json.data);
        setPagination(json.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load matches.");
      } finally {
        setLoading(false);
      }
    },
    [sportFilter, statusFilter, searchOpponent, startDateFilter, endDateFilter]
  );

  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchMatches(1);
  }, [fetchMatches]);

  const handleResetFilters = () => {
    setSportFilter("all");
    setStatusFilter("all");
    setSearchOpponent("");
    setStartDateFilter("");
    setEndDateFilter("");
  };

  const hasActiveFilters =
    sportFilter !== "all" ||
    statusFilter !== "all" ||
    searchOpponent.trim() !== "" ||
    startDateFilter !== "" ||
    endDateFilter !== "";

  const totalMatchesCount = pagination.total;
  const draftMatchesCount = matches.filter((m) => m.status === "draft").length;
  const finalizedMatchesCount = matches.filter((m) => m.status === "finalized").length;

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2D7C3]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-barlow-condensed font-bold tracking-wider uppercase bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E]">
              <SwordsIcon className="w-3.5 h-3.5 text-[#4ADE80]" />
              COMPETITION FIXTURES
            </span>
            <span className="text-xs font-barlow-condensed font-semibold text-[#665C52]">
              • {totalMatchesCount} TOTAL FIXTURES
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-alfa text-[#132B32] uppercase tracking-tight leading-tight mt-1">
            Academy Match Fixtures
          </h1>
          <p className="text-xs sm:text-sm text-[#665C52]">
            Schedule competitive fixtures, record individual player performance scores, and finalize match results.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/dashboard/coach/matches/new">
            <Button
              className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold text-xs sm:text-sm h-9 px-4 rounded-xl shadow-xs gap-1.5 cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>+ Create Match</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Mini KPI metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <MetricCard
          title="TOTAL FIXTURES"
          value={String(totalMatchesCount).padStart(2, "0")}
          subtitle="All competition records"
        />

        <MetricCard
          title="DRAFT FIXTURES"
          value={String(draftMatchesCount).padStart(2, "0")}
          subtitle="Awaiting score finalization"
        />

        <MetricCard
          title="FINALIZED FIXTURES"
          value={String(finalizedMatchesCount).padStart(2, "0")}
          subtitle="Official verified score sheets"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* Sport Filter */}
          <div>
            <label className="block text-xs font-barlow-condensed font-bold text-[#132B32] uppercase tracking-wider mb-1">
              Sport
            </label>
            <Select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
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
              Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "draft" | "finalized")
              }
              className="w-full text-xs bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
              options={[
                { value: "all", label: "All Statuses" },
                { value: "draft", label: "Draft (Editable)" },
                { value: "finalized", label: "Finalized (Locked)" },
              ]}
            />
          </div>

          {/* Search Opponent */}
          <div>
            <label className="block text-xs font-barlow-condensed font-bold text-[#132B32] uppercase tracking-wider mb-1">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A6D5F]">
                <SearchIcon className="w-3.5 h-3.5" />
              </div>
              <Input
                placeholder="Search title or opponent..."
                value={searchOpponent}
                onChange={(e) => setSearchOpponent(e.target.value)}
                className="w-full text-xs pl-8 bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-barlow-condensed font-bold text-[#132B32] uppercase tracking-wider mb-1">
              From Date
            </label>
            <Input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full text-xs bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-barlow-condensed font-bold text-[#132B32] uppercase tracking-wider mb-1">
              To Date
            </label>
            <Input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full text-xs bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-[#E2D7C3] flex items-center justify-between text-xs">
            <span className="text-[#665C52] font-barlow-condensed font-semibold">Filtered results active</span>
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

      {/* Main Content Area */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchMatches(pagination.page)}
            className="text-rose-700 border-rose-300 hover:bg-rose-100"
          >
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading matches..." />
      ) : matches.length === 0 ? (
        <EmptyState
          title="No matches found"
          description={
            hasActiveFilters
              ? "No matches match the selected filter criteria. Try clearing or relaxing the filters."
              : "No matches have been scheduled yet. Click 'Create Match' to schedule your first fixture."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={handleResetFilters} className="font-barlow-condensed font-bold rounded-xl">
                Clear Filters
              </Button>
            ) : (
              <Link href="/dashboard/coach/matches/new">
                <Button className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold text-xs h-9 px-4 rounded-xl shadow-xs">
                  + Create First Match
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5EBD8] border-b border-[#E2D7C3] text-[#132B32] font-barlow-condensed font-bold uppercase tracking-wider text-xs sm:text-[13px]">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Match Title</th>
                  <th scope="col" className="py-3.5 px-4">Opponent</th>
                  <th scope="col" className="py-3.5 px-4">Sport</th>
                  <th scope="col" className="py-3.5 px-4">Match Date</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Participants</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Avg Score</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Highest</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Status</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE0CF]/60 text-[#132B32]">
                {matches.map((match) => (
                  <tr
                    key={match.id}
                    className="hover:bg-[#F5EBD8]/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-[#132B32] text-sm font-barlow-condensed tracking-wide">
                        {match.title || "Match Fixture"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#132B32] whitespace-nowrap">
                      vs. {match.opponentName}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-barlow-condensed font-bold uppercase tracking-wider bg-[#E5F4EB] text-[#1F5A38] border border-[#C2E4CD]">
                        {match.sportName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-[#F5EBD8] border border-[#E2D7C3] flex items-center justify-center text-[#132B32]">
                          <CalendarIcon className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-bold text-[#132B32] font-mono">{formatDateOnly(match.matchDate)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-bold text-[#132B32] bg-[#F5EBD8]/70 border border-[#E2D7C3] px-2.5 py-0.5 rounded-full text-xs font-mono">
                        <UsersIcon className="w-3 h-3 text-[#7A6D5F]" />
                        {match.participantCount} players
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {match.averageScore !== null ? (
                        <span className="inline-flex items-center gap-1 font-alfa text-xs text-[#132B32] bg-[#F5EBD8] px-2.5 py-0.5 rounded-lg border border-[#E2D7C3]">
                          {match.averageScore.toFixed(1)} / 10
                        </span>
                      ) : (
                        <span className="text-[#A39687] font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {match.highestScore !== null ? (
                        <span className="font-alfa text-xs text-[#1F5A38] bg-[#E5F4EB] px-2 py-0.5 rounded border border-[#C2E4CD]">
                          {match.highestScore.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-[#A39687] font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {match.status === "finalized" ? (
                        <Badge variant="success" size="sm" dot>Finalized</Badge>
                      ) : (
                        <Badge variant="warning" size="sm" dot>Draft</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link href={`/dashboard/coach/matches/${match.id}`}>
                        <Button
                          size="sm"
                          variant={match.status === "finalized" ? "outline" : "primary"}
                          className={cn(
                            "text-xs font-barlow-condensed font-bold h-8 px-3 rounded-xl",
                            match.status === "finalized"
                              ? "border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8]"
                              : "bg-[#D95B24] hover:bg-[#C24F1D] text-white shadow-xs"
                          )}
                        >
                          <span>{match.status === "finalized" ? "View Summary" : "Enter Scores"}</span>
                          <ArrowRightIcon className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {pagination.totalPages > 1 && (
            <div className="px-5 py-3.5 bg-[#F5EBD8] border-t border-[#E2D7C3] flex items-center justify-between text-xs text-[#665C52] font-barlow-condensed font-semibold">
              <span>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} matches
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchMatches(pagination.page - 1)}
                  className="text-xs h-8 px-3 font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl"
                >
                  &larr; Previous
                </Button>
                <span className="text-xs font-bold text-[#132B32] px-2 font-mono">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchMatches(pagination.page + 1)}
                  className="text-xs h-8 px-3 font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl"
                >
                  Next &rarr;
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
