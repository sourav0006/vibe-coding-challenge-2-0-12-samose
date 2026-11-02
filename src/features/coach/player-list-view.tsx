"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import type { PopulatedPlayerResult } from "@/lib/services";
import type { SportOption } from "./types";

export interface PlayerListViewProps {
  initialPlayers?: PopulatedPlayerResult[] | null;
  initialPagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  sportsList?: SportOption[];
}

export function PlayerListView({
  initialPlayers = null,
  initialPagination = null,
  sportsList = [],
}: PlayerListViewProps) {
  const router = useRouter();
  const [players, setPlayers] = useState<PopulatedPlayerResult[] | null>(initialPlayers);
  const [pagination, setPagination] = useState(
    initialPagination || { total: 0, page: 1, limit: 10, totalPages: 1 }
  );

  const [search, setSearch] = useState("");
  const [sportId, setSportId] = useState("all");
  const [status, setStatus] = useState<"all" | "active" | "pending" | "archived">("all");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(!initialPlayers);
  const [error, setError] = useState<string | null>(null);

  const [availableSports, setAvailableSports] = useState<SportOption[]>(sportsList);

  // Fetch active sports for filter if not passed
  useEffect(() => {
    if (sportsList.length === 0) {
      fetch("/api/coach/sports")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAvailableSports(data.data.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
          }
        })
        .catch(() => {});
    }
  }, [sportsList]);

  const fetchPlayers = useCallback(
    async (targetPage = page) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (sportId && sportId !== "all") params.set("sportId", sportId);
        if (status && status !== "all") params.set("status", status);
        params.set("page", targetPage.toString());
        params.set("limit", "10");

        const res = await fetch(`/api/coach/players?${params.toString()}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to fetch players");
        }

        setPlayers(json.data);
        setPagination(json.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load players");
      } finally {
        setLoading(false);
      }
    },
    [search, sportId, status, page]
  );

  // Search/filter trigger on effect with light debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPlayers(1);
      setPage(1);
    }, 250);

    return () => clearTimeout(timer);
  }, [search, sportId, status, fetchPlayers]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPage(newPage);
    fetchPlayers(newPage);
  };

  const sportOptions = [
    { value: "all", label: "All Sports" },
    ...availableSports.map((s) => ({ value: s.id, label: s.name })),
  ];

  const statusOptions = [
    { value: "all", label: "All Account Statuses" },
    { value: "active", label: "Active Only" },
    { value: "pending", label: "Pending Activation" },
    { value: "archived", label: "Archived" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Player Management"
        description="Search, filter, and manage academy player profiles, assigned disciplines, and activation statuses."
        actions={
          <Link href="/dashboard/coach/players/new">
            <Button size="sm" variant="primary" className="gap-1.5 text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Add Player</span>
            </Button>
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl p-4 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by player name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs"
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            options={sportOptions}
            value={sportId}
            onChange={(e) => setSportId(e.target.value)}
            className="w-full text-xs"
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | "active" | "pending" | "archived")}
            className="w-full text-xs"
          />
        </div>

        {(search || sportId !== "all" || status !== "all") && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSearch("");
              setSportId("all");
              setStatus("all");
            }}
            className="text-xs h-9 shrink-0 text-[var(--color-text-secondary)]"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={() => fetchPlayers(page)}>
            Retry
          </Button>
        </div>
      )}

      {/* Table Section */}
      {loading && !players ? (
        <LoadingState message="Loading player roster..." />
      ) : players && players.length > 0 ? (
        <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-background-subtle)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)] uppercase font-semibold">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Player</th>
                  <th scope="col" className="py-3.5 px-4">Email</th>
                  <th scope="col" className="py-3.5 px-4">Sport</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Age</th>
                  <th scope="col" className="py-3.5 px-4">Account Status</th>
                  <th scope="col" className="py-3.5 px-4">Joined</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
                {players.map((player) => {
                  const joinedDate = new Date(player.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={player.id} className="hover:bg-[var(--color-background-subtle)]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[var(--color-text-primary)] text-sm">
                          {player.fullName}
                        </div>
                        <div className="font-mono text-[10px] text-[var(--color-text-muted)]">
                          ID: {player.id.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--color-text-secondary)] font-mono text-[11px]">
                        {player.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--color-background-subtle)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
                          {player.sportName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-[var(--color-text-primary)]">
                        {player.age}
                      </td>
                      <td className="py-3.5 px-4">
                        {player.status === "active" ? (
                          <Badge variant="success" size="sm" dot>Active</Badge>
                        ) : player.status === "pending" ? (
                          <Badge variant="warning" size="sm" dot>Pending</Badge>
                        ) : (
                          <Badge variant="default" size="sm">Archived</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--color-text-muted)] font-mono text-[11px]">
                        {joinedDate}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/dashboard/coach/players/${player.id}`}>
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2.5">
                            View Profile
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="py-3 px-4 bg-[var(--color-background-subtle)] border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
            <div>
              Showing <span className="font-semibold text-[var(--color-text-primary)]">{players.length}</span> of{" "}
              <span className="font-semibold text-[var(--color-text-primary)]">{pagination.total}</span> player records
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => handlePageChange(page - 1)}
                className="text-xs h-7 px-2"
              >
                &larr; Previous
              </Button>
              <span className="font-medium text-[var(--color-text-primary)] px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pagination.totalPages || loading}
                onClick={() => handlePageChange(page + 1)}
                className="text-xs h-7 px-2"
              >
                Next &rarr;
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title={search || sportId !== "all" || status !== "all" ? "No Matching Players Found" : "No Players Enrolled"}
          description={
            search || sportId !== "all" || status !== "all"
              ? "No players matched your active search or filter criteria. Try adjusting or clearing your filters."
              : "Your academy roster is currently empty. Create a new player account to begin onboarding."
          }
          action={
            search || sportId !== "all" || status !== "all" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setSportId("all");
                  setStatus("all");
                }}
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={() => router.push("/dashboard/coach/players/new")}
              >
                Create First Player
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
