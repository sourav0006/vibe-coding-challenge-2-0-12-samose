"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  const [matchStats, setMatchStats] = useState<PlayerMatchStatsResult | null>(
    initialMatchStats
  );
  const [readiness, setReadiness] = useState<PlayerReadinessDTO | null>(
    initialReadiness
  );

  // Remarks state
  const [remarks, setRemarks] = useState<SafeCoachRemarkDTO[]>(initialRemarks);

  // Synchronize when server component props update
  const [prevPlayerId, setPrevPlayerId] = useState(initialPlayer.id);
  if (initialPlayer.id !== prevPlayerId) {
    setPrevPlayerId(initialPlayer.id);
    setPlayer(initialPlayer);
    setAttendanceStats(initialAttendanceStats ?? null);
    setMatchStats(initialMatchStats ?? null);
    setReadiness(initialReadiness ?? null);
    setRemarks(initialRemarks ?? []);
  }
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
          className="text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#7A6D5F] hover:text-[#D95B24] transition-colors inline-flex items-center gap-1.5"
        >
          &larr; Back to All Players
        </Link>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E2D7C3]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-alfa text-[#132B32] uppercase tracking-tight leading-tight">
              {player.fullName}
            </h1>
            {player.status === "active" ? (
              <Badge variant="success" size="sm" dot>Active</Badge>
            ) : player.status === "pending" ? (
              <Badge variant="warning" size="sm" dot>Pending Activation</Badge>
            ) : (
              <Badge variant="default" size="sm">Archived</Badge>
            )}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-barlow-condensed font-bold uppercase tracking-wider bg-[#E5F4EB] text-[#1F5A38] border border-[#C2E4CD]">
              {player.sportName}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#665C52] font-mono">
            Email: {player.email} &bull; Profile ID: {player.id}
          </p>
        </div>

        {/* Profile Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenEdit}
            className="font-barlow-condensed font-bold text-xs border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl"
          >
            Edit Details
          </Button>
          <Button
            size="sm"
            variant={player.status === "archived" ? "secondary" : "outline"}
            onClick={() => setIsArchiveConfirmOpen(true)}
            className={`font-barlow-condensed font-bold text-xs rounded-xl border-[#DACBB4] ${
              player.status === "archived" ? "text-[#1F5A38] hover:bg-[#E5F4EB]" : "text-[#D95B24] hover:bg-[#FFF4DE]"
            }`}
          >
            {player.status === "archived" ? "Unarchive Player" : "Archive Player"}
          </Button>
        </div>
      </div>

      {/* Main Grid: Details + Activation Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Attributes Card */}
        <div className="lg:col-span-2 bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="pb-4 border-b border-[#E2D7C3]">
            <h2 className="text-lg font-alfa text-[#132B32] uppercase tracking-wide">Player Information</h2>
            <p className="text-xs text-[#665C52] mt-0.5">Core biographical and academy roster details.</p>
          </div>
          <div className="pt-5">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div>
                <dt className="text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#7A6D5F]">Full Name</dt>
                <dd className="mt-1 text-sm font-bold text-[#132B32]">
                  {player.fullName}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#7A6D5F]">Email Address</dt>
                <dd className="mt-1 text-sm font-mono text-[#132B32]">
                  {player.email}
                </dd>
                <span className="text-[10px] text-[#A39687]">
                  Immutable login credential
                </span>
              </div>

              <div>
                <dt className="text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#7A6D5F]">Player Age</dt>
                <dd className="mt-1 text-sm font-bold text-[#132B32]">
                  {player.age} years old
                </dd>
              </div>

              <div>
                <dt className="text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#7A6D5F]">Assigned Sport</dt>
                <dd className="mt-1 text-sm font-bold text-[#132B32]">
                  {player.sportName}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#7A6D5F]">Date Created</dt>
                <dd className="mt-1 font-mono text-[#132B32]">
                  {createdFormatted}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#7A6D5F]">Last Profile Update</dt>
                <dd className="mt-1 font-mono text-[#132B32]">
                  {updatedFormatted}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Account & Activation Status Card */}
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="pb-4 border-b border-[#E2D7C3]">
            <h2 className="text-lg font-alfa text-[#132B32] uppercase tracking-wide">Account &amp; Activation</h2>
            <p className="text-xs text-[#665C52] mt-0.5">Credential security and onboarding state.</p>
          </div>
          <div className="pt-5 space-y-4 text-xs">
            <div>
              <span className="text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#7A6D5F]">Current Status:</span>
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
              <div className="p-3 rounded-xl bg-[#E5F4EB] border border-[#C2E4CD] text-[#1F5A38] leading-relaxed text-[11px]">
                This player has successfully completed account onboarding with their single-use activation code and set their password.
              </div>
            )}

            {player.status === "pending" && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#FFF4DE] border border-[#FAD79A] text-[#9A6700] leading-relaxed text-[11px]">
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
                  className="w-full text-xs bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold rounded-xl h-9"
                >
                  Regenerate Activation Code
                </Button>
                <p className="text-[10px] text-[#7A6D5F] text-center">
                  Invalidates previously issued unused codes and generates a fresh 24h code.
                </p>
              </div>
            )}

            {player.status === "archived" && (
              <div className="p-3 rounded-xl bg-[#F5EBD8] border border-[#E2D7C3] text-[#665C52] leading-relaxed text-[11px]">
                This account is currently archived and cannot log in or have new activation codes generated. You can reactivate this player at any time.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phase 6: Training Attendance Record */}
      <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E2D7C3] bg-[#F5EBD8]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-alfa text-[#132B32] uppercase tracking-wide">
                Training Attendance Record
              </h2>
              <p className="text-xs text-[#665C52]">
                Official attendance percentages, roll-call records, and session history for {player.sportName}.
              </p>
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
        </div>
        <div className="p-5 space-y-5">
          {/* Summary Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-[#E2D7C3] bg-[#FFF9EF]">
              <span className="text-[10px] font-barlow-condensed font-bold uppercase tracking-wider text-[#7A6D5F]">
                Assigned Sport
              </span>
              <p className="text-sm font-bold text-[#132B32] mt-0.5">
                {player.sportName}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-[#E2D7C3] bg-[#FFF9EF]">
              <span className="text-[10px] font-barlow-condensed font-bold uppercase tracking-wider text-[#7A6D5F]">
                Applicable Closed Sessions
              </span>
              <p className="text-xl font-alfa text-[#132B32] mt-0.5">
                {attendanceStats?.totalSessions ?? 0}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-[#C2E4CD] bg-[#E5F4EB]">
              <span className="text-[10px] font-barlow-condensed font-bold uppercase tracking-wider text-[#1F5A38]">
                Present Sessions
              </span>
              <p className="text-xl font-alfa text-[#1F5A38] mt-0.5">
                {attendanceStats?.presentCount ?? 0}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-[#FECACA] bg-[#FEE2E2]">
              <span className="text-[10px] font-barlow-condensed font-bold uppercase tracking-wider text-[#991B1B]">
                Absent Sessions
              </span>
              <p className="text-xl font-alfa text-[#991B1B] mt-0.5">
                {attendanceStats?.absentCount ?? 0}
              </p>
            </div>
          </div>

          {/* Recent Attendance Records Table */}
          <div>
            <h3 className="text-xs font-barlow-condensed font-bold text-[#132B32] uppercase tracking-wider mb-2.5">
              Recent Attendance History
            </h3>

            {!attendanceStats || attendanceStats.history.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#7A6D5F] bg-[#FFF9EF] rounded-xl border border-dashed border-[#E2D7C3]">
                No closed practice sessions recorded yet for this player&apos;s assigned sport.
              </div>
            ) : (
              <div className="border border-[#E2D7C3] rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F5EBD8] border-b border-[#E2D7C3] text-[#132B32] font-barlow-condensed font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Session Date</th>
                      <th className="py-2.5 px-3">Sport</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE0CF]/60 text-[#132B32]">
                    {attendanceStats.history.map((record) => (
                      <tr key={record.sessionId} className="hover:bg-[#F5EBD8]/40">
                        <td className="py-2.5 px-3 font-mono font-semibold">
                          {formatDateOnly(record.sessionDate)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-barlow-condensed font-bold uppercase tracking-wider bg-[#E5F4EB] text-[#1F5A38] border border-[#C2E4CD]">
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
                            className="text-[11px] font-barlow-condensed font-bold uppercase tracking-wider text-[#D95B24] hover:underline"
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
        </div>
      </div>

      {/* Structured Sections for Future Phases */}
      <div className="space-y-4">
        <h2 className="text-lg font-alfa text-[#132B32] uppercase tracking-wide">
          Academy Records &amp; Activity
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Phase 7: Match Performance & Scoring History */}
          <div className="md:col-span-3 bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E2D7C3] bg-[#F5EBD8]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-alfa text-[#132B32] uppercase tracking-wide">
                    Match Performance &amp; Individual Scoring History
                  </h3>
                  <p className="text-xs text-[#665C52]">
                    Official match fixtures and verified individual performance ratings. Only finalized matches are counted.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-[#7A6D5F] block uppercase font-barlow-condensed font-bold">Matches Played</span>
                    <span className="text-lg font-alfa text-[#132B32]">
                      {matchStats?.totalMatchesPlayed || 0}
                    </span>
                  </div>
                  <div className="text-right pl-3 border-l border-[#E2D7C3]">
                    <span className="text-[10px] text-[#7A6D5F] block uppercase font-barlow-condensed font-bold">Avg Score</span>
                    <span className="text-lg font-alfa text-[#1F5A38]">
                      {matchStats?.averageScore !== null && matchStats?.averageScore !== undefined
                        ? `${matchStats.averageScore.toFixed(1)} / 10`
                        : "—"}
                    </span>
                  </div>
                  <div className="text-right pl-3 border-l border-[#E2D7C3]">
                    <span className="text-[10px] text-[#7A6D5F] block uppercase font-barlow-condensed font-bold">Peak Score</span>
                    <span className="text-lg font-alfa text-[#132B32]">
                      {matchStats?.highestScore !== null && matchStats?.highestScore !== undefined
                        ? `${matchStats.highestScore.toFixed(1)} / 10`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5">
              {!matchStats || matchStats.matchHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#7A6D5F] bg-[#FFF9EF] rounded-xl border border-dashed border-[#E2D7C3]">
                  No finalized match records recorded for this player yet.
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#E2D7C3] rounded-xl">
                  <table className="w-full text-left text-xs text-[#132B32]">
                    <thead className="bg-[#F5EBD8] border-b border-[#E2D7C3] text-[11px] uppercase font-barlow-condensed font-bold tracking-wider text-[#132B32]">
                      <tr>
                        <th className="py-2.5 px-3">Match Date</th>
                        <th className="py-2.5 px-3">Sport</th>
                        <th className="py-2.5 px-3">Opponent</th>
                        <th className="py-2.5 px-3 text-center">Individual Score</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE0CF]/60">
                      {matchStats.matchHistory.map((item) => (
                        <tr key={item.matchId} className="hover:bg-[#F5EBD8]/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-semibold text-[#132B32] whitespace-nowrap">
                            {formatDateOnly(item.matchDate)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-barlow-condensed font-bold uppercase tracking-wider bg-[#E5F4EB] text-[#1F5A38] border border-[#C2E4CD]">
                              {item.sportName}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#132B32] whitespace-nowrap">
                            vs. {item.opponentName}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-alfa bg-[#E5F4EB] text-[#1F5A38] border border-[#C2E4CD]">
                              {item.score.toFixed(1)} / 10
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <Link
                              href={`/dashboard/coach/matches/${item.matchId}`}
                              className="text-[#D95B24] hover:text-[#B84617] font-barlow-condensed font-bold uppercase tracking-wider text-xs hover:underline"
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
            </div>
          </div>

          {/* Phase 8: Athlete Scouting Readiness */}
          <div className="md:col-span-2 bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E2D7C3] bg-[#F5EBD8]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-alfa text-[#132B32] uppercase tracking-wide">
                    Scouting Readiness Evaluation
                  </h3>
                  <p className="text-xs text-[#665C52]">
                    Formula: (Attendance ≥ 75%) ∧ (Finalized Matches ≥ 2)
                  </p>
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
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-[#FFF9EF] rounded-xl border border-[#E2D7C3]">
                  <span className="text-[10px] uppercase font-barlow-condensed font-bold text-[#7A6D5F] block">
                    Attendance Criterion
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono font-bold text-[#132B32]">
                      {readiness ? readiness.attendancePercentage : "—"}
                    </span>
                    {readiness?.attendanceCriterionMet ? (
                      <span className="text-[11px] font-barlow-condensed font-bold text-[#1F5A38]">Met (≥ 75%) ✓</span>
                    ) : (
                      <span className="text-[11px] font-barlow-condensed font-bold text-[#9A6700]">Incomplete ✗</span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 bg-[#FFF9EF] rounded-xl border border-[#E2D7C3]">
                  <span className="text-[10px] uppercase font-barlow-condensed font-bold text-[#7A6D5F] block">
                    Match Criterion
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono font-bold text-[#132B32]">
                      {readiness ? `${readiness.finalizedMatchesPlayed} match(es)` : "—"}
                    </span>
                    {readiness?.matchCriterionMet ? (
                      <span className="text-[11px] font-barlow-condensed font-bold text-[#1F5A38]">Met (≥ 2) ✓</span>
                    ) : (
                      <span className="text-[11px] font-barlow-condensed font-bold text-[#9A6700]">Incomplete ✗</span>
                    )}
                  </div>
                </div>
              </div>

              {readiness?.readinessReasons && readiness.readinessReasons.length > 0 && (
                <div className="text-[11px] text-[#665C52] space-y-0.5">
                  <span className="font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32]">Readiness Rationale:</span>
                  <ul className="list-disc pl-4 space-y-0.5 font-mono text-[11px]">
                    {readiness.readinessReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-1 text-right">
                <Link
                  href="/dashboard/coach/readiness"
                  className="text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#D95B24] hover:underline"
                >
                  View Academy Readiness Board &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Coach Remarks & Evaluations */}
          <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E2D7C3] bg-[#F5EBD8]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-alfa text-[#132B32] uppercase tracking-wide">Coach Remarks</h3>
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
                  className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold text-xs rounded-xl"
                >
                  + Add Remark
                </Button>
              </div>
              <p className="text-xs text-[#665C52] mt-1">
                Private feedback, tactical pointers, and developmental evaluations.
              </p>
            </div>
            <div className="p-4">
              {remarks.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#7A6D5F] bg-[#FFF9EF] rounded-xl border border-dashed border-[#E2D7C3]">
                  <p className="font-bold text-[#132B32]">No remarks recorded yet</p>
                  <p className="mt-1 text-[#665C52]">Provide direct encouragement or tactical feedback to help {player.fullName} develop.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl"
                    onClick={() => {
                      setNewRemarkText("");
                      setAddRemarkError(null);
                      setIsAddRemarkOpen(true);
                    }}
                  >
                    + Create First Remark
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {remarks.map((remark) => (
                    <div
                      key={remark.id}
                      className="p-3.5 rounded-xl border border-[#E2D7C3] bg-[#FFF9EF] hover:bg-[#F5EBD8]/40 transition-colors"
                    >
                      <p className="text-xs text-[#132B32] whitespace-pre-wrap leading-relaxed">
                        {remark.content}
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-[#E2D7C3] flex items-center justify-between text-[11px] text-[#7A6D5F]">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span>Recorded on {formatDateTime(remark.createdAt)}</span>
                          {remark.updatedAt && remark.updatedAt !== remark.createdAt && (
                            <span className="text-[#D95B24] font-medium">
                              (edited {formatDateTime(remark.updatedAt)})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRemark(remark)}
                            className="font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32] hover:text-[#D95B24] transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <span>&bull;</span>
                          <button
                            type="button"
                            onClick={() => setDeletingRemark(remark)}
                            className="font-barlow-condensed font-bold uppercase tracking-wider text-[#991B1B] hover:text-[#7F1D1D] transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
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

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2D7C3]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(false)}
              disabled={updating}
              className="font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={updating}
              className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold rounded-xl"
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
        <div className="flex justify-end gap-2 pt-2 border-t border-[#E2D7C3]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsArchiveConfirmOpen(false)}
            disabled={togglingArchive}
            className="font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl"
          >
            Cancel
          </Button>
          <Button
            variant={player.status === "archived" ? "primary" : "secondary"}
            size="sm"
            onClick={handleToggleArchive}
            isLoading={togglingArchive}
            className={`font-barlow-condensed font-bold rounded-xl ${
              player.status === "archived"
                ? "bg-[#1F382B] text-white"
                : "bg-[#D95B24] text-white"
            }`}
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
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {addRemarkError}
            </div>
          )}

          <div>
            <label className="block text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32] mb-1">
              Remark Content *
            </label>
            <textarea
              className="w-full h-32 px-3 py-2 text-xs text-[#132B32] bg-[#FFF9EF] border border-[#DACBB4] rounded-xl focus:outline-none focus:border-[#D95B24] resize-y"
              placeholder="e.g. Excellent defensive positioning in today's match. Focus on early ball release during transitions."
              value={newRemarkText}
              onChange={(e) => setNewRemarkText(e.target.value)}
              maxLength={1000}
              required
              autoFocus
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-[#7A6D5F] font-mono">
              <span>Max 1,000 characters</span>
              <span className={newRemarkText.length >= 950 ? "text-[#D95B24] font-semibold" : ""}>
                {newRemarkText.length}/1000
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2D7C3]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddRemarkOpen(false)}
              disabled={addingRemark}
              className="font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={addingRemark}
              disabled={!newRemarkText.trim()}
              className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold rounded-xl"
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
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {editRemarkError}
            </div>
          )}

          <div>
            <label className="block text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32] mb-1">
              Remark Content *
            </label>
            <textarea
              className="w-full h-32 px-3 py-2 text-xs text-[#132B32] bg-[#FFF9EF] border border-[#DACBB4] rounded-xl focus:outline-none focus:border-[#D95B24] resize-y"
              value={editRemarkText}
              onChange={(e) => setEditRemarkText(e.target.value)}
              maxLength={1000}
              required
              autoFocus
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-[#7A6D5F] font-mono">
              <span>Max 1,000 characters</span>
              <span className={editRemarkText.length >= 950 ? "text-[#D95B24] font-semibold" : ""}>
                {editRemarkText.length}/1000
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2D7C3]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingRemark(null)}
              disabled={updatingRemark}
              className="font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={updatingRemark}
              disabled={!editRemarkText.trim()}
              className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold rounded-xl"
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
            <div className="p-3 bg-[#FFF9EF] border border-[#E2D7C3] rounded-xl text-xs text-[#132B32] max-h-24 overflow-y-auto italic">
              &ldquo;{deletingRemark.content}&rdquo;
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2D7C3]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingRemark(null)}
              disabled={deletingRemarkLoading}
              className="font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDeleteRemark}
              isLoading={deletingRemarkLoading}
              className="!bg-[#991B1B] hover:!bg-[#7F1D1D] !text-white font-barlow-condensed font-bold rounded-xl"
            >
              Delete Remark
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
