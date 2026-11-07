"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getTodayDateString } from "@/lib/utils";
import type { SportOption } from "./session-list-view";

export interface CreateSessionFormProps {
  sportsList: SportOption[];
}

export function CreateSessionForm({ sportsList }: CreateSessionFormProps) {
  const router = useRouter();

  // Filter to active sports only
  const activeSports = sportsList.filter((s) => s.isActive !== false);

  const [sportId, setSportId] = useState(activeSports[0]?.id || "");
  const [sessionDate, setSessionDate] = useState(getTodayDateString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sportId) {
      setError("Please select an active sport for this practice session.");
      return;
    }

    if (!sessionDate || !/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
      setError("Please select a valid session date (YYYY-MM-DD).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/coach/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sportId,
          sessionDate,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create practice session.");
      }

      // Route straight to the newly created session's attendance sheet
      router.push(`/dashboard/coach/sessions/${json.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating practice session.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/coach/sessions"
          className="text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#7A6D5F] hover:text-[#D95B24] transition-colors inline-flex items-center gap-1.5"
        >
          &larr; Back to Sessions
        </Link>
      </div>

      <div className="space-y-1.5">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-barlow-condensed font-bold tracking-wider uppercase bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E]">
          TRAINING ROSTER DISPATCH
        </span>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-alfa text-[#132B32] uppercase tracking-tight leading-tight mt-1">
          Schedule Practice Session
        </h1>
        <p className="text-xs sm:text-sm text-[#665C52]">
          Schedule a practice session. Eligible players are added automatically.
        </p>
      </div>

      <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E2D7C3] bg-[#F5EBD8]">
          <h2 className="text-lg font-alfa text-[#132B32] uppercase tracking-wide">
            Session Details &amp; Date
          </h2>
          <p className="text-xs text-[#665C52] mt-0.5">
            Designate the sport discipline and calendar date. A single session per sport per date is enforced.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
                <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Sport Select */}
            <div>
              <label htmlFor="sportId" className="block text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32] mb-1.5">
                Sport <span className="text-[#D95B24]">*</span>
              </label>
              {activeSports.length === 0 ? (
                <div className="p-3 rounded-xl bg-[#FFF4DE] border border-[#FAD79A] text-[#9A6700] text-xs">
                  No active sports available. Please activate or catalogue a sport first.
                </div>
              ) : (
                <Select
                  id="sportId"
                  value={sportId}
                  onChange={(e) => setSportId(e.target.value)}
                  options={activeSports.map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  disabled={loading}
                  className="bg-[#FFF9EF] border-[#DACBB4] rounded-xl text-[#132B32]"
                />
              )}
              <p className="text-[11px] text-[#7A6D5F] mt-1">
                Only active sports can hold training sessions.
              </p>
            </div>

            {/* Session Date */}
            <div>
              <label htmlFor="sessionDate" className="block text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32] mb-1.5">
                Session Date <span className="text-[#D95B24]">*</span>
              </label>
              <Input
                id="sessionDate"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                disabled={loading}
                required
                className="h-10 text-xs font-medium bg-[#FFF9EF] border-[#DACBB4] rounded-xl text-[#132B32]"
              />
              <p className="text-[11px] text-[#7A6D5F] mt-1 font-mono">
                Stored in consistent calendar time. Multiple sessions for the same sport on the same date are prohibited.
              </p>
            </div>


            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2D7C3]">
              <Link href="/dashboard/coach/sessions">
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  disabled={loading}
                  className="font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl text-xs"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={loading}
                disabled={loading || activeSports.length === 0}
                className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold rounded-xl text-xs"
              >
                Schedule Practice Session
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
