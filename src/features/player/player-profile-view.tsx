"use client";

import { formatDateOnly } from "@/lib/utils";
import type { SafePlayerProfileDTO } from "@/lib/services";

export interface PlayerProfileViewProps {
  profile: SafePlayerProfileDTO;
}

export function PlayerProfileView({ profile }: PlayerProfileViewProps) {
  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-[#E2D7C3]">
        <div>
          <span className="font-barlow-condensed text-xs font-bold uppercase tracking-widest text-[#D95B24]">
            Official Athlete Credentials
          </span>
          <h1 className="font-alfa text-2xl sm:text-3xl md:text-4xl text-[#132B32] uppercase tracking-tight mt-1">
            My Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#5D6B6E] mt-0.5">
            Verified athlete credentials and official academy registration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-barlow-condensed uppercase tracking-wider bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
            <span>Verified Active Athlete</span>
          </span>
        </div>
      </div>

      {/* Main Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Personal Information */}
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl overflow-hidden shadow-xs">
          <div className="border-b border-[#E2D7C3] bg-[#FAF5EC] px-5 py-3.5">
            <h2 className="font-alfa text-sm sm:text-base text-[#132B32] uppercase tracking-tight">
              Personal Information
            </h2>
          </div>
          <div className="p-5 space-y-4 text-xs">
            <div>
              <span className="font-barlow-condensed uppercase tracking-wider text-[11px] font-bold text-[#718E94] block">
                Full Name
              </span>
              <span className="text-base font-bold text-[#132B32] block mt-0.5">
                {profile.fullName}
              </span>
            </div>

            <div>
              <span className="font-barlow-condensed uppercase tracking-wider text-[11px] font-bold text-[#718E94] block">
                Email Address
              </span>
              <span className="text-sm font-semibold text-[#132B32] block mt-0.5">
                {profile.email}
              </span>
              <span className="text-[11px] text-[#718E94] mt-0.5 block">
                Your permanent login identifier.
              </span>
            </div>

            <div>
              <span className="font-barlow-condensed uppercase tracking-wider text-[11px] font-bold text-[#718E94] block">
                Athlete Age
              </span>
              <span className="text-sm font-semibold text-[#132B32] block mt-0.5">
                {profile.age} years old
              </span>
            </div>
          </div>
        </div>

        {/* Academy Registration */}
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-xl overflow-hidden shadow-xs">
          <div className="border-b border-[#E2D7C3] bg-[#FAF5EC] px-5 py-3.5">
            <h2 className="font-alfa text-sm sm:text-base text-[#132B32] uppercase tracking-tight">
              Academy Registration
            </h2>
          </div>
          <div className="p-5 space-y-4 text-xs">
            <div>
              <span className="font-barlow-condensed uppercase tracking-wider text-[11px] font-bold text-[#718E94] block">
                Sport Discipline
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-bold text-[#132B32]">
                  {profile.sportName}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-barlow-condensed uppercase tracking-wider bg-[#FAF5EC] border border-[#E8DEC9] text-[#132B32]">
                  Primary Sport
                </span>
              </div>
            </div>

            <div>
              <span className="font-barlow-condensed uppercase tracking-wider text-[11px] font-bold text-[#718E94] block">
                Account Activation Status
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E2F2E7] text-[#1F382B] border border-[#A6D5B4]">
                  ✓ Activated
                </span>
                <span className="text-[#718E94] text-[11px]">Password set &amp; verified</span>
              </div>
            </div>

            <div>
              <span className="font-barlow-condensed uppercase tracking-wider text-[11px] font-bold text-[#718E94] block">
                Registration Date
              </span>
              <span className="text-sm font-semibold text-[#132B32] block mt-0.5">
                {formatDateOnly(profile.dateJoined)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Administrative Notice */}
      <div className="bg-[#FAF5EC] border border-[#E8DEC9] rounded-xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
        <div className="w-8 h-8 rounded-full bg-[#E5D7C0] border border-[#D5A64A] text-[#132B32] font-bold text-sm flex items-center justify-center shrink-0">
          i
        </div>
        <div className="text-xs text-[#5D6B6E] space-y-1">
          <p className="font-bold text-[#132B32]">
            Academy Administrative Policy
          </p>
          <p className="leading-relaxed">
            To maintain academic and competitive integrity across squads, sport assignments and personal details are managed directly by academy coaches. If you need to update your assigned discipline or account information, please consult your coach.
          </p>
        </div>
      </div>
    </div>
  );
}
