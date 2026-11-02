"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateOnly } from "@/lib/utils";
import type { SafePlayerProfileDTO } from "@/lib/services";

export interface PlayerProfileViewProps {
  profile: SafePlayerProfileDTO;
}

export function PlayerProfileView({ profile }: PlayerProfileViewProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Athlete Account
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Profile
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verified athlete credentials and academy registration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            Verified Active Athlete
          </Badge>
        </div>
      </div>

      {/* Main Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900">
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold block">
                Full Name
              </span>
              <span className="text-base font-bold text-slate-900 block mt-0.5">
                {profile.fullName}
              </span>
            </div>

            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold block">
                Email Address
              </span>
              <span className="text-sm font-semibold text-slate-800 block mt-0.5">
                {profile.email}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Your permanent login identifier.
              </span>
            </div>

            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold block">
                Athlete Age
              </span>
              <span className="text-sm font-semibold text-slate-800 block mt-0.5">
                {profile.age} years old
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900">
              Academy Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold block">
                Sport Discipline
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-bold text-slate-900">
                  {profile.sportName}
                </span>
                <Badge variant="info" size="sm">
                  Primary Sport
                </Badge>
              </div>
            </div>

            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold block">
                Account Activation Status
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="success" size="sm">
                  Activated
                </Badge>
                <span className="text-slate-500 text-[11px]">Password set &amp; verified</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold block">
                Registration Date
              </span>
              <span className="text-sm font-semibold text-slate-800 block mt-0.5">
                {formatDateOnly(profile.dateJoined)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Administrative Notice */}
      <Card className="border border-slate-200 bg-slate-50/70 shadow-xs">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-sm font-bold">
            ℹ
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">
              Academy Administrative Policy
            </p>
            <p>
              To maintain academic and competitive integrity across squads, sport assignments and personal details are managed directly by academy coaches. If you need to update your assigned discipline or account information, please consult your coach.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
