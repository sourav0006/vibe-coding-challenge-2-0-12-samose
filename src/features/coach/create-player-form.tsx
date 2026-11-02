"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
    if (successData) {
      router.push(`/dashboard/coach/players/${successData.playerId}`);
    } else {
      router.push("/dashboard/coach/players");
    }
  };

  const sportOptions = sports.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
        <Link href="/dashboard/coach/players" className="hover:text-[var(--color-primary)]">
          &larr; Back to Players
        </Link>
      </div>

      <PageHeader
        title="Create New Player"
        description="Provision a player profile, assign an active discipline, and generate a single-use 24-hour activation code."
      />

      <Card>
        <CardHeader>
          <CardTitle>Player Account Information</CardTitle>
          <CardDescription>
            Enter the player&apos;s personal details. The Coach does not assign passwords; the player will create their password upon activating their account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
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

            <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-3">
              <Link href="/dashboard/coach/players">
                <Button type="button" variant="outline" size="sm" disabled={submitting}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={submitting}
                disabled={sports.length === 0}
              >
                Create Player &amp; Generate Code
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Activation Code Display Modal */}
      {successData && (
        <ActivationCodeModal
          isOpen={Boolean(successData)}
          onClose={handleModalClose}
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
