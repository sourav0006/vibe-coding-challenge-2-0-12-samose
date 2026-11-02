"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateOnly } from "@/lib/utils";
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            Practice Sessions
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--color-text-secondary)]">
            Schedule practice sessions, conduct roll-calls, and record official attendance rosters.
          </p>
        </div>
        <div>
          <Link href="/dashboard/coach/sessions/new">
            <Button variant="primary" size="md" className="gap-2 shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Session
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="bordered" className="bg-white">
          <CardHeader className="pb-1">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Total Sessions
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[var(--color-text-primary)]">
              {totalSessionsCount}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Across all sports catalogued</p>
          </CardContent>
        </Card>

        <Card variant="bordered" className="bg-white">
          <CardHeader className="pb-1">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Open Sessions
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-700">
              {openSessionsCount}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Ready for attendance marking</p>
          </CardContent>
        </Card>

        <Card variant="bordered" className="bg-white">
          <CardHeader className="pb-1">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Finalized Sessions
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-700">
              {closedSessionsCount}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Immutable attendance records</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card variant="bordered" className="bg-white">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Filter by Sport
              </label>
              <Select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
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
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Session Status
              </label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "open" | "closed")}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "open", label: "Open (In Progress)" },
                  { value: "closed", label: "Closed (Finalized)" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Session Date
              </label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleResetFilters}
                  className="w-full text-xs h-10"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Sessions Table / List */}
      <Card variant="bordered" className="bg-white overflow-hidden shadow-xs">
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
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Reset Filters
                  </Button>
                ) : (
                  <Link href="/dashboard/coach/sessions/new">
                    <Button variant="primary" size="sm">
                      Create Practice Session
                    </Button>
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-background-subtle)] text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Sport</th>
                  <th className="py-3 px-4 text-center">Applicable Players</th>
                  <th className="py-3 px-4 text-center">Attendance Breakdown</th>
                  <th className="py-3 px-4 text-center">Completion</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] font-normal text-[var(--color-text-primary)]">
                {sessions.map((session) => {
                  const formattedDate = formatDateOnly(session.sessionDate);
                  const markedPercentage =
                    session.applicableCount > 0
                      ? Math.round((session.markedCount / session.applicableCount) * 100)
                      : 0;

                  return (
                    <tr
                      key={session.id}
                      className="hover:bg-[var(--color-background-subtle)]/60 transition-colors"
                    >
                      {/* Session Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-sm text-[var(--color-text-primary)]">
                          {formattedDate}
                        </div>
                      </td>

                      {/* Sport */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold text-xs bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                          {session.sportName}
                        </span>
                      </td>

                      {/* Applicable Roster Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-sm text-[var(--color-text-primary)]">
                          {session.applicableCount}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)] ml-1">players</span>
                      </td>

                      {/* Present / Absent Breakdown */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2 font-medium">
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <strong>{session.presentCount}</strong> Present
                          </span>
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <strong>{session.absentCount}</strong> Absent
                          </span>
                        </div>
                      </td>

                      {/* Marking Progress */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {session.isComplete ? (
                            <Badge variant="success" size="sm">
                              Complete ({session.markedCount}/{session.applicableCount})
                            </Badge>
                          ) : (
                            <div className="flex flex-col items-center gap-1 w-28">
                              <Badge variant="warning" size="sm">
                                {session.markedCount} / {session.applicableCount} Marked
                              </Badge>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${markedPercentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Session Status */}
                      <td className="py-3.5 px-4 text-center">
                        {session.status === "open" ? (
                          <Badge variant="success" size="sm" dot>
                            Open
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            Closed
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/dashboard/coach/sessions/${session.id}`}>
                          <Button
                            variant={session.status === "open" ? "primary" : "outline"}
                            size="sm"
                            className="text-xs h-8"
                          >
                            {session.status === "open" ? "Mark Attendance" : "View Sheet"}
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
          <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
            <div>
              Showing page <strong>{pagination.page}</strong> of{" "}
              <strong>{pagination.totalPages}</strong> ({pagination.total} total sessions)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchSessions(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchSessions(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
