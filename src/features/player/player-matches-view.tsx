"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateOnly } from "@/lib/utils";
import type { PlayerMatchHistoryResult } from "@/lib/services";

export interface PlayerMatchesViewProps {
  initialData: PlayerMatchHistoryResult;
}

export function PlayerMatchesView({ initialData }: PlayerMatchesViewProps) {
  const [data, setData] = useState<PlayerMatchHistoryResult>(initialData);
  const [loadingPage, setLoadingPage] = useState(false);

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > data.pagination.totalPages) return;
    setLoadingPage(true);
    try {
      const res = await fetch(`/api/player/matches?page=${newPage}&limit=${data.pagination.limit}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      }
    } catch {
      // Ignore network error
    } finally {
      setLoadingPage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Competition Records
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Match History &amp; Performance
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verified individual performance ratings recorded by academy coaching staff in finalized fixtures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={data.totalMatchesPlayed >= 2 ? "success" : "default"}
            size="md"
          >
            {data.totalMatchesPlayed} Finalized {data.totalMatchesPlayed === 1 ? "Match" : "Matches"}
          </Badge>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Matches Played
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {data.totalMatchesPlayed}
              </span>
              <span className="text-xs text-slate-500">fixtures</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Average Score
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {data.averageScore !== null ? `${data.averageScore}` : "—"}
              </span>
              <span className="text-xs text-slate-400">/ 10</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Top Score
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">
                {data.highestScore !== null ? `${data.highestScore}` : "—"}
              </span>
              <span className="text-xs text-slate-400">/ 10</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Lowest Score
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-700">
                {data.lowestScore !== null ? `${data.lowestScore}` : "—"}
              </span>
              <span className="text-xs text-slate-400">/ 10</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Match History Table Card */}
      <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Finalized Fixtures ({data.pagination.total})
            </CardTitle>
            <span className="text-xs text-slate-400">
              Official 0–10 performance evaluation scale
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {data.history.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <p className="font-semibold text-slate-700">No finalized matches on record</p>
              <p className="mt-1">
                Once coaches finalize matches with your individual performance evaluation, they will be recorded here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-5 py-3">Match Date</th>
                    <th scope="col" className="px-5 py-3">Discipline</th>
                    <th scope="col" className="px-5 py-3">Opponent</th>
                    <th scope="col" className="px-5 py-3 text-right">Individual Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.history.map((record) => (
                    <tr
                      key={record.matchId}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        {formatDateOnly(record.matchDate)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">
                          {record.sportName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        vs {record.opponentName}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded font-bold text-xs ${
                            record.score >= 8.0
                              ? "bg-emerald-100 text-emerald-800"
                              : record.score >= 6.0
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {record.score.toFixed(1)} / 10
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Bar */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500">
              <span>
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(data.pagination.page - 1)}
                  disabled={data.pagination.page <= 1 || loadingPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(data.pagination.page + 1)}
                  disabled={data.pagination.page >= data.pagination.totalPages || loadingPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
