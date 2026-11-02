"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { SafeCoachRemarkDTO } from "@/lib/services";

export interface PlayerRemarksViewProps {
  remarks: SafeCoachRemarkDTO[];
}

export function PlayerRemarksView({ remarks }: PlayerRemarksViewProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Player Feedback
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Coach Feedback &amp; Remarks
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Private developmental notes, tactical guidance, and encouragement from your academy coaches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info" size="md">
            {remarks.length} {remarks.length === 1 ? "Remark" : "Remarks"}
          </Badge>
        </div>
      </div>

      {/* Remarks Feed */}
      {remarks.length === 0 ? (
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="py-16 text-center text-xs text-slate-500">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-lg">
              💬
            </div>
            <p className="font-semibold text-slate-800 text-sm">No feedback yet</p>
            <p className="mt-1 text-slate-500 max-w-md mx-auto">
              Your coach&apos;s feedback will appear here. After practice sessions and matches, your coaches will record developmental notes to help you improve.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {remarks.map((remark) => (
            <Card
              key={remark.id}
              className="border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-colors"
            >
              <CardContent className="p-5 space-y-3">
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {remark.content}
                </p>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Recorded by Academy Coaching Staff</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span>{formatDateTime(remark.createdAt)}</span>
                    {remark.updatedAt && remark.updatedAt !== remark.createdAt && (
                      <span className="text-amber-600 font-medium">
                        (edited {formatDateTime(remark.updatedAt)})
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
