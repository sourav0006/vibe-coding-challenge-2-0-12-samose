"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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

  const [sportId, setSportId] = useState(activeSports[0]?.id || "");
  const [matchDate, setMatchDate] = useState(getTodayDateString());
  const [opponentName, setOpponentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sportId) {
      setError("Please select an active sport for this match.");
      return;
    }

    if (!matchDate || !/^\d{4}-\d{2}-\d{2}$/.test(matchDate)) {
      setError("Please select a valid match date (YYYY-MM-DD).");
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

    setLoading(true);

    try {
      const res = await fetch("/api/coach/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sportId,
          matchDate,
          opponentName: opponentName.trim(),
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
          className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5"
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

      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="border-b border-slate-100 pb-5">
          <CardTitle className="text-xl font-bold text-slate-900">
            Schedule New Match Fixture
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Create an official fixture. You will be able to select participating players from the eligible roster and record their individual performance scores.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                {error}
              </div>
            )}

            {/* Sport Select */}
            <div>
              <label
                htmlFor="match-sport"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Sport <span className="text-rose-500">*</span>
              </label>
              {activeSports.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded text-sm">
                  No active sports available. Please activate or create a sport first.
                </div>
              ) : (
                <Select
                  id="match-sport"
                  value={sportId}
                  onChange={(e) => setSportId(e.target.value)}
                  className="w-full"
                  required
                >
                  {activeSports.map((sport) => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </Select>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Only active sports can host official match fixtures.
              </p>
            </div>

            {/* Match Date */}
            <div>
              <label
                htmlFor="match-date"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Match Date <span className="text-rose-500">*</span>
              </label>
              <Input
                id="match-date"
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Player eligibility and same-day attendance restrictions will be computed based on this calendar date.
              </p>
            </div>

            {/* Opponent Name */}
            <div>
              <label
                htmlFor="match-opponent"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Opponent Club / Academy <span className="text-rose-500">*</span>
              </label>
              <Input
                id="match-opponent"
                type="text"
                placeholder="e.g. Manchester City Youth Academy"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                className="w-full"
                maxLength={100}
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Between 2 and 100 characters. Duplicate matches for the same sport, date, and opponent will be rejected.
              </p>
            </div>

            {/* Invariant Note */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800">Match Lifecycle Guarantee:</span>
              <p>
                Matches start in <strong>Draft</strong> status. You can add or remove participating players and adjust individual scores. Once <strong>Finalized</strong>, match details and player scores are permanently locked and immutable.
              </p>
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link href="/dashboard/coach/matches">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading || activeSports.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
              >
                {loading ? "Creating..." : "Create & Open Sheet"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
