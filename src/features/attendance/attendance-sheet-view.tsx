"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { MetricCard } from "@/components/ui/metric-card";
import { formatDateOnly, cn } from "@/lib/utils";
import type { SessionAttendanceSheetDTO } from "@/lib/services";

export interface AttendanceSheetViewProps {
  initialData: SessionAttendanceSheetDTO;
}

export function AttendanceSheetView({ initialData }: AttendanceSheetViewProps) {
  const router = useRouter();
  const [data, setData] = useState<SessionAttendanceSheetDTO>(initialData);
  const [filterTab, setFilterTab] = useState<"all" | "unmarked" | "present" | "absent">("all");
  const [search, setSearch] = useState("");
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isClosed = data.session.status === "closed";

  const refreshSheet = async () => {
    try {
      const res = await fetch(`/api/coach/sessions/${data.session.id}/attendance`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      }
    } catch {}
  };

  // Mark an individual player Present or Absent
  const handleMarkPlayer = async (playerId: string, status: "present" | "absent") => {
    if (isClosed) return;

    setSavingPlayerId(playerId);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Optimistic UI update
    const previousRoster = [...data.roster];
    const previousStats = { ...data.stats };

    const updatedRoster = data.roster.map((p) => {
      if (p.playerId === playerId) {
        return { ...p, status, markedAt: new Date() };
      }
      return p;
    });

    let presentCount = 0;
    let absentCount = 0;
    for (const p of updatedRoster) {
      if (p.status === "present") presentCount++;
      if (p.status === "absent") absentCount++;
    }
    const markedCount = presentCount + absentCount;
    const unmarkedCount = Math.max(0, updatedRoster.length - markedCount);
    const isComplete = updatedRoster.length > 0 && markedCount >= updatedRoster.length;

    setData({
      ...data,
      roster: updatedRoster,
      stats: {
        ...data.stats,
        presentCount,
        absentCount,
        markedCount,
        unmarkedCount,
        isComplete,
      },
    });

    try {
      const res = await fetch(`/api/coach/sessions/${data.session.id}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, status }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save attendance.");
      }

      setData(json.data);
    } catch (err) {
      // Revert optimistic update
      setData({ ...data, roster: previousRoster, stats: previousStats });
      setErrorMessage(err instanceof Error ? err.message : "Error saving attendance mark.");
    } finally {
      setSavingPlayerId(null);
    }
  };

  // Bulk mark all applicable players
  const handleBulkMark = async (status: "present" | "absent") => {
    if (isClosed || data.roster.length === 0) return;

    setBulkLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const records = data.roster.map((p) => ({
        playerId: p.playerId,
        status,
      }));

      const res = await fetch(`/api/coach/sessions/${data.session.id}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to bulk update attendance.");
      }

      setData(json.data);
      setSuccessMessage(`All ${data.roster.length} players marked ${status.toUpperCase()}.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Bulk update error.");
      await refreshSheet();
    } finally {
      setBulkLoading(false);
    }
  };

  // Finalize and close practice session
  const handleCloseSession = async () => {
    if (data.stats.unmarkedCount > 0) {
      setErrorMessage(
        `Cannot close session: ${data.stats.unmarkedCount} player(s) are still unmarked. All applicable players must have an explicit Present or Absent status.`
      );
      setIsCloseModalOpen(false);
      return;
    }

    setClosing(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/coach/sessions/${data.session.id}/close`, {
        method: "PATCH",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to finalize session.");
      }

      setIsCloseModalOpen(false);
      await refreshSheet();
      router.refresh();
      setSuccessMessage("Session has been finalized and closed. Attendance records are now immutable.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error closing session.");
    } finally {
      setClosing(false);
    }
  };

  // Filter roster by tab and search
  const filteredRoster = data.roster.filter((item) => {
    if (filterTab === "unmarked" && item.status !== null) return false;
    if (filterTab === "present" && item.status !== "present") return false;
    if (filterTab === "absent" && item.status !== "absent") return false;

    if (search.trim()) {
      const query = search.toLowerCase();
      const matchName = item.fullName.toLowerCase().includes(query);
      const matchEmail = item.email.toLowerCase().includes(query);
      return matchName || matchEmail;
    }

    return true;
  });

  const completionPercent =
    data.stats.applicableCount > 0
      ? Math.round((data.stats.markedCount / data.stats.applicableCount) * 100)
      : 0;

  const formattedDate = formatDateOnly(data.session.sessionDate);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/coach/sessions"
          className="text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#7A6D5F] hover:text-[#D95B24] transition-colors inline-flex items-center gap-1.5"
        >
          &larr; Back to Practice Sessions
        </Link>
      </div>

      {/* Session Title Header Card */}
      <div className="bg-[#FFFDF8] rounded-2xl border border-[#E2D7C3] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-alfa text-[#132B32] uppercase tracking-tight leading-tight">
                {formattedDate} &mdash; Attendance Sheet
              </h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-barlow-condensed font-bold uppercase tracking-wider bg-[#E5F4EB] text-[#1F5A38] border border-[#C2E4CD]">
                {data.session.sportName}
              </span>
              {isClosed ? (
                <Badge variant="default" size="sm">
                  Closed &bull; Immutable
                </Badge>
              ) : (
                <Badge variant="success" size="sm" dot>
                  Session Open
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs sm:text-sm text-[#665C52]">
              {isClosed
                ? `Attendance was finalized on ${new Date(data.session.closedAt || data.session.updatedAt).toLocaleString("en-US")}. Records are read-only.`
                : "Mark roll-call for all assigned players. Session can be finalized once all players have an explicit status."}
            </p>
          </div>

          {/* Action button */}
          {!isClosed && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="md"
                disabled={!data.stats.isComplete || closing}
                onClick={() => setIsCloseModalOpen(true)}
                className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold text-xs sm:text-sm h-9 px-4 rounded-xl shadow-xs whitespace-nowrap cursor-pointer"
              >
                Close &amp; Finalize Session
              </Button>
            </div>
          )}
        </div>

        {/* Closed Banner */}
        {isClosed && (
          <div className="mt-4 p-3 rounded-xl bg-[#F5EBD8] border border-[#E2D7C3] text-xs text-[#132B32] flex items-center gap-2 font-medium">
            <svg className="w-4 h-4 text-[#7A6D5F] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span>
              This session is closed. Backend validation rejects all modifications, updates, and reopen attempts.
            </span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <MetricCard
          title="APPLICABLE ROSTER"
          value={String(data.stats.applicableCount).padStart(2, "0")}
          subtitle="Eligible sport members"
        />

        <MetricCard
          title="MARKED PRESENT"
          value={String(data.stats.presentCount).padStart(2, "0")}
          subtitle={
            data.stats.applicableCount > 0
              ? `${Math.round((data.stats.presentCount / data.stats.applicableCount) * 100)}% attendance rate`
              : "No roster"
          }
        />

        <MetricCard
          title="MARKED ABSENT"
          value={String(data.stats.absentCount).padStart(2, "0")}
          subtitle="Documented absences"
        />

        <MetricCard
          title="UNMARKED PLAYERS"
          value={String(data.stats.unmarkedCount).padStart(2, "0")}
          subtitle={data.stats.unmarkedCount === 0 ? "Ready to close" : "Needs explicit mark"}
        />
      </div>

      {/* Progress & Bulk Operations Card */}
      <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 max-w-md space-y-1.5">
            <div className="flex items-center justify-between text-xs font-barlow-condensed font-bold uppercase tracking-wider">
              <span className="text-[#132B32]">Roster Roll-Call Progress</span>
              <span
                className={cn(
                  "font-mono font-bold text-xs",
                  data.stats.isComplete ? "text-[#1F5A38]" : "text-[#D95B24]"
                )}
              >
                {data.stats.markedCount} / {data.stats.applicableCount} Marked ({completionPercent}%)
              </span>
            </div>
            <div className="w-full bg-[#EAE0CF] rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  data.stats.isComplete ? "bg-[#1F5A38]" : "bg-[#D95B24]"
                )}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          {/* Bulk Controls */}
          {!isClosed && (
            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <Button
                variant="outline"
                size="sm"
                disabled={bulkLoading || data.roster.length === 0}
                onClick={() => handleBulkMark("present")}
                className="font-barlow-condensed font-bold border-[#C2E4CD] text-[#1F5A38] bg-[#E5F4EB] hover:bg-[#D1EBD9] rounded-xl text-xs h-8 px-3 cursor-pointer"
              >
                Mark All Present
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkLoading || data.roster.length === 0}
                onClick={() => handleBulkMark("absent")}
                className="font-barlow-condensed font-bold border-[#FECACA] text-[#991B1B] bg-[#FEE2E2] hover:bg-[#FDD2D2] rounded-xl text-xs h-8 px-3 cursor-pointer"
              >
                Mark All Absent
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Messages */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between shadow-xs">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-800 text-xs font-bold font-barlow-condensed cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold font-barlow-condensed cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Player Table Card with Filter Tabs */}
      <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl overflow-hidden shadow-xs">
        {/* Table Controls Bar */}
        <div className="p-4 border-b border-[#E2D7C3] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#F5EBD8]">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#FFF9EF] p-1 rounded-xl border border-[#DACBB4]">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-barlow-condensed font-bold tracking-wider uppercase transition-all cursor-pointer",
                filterTab === "all"
                  ? "bg-[#132B32] text-[#FFF9EF] shadow-xs"
                  : "text-[#665C52] hover:text-[#132B32]"
              )}
            >
              All ({data.roster.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("unmarked")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-barlow-condensed font-bold tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer",
                filterTab === "unmarked"
                  ? "bg-[#132B32] text-[#D5A64A] shadow-xs"
                  : "text-[#665C52] hover:text-[#132B32]"
              )}
            >
              Unmarked ({data.stats.unmarkedCount})
              {data.stats.unmarkedCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#D95B24]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("present")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-barlow-condensed font-bold tracking-wider uppercase transition-all cursor-pointer",
                filterTab === "present"
                  ? "bg-[#1F382B] text-[#FFF9EF] shadow-xs"
                  : "text-[#665C52] hover:text-[#132B32]"
              )}
            >
              Present ({data.stats.presentCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("absent")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-barlow-condensed font-bold tracking-wider uppercase transition-all cursor-pointer",
                filterTab === "absent"
                  ? "bg-[#991B1B] text-[#FFF9EF] shadow-xs"
                  : "text-[#665C52] hover:text-[#132B32]"
              )}
            >
              Absent ({data.stats.absentCount})
            </button>
          </div>

          {/* Search filter */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search player name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 px-3 text-xs bg-[#FFF9EF] border border-[#DACBB4] rounded-xl focus:outline-none focus:border-[#D95B24] text-[#132B32]"
            />
          </div>
        </div>

        {/* Player Roster Table */}
        {filteredRoster.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#7A6D5F]">
            No players found matching the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2D7C3] bg-[#F5EBD8] text-[#132B32] font-barlow-condensed font-bold uppercase tracking-wider text-xs sm:text-[13px]">
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Current Status</th>
                  <th className="py-3 px-4 text-right">Attendance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE0CF]/60 font-normal text-[#132B32]">
                {filteredRoster.map((player) => {
                  const isPresent = player.status === "present";
                  const isAbsent = player.status === "absent";
                  const isSaving = savingPlayerId === player.playerId;

                  return (
                    <tr
                      key={player.playerId}
                      className="hover:bg-[#F5EBD8]/40 transition-colors"
                    >
                      {/* Player Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#132B32] text-[#D5A64A] font-alfa text-xs flex items-center justify-center border border-[#D5A64A]/30 shrink-0">
                            {player.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/coach/players/${player.playerId}`}
                              className="font-bold text-sm text-[#132B32] hover:text-[#D95B24] transition-colors"
                            >
                              {player.fullName}
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-[#665C52] font-mono">
                        {player.email}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center">
                        {isPresent ? (
                          <Badge variant="success" size="sm">
                            Present
                          </Badge>
                        ) : isAbsent ? (
                          <Badge variant="error" size="sm">
                            Absent
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            Unmarked
                          </Badge>
                        )}
                      </td>

                      {/* Attendance Marking Controls */}
                      <td className="py-3 px-4 text-right">
                        {isClosed ? (
                          <span className="text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#7A6D5F]">
                            Finalized
                          </span>
                        ) : (
                          <div className="inline-flex items-center rounded-xl border border-[#DACBB4] bg-[#F5EBD8] p-0.5">
                            {/* Present Button */}
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleMarkPlayer(player.playerId, "present")}
                              className={cn(
                                "px-3 py-1 text-xs font-barlow-condensed font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                                isPresent
                                  ? "bg-[#1F382B] text-white shadow-xs"
                                  : "text-[#132B32] hover:text-[#1F5A38] hover:bg-[#E5F4EB]"
                              )}
                            >
                              Present
                            </button>

                            {/* Absent Button */}
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleMarkPlayer(player.playerId, "absent")}
                              className={cn(
                                "px-3 py-1 text-xs font-barlow-condensed font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                                isAbsent
                                  ? "bg-[#991B1B] text-white shadow-xs"
                                  : "text-[#132B32] hover:text-[#991B1B] hover:bg-[#FEE2E2]"
                              )}
                            >
                              Absent
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Finalizing Session */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="Finalize Practice Session Attendance"
        description="Review attendance totals before closing. Once closed, attendance records become completely immutable."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-[#FFF4DE] border border-[#FAD79A] text-[#9A6700] text-xs">
            <strong className="block font-bold">Important Notice:</strong>
            After closing, the backend strictly rejects any new marks, modifications, or deletions. Reopening through ordinary API calls is prohibited.
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl border border-[#E2D7C3] bg-[#F5EBD8]">
              <span className="text-[10px] text-[#665C52] uppercase font-barlow-condensed font-bold">Total</span>
              <p className="text-xl font-alfa text-[#132B32]">{data.stats.applicableCount}</p>
            </div>
            <div className="p-2.5 rounded-xl border border-[#C2E4CD] bg-[#E5F4EB]">
              <span className="text-[10px] text-[#1F5A38] uppercase font-barlow-condensed font-bold">Present</span>
              <p className="text-xl font-alfa text-[#1F5A38]">{data.stats.presentCount}</p>
            </div>
            <div className="p-2.5 rounded-xl border border-[#FECACA] bg-[#FEE2E2]">
              <span className="text-[10px] text-[#991B1B] uppercase font-barlow-condensed font-bold">Absent</span>
              <p className="text-xl font-alfa text-[#991B1B]">{data.stats.absentCount}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2D7C3]">
            <Button
              variant="outline"
              size="sm"
              disabled={closing}
              onClick={() => setIsCloseModalOpen(false)}
              className="font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={closing}
              onClick={handleCloseSession}
              className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold rounded-xl"
            >
              Confirm &amp; Finalize Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
