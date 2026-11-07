"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getTodayDateString } from "@/lib/utils";
import type { SportOption } from "./match-list-view";

export interface CreateMatchFormProps {
  sportsList: SportOption[];
}

export function CreateMatchForm({ sportsList }: CreateMatchFormProps) {
  const router = useRouter();

  // Filter to active sports only
  const activeSports = sportsList.filter((s) => s.isActive !== false);

  const [title, setTitle] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [sportId, setSportId] = useState(activeSports[0]?.id || "");
  const [matchDate, setMatchDate] = useState(getTodayDateString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || title.trim().length < 2) {
      setError("Match title is required and must be at least 2 characters long.");
      return;
    }

    if (title.trim().length > 100) {
      setError("Match title cannot exceed 100 characters.");
      return;
    }

    if (!opponentName.trim() || opponentName.trim().length < 2) {
      setError("Opponent name is required and must be at least 2 characters long.");
      return;
    }

    if (opponentName.trim().length > 100) {
      setError("Opponent name cannot exceed 100 characters.");
      return;
    }

    if (!sportId) {
      setError("Please select an active sport for this match.");
      return;
    }

    if (!matchDate || !/^\d{4}-\d{2}-\d{2}$/.test(matchDate)) {
      setError("Please select a valid match date (YYYY-MM-DD).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/coach/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          opponentName: opponentName.trim(),
          sportId,
          matchDate,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create match fixture.");
      }

      // Route straight to the newly created match's score sheet
      router.push(`/dashboard/coach/matches/${json.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create match fixture.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/coach/matches"
          className="text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#7A6D5F] hover:text-[#D95B24] transition-colors inline-flex items-center gap-1.5"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Matches
        </Link>
      </div>

      <div className="space-y-1.5">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-barlow-condensed font-bold tracking-wider uppercase bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E]">
          COMPETITION FIXTURE SCHEDULING
        </span>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-alfa text-[#132B32] uppercase tracking-tight leading-tight mt-1">
          Schedule Match Fixture
        </h1>
        <p className="text-xs sm:text-sm text-[#665C52]">
          Schedule a match, select eligible players, and record individual scores.
        </p>
      </div>

      <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E2D7C3] bg-[#F5EBD8]">
          <h2 className="text-lg font-alfa text-[#132B32] uppercase tracking-wide">
            Fixture Details &amp; Opponent
          </h2>
          <p className="text-xs text-[#665C52] mt-0.5">
            Designate the title, opponent academy, discipline, and fixture date.
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            {/* Field 1: Match Title */}
            <div>
              <label
                htmlFor="match-title"
                className="block text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32] mb-1"
              >
                Match Title <span className="text-[#D95B24]">*</span>
              </label>
              <Input
                id="match-title"
                type="text"
                placeholder="e.g. Test Match 1, Dumka Series M1, Inter Academy Final"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#FFF9EF] border-[#DACBB4] rounded-xl text-[#132B32]"
                maxLength={100}
                required
              />
              <p className="mt-1 text-xs text-[#7A6D5F]">
                Between 2 and 100 characters. Multiple fixtures against the same opponent on the same day are supported with unique titles.
              </p>
            </div>

            {/* Field 2: Opponent Club / Academy */}
            <div>
              <label
                htmlFor="match-opponent"
                className="block text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32] mb-1"
              >
                Opponent Club / Academy <span className="text-[#D95B24]">*</span>
              </label>
              <Input
                id="match-opponent"
                type="text"
                placeholder="e.g. Dumka Academy, Manchester City Youth Academy"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                className="w-full bg-[#FFF9EF] border-[#DACBB4] rounded-xl text-[#132B32]"
                maxLength={100}
                required
              />
              <p className="mt-1 text-xs text-[#7A6D5F]">
                Between 2 and 100 characters. Name of the visiting or hosting opponent academy.
              </p>
            </div>

            {/* Field 3: Sport */}
            <div>
              <label
                htmlFor="match-sport"
                className="block text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32] mb-1"
              >
                Sport <span className="text-[#D95B24]">*</span>
              </label>
              {activeSports.length === 0 ? (
                <div className="p-3 bg-[#FFF4DE] border border-[#FAD79A] text-[#9A6700] rounded-xl text-xs">
                  No active sports available. Please activate or create a sport first.
                </div>
              ) : (
                <Select
                  id="match-sport"
                  value={sportId}
                  onChange={(e) => setSportId(e.target.value)}
                  className="w-full bg-[#FFF9EF] border-[#DACBB4] rounded-xl text-[#132B32]"
                  required
                >
                  {activeSports.map((sport) => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </Select>
              )}
              <p className="mt-1 text-xs text-[#7A6D5F]">
                Only active sports can host official match fixtures.
              </p>
            </div>

            {/* Field 4: Match Date */}
            <div>
              <label
                htmlFor="match-date"
                className="block text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32] mb-1"
              >
                Match Date <span className="text-[#D95B24]">*</span>
              </label>
              <Input
                id="match-date"
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full bg-[#FFF9EF] border-[#DACBB4] rounded-xl text-[#132B32]"
                required
              />
              <p className="mt-1 text-xs text-[#7A6D5F] font-mono">
                Player eligibility and same-day attendance restrictions will be computed based on this calendar date.
              </p>
            </div>


            {/* Form actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2D7C3]">
              <Link href="/dashboard/coach/matches">
                <Button
                  type="button"
                  variant="outline"
                  className="font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl text-xs"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading || activeSports.length === 0}
                className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold rounded-xl text-xs min-w-[140px]"
              >
                {loading ? "Creating..." : "Create & Open Sheet"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
