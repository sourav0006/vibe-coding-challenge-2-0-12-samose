"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/ui/metric-card";
import { formatDateOnly, cn } from "@/lib/utils";
import type {
  MatchDetailsDTO,
  MatchParticipantDTO,
  EligibleMatchPlayerDTO,
} from "@/lib/services";

export interface MatchDetailViewProps {
  initialDetails: MatchDetailsDTO;
}

export function MatchDetailView({ initialDetails }: MatchDetailViewProps) {
  const router = useRouter();
  const [details, setDetails] = useState<MatchDetailsDTO>(initialDetails);
  const [participants, setParticipants] = useState<MatchParticipantDTO[]>(
    initialDetails.participants
  );
  const [scores, setScores] = useState<Record<string, number | string>>(() => {
    const map: Record<string, number | string> = {};
    for (const p of initialDetails.participants) {
      map[p.playerId] = p.score;
    }
    return map;
  });

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [savingScores, setSavingScores] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add participant drawer/form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [newPlayerScore, setNewPlayerScore] = useState<string>("7.0");
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(null);

  const isFinalized = details.match.status === "finalized";

  // Participating player IDs
  const participatingPlayerIds = useMemo(() => {
    return new Set(participants.map((p) => p.playerId));
  }, [participants]);

  // Unselected eligible players who can be added
  const availableEligiblePlayers = useMemo(() => {
    return details.eligibleRoster.filter(
      (player: EligibleMatchPlayerDTO) => !participatingPlayerIds.has(player.playerId)
    );
  }, [details.eligibleRoster, participatingPlayerIds]);

  // Stats calculation
  const currentStats = useMemo(() => {
    const list = participants;
    const count = list.length;
    if (count === 0) {
      return { count: 0, average: null, highest: null, lowest: null };
    }
    const scoreVals = list.map((p) => Number(scores[p.playerId] ?? p.score));
    const validScores = scoreVals.filter((s) => !isNaN(s) && s >= 0 && s <= 10);
    if (validScores.length === 0) {
      return { count, average: null, highest: null, lowest: null };
    }
    const sum = validScores.reduce((acc, s) => acc + s, 0);
    return {
      count,
      average: Number((sum / validScores.length).toFixed(1)),
      highest: Math.max(...validScores),
      lowest: Math.min(...validScores),
    };
  }, [participants, scores]);

  // Filtered participants
  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return participants;
    const q = searchQuery.toLowerCase().trim();
    return participants.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
    );
  }, [participants, searchQuery]);

  // Score validation check
  const hasInvalidScore = useMemo(() => {
    for (const p of participants) {
      const val = Number(scores[p.playerId]);
      if (isNaN(val) || val < 0 || val > 10) {
        return true;
      }
    }
    return false;
  }, [participants, scores]);

  // Score input change
  const handleScoreChange = (playerId: string, value: string) => {
    if (isFinalized) return;
    setScores((prev) => ({
      ...prev,
      [playerId]: value,
    }));
  };

  // Save all modified scores in batch
  const handleSaveScores = async () => {
    if (isFinalized) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate all scores
    for (const p of participants) {
      const scoreVal = Number(scores[p.playerId]);
      if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 10) {
        setErrorMessage(
          `Invalid score for ${p.fullName}: Scores must be a valid number between 0 and 10.`
        );
        return;
      }
    }

    setSavingScores(true);
    try {
      const payload = {
        participants: participants.map((p) => ({
          playerId: p.playerId,
          score: Number(scores[p.playerId]),
        })),
      };

      const res = await fetch(`/api/coach/matches/${details.match.id}/participants`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save match scores.");
      }

      setSuccessMessage("All individual scores have been saved successfully.");
      // Refresh match details
      const refreshRes = await fetch(`/api/coach/matches/${details.match.id}`);
      const refreshJson = await refreshRes.json();
      if (refreshRes.ok && refreshJson.success) {
        setDetails(refreshJson.data);
        setParticipants(refreshJson.data.participants);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save scores.");
    } finally {
      setSavingScores(false);
    }
  };

  // Add individual participant
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFinalized) return;
    setErrorMessage(null);

    if (!selectedPlayerId) {
      setErrorMessage("Please select a player from the eligible roster.");
      return;
    }

    const scoreNum = Number(newPlayerScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
      setErrorMessage("Individual score must be a number between 0 and 10.");
      return;
    }

    setAddingParticipant(true);
    try {
      const res = await fetch(`/api/coach/matches/${details.match.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: selectedPlayerId,
          score: scoreNum,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to add participant to match.");
      }

      // Refresh match state
      const refreshRes = await fetch(`/api/coach/matches/${details.match.id}`);
      const refreshJson = await refreshRes.json();
      if (refreshRes.ok && refreshJson.success) {
        setDetails(refreshJson.data);
        setParticipants(refreshJson.data.participants);
        setScores((prev) => ({
          ...prev,
          [selectedPlayerId]: scoreNum,
        }));
      }

      setSelectedPlayerId("");
      setNewPlayerScore("7.0");
      setShowAddForm(false);
      setSuccessMessage("Player added to match score sheet.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to add player.");
    } finally {
      setAddingParticipant(false);
    }
  };

  // Remove participant
  const handleRemoveParticipant = async (playerId: string) => {
    if (isFinalized) return;
    setErrorMessage(null);
    setRemovingPlayerId(playerId);

    try {
      const res = await fetch(
        `/api/coach/matches/${details.match.id}/participants?playerId=${playerId}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to remove player from match.");
      }

      // Refresh match state
      const refreshRes = await fetch(`/api/coach/matches/${details.match.id}`);
      const refreshJson = await refreshRes.json();
      if (refreshRes.ok && refreshJson.success) {
        setDetails(refreshJson.data);
        setParticipants(refreshJson.data.participants);
      }
      setSuccessMessage("Player removed from match score sheet.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to remove player.");
    } finally {
      setRemovingPlayerId(null);
    }
  };

  // Finalize match
  const handleFinalizeMatch = async () => {
    setErrorMessage(null);
    setFinalizing(true);

    try {
      // First save any unsaved scores
      const payload = {
        participants: participants.map((p) => ({
          playerId: p.playerId,
          score: Number(scores[p.playerId] ?? p.score),
        })),
      };

      const putRes = await fetch(`/api/coach/matches/${details.match.id}/participants`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const putJson = await putRes.json();
      if (!putRes.ok || !putJson.success) {
        throw new Error(putJson.error || "Failed to save scores prior to finalization.");
      }

      // Finalize
      const res = await fetch(`/api/coach/matches/${details.match.id}/finalize`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to finalize match.");
      }

      setShowFinalizeModal(false);
      setSuccessMessage("Match has been permanently finalized. All scores are now immutable.");
      router.refresh();

      // Refresh view
      const refreshRes = await fetch(`/api/coach/matches/${details.match.id}`);
      const refreshJson = await refreshRes.json();
      if (refreshRes.ok && refreshJson.success) {
        setDetails(refreshJson.data);
        setParticipants(refreshJson.data.participants);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to finalize match.");
      setShowFinalizeModal(false);
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2D7C3]">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/coach/matches"
            className="p-2 rounded-xl border border-[#DACBB4] bg-[#FFF9EF] text-[#7A6D5F] hover:text-[#132B32] hover:bg-[#F5EBD8] transition-colors"
            title="Back to Matches"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-alfa text-[#132B32] uppercase tracking-tight leading-tight">
                {details.match.title || `vs. ${details.match.opponentName}`}
              </h1>
              {isFinalized ? (
                <Badge variant="success">Finalized</Badge>
              ) : (
                <Badge variant="warning">Draft Fixture</Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#665C52] flex flex-wrap items-center gap-2 mt-1">
              <span className="font-barlow-condensed font-bold uppercase tracking-wider text-[#1F5A38] bg-[#E5F4EB] px-2 py-0.5 rounded border border-[#C2E4CD]">
                {details.match.sportName}
              </span>
              <span className="font-bold text-[#132B32]">vs. {details.match.opponentName}</span>
              <span className="text-[#A39687]">•</span>
              <span className="font-mono text-[#7A6D5F]">{formatDateOnly(details.match.matchDate)}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {!isFinalized && (
            <>
              <Button
                variant="outline"
                size="md"
                onClick={handleSaveScores}
                disabled={savingScores || participants.length === 0 || hasInvalidScore}
                className="font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl text-xs h-9 px-4 cursor-pointer"
              >
                {savingScores ? "Saving..." : "Save Scores"}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowFinalizeModal(true)}
                disabled={
                  savingScores ||
                  participants.length === 0 ||
                  hasInvalidScore ||
                  details.sameDaySession?.status === "open"
                }
                className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold rounded-xl text-xs h-9 px-4 shadow-xs cursor-pointer"
              >
                Finalize Match
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Finalized Status Banner */}
      {isFinalized && (
        <div className="p-4 rounded-2xl bg-[#E5F4EB] border border-[#C2E4CD] text-[#1F5A38] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1F382B] flex items-center justify-center text-[#4ADE80] shrink-0">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-alfa text-[#132B32] uppercase tracking-wide">
                Match Finalized &amp; Records Immutable
              </p>
              <p className="text-xs text-[#1F5A38] mt-0.5">
                {details.match.finalizedAt ? (
                  <>Locked on {formatDateOnly(details.match.finalizedAt)}. Individual player scores are now part of official performance history.</>
                ) : (
                  <>Locked permanently. Scores and participation cannot be modified.</>
                )}
              </p>
            </div>
          </div>
          <span className="text-xs font-barlow-condensed font-bold uppercase tracking-wider px-3 py-1 bg-[#1F382B] rounded-full text-[#FFF9EF] self-start sm:self-auto border border-[#2E543E]">
            Official Record
          </span>
        </div>
      )}

      {/* Same-day Session Attendance Notice Banner */}
      {details.sameDaySession && (
        <div
          className={cn(
            "p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed shadow-xs",
            details.sameDaySession.status === "open"
              ? "bg-[#FFF4DE] border-[#FAD79A] text-[#9A6700]"
              : "bg-[#E3EAF0] border-[#CBD7E2] text-[#132B32]"
          )}
        >
          <div className="w-5 h-5 mt-0.5 shrink-0">
            {details.sameDaySession.status === "open" ? (
              <svg
                className="w-5 h-5 text-[#D95B24]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-[#132B32]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
            )}
          </div>
          <div>
            <span className="font-alfa text-xs uppercase tracking-wide block mb-0.5">
              {details.sameDaySession.status === "open"
                ? "Pending Practice Session Attendance"
                : "Same-Day Attendance Enforced"}
            </span>
            {details.sameDaySession.status === "open" ? (
              <>
                A practice session for <strong>{details.match.sportName}</strong> on this date is still{" "}
                <strong>Open</strong>. This match cannot be finalized until all attendance marks are recorded and that session is closed.
              </>
            ) : (
              <>
                A closed practice session exists on this date. Only players verified as <strong>Present</strong> in that session are eligible to participate. Absent or unmarked players are excluded by the backend.
              </>
            )}
          </div>
        </div>
      )}

      {/* Feedback alerts */}
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

      {/* Aggregate Performance Metrics Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <MetricCard
          title="PARTICIPATING ROSTER"
          value={String(currentStats.count).padStart(2, "0")}
          subtitle={`Eligible available: ${availableEligiblePlayers.length}`}
        />

        <MetricCard
          title="AVERAGE PERFORMANCE"
          value={currentStats.average !== null ? `${currentStats.average.toFixed(1)} / 10` : "—"}
          subtitle="Individual score mean"
        />

        <MetricCard
          title="HIGHEST SCORE"
          value={currentStats.highest !== null ? `${currentStats.highest.toFixed(1)} / 10` : "—"}
          subtitle="Peak player rating"
        />

        <MetricCard
          title="LOWEST SCORE"
          value={currentStats.lowest !== null ? `${currentStats.lowest.toFixed(1)} / 10` : "—"}
          subtitle="Minimum player rating"
        />
      </div>

      {/* Main Score Sheet */}
      <div className="border border-[#E2D7C3] bg-[#FFFDF8] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E2D7C3] bg-[#F5EBD8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-alfa text-[#132B32] uppercase tracking-wide">
              Individual Performance Sheet
            </h3>
            <p className="text-xs text-[#665C52] mt-0.5">
              Scores represent individual technical and physical performance (0.0 to 10.0 scale). Team match outcomes are not tracked.
            </p>
          </div>

          {!isFinalized && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddForm(!showAddForm)}
                className="font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl text-xs h-9 px-3.5 cursor-pointer"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {showAddForm ? "Close Roster Picker" : "+ Add Player to Fixture"}
              </Button>
            </div>
          )}
        </div>

        {/* Add Player Drawer / Inline Form */}
        {!isFinalized && showAddForm && (
          <div className="p-4 bg-[#FFF9EF] border-b border-[#E2D7C3]">
            <h4 className="text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32] mb-3">
              Select Eligible Player
            </h4>
            {availableEligiblePlayers.length === 0 ? (
              <p className="text-xs text-[#7A6D5F]">
                All eligible active players for this sport have already been added to the sheet.
              </p>
            ) : (
              <form
                onSubmit={handleAddParticipant}
                className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
              >
                <div className="flex-1">
                  <label
                    htmlFor="eligible-player-select"
                    className="block text-xs font-barlow-condensed font-bold text-[#132B32] uppercase tracking-wider mb-1"
                  >
                    Eligible Roster ({availableEligiblePlayers.length} available)
                  </label>
                  <select
                    id="eligible-player-select"
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-[#DACBB4] bg-[#FFF9EF] p-2 text-[#132B32] focus:outline-none focus:border-[#D95B24]"
                    required
                  >
                    <option value="">-- Choose an eligible player --</option>
                    {availableEligiblePlayers.map((p: EligibleMatchPlayerDTO) => (
                      <option
                        key={p.playerId}
                        value={p.playerId}
                        disabled={!p.isEligibleForMatch}
                      >
                        {p.fullName} ({p.email})
                        {p.sameDayAttendance ? ` • [${p.sameDayAttendance.toUpperCase()}]` : ""}
                        {!p.isEligibleForMatch ? ` (Ineligible: ${p.ineligibilityReason})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-36">
                  <label
                    htmlFor="new-player-score"
                    className="block text-xs font-barlow-condensed font-bold text-[#132B32] uppercase tracking-wider mb-1"
                  >
                    Score (0.0 - 10.0)
                  </label>
                  <Input
                    id="new-player-score"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={newPlayerScore}
                    onChange={(e) => setNewPlayerScore(e.target.value)}
                    className="text-xs h-9 bg-[#FFF9EF] border-[#DACBB4] rounded-xl text-[#132B32]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={addingParticipant || !selectedPlayerId}
                  className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold rounded-xl text-xs h-9 px-4 cursor-pointer"
                >
                  {addingParticipant ? "Adding..." : "+ Add to Sheet"}
                </Button>
              </form>
            )}
          </div>
        )}

        {/* Filter / Search Bar */}
        <div className="p-3 border-b border-[#E2D7C3] bg-[#F5EBD8]/50 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Search participating player by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs h-8 pl-8 bg-[#FFF9EF] border-[#DACBB4] rounded-xl text-[#132B32]"
            />
            <svg
              className="w-4 h-4 text-[#7A6D5F] absolute left-2.5 top-2"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <span className="text-xs font-barlow-condensed font-bold text-[#7A6D5F]">
            {filteredParticipants.length} of {participants.length} shown
          </span>
        </div>

        {/* Table Content */}
        {participants.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F5EBD8] border border-[#E2D7C3] flex items-center justify-center mx-auto text-[#7A6D5F]">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            </div>
            <h4 className="text-sm font-alfa text-[#132B32] uppercase">No Participants Added Yet</h4>
            <p className="text-xs text-[#665C52] max-w-sm mx-auto">
              Select participating players from the eligible roster above and record their individual scores. A match requires at least one participant to be finalized.
            </p>
            {!isFinalized && (
              <Button
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold rounded-xl text-xs"
              >
                + Add Participating Players
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#132B32]">
              <thead className="bg-[#F5EBD8] border-b border-[#E2D7C3] text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32]">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Player Name
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Email
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-center w-48">
                    Individual Score (0-10)
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-center">
                    Rating Tier
                  </th>
                  {!isFinalized && (
                    <th scope="col" className="px-5 py-3.5 text-right w-24">
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE0CF]/60 font-normal">
                {filteredParticipants.map((p) => {
                  const currentScoreVal = Number(scores[p.playerId] ?? p.score);
                  const isScoreInvalid =
                    isNaN(currentScoreVal) || currentScoreVal < 0 || currentScoreVal > 10;

                  return (
                    <tr
                      key={p.playerId}
                      className={cn(
                        "hover:bg-[#F5EBD8]/40 transition-colors",
                        isScoreInvalid && "bg-rose-50/50"
                      )}
                    >
                      <td className="px-5 py-4 font-bold text-[#132B32] whitespace-nowrap">
                        <Link
                          href={`/dashboard/coach/players/${p.playerId}`}
                          className="hover:text-[#D95B24] transition-colors"
                        >
                          {p.fullName}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#665C52] font-mono whitespace-nowrap">
                        {p.email}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        {isFinalized ? (
                          <span className="inline-flex items-center justify-center font-alfa text-xs text-[#1F5A38] bg-[#E5F4EB] px-3 py-1 rounded-lg border border-[#C2E4CD]">
                            {Number(p.score).toFixed(1)} / 10
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={scores[p.playerId] ?? ""}
                              onChange={(e) => handleScoreChange(p.playerId, e.target.value)}
                              className={cn(
                                "w-24 text-center font-alfa text-sm h-8 bg-[#FFF9EF] border-[#DACBB4] rounded-xl text-[#132B32]",
                                isScoreInvalid && "border-rose-500 text-rose-700 bg-rose-50"
                              )}
                            />
                            <span className="text-xs text-[#7A6D5F] font-mono">/ 10</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        {!isNaN(currentScoreVal) && currentScoreVal >= 8 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-barlow-condensed font-bold uppercase tracking-wider bg-[#E5F4EB] text-[#1F5A38] border border-[#C2E4CD]">
                            Outstanding
                          </span>
                        ) : !isNaN(currentScoreVal) && currentScoreVal >= 6 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-barlow-condensed font-bold uppercase tracking-wider bg-[#E3EAF0] text-[#132B32] border border-[#CBD7E2]">
                            Competent
                          </span>
                        ) : !isNaN(currentScoreVal) && currentScoreVal >= 4 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-barlow-condensed font-bold uppercase tracking-wider bg-[#FFF4DE] text-[#9A6700] border border-[#FAD79A]">
                            Developing
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-barlow-condensed font-bold uppercase tracking-wider bg-[#F5EBD8] text-[#665C52] border border-[#DACBB4]">
                            Needs Support
                          </span>
                        )}
                      </td>
                      {!isFinalized && (
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(p.playerId)}
                            disabled={removingPlayerId === p.playerId}
                            className="text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#991B1B] hover:text-[#7F1D1D] p-1 hover:bg-[#FEE2E2] rounded cursor-pointer"
                            title="Remove participant"
                          >
                            {removingPlayerId === p.playerId ? "Removing..." : "Remove"}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Finalize Confirmation Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-[#FFFDF8] rounded-2xl shadow-xl max-w-md w-full border border-[#E2D7C3] overflow-hidden">
            <div className="p-5 border-b border-[#E2D7C3] bg-[#F5EBD8]">
              <h3 className="text-lg font-alfa text-[#132B32] uppercase tracking-wide">
                Confirm Match Finalization
              </h3>
              <p className="text-xs text-[#665C52] mt-1">
                Permanent lock and individual performance scoring commit.
              </p>
            </div>
            <div className="p-5 space-y-4 text-sm text-[#132B32]">
              <div className="p-3 bg-[#FFF4DE] border border-[#FAD79A] rounded-xl text-[#9A6700] text-xs space-y-1">
                <span className="font-bold block">Permanent Immutability Warning:</span>
                <p>
                  Once finalized, this match and all {participants.length} recorded individual player scores will become <strong>permanently immutable</strong>.
                </p>
                <p>
                  You will not be able to edit scores, add or remove players, modify the match date, or reopen this match under any circumstances.
                </p>
              </div>

              <div className="text-xs space-y-1">
                <div className="flex justify-between py-1 border-b border-[#E2D7C3]/60">
                  <span className="text-[#665C52]">Match Title:</span>
                  <span className="font-bold text-[#132B32]">
                    {details.match.title || "Match Fixture"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2D7C3]/60">
                  <span className="text-[#665C52]">Opponent:</span>
                  <span className="font-bold text-[#132B32]">
                    {details.match.opponentName}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2D7C3]/60">
                  <span className="text-[#665C52]">Match Date:</span>
                  <span className="font-mono font-bold text-[#132B32]">
                    {formatDateOnly(details.match.matchDate)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2D7C3]/60">
                  <span className="text-[#665C52]">Total Participants:</span>
                  <span className="font-bold text-[#132B32]">
                    {participants.length} players
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#665C52]">Roster Average Score:</span>
                  <span className="font-alfa text-xs text-[#1F5A38]">
                    {currentStats.average !== null ? currentStats.average.toFixed(1) : "—"} / 10
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-[#F5EBD8] border-t border-[#E2D7C3] flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFinalizeModal(false)}
                disabled={finalizing}
                className="font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleFinalizeMatch}
                disabled={finalizing}
                className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold rounded-xl"
              >
                {finalizing ? "Finalizing..." : "Yes, Finalize Permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
