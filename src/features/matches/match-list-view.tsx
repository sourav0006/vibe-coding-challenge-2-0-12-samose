"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateOnly } from "@/lib/utils";
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

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Academy Match Fixtures
          </h2>
          <p className="text-sm text-slate-500">
            Schedule competitive fixtures, record individual player scores, and finalize immutable performance records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coach/matches/new">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-colors"
              size="md"
            >
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Match
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="w-full text-sm"
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
                Status
              </label>
              <Select
                id="status-filter"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | "draft" | "finalized")
                }
                className="w-full text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft (Editable)</option>
                <option value="finalized">Finalized (Locked)</option>
              </Select>
            </div>

            {/* Search Opponent */}
            <div>
              <label
                htmlFor="search-opponent"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1"
              >
                Opponent
              </label>
              <Input
                id="search-opponent"
                placeholder="Search opponent..."
                value={searchOpponent}
                onChange={(e) => setSearchOpponent(e.target.value)}
                className="w-full text-sm"
              />
            </div>

            {/* Start Date */}
            <div>
              <label
                htmlFor="start-date-filter"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1"
              >
                From Date
              </label>
              <Input
                id="start-date-filter"
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full text-sm"
              />
            </div>

            {/* End Date */}
            <div>
              <label
                htmlFor="end-date-filter"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1"
              >
                To Date
              </label>
              <Input
                id="end-date-filter"
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="w-full text-sm"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Filtered results active</span>
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

      {/* Main Content Area */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
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
              <Button variant="outline" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            ) : (
              <Link href="/dashboard/coach/matches/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Create First Match
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">
                      Match Date
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Sport
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Opponent
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-center">
                      Participants
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-center">
                      Avg Score
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-center">
                      Highest
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-center">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matches.map((match) => (
                    <tr
                      key={match.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4 font-medium text-slate-900 whitespace-nowrap">
                        {formatDateOnly(match.matchDate)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {match.sportName}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900 whitespace-nowrap">
                        vs. {match.opponentName}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className="font-semibold text-slate-700">
                          {match.participantCount}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">players</span>
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        {match.averageScore !== null ? (
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-200">
                            {match.averageScore.toFixed(1)} / 10
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        {match.highestScore !== null ? (
                          <span className="font-medium text-slate-700 text-xs">
                            {match.highestScore.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        {match.status === "finalized" ? (
                          <Badge variant="success">Finalized</Badge>
                        ) : (
                          <Badge variant="warning">Draft</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <Link href={`/dashboard/coach/matches/${match.id}`}>
                          <Button
                            size="sm"
                            variant={match.status === "finalized" ? "outline" : "primary"}
                            className={
                              match.status === "finalized"
                                ? "text-slate-700 hover:bg-slate-100"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }
                          >
                            {match.status === "finalized" ? "View Summary" : "Enter Scores"}
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
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
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
                  >
                    Previous
                  </Button>
                  <span className="text-xs font-medium text-slate-700 px-2">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchMatches(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
