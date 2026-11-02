"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
          className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors inline-flex items-center gap-1"
        >
          &larr; Back to Sessions
        </Link>
      </div>

      <Card variant="bordered" className="bg-white shadow-xs">
        <CardHeader className="pb-4 border-b border-[var(--color-border)]">
          <CardTitle className="text-xl font-extrabold text-[var(--color-text-primary)]">
            Schedule New Practice Session
          </CardTitle>
          <CardDescription className="text-xs text-[var(--color-text-secondary)] mt-1">
            Create an open training session for a designated sport. All currently assigned eligible players will automatically be populated onto the attendance roster.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error banner */}
            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
                <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Sport Select */}
            <div>
              <label htmlFor="sportId" className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                Sport <span className="text-red-500">*</span>
              </label>
              {activeSports.length === 0 ? (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
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
                />
              )}
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Only active sports can hold training sessions.
              </p>
            </div>

            {/* Session Date */}
            <div>
              <label htmlFor="sessionDate" className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                Session Date <span className="text-red-500">*</span>
              </label>
              <Input
                id="sessionDate"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                disabled={loading}
                required
                className="h-10 text-xs font-medium"
              />
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Stored in consistent calendar time. Multiple sessions for the same sport on the same date are prohibited.
              </p>
            </div>

            {/* Session Info Note */}
            <div className="p-3.5 rounded-lg bg-[var(--color-background-subtle)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] space-y-1">
              <strong className="text-[var(--color-text-primary)]">Session Lifecycle:</strong>
              <p className="text-[11px]">
                Newly created sessions default to <span className="font-semibold text-emerald-700">Open</span> status. Once attendance is completely marked for all applicable players, you can finalize and lock the session.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
              <Link href="/dashboard/coach/sessions">
                <Button variant="outline" size="md" type="button" disabled={loading} className="text-xs">
                  Cancel
                </Button>
              </Link>
              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={loading}
                disabled={loading || activeSports.length === 0}
                className="text-xs"
              >
                Create Practice Session
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
