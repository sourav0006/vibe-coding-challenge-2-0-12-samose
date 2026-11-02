"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDateOnly, cn } from "@/lib/utils";
import type { SessionAttendanceSheetDTO } from "@/lib/services";

export interface AttendanceSheetViewProps {
  initialData: SessionAttendanceSheetDTO;
}

export function AttendanceSheetView({ initialData }: AttendanceSheetViewProps) {
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
          className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors inline-flex items-center gap-1"
        >
          &larr; Back to Practice Sessions
        </Link>
      </div>

      {/* Session Title Header Card */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text-primary)] tracking-tight">
                {formattedDate} &mdash; Attendance Sheet
              </h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-primary-soft)] text-[var(--color-primary)] border border-emerald-200">
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
            <p className="mt-1 text-xs sm:text-sm text-[var(--color-text-secondary)]">
              {isClosed
                ? `Attendance was finalized on ${new Date(data.session.closedAt || data.session.updatedAt).toLocaleString("en-US")}. Records are read-only.`
                : "Mark roll-call for all assigned players. Session can be finalized once all players have an explicit status."}
            </p>
          </div>

          {/* Action button */}
          {!isClosed && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="md"
                disabled={!data.stats.isComplete || closing}
                onClick={() => setIsCloseModalOpen(true)}
                className="text-xs font-bold shadow-xs whitespace-nowrap"
              >
                Close &amp; Finalize Session
              </Button>
            </div>
          )}
        </div>

        {/* Closed Banner */}
        {isClosed && (
          <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2 font-medium">
            <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span>
              This session is closed. Backend validation rejects all modifications, updates, and reopen attempts.
            </span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Applicable Players */}
        <Card variant="bordered" className="bg-white">
          <CardHeader className="pb-1">
            <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Applicable Roster
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[var(--color-text-primary)]">
              {data.stats.applicableCount}
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Eligible sport members</p>
          </CardContent>
        </Card>

        {/* Present Count */}
        <Card variant="bordered" className="bg-emerald-50/50 border-emerald-200">
          <CardHeader className="pb-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Marked Present
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-700">
              {data.stats.presentCount}
            </div>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">
              {data.stats.applicableCount > 0
                ? `${Math.round((data.stats.presentCount / data.stats.applicableCount) * 100)}% attendance rate`
                : "No roster"}
            </p>
          </CardContent>
        </Card>

        {/* Absent Count */}
        <Card variant="bordered" className="bg-rose-50/50 border-rose-200">
          <CardHeader className="pb-1">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
              Marked Absent
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-700">
              {data.stats.absentCount}
            </div>
            <p className="text-[11px] text-rose-600/80 mt-0.5">Documented absences</p>
          </CardContent>
        </Card>

        {/* Unmarked Count */}
        <Card
          variant="bordered"
          className={cn(
            "bg-white",
            data.stats.unmarkedCount > 0 ? "border-amber-300 bg-amber-50/30" : "border-emerald-200 bg-emerald-50/20"
          )}
        >
          <CardHeader className="pb-1">
            <span
              className={cn(
                "text-[11px] font-bold uppercase tracking-wider",
                data.stats.unmarkedCount > 0 ? "text-amber-800" : "text-emerald-800"
              )}
            >
              Unmarked Players
            </span>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-black",
                data.stats.unmarkedCount > 0 ? "text-amber-700" : "text-emerald-700"
              )}
            >
              {data.stats.unmarkedCount}
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              {data.stats.unmarkedCount === 0 ? "Ready to close" : "Needs explicit mark"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress & Bulk Operations Card */}
      <Card variant="bordered" className="bg-white">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 max-w-md space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[var(--color-text-primary)]">Roster Roll-Call Progress</span>
                <span
                  className={cn(
                    "font-bold",
                    data.stats.isComplete ? "text-emerald-700" : "text-amber-700"
                  )}
                >
                  {data.stats.markedCount} / {data.stats.applicableCount} Marked ({completionPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300",
                    data.stats.isComplete ? "bg-emerald-600" : "bg-amber-500"
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
                  className="text-xs h-8 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                >
                  Mark All Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkLoading || data.roster.length === 0}
                  onClick={() => handleBulkMark("absent")}
                  className="text-xs h-8 text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  Mark All Absent
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Messages */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-800 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Player Table Card with Filter Tabs */}
      <Card variant="bordered" className="bg-white overflow-hidden shadow-xs">
        {/* Table Controls Bar */}
        <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[var(--color-background-subtle)]/50">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-semibold transition-all",
                filterTab === "all"
                  ? "bg-white text-[var(--color-text-primary)] shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              )}
            >
              All ({data.roster.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("unmarked")}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1",
                filterTab === "unmarked"
                  ? "bg-white text-amber-800 shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              )}
            >
              Unmarked ({data.stats.unmarkedCount})
              {data.stats.unmarkedCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("present")}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-semibold transition-all",
                filterTab === "present"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              )}
            >
              Present ({data.stats.presentCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("absent")}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-semibold transition-all",
                filterTab === "absent"
                  ? "bg-white text-rose-800 shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
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
              className="w-full h-8 px-3 text-xs bg-white border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        {/* Player Roster Table */}
        {filteredRoster.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">
            No players found matching the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-background-subtle)] text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Current Status</th>
                  <th className="py-3 px-4 text-right">Attendance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] font-normal text-[var(--color-text-primary)]">
                {filteredRoster.map((player) => {
                  const isPresent = player.status === "present";
                  const isAbsent = player.status === "absent";
                  const isSaving = savingPlayerId === player.playerId;

                  return (
                    <tr
                      key={player.playerId}
                      className="hover:bg-[var(--color-background-subtle)]/60 transition-colors"
                    >
                      {/* Player Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold text-xs flex items-center justify-center border border-emerald-200 shrink-0">
                            {player.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/coach/players/${player.playerId}`}
                              className="font-bold text-sm text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
                            >
                              {player.fullName}
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-[var(--color-text-secondary)]">
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
                          <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                            Finalized
                          </span>
                        ) : (
                          <div className="inline-flex items-center rounded-lg border border-[var(--color-border)] bg-slate-50 p-0.5">
                            {/* Present Button */}
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleMarkPlayer(player.playerId, "present")}
                              className={cn(
                                "px-3 py-1 text-xs font-bold rounded-md transition-all",
                                isPresent
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
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
                                "px-3 py-1 text-xs font-bold rounded-md transition-all",
                                isAbsent
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "text-slate-600 hover:text-rose-700 hover:bg-rose-50"
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
      </Card>

      {/* Confirmation Modal for Finalizing Session */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="Finalize Practice Session Attendance"
        description="Review attendance totals before closing. Once closed, attendance records become completely immutable."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <strong className="block font-bold">Important Notice:</strong>
            After closing, the backend strictly rejects any new marks, modifications, or deletions. Reopening through ordinary API calls is prohibited.
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-lg border border-[var(--color-border)] bg-slate-50">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold">Total</span>
              <p className="text-lg font-black text-[var(--color-text-primary)]">{data.stats.applicableCount}</p>
            </div>
            <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50">
              <span className="text-[10px] text-emerald-800 uppercase font-bold">Present</span>
              <p className="text-lg font-black text-emerald-700">{data.stats.presentCount}</p>
            </div>
            <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50">
              <span className="text-[10px] text-rose-800 uppercase font-bold">Absent</span>
              <p className="text-lg font-black text-rose-700">{data.stats.absentCount}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--color-border)]">
            <Button
              variant="outline"
              size="sm"
              disabled={closing}
              onClick={() => setIsCloseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={closing}
              onClick={handleCloseSession}
            >
              Confirm &amp; Finalize Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
