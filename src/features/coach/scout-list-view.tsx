"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { ActivationCodeModal } from "@/components/shared/activation-code-modal";
import {
  UsersIcon,
  PlusIcon,
  SearchIcon,
  CalendarIcon,
  RefreshIcon,
  SpinnerIcon,
  CloseIcon,
} from "@/components/ui/icons";
import type { PopulatedScoutResult, ScoutStatsDTO } from "@/lib/services";

export interface ScoutListViewProps {
  initialScouts?: PopulatedScoutResult[] | null;
  initialPagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  initialStats?: ScoutStatsDTO | null;
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

export function ScoutListView({
  initialScouts = null,
  initialPagination = null,
  initialStats = null,
}: ScoutListViewProps) {
  const router = useRouter();
  const [scouts, setScouts] = useState<PopulatedScoutResult[] | null>(initialScouts);
  const [pagination, setPagination] = useState(
    initialPagination || { total: 0, page: 1, limit: 10, totalPages: 1 }
  );
  const [stats, setStats] = useState<ScoutStatsDTO>(
    initialStats || { totalScouts: 0, activeScouts: 0, pendingScouts: 0 }
  );

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "pending" | "archived">("all");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(!initialScouts);
  const [error, setError] = useState<string | null>(null);

  // Synchronize when server component props update
  const [prevInitialScouts, setPrevInitialScouts] = useState(initialScouts);
  if (initialScouts && initialScouts !== prevInitialScouts) {
    setPrevInitialScouts(initialScouts);
    setScouts(initialScouts);
    if (initialPagination) setPagination(initialPagination);
    if (initialStats) setStats(initialStats);
  }

  // Modal states for creating a new scout
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Activation code display modal state
  const [activationModalData, setActivationModalData] = useState<{
    scoutName: string;
    scoutEmail: string;
    code: string;
    expiresAt: string | Date;
  } | null>(null);

  // Regeneration loading tracking
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const isInitialMount = useRef(true);

  const fetchScouts = useCallback(
    async (targetPage = page) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (status && status !== "all") params.set("status", status);
        params.set("page", targetPage.toString());
        params.set("limit", "10");

        const res = await fetch(`/api/coach/scouts?${params.toString()}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to fetch scouts");
        }

        // Defensively extract scouts array from standard response shapes
        const scoutsList: PopulatedScoutResult[] = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.data?.scouts)
          ? json.data.scouts
          : Array.isArray(json.scouts)
          ? json.scouts
          : [];

        const paginationData = json.pagination || json.data?.pagination;
        const statsData = json.stats || json.data?.stats;

        setScouts(scoutsList);
        if (paginationData) {
          setPagination(paginationData);
        }
        if (statsData) {
          setStats(statsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load scouts");
        // Crucial invariant: never overwrite existing successfully loaded scouts on an error
      } finally {
        setLoading(false);
      }
    },
    [search, status, page]
  );

  // Search/filter trigger on effect with debounce
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // If server already provided initialScouts and no filters are active, preserve them without an immediate redundant re-fetch
      if (initialScouts !== null && search === "" && status === "all") {
        return;
      }
    }

    const timer = setTimeout(() => {
      fetchScouts(1);
      setPage(1);
    }, 250);

    return () => clearTimeout(timer);
  }, [search, status, fetchScouts, initialScouts]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPage(newPage);
    fetchScouts(newPage);
  };

  const handleOpenAddModal = () => {
    setFullName("");
    setEmail("");
    setModalError(null);
    setIsAddModalOpen(true);
  };

  const handleCreateScout = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setModalError("Scout full name must be between 2 and 100 characters long.");
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setModalError("Please provide a valid email address.");
      return;
    }

    setModalSubmitting(true);
    try {
      const res = await fetch("/api/coach/scouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: trimmedName,
          email: trimmedEmail,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create scout account.");
      }

      setFullName("");
      setEmail("");
      setModalError(null);
      setIsAddModalOpen(false);
      setActivationModalData({
        scoutName: json.data.scout.fullName,
        scoutEmail: json.data.user.email,
        code: json.data.activationCode,
        expiresAt: json.data.expiresAt,
      });

      await fetchScouts(1);
      setPage(1);
      router.refresh();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleRegenerateCode = async (scout: PopulatedScoutResult) => {
    try {
      setRegeneratingId(scout.id);
      const res = await fetch(`/api/coach/scouts/${scout.id}/activation-code`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to generate activation code.");
      }

      setActivationModalData({
        scoutName: json.data.scout.fullName,
        scoutEmail: json.data.scout.email,
        code: json.data.code,
        expiresAt: json.data.expiresAt,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate activation code.");
    } finally {
      setRegeneratingId(null);
    }
  };

  const statusOptions = [
    { value: "all", label: "All Account Statuses" },
    { value: "active", label: "Active Only" },
    { value: "pending", label: "Pending Activation" },
    { value: "archived", label: "Archived" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2D7C3]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-barlow-condensed font-bold tracking-wider uppercase bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E]">
              <SearchIcon className="w-3.5 h-3.5 text-[#4ADE80]" />
              TALENT DISCOVERY &amp; SCOUTING NETWORK
            </span>
            <span className="text-xs font-barlow-condensed font-semibold text-[#665C52]">
              • {stats.totalScouts} TOTAL SCOUTS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-alfa text-[#132B32] uppercase tracking-tight leading-tight mt-1">
            Scout Management
          </h1>
          <p className="text-xs sm:text-sm text-[#665C52]">
            Create scout credentials, issue secure single-use activation codes, and supervise talent discovery access.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold text-xs sm:text-sm h-9 px-4 rounded-xl shadow-xs gap-1.5 cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>+ Add Scout</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Row (Vintage Scoreboard Plaques) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <MetricCard
          title="TOTAL SCOUTS"
          value={String(stats.totalScouts).padStart(2, "0")}
          subtitle="Registered talent scout accounts"
        />

        <MetricCard
          title="ACTIVE SCOUTS"
          value={String(stats.activeScouts).padStart(2, "0")}
          subtitle="Authorized to scout athletes"
        />

        <MetricCard
          title="PENDING ACTIVATION"
          value={String(stats.pendingScouts).padStart(2, "0")}
          subtitle="Awaiting passcode setup"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3.5">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A6D5F]">
            <SearchIcon className="w-4 h-4" />
          </div>
          <Input
            placeholder="Search by scout name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | "active" | "pending" | "archived")}
            className="w-full text-xs bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
          />
        </div>

        {(search || status !== "all") && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSearch("");
              setStatus("all");
            }}
            className="text-xs h-9 shrink-0 font-barlow-condensed font-bold text-[#D95B24] hover:text-[#B84617] hover:bg-[#F5EBD8]"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Main Content: Error / Loading / Data / Empty */}
      {error && (!scouts || scouts.length === 0) ? (
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl p-8 sm:p-12 text-center shadow-xs">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <span className="w-3 h-3 rounded-full bg-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#132B32]">Failed to Load Talent Scouts</h3>
              <p className="text-xs text-[#665C52] mt-1">{error}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchScouts(page)}
              className="font-barlow-condensed font-bold bg-[#FFF9EF] border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8]"
            >
              Retry
            </Button>
          </div>
        </div>
      ) : loading && (!scouts || scouts.length === 0) ? (
        <LoadingState message="Loading talent scouts..." />
      ) : scouts && scouts.length > 0 ? (
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl overflow-hidden shadow-xs">
          {error && (
            <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center justify-between">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={() => fetchScouts(page)} className="text-xs h-7 px-2">
                Retry
              </Button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5EBD8] border-b border-[#E2D7C3] text-[#132B32] font-barlow-condensed font-bold uppercase tracking-wider text-xs sm:text-[13px]">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Scout</th>
                  <th scope="col" className="py-3.5 px-4">Email</th>
                  <th scope="col" className="py-3.5 px-4">Account Status</th>
                  <th scope="col" className="py-3.5 px-4">Registered Date</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE0CF]/60 text-slate-700">
                {scouts.map((scout) => {
                  const registeredDate = new Date(scout.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const initials = getInitials(scout.fullName);

                  return (
                    <tr key={scout.id} className="hover:bg-[#F5EBD8]/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#132B32]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#EEDDC5] text-[#132B32] font-serif font-bold flex items-center justify-center text-xs shrink-0 border border-[#DACBB4]">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-[#132B32] text-sm">
                              {scout.fullName}
                            </div>
                            <div className="font-mono text-[10px] text-[#7A6D5F]">
                              ID: {scout.id.slice(-8).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#665C52] font-mono text-[11px]">
                        {scout.email}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {scout.status === "active" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-barlow-condensed font-bold bg-[#E5F4EB] text-[#1F5A38] border border-[#99C7AB]/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1F5A38]" />
                            <span>Active</span>
                          </span>
                        ) : scout.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-barlow-condensed font-bold bg-[#FFF4DE] text-[#9A6700] border border-[#F0D08A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#9A6700]" />
                            <span>Pending Activation</span>
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
                          <span>{registeredDate}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {scout.status === "pending" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRegenerateCode(scout)}
                            disabled={regeneratingId === scout.id}
                            className="font-barlow-condensed font-bold text-xs h-8 px-3 text-[#132B32] bg-[#FFF9EF] border-[#DACBB4] hover:bg-[#F5EBD8] hover:text-[#D95B24] shadow-2xs rounded-lg gap-1.5"
                          >
                            {regeneratingId === scout.id ? (
                              <>
                                <SpinnerIcon className="w-3.5 h-3.5 text-[#D95B24]" />
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <RefreshIcon className="w-3.5 h-3.5 text-[#D95B24]" />
                                <span>Get Code</span>
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-[#7A6D5F] text-xs font-barlow-condensed font-medium italic">
                            Account Active
                          </span>
                        )}
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
              Showing <span className="font-bold text-[#132B32]">{scouts.length}</span> of{" "}
              <span className="font-bold text-[#132B32]">{pagination.total}</span> scout accounts
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
          title={search || status !== "all" ? "No Matching Scouts Found" : "No Talent Scouts Registered"}
          description={
            search || status !== "all"
              ? "No scouts matched your active search or filter criteria. Try adjusting or clearing your filters."
              : "Your academy currently has no registered talent scouts. Provision an account to provide talent scouting access."
          }
          action={
            search || status !== "all" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatus("all");
                }}
                className="font-barlow-condensed font-bold bg-[#FFF9EF] border-[#DACBB4] text-[#132B32]"
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleOpenAddModal}
                className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold"
              >
                Add First Scout
              </Button>
            )
          }
        />
      )}

      {/* Add Scout Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#11262C]/70 backdrop-blur-xs transition-opacity"
            onClick={() => !modalSubmitting && setIsAddModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl shadow-2xl p-6 z-10 space-y-5 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-barlow-condensed font-bold tracking-wider uppercase bg-[#1F382B] text-[#FFF9EF]">
                  <UsersIcon className="w-3 h-3 text-[#4ADE80]" />
                  SCOUT PROVISIONING
                </span>
                <h3 className="font-alfa text-lg text-[#132B32] tracking-tight">
                  Add Talent Scout
                </h3>
                <p className="text-xs text-[#665C52]">
                  Create account credentials and issue an activation code for onboarding.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={modalSubmitting}
                className="p-1 rounded-lg text-[#7A6D5F] hover:text-[#132B32] hover:bg-[#F5EBD8] cursor-pointer"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateScout} className="space-y-4">
              <div>
                <label className="block text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32] mb-1.5">
                  Full Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Marcus Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={modalSubmitting}
                  className="w-full text-xs bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
                />
              </div>

              <div>
                <label className="block text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32] mb-1.5">
                  Email Address *
                </label>
                <Input
                  required
                  type="email"
                  placeholder="scout@club.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={modalSubmitting}
                  className="w-full text-xs bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={modalSubmitting}
                  className="font-barlow-condensed font-bold text-xs text-[#132B32] bg-[#FFF9EF] border-[#DACBB4]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={modalSubmitting}
                  className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold text-xs px-4"
                >
                  {modalSubmitting ? (
                    <>
                      <SpinnerIcon className="w-3.5 h-3.5" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create &amp; Generate Code</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activation Code Modal */}
      {activationModalData && (
        <ActivationCodeModal
          isOpen={true}
          onClose={() => setActivationModalData(null)}
          title={`Scout Activation: ${activationModalData.scoutName}`}
          description={`Provide this single-use activation code to ${activationModalData.scoutEmail} to complete scout onboarding.`}
          code={activationModalData.code}
          expiresAt={activationModalData.expiresAt}
        />
      )}
    </div>
  );
}
