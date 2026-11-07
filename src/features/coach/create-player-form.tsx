"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ActivationCodeModal } from "@/components/shared/activation-code-modal";
import type { SportOption } from "./types";

export function CreatePlayerForm({
  initialSports = [],
}: {
  initialSports?: SportOption[];
}) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<number | string>("");
  const [sportId, setSportId] = useState(initialSports[0]?.id || "");

  const [sports, setSports] = useState<SportOption[]>(initialSports);
  const [loadingSports, setLoadingSports] = useState(initialSports.length === 0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Success modal state
  const [successData, setSuccessData] = useState<{
    playerId: string;
    playerName: string;
    playerEmail: string;
    sportName: string;
    activationCode: string;
    expiresAt: string;
  } | null>(null);

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setAge("");
    setFormError(null);
    setSuccessData(null);
  };

  useEffect(() => {
    let ignore = false;
    if (initialSports.length === 0) {
      fetch("/api/coach/sports")
        .then((res) => res.json())
        .then((data) => {
          if (!ignore && data.success) {
            // Only active sports can be selected
            const activeOnly = data.data
              .filter((s: { isActive: boolean }) => s.isActive)
              .map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }));
            setSports(activeOnly);
            if (activeOnly.length > 0) {
              setSportId(activeOnly[0].id);
            }
            setLoadingSports(false);
          }
        })
        .catch(() => {
          if (!ignore) setLoadingSports(false);
        });
    }
    return () => {
      ignore = true;
    };
  }, [initialSports]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const parsedAge = parseInt(age.toString(), 10);

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setFormError("Player full name must be between 2 and 100 characters long.");
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setFormError("Please provide a valid email address.");
      return;
    }

    if (isNaN(parsedAge) || parsedAge < 4 || parsedAge > 100) {
      setFormError("Player age must be an integer between 4 and 100.");
      return;
    }

    if (!sportId) {
      setFormError("Please select an active sport for this player.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/coach/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: trimmedName,
          email: trimmedEmail,
          age: parsedAge,
          sportId,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create player.");
      }

      // Open one-time activation code modal
      setSuccessData({
        playerId: json.data.player.id,
        playerName: json.data.player.fullName,
        playerEmail: json.data.user.email,
        sportName: json.data.player.sportName,
        activationCode: json.data.activationCode,
        expiresAt: json.data.expiresAt,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    const targetPlayerId = successData?.playerId;
    resetForm();
    if (targetPlayerId) {
      router.push(`/dashboard/coach/players/${targetPlayerId}`);
      router.refresh();
    } else {
      router.push("/dashboard/coach/players");
      router.refresh();
    }
  };

  const handleCreateAnother = () => {
    resetForm();
  };

  const sportOptions = sports.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/coach/players"
          className="text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#7A6D5F] hover:text-[#D95B24] transition-colors inline-flex items-center gap-1.5"
        >
          &larr; Back to Players
        </Link>
      </div>

      <div className="space-y-1.5">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-barlow-condensed font-bold tracking-wider uppercase bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E]">
          NEW ATHLETE ONBOARDING
        </span>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-alfa text-[#132B32] uppercase tracking-tight leading-tight mt-1">
          Create New Player
        </h1>
        <p className="text-xs sm:text-sm text-[#665C52]">
          Provision a player profile, assign an active discipline, and generate a single-use 24-hour activation code.
        </p>
      </div>

      <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E2D7C3] bg-[#F5EBD8]">
          <h2 className="text-lg font-alfa text-[#132B32] uppercase tracking-wide">Player Account Information</h2>
          <p className="text-xs text-[#665C52] mt-0.5">
            Enter the player&apos;s personal details. The Coach does not assign passwords; the player will create their password upon activating their account.
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <Input
              label="Full Name *"
              placeholder="e.g. Marcus Rashford, Alex Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
              helperText="Full legal or registered player name."
            />

            <Input
              label="Email Address *"
              type="email"
              placeholder="e.g. player@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              helperText="A single unique email across the academy. Used for login authentication."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Player Age *"
                type="number"
                min={4}
                max={100}
                placeholder="e.g. 16"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                helperText="Allowed range: 4 to 100 years."
              />

              <div>
                <Select
                  label="Assigned Sport *"
                  options={sportOptions}
                  value={sportId}
                  onChange={(e) => setSportId(e.target.value)}
                  disabled={loadingSports || sports.length === 0}
                  helperText={
                    sports.length === 0
                      ? "No active sports found. Please activate or create a sport first."
                      : "Player belongs to exactly one sport."
                  }
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2D7C3] flex items-center justify-end gap-3">
              <Link href="/dashboard/coach/players">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={submitting}
                  className="font-barlow-condensed font-bold border-[#DACBB4] text-[#132B32] hover:bg-[#F5EBD8] rounded-xl"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={submitting}
                disabled={sports.length === 0}
                className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold rounded-xl"
              >
                Create Player &amp; Generate Code
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Activation Code Display Modal */}
      {successData && (
        <ActivationCodeModal
          isOpen={Boolean(successData)}
          onClose={handleModalClose}
          onCreateAnother={handleCreateAnother}
          createAnotherLabel="Create Another Player"
          playerName={successData.playerName}
          playerEmail={successData.playerEmail}
          sportName={successData.sportName}
          code={successData.activationCode}
          expiresAt={successData.expiresAt}
          title="Player Account Provisioned Successfully"
        />
      )}
    </div>
  );
}
