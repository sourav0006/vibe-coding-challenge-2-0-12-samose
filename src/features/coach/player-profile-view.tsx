"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { ActivationCodeModal } from "@/components/shared/activation-code-modal";
import { formatDateOnly, formatDateTime } from "@/lib/utils";
import type {
  PlayerDetailsResult,
  PlayerAttendanceStatsResult,
  PlayerMatchStatsResult,
  PlayerReadinessDTO,
  SafeCoachRemarkDTO,
} from "@/lib/services";
import type { SportOption } from "./types";

export interface PlayerProfileViewProps {
  initialPlayer: PlayerDetailsResult;
  sportsList: SportOption[];
  initialAttendanceStats?: PlayerAttendanceStatsResult | null;
  initialMatchStats?: PlayerMatchStatsResult | null;
  initialReadiness?: PlayerReadinessDTO | null;
  initialRemarks?: SafeCoachRemarkDTO[];
}

export function PlayerProfileView({
  initialPlayer,
  sportsList = [],
  initialAttendanceStats = null,
  initialMatchStats = null,
  initialReadiness = null,
  initialRemarks = [],
}: PlayerProfileViewProps) {
  const [player, setPlayer] = useState<PlayerDetailsResult>(initialPlayer);
  const [attendanceStats, setAttendanceStats] = useState<PlayerAttendanceStatsResult | null>(
    initialAttendanceStats
  );
  const [matchStats] = useState<PlayerMatchStatsResult | null>(
    initialMatchStats
  );
  const [readiness] = useState<PlayerReadinessDTO | null>(
    initialReadiness
  );

  // Remarks state
  const [remarks, setRemarks] = useState<SafeCoachRemarkDTO[]>(initialRemarks);
  const [isAddRemarkOpen, setIsAddRemarkOpen] = useState(false);
  const [newRemarkText, setNewRemarkText] = useState("");
  const [addingRemark, setAddingRemark] = useState(false);
  const [addRemarkError, setAddRemarkError] = useState<string | null>(null);

  const [editingRemark, setEditingRemark] = useState<SafeCoachRemarkDTO | null>(null);
  const [editRemarkText, setEditRemarkText] = useState("");
  const [updatingRemark, setUpdatingRemark] = useState(false);
  const [editRemarkError, setEditRemarkError] = useState<string | null>(null);

  const [deletingRemark, setDeletingRemark] = useState<SafeCoachRemarkDTO | null>(null);
  const [deletingRemarkLoading, setDeletingRemarkLoading] = useState(false);

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [fullName, setFullName] = useState(player.fullName);
  const [age, setAge] = useState<number | string>(player.age);
  const [sportId, setSportId] = useState(player.sportId);
  const [editError, setEditError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Archive modal
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [togglingArchive, setTogglingArchive] = useState(false);

  // Regenerate Code modal
  const [regeneratingCode, setRegeneratingCode] = useState(false);
  const [newCodeData, setNewCodeData] = useState<{
    code: string;
    expiresAt: string;
  } | null>(null);

  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRemarkText.trim();
    if (!trimmed) {
      setAddRemarkError("Remark content cannot be empty.");
      return;
    }
    setAddingRemark(true);
    setAddRemarkError(null);
    try {
      const res = await fetch(`/api/coach/players/${player.id}/remarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to add remark.");
      }
      setRemarks([json.data, ...remarks]);
      setNewRemarkText("");
      setIsAddRemarkOpen(false);
    } catch (err: unknown) {
      setAddRemarkError(err instanceof Error ? err.message : "Failed to add remark.");
    } finally {
      setAddingRemark(false);
    }
  };

  const handleOpenEditRemark = (remark: SafeCoachRemarkDTO) => {
    setEditingRemark(remark);
    setEditRemarkText(remark.content);
    setEditRemarkError(null);
  };

  const handleUpdateRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRemark) return;
    const trimmed = editRemarkText.trim();
    if (!trimmed) {
      setEditRemarkError("Remark content cannot be empty.");
      return;
    }
    setUpdatingRemark(true);
    setEditRemarkError(null);
    try {
      const res = await fetch(`/api/coach/players/${player.id}/remarks/${editingRemark.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update remark.");
      }
      setRemarks(remarks.map((r) => (r.id === editingRemark.id ? json.data : r)));
      setEditingRemark(null);
    } catch (err: unknown) {
      setEditRemarkError(err instanceof Error ? err.message : "Failed to update remark.");
    } finally {
      setUpdatingRemark(false);
    }
  };

  const handleDeleteRemark = async () => {
    if (!deletingRemark) return;
    setDeletingRemarkLoading(true);
    try {
      const res = await fetch(`/api/coach/players/${player.id}/remarks/${deletingRemark.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete remark.");
      }
      setRemarks(remarks.filter((r) => r.id !== deletingRemark.id));
      setDeletingRemark(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete remark.");
    } finally {
      setDeletingRemarkLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const res = await fetch(`/api/coach/players/${player.id}/attendance`);
      const json = await res.json();
      if (res.ok && json.success) {
        setAttendanceStats(json.data);
      }
    } catch {}
  };

  const fetchRefreshedPlayer = async () => {
    try {
      const res = await fetch(`/api/coach/players/${player.id}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setPlayer(json.data);
        await fetchAttendanceStats();
      }
    } catch {}
  };

  const handleOpenEdit = () => {
    setFullName(player.fullName);
    setAge(player.age);
    setSportId(player.sportId);
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    const trimmedName = fullName.trim();
    const parsedAge = parseInt(age.toString(), 10);

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setEditError("Player full name must be between 2 and 100 characters.");
      return;
    }

    if (isNaN(parsedAge) || parsedAge < 4 || parsedAge > 100) {
      setEditError("Player age must be between 4 and 100.");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/coach/players/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: trimmedName,
          age: parsedAge,
          sportId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update player.");
      }

      setPlayer(json.data);
      await fetchAttendanceStats();
      setIsEditOpen(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update player");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleArchive = async () => {
    setTogglingArchive(true);
    try {
      const nextActiveState = player.status === "archived"; // true if unarchiving
      const res = await fetch(`/api/coach/players/${player.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActiveState }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to toggle archival state.");
      }
      setPlayer(json.data);
      setIsArchiveConfirmOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error toggling player archival");
    } finally {
      setTogglingArchive(false);
    }
  };

  const handleRegenerateCode = async () => {
    setRegeneratingCode(true);
    try {
      const res = await fetch(`/api/coach/players/${player.id}/activation-code`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to regenerate activation code.");
      }

      setNewCodeData({
        code: json.data.code,
        expiresAt: json.data.expiresAt,
      });

      await fetchRefreshedPlayer();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to regenerate code");
    } finally {
      setRegeneratingCode(false);
    }
  };

  // Only allow active sports or current sport
  const sportOptions = sportsList
    .filter((s) => s.isActive || s.id === player.sportId)
    .map((s) => ({
      value: s.id,
      label: s.isActive ? s.name : `${s.name} (Inactive)`,
    }));

  const createdFormatted = new Date(player.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const updatedFormatted = new Date(player.updatedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/coach/players"
          className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors inline-flex items-center gap-1"
        >
          &larr; Back to All Players
        </Link>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
              {player.fullName}
            </h1>
            {player.status === "active" ? (
              <Badge variant="success" size="sm" dot>Active</Badge>
            ) : player.status === "pending" ? (
              <Badge variant="warning" size="sm" dot>Pending Activation</Badge>
            ) : (
              <Badge variant="default" size="sm">Archived</Badge>
            )}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              {player.sportName}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)] font-mono">
            Email: {player.email} &bull; Profile ID: {player.id}
          </p>
        </div>

        {/* Profile Action Buttons */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleOpenEdit} className="text-xs">
            Edit Details
          </Button>
          <Button
            size="sm"
            variant={player.status === "archived" ? "secondary" : "outline"}
            onClick={() => setIsArchiveConfirmOpen(true)}
            className={`text-xs ${
              player.status === "archived" ? "text-emerald-700" : "text-amber-700 hover:text-amber-800"
            }`}
          >
            {player.status === "archived" ? "Unarchive Player" : "Archive Player"}
          </Button>
        </div>
      </div>

      {/* Main Grid: Details + Activation Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Attributes Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Player Information</CardTitle>
            <CardDescription>Core biographical and academy roster details.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div>
                <dt className="text-[var(--color-text-secondary)] font-medium">Full Name</dt>
                <dd className="mt-1 text-sm font-bold text-[var(--color-text-primary)]">
                  {player.fullName}
                </dd>
              </div>

              <div>
                <dt className="text-[var(--color-text-secondary)] font-medium">Email Address</dt>
                <dd className="mt-1 text-sm font-mono text-[var(--color-text-primary)]">
                  {player.email}
                </dd>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  Immutable login credential
                </span>
              </div>

              <div>
                <dt className="text-[var(--color-text-secondary)] font-medium">Player Age</dt>
                <dd className="mt-1 text-sm font-bold text-[var(--color-text-primary)]">
                  {player.age} years old
                </dd>
              </div>

              <div>
                <dt className="text-[var(--color-text-secondary)] font-medium">Assigned Sport</dt>
                <dd className="mt-1 text-sm font-bold text-[var(--color-text-primary)]">
                  {player.sportName}
                </dd>
              </div>

              <div>
                <dt className="text-[var(--color-text-secondary)] font-medium">Date Created</dt>
                <dd className="mt-1 font-medium text-[var(--color-text-primary)]">
                  {createdFormatted}
                </dd>
              </div>

              <div>
                <dt className="text-[var(--color-text-secondary)] font-medium">Last Profile Update</dt>
                <dd className="mt-1 font-medium text-[var(--color-text-primary)]">
                  {updatedFormatted}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Account & Activation Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account &amp; Activation</CardTitle>
            <CardDescription>Credential security and onboarding state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <span className="text-[var(--color-text-secondary)]">Current Status:</span>
              <div className="mt-1">
                {player.status === "active" ? (
                  <Badge variant="success" size="sm" dot>
                    Account Activated
                  </Badge>
                ) : player.status === "pending" ? (
                  <Badge variant="warning" size="sm" dot>
                    Pending First Activation
                  </Badge>
                ) : (
                  <Badge variant="default" size="sm">
                    Account Archived
                  </Badge>
                )}
              </div>
            </div>

            {player.status === "active" && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 leading-relaxed text-[11px]">
                This player has successfully completed account onboarding with their single-use activation code and set their password.
              </div>
            )}

            {player.status === "pending" && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 leading-relaxed text-[11px]">
                  <strong>Activation Pending:</strong> The player has not yet activated their account.
                  {player.activationStatus?.expiresAt && (
                    <div className="mt-1 font-mono text-[10px]">
                      Latest Code Expiry:{" "}
                      {new Date(player.activationStatus.expiresAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {player.activationStatus.isExpired && " (EXPIRED)"}
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleRegenerateCode}
                  isLoading={regeneratingCode}
                  className="w-full text-xs"
                >
                  Regenerate Activation Code
                </Button>
                <p className="text-[10px] text-[var(--color-text-muted)] text-center">
                  Invalidates previously issued unused codes and generates a fresh 24h code.
                </p>
              </div>
            )}

            {player.status === "archived" && (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 leading-relaxed text-[11px]">
                This account is currently archived and cannot log in or have new activation codes generated. You can reactivate this player at any time.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Phase 6: Training Attendance Record */}
      <Card variant="bordered" className="bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-[var(--color-border)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-[var(--color-text-primary)]">
                Training Attendance Record
              </CardTitle>
              <CardDescription className="text-xs text-[var(--color-text-secondary)]">
                Official attendance percentages, roll-call records, and session history for {player.sportName}.
              </CardDescription>
            </div>
            {attendanceStats && attendanceStats.attendancePercentage !== "N/A" ? (
              <Badge variant="success" size="md">
                {attendanceStats.attendancePercentage} Attendance
              </Badge>
            ) : (
              <Badge variant="default" size="md">
                Attendance: N/A
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          {/* Summary Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background-subtle)]/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Assigned Sport
              </span>
              <p className="text-sm font-black text-[var(--color-text-primary)] mt-0.5">
                {player.sportName}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background-subtle)]/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Applicable Closed Sessions
              </span>
              <p className="text-xl font-black text-[var(--color-text-primary)] mt-0.5">
                {attendanceStats?.totalSessions ?? 0}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Present Sessions
              </span>
              <p className="text-xl font-black text-emerald-700 mt-0.5">
                {attendanceStats?.presentCount ?? 0}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                Absent Sessions
              </span>
              <p className="text-xl font-black text-rose-700 mt-0.5">
                {attendanceStats?.absentCount ?? 0}
              </p>
            </div>
          </div>

          {/* Recent Attendance Records Table */}
          <div>
            <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2.5">
              Recent Attendance History
            </h3>

            {!attendanceStats || attendanceStats.history.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--color-text-muted)] bg-[var(--color-background-subtle)]/40 rounded-lg border border-dashed border-[var(--color-border)]">
                No closed practice sessions recorded yet for this player&apos;s assigned sport.
              </div>
            ) : (
              <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[var(--color-background-subtle)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Session Date</th>
                      <th className="py-2.5 px-3">Sport</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text-primary)]">
                    {attendanceStats.history.map((record) => (
                      <tr key={record.sessionId} className="hover:bg-[var(--color-background-subtle)]/50">
                        <td className="py-2.5 px-3 font-semibold">
                          {formatDateOnly(record.sessionDate)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                            {record.sportName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {record.status === "present" ? (
                            <Badge variant="success" size="sm">
                              Present
                            </Badge>
                          ) : (
                            <Badge variant="error" size="sm">
                              Absent
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href={`/dashboard/coach/sessions/${record.sessionId}`}
                            className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline"
                          >
                            View Sheet &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Structured Sections for Future Phases (Phase 7+) */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">
          Academy Records &amp; Activity
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Phase 7: Match Performance & Scoring History */}
          <Card variant="bordered" className="md:col-span-3">
            <CardHeader className="pb-3 border-b border-[var(--color-border)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Match Performance &amp; Individual Scoring History
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Official match fixtures and verified individual performance ratings. Only finalized matches are counted.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block uppercase font-medium">Matches Played</span>
                    <span className="text-lg font-bold text-slate-900">
                      {matchStats?.totalMatchesPlayed || 0}
                    </span>
                  </div>
                  <div className="text-right pl-3 border-l border-slate-200">
                    <span className="text-xs text-slate-400 block uppercase font-medium">Avg Score</span>
                    <span className="text-lg font-bold text-emerald-700">
                      {matchStats?.averageScore !== null && matchStats?.averageScore !== undefined
                        ? `${matchStats.averageScore.toFixed(1)} / 10`
                        : "—"}
                    </span>
                  </div>
                  <div className="text-right pl-3 border-l border-slate-200">
                    <span className="text-xs text-slate-400 block uppercase font-medium">Peak Score</span>
                    <span className="text-lg font-bold text-slate-900">
                      {matchStats?.highestScore !== null && matchStats?.highestScore !== undefined
                        ? `${matchStats.highestScore.toFixed(1)} / 10`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {!matchStats || matchStats.matchHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No finalized match records recorded for this player yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-semibold text-slate-500 tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Match Date</th>
                        <th className="py-2.5 px-3">Sport</th>
                        <th className="py-2.5 px-3">Opponent</th>
                        <th className="py-2.5 px-3 text-center">Individual Score</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {matchStats.matchHistory.map((item) => (
                        <tr key={item.matchId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                            {formatDateOnly(item.matchDate)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                              {item.sportName}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                            vs. {item.opponentName}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {item.score.toFixed(1)} / 10
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <Link
                              href={`/dashboard/coach/matches/${item.matchId}`}
                              className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
                            >
                              View Fixture &rarr;
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phase 8: Athlete Scouting Readiness */}
          <Card variant="bordered" className="md:col-span-2">
            <CardHeader className="pb-2 border-b border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Scouting Readiness Evaluation
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Formula: (Attendance ≥ 75%) ∧ (Finalized Matches ≥ 2)
                  </CardDescription>
                </div>
                {readiness?.isReady ? (
                  <Badge variant="success" size="sm">
                    Ready for Scouting
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm">
                    Not Ready
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Attendance Criterion
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-slate-800">
                      {readiness ? readiness.attendancePercentage : "—"}
                    </span>
                    {readiness?.attendanceCriterionMet ? (
                      <span className="text-[11px] font-bold text-emerald-700">Met (≥ 75%) ✓</span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700">Incomplete ✗</span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Match Criterion
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-slate-800">
                      {readiness ? `${readiness.finalizedMatchesPlayed} match(es)` : "—"}
                    </span>
                    {readiness?.matchCriterionMet ? (
                      <span className="text-[11px] font-bold text-emerald-700">Met (≥ 2) ✓</span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700">Incomplete ✗</span>
                    )}
                  </div>
                </div>
              </div>

              {readiness?.readinessReasons && readiness.readinessReasons.length > 0 && (
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <span className="font-semibold text-slate-700">Readiness Rationale:</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {readiness.readinessReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-1 text-right">
                <Link
                  href="/dashboard/coach/readiness"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  View Academy Readiness Board &rarr;
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Coach Remarks & Evaluations */}
          <Card variant="bordered">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold">Coach Remarks &amp; Evaluations</CardTitle>
                  <Badge variant="info" size="sm">
                    {remarks.length} {remarks.length === 1 ? "Remark" : "Remarks"}
                  </Badge>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setNewRemarkText("");
                    setAddRemarkError(null);
                    setIsAddRemarkOpen(true);
                  }}
                >
                  + Add Remark
                </Button>
              </div>
              <CardDescription className="text-xs">
                Private feedback, tactical pointers, and developmental evaluations visible only to the player and coaches.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {remarks.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--color-text-muted)] bg-[var(--color-background-subtle)]/40 rounded-lg border border-dashed border-[var(--color-border)]">
                  <p className="font-medium text-slate-700">No remarks recorded yet</p>
                  <p className="mt-1 text-slate-500">Provide direct encouragement or tactical feedback to help {player.fullName} develop.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setNewRemarkText("");
                      setAddRemarkError(null);
                      setIsAddRemarkOpen(true);
                    }}
                  >
                    Create First Remark
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {remarks.map((remark) => (
                    <div
                      key={remark.id}
                      className="p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background-subtle)]/30 hover:bg-[var(--color-background-subtle)]/60 transition-colors"
                    >
                      <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {remark.content}
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span>Recorded on {formatDateTime(remark.createdAt)}</span>
                          {remark.updatedAt && remark.updatedAt !== remark.createdAt && (
                            <span className="text-amber-600 font-medium">
                              (edited {formatDateTime(remark.updatedAt)})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRemark(remark)}
                            className="font-semibold text-slate-600 hover:text-emerald-700 hover:underline transition-colors"
                          >
                            Edit
                          </button>
                          <span>&bull;</span>
                          <button
                            type="button"
                            onClick={() => setDeletingRemark(remark)}
                            className="font-semibold text-rose-500 hover:text-rose-700 hover:underline transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Player Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Player Profile"
        description="Update personal attributes or reassign sport. Email address is permanent."
        maxWidth="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {editError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {editError}
            </div>
          )}

          <Input
            label="Full Name *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Email Address"
            value={player.email}
            disabled
            helperText="Player email cannot be changed as it serves as the authentication identity."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Player Age *"
              type="number"
              min={4}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />

            <Select
              label="Assigned Sport *"
              options={sportOptions}
              value={sportId}
              onChange={(e) => setSportId(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={updating}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Archival */}
      <Modal
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        title={
          player.status === "archived"
            ? `Unarchive ${player.fullName}?`
            : `Archive ${player.fullName}?`
        }
        description={
          player.status === "archived"
            ? "Unarchiving this player restores their active status in academy rosters. If their account was previously activated, login access will be reinstated."
            : "Archiving this player preserves all historical records, but marks the player profile inactive and immediately revokes login access. No player records or data will be permanently deleted."
        }
        maxWidth="sm"
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsArchiveConfirmOpen(false)}
            disabled={togglingArchive}
          >
            Cancel
          </Button>
          <Button
            variant={player.status === "archived" ? "primary" : "secondary"}
            size="sm"
            onClick={handleToggleArchive}
            isLoading={togglingArchive}
          >
            {player.status === "archived" ? "Confirm Unarchive" : "Confirm Archival"}
          </Button>
        </div>
      </Modal>

      {/* Success Modal for Regenerated Activation Code */}
      {newCodeData && (
        <ActivationCodeModal
          isOpen={Boolean(newCodeData)}
          onClose={() => setNewCodeData(null)}
          playerName={player.fullName}
          playerEmail={player.email}
          sportName={player.sportName}
          code={newCodeData.code}
          expiresAt={newCodeData.expiresAt}
          title="New Activation Code Generated"
        />
      )}

      {/* Add Coach Remark Modal */}
      <Modal
        isOpen={isAddRemarkOpen}
        onClose={() => setIsAddRemarkOpen(false)}
        title={`Add Coach Remark for ${player.fullName}`}
        description="Write developmental pointers, tactical notes, or progress feedback. Visible only to this player and coaches."
        maxWidth="md"
      >
        <form onSubmit={handleAddRemark} className="space-y-4">
          {addRemarkError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {addRemarkError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remark Content *
            </label>
            <textarea
              className="w-full h-32 px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y"
              placeholder="e.g. Excellent defensive positioning in today's match. Focus on early ball release during transitions."
              value={newRemarkText}
              onChange={(e) => setNewRemarkText(e.target.value)}
              maxLength={1000}
              required
              autoFocus
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
              <span>Max 1,000 characters</span>
              <span className={newRemarkText.length >= 950 ? "text-amber-600 font-semibold" : ""}>
                {newRemarkText.length}/1000
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddRemarkOpen(false)}
              disabled={addingRemark}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={addingRemark}
              disabled={!newRemarkText.trim()}
            >
              Save Remark
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Coach Remark Modal */}
      <Modal
        isOpen={Boolean(editingRemark)}
        onClose={() => setEditingRemark(null)}
        title="Edit Coach Remark"
        description="Update coaching pointers or tactical notes."
        maxWidth="md"
      >
        <form onSubmit={handleUpdateRemark} className="space-y-4">
          {editRemarkError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {editRemarkError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remark Content *
            </label>
            <textarea
              className="w-full h-32 px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y"
              value={editRemarkText}
              onChange={(e) => setEditRemarkText(e.target.value)}
              maxLength={1000}
              required
              autoFocus
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
              <span>Max 1,000 characters</span>
              <span className={editRemarkText.length >= 950 ? "text-amber-600 font-semibold" : ""}>
                {editRemarkText.length}/1000
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingRemark(null)}
              disabled={updatingRemark}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={updatingRemark}
              disabled={!editRemarkText.trim()}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Coach Remark Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingRemark)}
        onClose={() => setDeletingRemark(null)}
        title="Delete Coach Remark"
        description="Are you sure you want to permanently delete this coaching remark? This action cannot be undone."
        maxWidth="sm"
      >
        <div className="space-y-3 pt-1">
          {deletingRemark && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 max-h-24 overflow-y-auto italic">
              &ldquo;{deletingRemark.content}&rdquo;
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingRemark(null)}
              disabled={deletingRemarkLoading}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDeleteRemark}
              isLoading={deletingRemarkLoading}
              className="!bg-rose-600 hover:!bg-rose-700 !text-white"
            >
              Delete Remark
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
