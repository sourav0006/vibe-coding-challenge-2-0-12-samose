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
  CalendarIcon,
  PlusIcon,
  UsersIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";
import { formatDateOnly, cn } from "@/lib/utils";
import type { SessionListItemDTO } from "@/lib/services";

export interface SportOption {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface SessionListViewProps {
  initialSessions: SessionListItemDTO[];
  initialPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  sportsList: SportOption[];
}

export function SessionListView({
  initialSessions,
  initialPagination,
  sportsList,
}: SessionListViewProps) {
  const [sessions, setSessions] = useState<SessionListItemDTO[]>(initialSessions);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize when server component props update
  const [prevInitialSessions, setPrevInitialSessions] = useState(initialSessions);
  if (initialSessions !== prevInitialSessions) {
    setPrevInitialSessions(initialSessions);
    setSessions(initialSessions);
    setPagination(initialPagination);
  }

  // Filters
  const [sportFilter, setSportFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  const [dateFilter, setDateFilter] = useState("");

  const fetchSessions = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (sportFilter !== "all") params.set("sportId", sportFilter);
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (dateFilter) {
          params.set("startDate", dateFilter);
          params.set("endDate", dateFilter);
        }
        params.set("page", pageToLoad.toString());
        params.set("limit", "20");

        const res = await fetch(`/api/coach/sessions?${params.toString()}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to load practice sessions.");
        }

        setSessions(json.data);
        setPagination(json.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching practice sessions.");
      } finally {
        setLoading(false);
      }
    },
    [sportFilter, statusFilter, dateFilter]
  );

  // Re-fetch when filters change (skip initial mount since props are passed)
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchSessions(1);
  }, [fetchSessions]);

  const handleResetFilters = () => {
    setSportFilter("all");
    setStatusFilter("all");
    setDateFilter("");
  };

  const hasActiveFilters = sportFilter !== "all" || statusFilter !== "all" || dateFilter !== "";

  // Summary counts from current view
  const totalSessionsCount = pagination.total;
  const openSessionsCount = sessions.filter((s) => s.status === "open").length;
  const closedSessionsCount = sessions.filter((s) => s.status === "closed").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2D7C3]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-barlow-condensed font-bold tracking-wider uppercase bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E]">
              <CalendarIcon className="w-3.5 h-3.5 text-[#4ADE80]" />
              PRACTICE SESSIONS
            </span>
            <span className="text-xs font-barlow-condensed font-semibold text-[#665C52]">
              • {totalSessionsCount} TOTAL SCHEDULED
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-alfa text-[#132B32] uppercase tracking-tight leading-tight mt-1">
            Training &amp; Attendance
          </h1>
          <p className="text-xs sm:text-sm text-[#665C52]">
            Schedule practice sessions, conduct roll-calls, and record official attendance rosters.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/dashboard/coach/sessions/new">
            <Button
              className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold text-xs sm:text-sm h-9 px-4 rounded-xl shadow-xs gap-1.5 cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>+ Create Session</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <MetricCard
          title="TOTAL SESSIONS"
          value={String(totalSessionsCount).padStart(2, "0")}
          subtitle="Across all catalogued sports"
        />

        <MetricCard
          title="OPEN SESSIONS"
          value={String(openSessionsCount).padStart(2, "0")}
          subtitle="Ready for roll-call marking"
        />

        <MetricCard
          title="FINALIZED SESSIONS"
          value={String(closedSessionsCount).padStart(2, "0")}
          subtitle="Locked attendance rosters"
        />
      </div>

      {/* Filters Card */}
      <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-barlow-condensed font-bold text-[#132B32] uppercase tracking-wider mb-1">
              Filter by Sport
            </label>
            <Select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="w-full text-xs bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
              options={[
                { value: "all", label: "All Sports" },
                ...sportsList.map((s) => ({
                  value: s.id,
                  label: s.isActive === false ? `${s.name} (Inactive)` : s.name,
                })),
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-barlow-condensed font-bold text-[#132B32] uppercase tracking-wider mb-1">
              Session Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "open" | "closed")}
              className="w-full text-xs bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
              options={[
                { value: "all", label: "All Statuses" },
                { value: "open", label: "Open (In Progress)" },
                { value: "closed", label: "Closed (Finalized)" },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-barlow-condensed font-bold text-[#132B32] uppercase tracking-wider mb-1">
              Session Date
            </label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full text-xs bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
            />
          </div>

          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="w-full text-xs h-9 font-barlow-condensed font-bold text-[#D95B24] hover:text-[#B84617] hover:bg-[#F5EBD8] border-[#DACBB4] rounded-xl cursor-pointer"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium shadow-xs">
          {error}
        </div>
      )}

      {/* Sessions Table / List */}
      <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16">
            <LoadingState message="Loading practice sessions..." />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title={hasActiveFilters ? "No matching sessions found" : "No practice sessions yet"}
              description={
                hasActiveFilters
                  ? "Try clearing or modifying your filter criteria."
                  : "Create your first practice session to start recording attendance rosters."
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" size="sm" onClick={handleResetFilters} className="font-barlow-condensed font-bold rounded-xl">
                    Reset Filters
                  </Button>
                ) : (
                  <Link href="/dashboard/coach/sessions/new">
                    <Button
                      size="sm"
                      className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold text-xs h-9 px-4 rounded-xl shadow-xs"
                    >
                      + Create Practice Session
                    </Button>
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5EBD8] border-b border-[#E2D7C3] text-[#132B32] font-barlow-condensed font-bold uppercase tracking-wider text-xs sm:text-[13px]">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Date</th>
                  <th scope="col" className="py-3.5 px-4">Sport</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Applicable Players</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Attendance Breakdown</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Completion</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Status</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE0CF]/60 text-[#132B32]">
                {sessions.map((session) => {
                  const formattedDate = formatDateOnly(session.sessionDate);
                  const markedPercentage =
                    session.applicableCount > 0
                      ? Math.round((session.markedCount / session.applicableCount) * 100)
                      : 0;

                  return (
                    <tr
                      key={session.id}
                      className="hover:bg-[#F5EBD8]/40 transition-colors"
                    >
                      {/* Session Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-[#F5EBD8] border border-[#E2D7C3] flex items-center justify-center text-[#132B32]">
                            <CalendarIcon className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-bold text-[#132B32] font-mono">{formattedDate}</span>
                        </div>
                      </td>

                      {/* Sport */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-barlow-condensed font-bold uppercase tracking-wider bg-[#E5F4EB] text-[#1F5A38] border border-[#C2E4CD]">
                          {session.sportName}
                        </span>
                      </td>

                      {/* Applicable Roster Count */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-[#132B32] bg-[#F5EBD8]/70 border border-[#E2D7C3] px-2.5 py-0.5 rounded-full text-xs font-mono">
                          <UsersIcon className="w-3.5 h-3.5 text-[#7A6D5F]" />
                          {session.applicableCount} players
                        </span>
                      </td>

                      {/* Present / Absent Breakdown */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2 font-semibold">
                          <span className="inline-flex items-center gap-1 text-[#1F5A38] bg-[#E5F4EB] px-2 py-0.5 rounded-md border border-[#C2E4CD] text-[11px] font-mono">
                            <strong>{session.presentCount}</strong> Present
                          </span>
                          <span className="inline-flex items-center gap-1 text-[#991B1B] bg-[#FEE2E2] px-2 py-0.5 rounded-md border border-[#FECACA] text-[11px] font-mono">
                            <strong>{session.absentCount}</strong> Absent
                          </span>
                        </div>
                      </td>

                      {/* Marking Progress */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          {session.isComplete ? (
                            <Badge variant="success" size="sm" dot>
                              Complete ({session.markedCount}/{session.applicableCount})
                            </Badge>
                          ) : (
                            <div className="flex flex-col items-center gap-1 w-28">
                              <Badge variant="warning" size="sm" dot>
                                {session.markedCount} / {session.applicableCount} Marked
                              </Badge>
                              <div className="w-full bg-[#EAE0CF] rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-[#D95B24] h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${markedPercentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Session Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {session.status === "open" ? (
                          <Badge variant="success" size="sm" dot>
                            Open
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            Finalized
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link href={`/dashboard/coach/sessions/${session.id}`} prefetch={true}>
                          <Button
                            variant={session.status === "open" ? "primary" : "outline"}
                            size="sm"
                            className={cn(
                              "text-xs font-barlow-condensed font-bold h-8 px-3 rounded-xl",
                              session.status === "open"
                                ? "bg-[#D95B24] hover:bg-[#C24F1D] text-white shadow-xs"
                                : "border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8]"
                            )}
                          >
                            <span>{session.status === "open" ? "Mark Attendance" : "View Sheet"}</span>
                            <ArrowRightIcon className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-[#F5EBD8] border-t border-[#E2D7C3] flex items-center justify-between text-xs text-[#665C52] font-barlow-condensed font-semibold">
            <div>
              Showing page <strong className="text-[#132B32]">{pagination.page}</strong> of{" "}
              <strong className="text-[#132B32]">{pagination.totalPages}</strong> ({pagination.total} total sessions)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchSessions(pagination.page - 1)}
                className="text-xs h-8 px-3 font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl"
              >
                &larr; Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchSessions(pagination.page + 1)}
                className="text-xs h-8 px-3 font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl"
              >
                Next &rarr;
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
