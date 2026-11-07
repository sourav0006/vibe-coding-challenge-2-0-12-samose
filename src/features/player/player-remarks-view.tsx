"use client";

import { formatDateTime } from "@/lib/utils";
import type { SafeCoachRemarkDTO } from "@/lib/services";

export interface PlayerRemarksViewProps {
  remarks: SafeCoachRemarkDTO[];
}

export function PlayerRemarksView({ remarks }: PlayerRemarksViewProps) {
  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-[#E2D7C3]">
        <div>
          <span className="font-barlow-condensed text-xs font-bold uppercase tracking-widest text-[#D95B24]">
            Athlete Journal &bull; Coaching Notes
          </span>
          <h1 className="font-alfa text-2xl sm:text-3xl md:text-4xl text-[#132B32] uppercase tracking-tight mt-1">
            Coach Feedback &amp; Remarks
          </h1>
          <p className="text-xs sm:text-sm text-[#5D6B6E] mt-0.5">
            Private developmental notes, tactical guidance, and encouragement from your academy coaches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-barlow-condensed uppercase tracking-wider bg-[#132B32] text-[#FFF9EF] border border-[#D5A64A]/60 shadow-2xs">
            {remarks.length} {remarks.length === 1 ? "Remark" : "Remarks"}
          </span>
        </div>
      </div>

      {/* Remarks Feed */}
      {remarks.length === 0 ? (
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl py-16 px-6 text-center shadow-xs">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#FAF5EC] border border-[#E8DEC9] text-[#B8892E] flex items-center justify-center text-xl">
            💬
          </div>
          <p className="font-alfa text-base text-[#132B32] uppercase tracking-tight">No feedback yet</p>
          <p className="mt-1 text-xs text-[#5D6B6E] max-w-md mx-auto">
            Your coach&apos;s feedback will appear here. After practice sessions and matches, your coaches will record developmental notes to help you improve.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {remarks.map((remark) => (
            <div
              key={remark.id}
              className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl p-5 sm:p-6 shadow-xs hover:border-[#D5A64A] transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-[#D5A64A] font-serif text-3xl sm:text-4xl leading-none select-none">
                  &ldquo;
                </span>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-xs sm:text-sm text-[#132B32] italic leading-relaxed whitespace-pre-wrap">
                    {remark.content}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EBE1D0] flex flex-wrap items-center justify-between gap-2 text-xs text-[#718E94]">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#4ADE80]" />
                  <span className="font-barlow-condensed font-semibold uppercase tracking-wider text-[11px] text-[#132B32]">
                    Recorded by Academy Coaching Staff
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span>{formatDateTime(remark.createdAt)}</span>
                  {remark.updatedAt && remark.updatedAt !== remark.createdAt && (
                    <span className="text-[#D95B24] font-medium">
                      (edited {formatDateTime(remark.updatedAt)})
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
