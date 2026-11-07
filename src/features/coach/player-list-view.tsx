"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import {
  UsersIcon,
  PlusIcon,
  SearchIcon,
  CalendarIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
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

  // Synchronize when server component props update
  const [prevInitialPlayers, setPrevInitialPlayers] = useState(initialPlayers);
  if (initialPlayers && initialPlayers !== prevInitialPlayers) {
    setPrevInitialPlayers(initialPlayers);
    setPlayers(initialPlayers);
    if (initialPagination) setPagination(initialPagination);
  }

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
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // If server already provided initialPlayers and no filters are active, preserve them without an immediate redundant re-fetch
      if (initialPlayers !== null && search === "" && sportId === "all" && status === "all") {
        return;
      }
    }

    const timer = setTimeout(() => {
      fetchPlayers(1);
      setPage(1);
    }, 250);

    return () => clearTimeout(timer);
  }, [search, sportId, status, fetchPlayers, initialPlayers]);

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

  // Calculated KPI stats
  const activeCount = players ? players.filter((p) => p.status === "active").length : 0;
  const pendingCount = players ? players.filter((p) => p.status === "pending").length : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2D7C3]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-barlow-condensed font-bold tracking-wider uppercase bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E]">
              <UsersIcon className="w-3.5 h-3.5 text-[#4ADE80]" />
              ATHLETE MANAGEMENT
            </span>
            <span className="text-xs font-barlow-condensed font-semibold text-[#665C52]">
              • {pagination.total} TOTAL ATHLETES
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-alfa text-[#132B32] uppercase tracking-tight leading-tight mt-1">
            Academy Players Roster
          </h1>
          <p className="text-xs sm:text-sm text-[#665C52]">
            Search, filter, and manage academy player profiles, assigned disciplines, and activation statuses.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/dashboard/coach/players/new">
            <Button size="sm" className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold text-xs sm:text-sm h-9 px-4 rounded-xl shadow-xs gap-1.5 cursor-pointer">
              <PlusIcon className="w-3.5 h-3.5" />
              <span>+ Add Player</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Scoreboard KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <MetricCard
          title="TOTAL PLAYERS"
          value={String(pagination.total).padStart(2, "0")}
          subtitle="Enrolled academy athletes"
        />
        <MetricCard
          title="ACTIVE ATHLETES"
          value={String(activeCount).padStart(2, "0")}
          subtitle="Activated and training"
        />
        <MetricCard
          title="PENDING ACTIVATION"
          value={String(pendingCount).padStart(2, "0")}
          subtitle="Awaiting account onboarding"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3.5">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A6D5F]">
            <SearchIcon className="w-4 h-4" />
          </div>
          <Input
            placeholder="Search by player name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            options={sportOptions}
            value={sportId}
            onChange={(e) => setSportId(e.target.value)}
            className="w-full text-xs bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | "active" | "pending" | "archived")}
            className="w-full text-xs bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
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
            className="text-xs h-9 shrink-0 font-barlow-condensed font-bold text-[#D95B24] hover:text-[#B84617] hover:bg-[#F5EBD8]"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => fetchPlayers(page)}>
            Retry
          </Button>
        </div>
      )}

      {/* Table Section */}
      {loading && !players ? (
        <LoadingState message="Loading player roster..." />
      ) : players && players.length > 0 ? (
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5EBD8] border-b border-[#E2D7C3] text-[#132B32] font-barlow-condensed font-bold uppercase tracking-wider text-xs sm:text-[13px]">
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
              <tbody className="divide-y divide-[#EAE0CF]/60 text-slate-700">
                {players.map((player) => {
                  const joinedDate = new Date(player.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const initials = getInitials(player.fullName);

                  return (
                    <tr key={player.id} className="hover:bg-[#F5EBD8]/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#132B32]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#EEDDC5] text-[#132B32] font-serif font-bold flex items-center justify-center text-xs shrink-0 border border-[#DACBB4]">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-[#132B32] text-sm hover:text-[#D95B24] transition-colors">
                              {player.fullName}
                            </div>
                            <div className="font-mono text-[10px] text-[#7A6D5F]">
                              ID: {player.id.slice(-8).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#665C52] font-mono text-[11px]">
                        {player.email}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-barlow-condensed font-bold bg-[#E3EAF0] text-[#284457] border border-[#C5D5E2]">
                          {player.sportName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-[#132B32]">
                        <span className="inline-block bg-[#F7EFE0] border border-[#DACBB4] px-2 py-0.5 rounded text-xs font-barlow-condensed font-bold">
                          {player.age} yrs
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {player.status === "active" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-barlow-condensed font-bold bg-[#E5F4EB] text-[#1F5A38] border border-[#99C7AB]/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1F5A38]" />
                            <span>Active</span>
                          </span>
                        ) : player.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-barlow-condensed font-bold bg-[#FFF4DE] text-[#9A6700] border border-[#F0D08A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#9A6700]" />
                            <span>Pending Setup</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-barlow-condensed font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#7A6D5F] text-[11px] font-barlow-condensed whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-[#7A6D5F]" />
                          <span>{joinedDate}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link href={`/dashboard/coach/players/${player.id}`} prefetch={true}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-barlow-condensed font-bold text-xs h-8 px-2.5 text-[#132B32] bg-[#FFF9EF] border-[#DACBB4] hover:bg-[#F5EBD8] hover:text-[#D95B24] shadow-2xs rounded-lg"
                          >
                            <span>View Profile</span>
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

          {/* Pagination Controls */}
          <div className="py-3.5 px-4 bg-[#F5EBD8] border-t border-[#E2D7C3] flex items-center justify-between text-xs text-[#665C52] font-barlow-condensed">
            <div>
              Showing <span className="font-bold text-[#132B32]">{players.length}</span> of{" "}
              <span className="font-bold text-[#132B32]">{pagination.total}</span> player records
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => handlePageChange(page - 1)}
                className="text-xs h-8 px-3 font-barlow-condensed font-bold text-[#132B32] bg-[#FFF9EF] border-[#DACBB4] hover:bg-white disabled:opacity-50"
              >
                &larr; Previous
              </Button>
              <span className="font-bold text-[#132B32] px-2 text-xs">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pagination.totalPages || loading}
                onClick={() => handlePageChange(page + 1)}
                className="text-xs h-8 px-3 font-barlow-condensed font-bold text-[#132B32] bg-[#FFF9EF] border-[#DACBB4] hover:bg-white disabled:opacity-50"
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
                className="font-barlow-condensed font-bold bg-[#FFF9EF] border-[#DACBB4] text-[#132B32]"
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => router.push("/dashboard/coach/players/new")}
                className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold"
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
