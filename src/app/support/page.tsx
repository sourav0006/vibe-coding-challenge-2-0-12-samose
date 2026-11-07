"use client";

import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import {
  SUPPORT_CONFIG,
  OPERATING_HOURS,
} from "@/config/support.config";

export default function SupportPage() {
  const sections = [
    {
      key: "activation",
      title: SUPPORT_CONFIG.activationHelp.title,
      category: SUPPORT_CONFIG.activationHelp.category,
      badge: "Primary Support",
      emails: SUPPORT_CONFIG.activationHelp.emails,
      phones: SUPPORT_CONFIG.activationHelp.phones,
      description: SUPPORT_CONFIG.activationHelp.description,
      availability: SUPPORT_CONFIG.activationHelp.availability,
      action: {
        label: "Activation Help Guide →",
        href: "/activate/help",
      },
    },
    {
      key: "login",
      title: SUPPORT_CONFIG.accountAccess.title,
      category: SUPPORT_CONFIG.accountAccess.category,
      emails: SUPPORT_CONFIG.accountAccess.emails,
      phones: SUPPORT_CONFIG.accountAccess.phones,
      description: SUPPORT_CONFIG.accountAccess.description,
      availability: SUPPORT_CONFIG.accountAccess.availability,
      action: {
        label: "Go to Sign In →",
        href: "/login",
      },
    },
    {
      key: "general",
      title: SUPPORT_CONFIG.generalEnquiries.title,
      category: SUPPORT_CONFIG.generalEnquiries.category,
      emails: SUPPORT_CONFIG.generalEnquiries.emails,
      phones: SUPPORT_CONFIG.generalEnquiries.phones,
      description: SUPPORT_CONFIG.generalEnquiries.description,
      availability: SUPPORT_CONFIG.generalEnquiries.availability,
    },
    {
      key: "tech",
      title: SUPPORT_CONFIG.technicalSupport.title,
      category: SUPPORT_CONFIG.technicalSupport.category,
      emails: SUPPORT_CONFIG.technicalSupport.emails,
      phones: SUPPORT_CONFIG.technicalSupport.phones,
      description: SUPPORT_CONFIG.technicalSupport.description,
      availability: SUPPORT_CONFIG.technicalSupport.availability,
    },
    {
      key: "privacy",
      title: SUPPORT_CONFIG.privacyRequests.title,
      category: SUPPORT_CONFIG.privacyRequests.category,
      emails: SUPPORT_CONFIG.privacyRequests.emails,
      phones: SUPPORT_CONFIG.privacyRequests.phones,
      description: SUPPORT_CONFIG.privacyRequests.description,
      availability: SUPPORT_CONFIG.privacyRequests.availability,
      action: {
        label: "View Privacy Policy →",
        href: "/legal?tab=privacy",
      },
    },
    {
      key: "admin",
      title: SUPPORT_CONFIG.academyAdministration.title,
      category: SUPPORT_CONFIG.academyAdministration.category,
      emails: SUPPORT_CONFIG.academyAdministration.emails,
      phones: SUPPORT_CONFIG.academyAdministration.phones,
      description: SUPPORT_CONFIG.academyAdministration.description,
      availability: SUPPORT_CONFIG.academyAdministration.availability,
    },
  ];

  return (
    <PublicShell activeNav="support">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="border-b border-[#E2D7C3] pb-6">
          <span className="font-barlow-condensed font-semibold text-xs uppercase tracking-widest text-[#D95B24]">
            Official Academy Contact Directory
          </span>
          <h1 className="font-alfa text-2xl sm:text-3xl md:text-4xl text-[#11262C] mt-1 tracking-tight">
            Contact &amp; Support
          </h1>
          <p className="text-xs sm:text-sm text-[#718E94] mt-1 font-medium max-w-2xl leading-relaxed">
            Direct communication channels for coaches, registered student-athletes, and affiliated talent scouts.
            Reach our administrative and support team via verified email or telephone.
          </p>
        </div>

        {/* Operating Hours & Availability Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-[#FAF6EE] border border-[#E2D7C3] shadow-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#11262C]" />
              <h2 className="font-barlow-condensed text-sm font-bold uppercase tracking-wider text-[#11262C]">
                {OPERATING_HOURS.academy.title}
              </h2>
            </div>
            <p className="font-mono text-sm font-bold text-[#11262C]">
              {OPERATING_HOURS.academy.schedule}
            </p>
            <p className="text-xs text-[#516B70] mt-1 leading-relaxed">
              {OPERATING_HOURS.academy.description}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#FAF6EE] border border-[#E2D7C3] shadow-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#D95B24]" />
              <h2 className="font-barlow-condensed text-sm font-bold uppercase tracking-wider text-[#D95B24]">
                {OPERATING_HOURS.support.title}
              </h2>
            </div>
            <p className="font-mono text-sm font-bold text-[#11262C]">
              {OPERATING_HOURS.support.schedule}
            </p>
            <p className="text-xs text-[#8B1E1E] font-medium mt-1 leading-relaxed">
              {OPERATING_HOURS.support.sundayNote}
            </p>
          </div>
        </div>

        {/* Support Grid (6 structured cards, 2 columns on tablet/desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((sec) => (
            <div
              key={sec.key}
              className="bg-[#FAF6EE] p-6 rounded-2xl border border-[#E2D7C3] shadow-xs flex flex-col justify-between hover:border-[#C5A572] transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-barlow-condensed text-xs font-bold uppercase tracking-wider text-[#D95B24]">
                    {sec.category}
                  </span>
                  {sec.badge && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#11262C] text-[#FFF9EF]">
                      {sec.badge}
                    </span>
                  )}
                </div>

                <h2 className="font-alfa text-lg sm:text-xl text-[#11262C] leading-snug">
                  {sec.title}
                </h2>

                <p className="text-xs sm:text-sm text-[#3E565C] leading-relaxed">
                  {sec.description}
                </p>

                {/* Details Box */}
                <div className="p-3.5 rounded-lg bg-[#EFE4CF]/70 border border-[#E2D7C3]/60 text-xs space-y-2 font-medium text-[#22383E]">
                  <div>
                    <span className="text-[#718E94] block text-[11px] font-semibold uppercase tracking-wider mb-1">
                      Official Email Addresses
                    </span>
                    <div className="flex flex-col gap-1">
                      {sec.emails.map((email) => (
                        <a
                          key={email}
                          href={`mailto:${email}`}
                          className="font-mono text-xs font-bold text-[#D95B24] hover:text-[#B84715] hover:underline underline-offset-2 break-all inline-flex items-center gap-1.5 transition-colors"
                        >
                          <span>&bull;</span>
                          <span>{email}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[#718E94] block text-[11px] font-semibold uppercase tracking-wider mb-1">
                      Official Telephone Lines
                    </span>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {sec.phones.map((phone) => (
                        <a
                          key={phone}
                          href={`tel:${phone.replace(/\s+/g, "")}`}
                          className="font-mono text-xs font-bold text-[#11262C] hover:text-[#D95B24] hover:underline underline-offset-2 inline-flex items-center gap-1.5 transition-colors"
                        >
                          <span>&bull;</span>
                          <span>{phone}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  {sec.availability && (
                    <div className="pt-1 border-t border-[#E2D7C3]/60">
                      <span className="text-[#718E94]">Hours: </span>
                      <span className="text-[#516B70]">{sec.availability}</span>
                    </div>
                  )}
                </div>
              </div>

              {sec.action && (
                <div className="pt-4 mt-2 border-t border-[#E8DEC9]">
                  <Link
                    href={sec.action.href}
                    className="inline-flex items-center gap-1.5 text-xs font-bold font-barlow-condensed tracking-wider uppercase text-[#D95B24] hover:text-[#B84715] transition-colors"
                  >
                    <span>{sec.action.label}</span>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Operations Callout */}
        <div className="p-6 rounded-2xl bg-[#11262C] text-[#FFF9EF] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-alfa text-lg sm:text-xl">Have an Activation Code?</h3>
            <p className="text-xs text-[#A8C2C7] mt-0.5">
              Players and Scouts issued an 8-character code can activate their profile immediately.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/activate"
              className="px-5 py-2 rounded-full font-barlow-condensed font-bold text-xs sm:text-sm tracking-wider uppercase bg-[#D95B24] hover:bg-[#C04C1A] text-white shadow-2xs transition-colors"
            >
              Activate Account
            </Link>
            <Link
              href="/activate/help"
              className="px-4 py-2 rounded-full font-barlow-condensed font-bold text-xs sm:text-sm tracking-wider uppercase bg-white/10 hover:bg-white/20 text-[#FFF9EF] border border-white/20 transition-colors"
            >
              Need Guidance?
            </Link>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
