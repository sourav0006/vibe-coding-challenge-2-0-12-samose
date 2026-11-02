"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { SafeScoutPlayerDTO } from "@/lib/services";

export interface ScoutDiscoveryViewProps {
  initialPlayers: SafeScoutPlayerDTO[];
  initialTotalReadyCount: number;
  initialAvailableSports: Array<{ id: string; name: string; count: number }>;
}

export function ScoutDiscoveryView({
  initialPlayers,
  initialTotalReadyCount,
  initialAvailableSports,
}: ScoutDiscoveryViewProps) {
  const [players] = useState<SafeScoutPlayerDTO[]>(initialPlayers);
  const [totalReadyCount] = useState<number>(initialTotalReadyCount);
  const [availableSports] = useState(initialAvailableSports);

  // Filters
  const [selectedSportId, setSelectedSportId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filtered ready players
  const filteredPlayers = useMemo(() => {
    let result = [...players];

    if (selectedSportId !== "all") {
      result = result.filter((p) => p.sportId === selectedSportId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => p.fullName.toLowerCase().includes(q));
    }

    return result;
  }, [players, selectedSportId, searchQuery]);

  const handleResetFilters = () => {
    setSelectedSportId("all");
    setSearchQuery("");
  };

  const hasActiveFilters = selectedSportId !== "all" || searchQuery.trim() !== "";

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            One Academy Scout Portal
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Talent Discovery Portal
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Discover verified athletes meeting official performance criteria (≥ 75% attendance and ≥ 2 finalized matches).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            Scout Access Verified
          </Badge>
        </div>
      </div>

      {/* Discovery Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 block">
                Discoverable Talent
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-700">
                  {totalReadyCount}
                </span>
                <span className="text-xs text-slate-500">Ready Athletes</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Verified through official academy records
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
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
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Sports With Available Talent
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {availableSports.length}
                </span>
                <span className="text-xs text-slate-500">Disciplines</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Sports with at least one scouting-ready athlete
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
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
                  d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.982-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.483 2.244 9.776 2 12 2s4.517.244 6.75.721v1.515m0 0c.982.143 1.954.317 2.916.52a6.003 6.003 0 01-5.396 4.972m2.48-5.228V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.396-4.972"
                />
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discovery Filter & Search Bar */}
      <Card id="discover" className="border border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search athlete by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs h-9 text-slate-600 hover:text-slate-900"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Dynamic Sport Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setSelectedSportId("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                selectedSportId === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              All Sports ({totalReadyCount})
            </button>
            {availableSports.map((sport) => (
              <button
                key={sport.id}
                type="button"
                onClick={() => setSelectedSportId(sport.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  selectedSportId === sport.id
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                {sport.name} ({sport.count})
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ready Players Grid */}
      {filteredPlayers.length === 0 ? (
        <EmptyState
          title="No Ready Players Found"
          description={
            hasActiveFilters
              ? "No qualified athletes match the selected filter criteria."
              : "There are currently no athletes who meet the official scouting readiness criteria (≥ 75% attendance and ≥ 2 finalized matches)."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((player) => (
            <Card
              key={player.id}
              className="border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      {player.fullName}
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {player.sportName} &bull; Age {player.age}
                    </p>
                  </div>
                  <Badge variant="success" size="sm">
                    Ready
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg text-center">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Attendance
                    </span>
                    <span className="text-sm font-bold text-emerald-700">
                      {player.attendancePercentage}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Matches
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {player.finalizedMatchesPlayed}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Avg Score
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {player.averageIndividualScore !== null
                        ? `${player.averageIndividualScore.toFixed(1)}/10`
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href={`/dashboard/scout/players/${player.id}`} className="block">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
                    >
                      View Scouting Profile &rarr;
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
