"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateOnly, formatDateTime } from "@/lib/utils";
import type { PlayerAttendanceHistoryResult } from "@/lib/services";

export interface PlayerAttendanceViewProps {
  initialData: PlayerAttendanceHistoryResult;
}

export function PlayerAttendanceView({ initialData }: PlayerAttendanceViewProps) {
  const [data, setData] = useState<PlayerAttendanceHistoryResult>(initialData);
  const [loadingPage, setLoadingPage] = useState(false);

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > data.pagination.totalPages) return;
    setLoadingPage(true);
    try {
      const res = await fetch(`/api/player/attendance?page=${newPage}&limit=${data.pagination.limit}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      }
    } catch {
      // Ignore network failure
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
            Training Records
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Attendance History
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verified official attendance log across applicable closed practice sessions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              data.numericPercentage !== null && data.numericPercentage >= 75
                ? "success"
                : "default"
            }
            size="md"
          >
            {data.attendancePercentage} Attendance
          </Badge>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Attendance Rate
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {data.attendancePercentage}
              </span>
              {data.numericPercentage !== null && (
                <span
                  className={`text-xs font-semibold ${
                    data.numericPercentage >= 75 ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {data.numericPercentage >= 75 ? "✓ Target Met" : "Target: 75%"}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Present Sessions
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">
                {data.presentSessions}
              </span>
              <span className="text-xs text-slate-500">attended</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Absent Sessions
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-700">
                {data.absentSessions}
              </span>
              <span className="text-xs text-slate-500">missed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Closed Sessions
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {data.totalApplicableClosedSessions}
              </span>
              <span className="text-xs text-slate-500">applicable</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History Table Card */}
      <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Session Attendance Records ({data.pagination.total})
            </CardTitle>
            <span className="text-xs text-slate-400">
              Historical sport assignments respected
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {data.history.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <p className="font-semibold text-slate-700">No applicable closed sessions on record</p>
              <p className="mt-1">
                Your official attendance history will update once coaches hold and finalize practice sessions for your sport.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-5 py-3">Session Date</th>
                    <th scope="col" className="px-5 py-3">Discipline</th>
                    <th scope="col" className="px-5 py-3">Attendance Status</th>
                    <th scope="col" className="px-5 py-3 text-right">Recorded Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.history.map((record, idx) => (
                    <tr
                      key={`${record.sessionId}-${idx}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        {formatDateOnly(record.sessionDate)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">
                          {record.sportName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={record.status === "present" ? "success" : "default"}
                          size="sm"
                        >
                          {record.status === "present" ? "✓ Present" : "✕ Absent"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-400 text-[11px]">
                        {formatDateTime(record.markedAt)}
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
