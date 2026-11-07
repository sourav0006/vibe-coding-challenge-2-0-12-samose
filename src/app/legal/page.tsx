"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import {
  SUPPORT_CONFIG,
  OFFICIAL_EMAILS,
  OFFICIAL_PHONES,
  OPERATING_HOURS,
} from "@/config/support.config";
import { cn } from "@/lib/utils";

type LegalTab = "privacy" | "terms";

function LegalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab");
  const [hashTab, setHashTab] = useState<LegalTab | null>(null);

  // Subscribe to external hashchange events
  useEffect(() => {
    const updateFromHash = () => {
      if (typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash.replace("#", "");
        if (hash === "terms" || hash === "privacy") {
          setHashTab(hash);
        }
      }
    };

    updateFromHash();
    window.addEventListener("hashchange", updateFromHash);
    return () => window.removeEventListener("hashchange", updateFromHash);
  }, []);

  const activeTab: LegalTab =
    tabParam === "terms" || tabParam === "privacy"
      ? tabParam
      : hashTab || "privacy";

  const handleTabChange = (tab: LegalTab) => {
    router.replace(`/legal?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="border-b border-[#E2D7C3] pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-barlow-condensed font-semibold text-xs uppercase tracking-widest text-[#D95B24]">
              Public Disclosures &bull; Regulatory Policies
            </span>
            <h1 className="font-alfa text-2xl sm:text-3xl md:text-4xl text-[#11262C] mt-1 tracking-tight">
              Privacy Policy &amp; Terms of Use
            </h1>
            <p className="text-xs sm:text-sm text-[#718E94] mt-1 font-medium">
              Effective Date: {SUPPORT_CONFIG.lastUpdated} &bull; Platform: One Academy Single-Academy System
            </p>
          </div>

          {/* Segmented Tab Switcher */}
          <div
            className="inline-flex p-1 rounded-xl bg-[#EFE4CF] border border-[#E2D7C3] select-none shrink-0 self-start md:self-auto"
            role="tablist"
            aria-label="Legal document sections"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "privacy"}
              aria-controls="privacy-section"
              onClick={() => handleTabChange("privacy")}
              className={cn(
                "px-5 py-2 rounded-lg font-barlow-condensed font-bold text-xs sm:text-sm tracking-wider uppercase transition-all cursor-pointer",
                activeTab === "privacy"
                  ? "bg-[#11262C] text-[#FFF9EF] shadow-2xs"
                  : "text-[#718E94] hover:text-[#11262C]"
              )}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "terms"}
              aria-controls="terms-section"
              onClick={() => handleTabChange("terms")}
              className={cn(
                "px-5 py-2 rounded-lg font-barlow-condensed font-bold text-xs sm:text-sm tracking-wider uppercase transition-all cursor-pointer",
                activeTab === "terms"
                  ? "bg-[#11262C] text-[#FFF9EF] shadow-2xs"
                  : "text-[#718E94] hover:text-[#11262C]"
              )}
            >
              Terms of Use
            </button>
          </div>
        </div>
      </div>

      {/* Advisory Notice Box */}
      <div className="p-4 rounded-lg bg-[#FAF4E6] border border-[#D9C8A9] text-xs text-[#523A1E] leading-relaxed">
        <strong>Important Advisory:</strong> This document represents an initial responsible operational disclosure
        for One Academy&apos;s single-academy sports platform. It reflects actual system capabilities and access rules.
        Formal jurisdictional legal certifications remain subject to local organizational legal counsel review.
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PRIVACY POLICY                                                */}
      {/* ========================================================================= */}
      {activeTab === "privacy" && (
        <article
          id="privacy-section"
          role="tabpanel"
          className="space-y-8 bg-[#FAF6EE] p-6 sm:p-10 rounded-2xl border border-[#E2D7C3] shadow-xs text-[#22383E]"
        >
          <header className="border-b border-[#E8DEC9] pb-4">
            <h2 className="font-alfa text-xl sm:text-2xl text-[#11262C]">
              Privacy Policy
            </h2>
            <p className="text-xs text-[#718E94] mt-0.5">
              How One Academy collects, stores, processes, and safeguards academy athletic records.
            </p>
          </header>

          <section className="space-y-3">
            <h3 className="font-barlow-condensed font-bold text-lg text-[#11262C] tracking-wide uppercase">
              1. Information Collected
            </h3>
            <p className="text-sm leading-relaxed">
              One Academy collects only information strictly necessary to manage single-academy sports operations,
              training sessions, attendance compliance, fixture performance, and talent scouting readiness. This includes:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1.5 leading-relaxed">
              <li>
                <strong>Identity &amp; Account Data:</strong> Full name, registered email address, age, and assigned system role (Coach, Player, or Scout).
              </li>
              <li>
                <strong>Athletic Profiling:</strong> Academy sport assignment, historical sport transfer dates (<code className="text-xs bg-[#EFE4CF] px-1 py-0.5 rounded">effectiveFrom</code> and <code className="text-xs bg-[#EFE4CF] px-1 py-0.5 rounded">effectiveTo</code>), and active/archival standing.
              </li>
              <li>
                <strong>Training &amp; Attendance Records:</strong> Practice session date, presence/absence timestamps, and session finalization records.
              </li>
              <li>
                <strong>Match Performance Data:</strong> Fixture participation, opponent academy details, individual player performance scores, and match date verification.
              </li>
              <li>
                <strong>Scouting Readiness Evaluations:</strong> Computed metrics indicating whether an athlete meets the official readiness threshold (Attendance &ge; 75.0% and Finalized Matches &ge; 2).
              </li>
              <li>
                <strong>Coach Remarks:</strong> Qualitative athletic developmental notes recorded by the Head Coach.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="font-barlow-condensed font-bold text-lg text-[#11262C] tracking-wide uppercase">
              2. Account Creation &amp; Activation Workflow
            </h3>
            <p className="text-sm leading-relaxed">
              One Academy does not offer open public self-registration. Player and Scout accounts are provisioned exclusively
              by the authorized Academy Head Coach. Upon account creation, the system generates an unguessable 8-character
              activation code valid for 24 hours. The athlete or scout redeems this code once at <Link href="/activate" className="text-[#D95B24] font-semibold underline underline-offset-2">/activate</Link> to establish their personal secret password.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-barlow-condensed font-bold text-lg text-[#11262C] tracking-wide uppercase">
              3. Password Protection &amp; Authentication Security
            </h3>
            <p className="text-sm leading-relaxed">
              User passwords are never stored in plaintext. Passwords and activation codes are cryptographically hashed using
              industry-standard salted bcrypt. Authentication sessions use signed JSON Web Tokens (JWT) stored in
              strictly HTTP-only, secure, same-site browser cookies to protect against cross-site scripting (XSS) and token theft.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-barlow-condensed font-bold text-lg text-[#11262C] tracking-wide uppercase">
              4. Role-Based Access Control (RBAC) &amp; Privacy Isolation
            </h3>
            <p className="text-sm leading-relaxed">
              Access permissions are strictly segmented across three isolated platform roles:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1.5 leading-relaxed">
              <li>
                <strong>Coach:</strong> Full administrative management of players, scouts, sports catalogue, practice attendance, fixture scoring, and private coach remarks.
              </li>
              <li>
                <strong>Player:</strong> Read-only access to their individual attendance history, match scores, readiness status, and personal coach remarks. Players cannot view peers&apos; private remarks.
              </li>
              <li>
                <strong>Talent Scout:</strong> Restricted discovery access strictly limited to athletes who have officially qualified as <em>Scouting Ready</em> (Attendance &ge; 75.0% and Finalized Matches &ge; 2). Scouts cannot view unqualified athletes, internal attendance breakdowns, or confidential coach remarks.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="font-barlow-condensed font-bold text-lg text-[#11262C] tracking-wide uppercase">
              5. Hosting Infrastructure &amp; Data Storage
            </h3>
            <p className="text-sm leading-relaxed">
              Platform data is stored in MongoDB Atlas cloud database clusters with connection pooling, document schema validation,
              and strict unique index constraints. Next.js server runtime components operate on secure application servers (e.g., Vercel).
              One Academy does not run third-party advertising trackers, cross-site behavioral analytics, or third-party data broker SDKs.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-barlow-condensed font-bold text-lg text-[#11262C] tracking-wide uppercase">
              6. Rate Limiting &amp; Brute-Force Defense
            </h3>
            <p className="text-sm leading-relaxed">
              Sensitive authentication endpoints (<code className="text-xs bg-[#EFE4CF] px-1 py-0.5 rounded">/api/auth/login</code> and <code className="text-xs bg-[#EFE4CF] px-1 py-0.5 rounded">/api/auth/activate</code>)
              are protected by hybrid sliding-window rate limiters. Accounts are permitted up to 5 attempts per 2-minute window.
              Legitimate users entering valid credentials under a mismatched portal role tab are not penalized with failed-attempt lockouts.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-barlow-condensed font-bold text-lg text-[#11262C] tracking-wide uppercase">
              7. Data Retention, Archival &amp; Correction Rights
            </h3>
            <p className="text-sm leading-relaxed">
              Historical training attendance and match fixture records are preserved to maintain academy competitive integrity.
              When an athlete leaves the academy, the coach archives the profile rather than destroying verified historical fixture results.
              Athletes, coaches, scouts, and parents/guardians may write to academy administration at any time to request personal data review,
              record correction, or account deletion.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8DEC9] pt-4">
            <h3 className="font-barlow-condensed font-bold text-lg text-[#11262C] tracking-wide uppercase">
              8. Privacy Contact &amp; Data Subject Requests
            </h3>
            <p className="text-sm leading-relaxed">
              For any privacy-related queries, personal data review, corrections, or account deletion requests, please contact our administration:
            </p>
            <div className="p-4 bg-[#EFE4CF]/80 rounded-xl text-xs space-y-3 font-medium text-[#22383E]">
              <div>
                <span className="text-[#718E94] block text-[11px] font-semibold uppercase tracking-wider mb-1">
                  Official Email Addresses
                </span>
                <div className="flex flex-col gap-1">
                  {OFFICIAL_EMAILS.map((email) => (
                    <a
                      key={email}
                      href={`mailto:${email}`}
                      className="font-mono text-xs font-bold text-[#D95B24] hover:underline underline-offset-2 break-all inline-flex items-center gap-1.5"
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
                  {OFFICIAL_PHONES.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/\s+/g, "")}`}
                      className="font-mono text-xs font-bold text-[#11262C] hover:text-[#D95B24] hover:underline underline-offset-2 inline-flex items-center gap-1.5"
                    >
                      <span>&bull;</span>
                      <span>{phone}</span>
                    </a>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2D7C3]/80 text-[#516B70]">
                <span>Support Availability: </span>
                <span className="font-semibold text-[#11262C]">{OPERATING_HOURS.support.schedule}</span>
                <span className="block text-[11px] text-[#8B1E1E] mt-0.5">{OPERATING_HOURS.support.sundayNote}</span>
              </div>
            </div>
          </section>
        </article>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: TERMS OF USE                                                  */}
      {/* ========================================================================= */}
      {activeTab === "terms" && (
        <article
          id="terms-section"
          role="tabpanel"
          className="space-y-8 bg-[#FAF6EE] p-6 sm:p-10 rounded-2xl border border-[#E2D7C3] shadow-xs text-[#22383E]"
        >
          <header className="border-b border-[#E8DEC9] pb-4">
            <h2 className="font-alfa text-xl sm:text-2xl text-[#11262C]">
              Terms of Use
            </h2>
            <p className="text-xs text-[#718E94] mt-0.5">
              Rules, responsibilities, and operational conditions for using the One Academy platform.
            </p>
          </header>

          <section className="space-y-3">
            <h3 className="font-barlow-condensed font-bold text-lg text-[#11262C] tracking-wide uppercase">
              1. Platform Purpose &amp; Scope
            </h3>
            <p className="text-sm leading-relaxed">
              One Academy is a closed, single-academy sports operations platform engineered specifically for youth and amateur sports academies.
              The platform facilitates roster management, multi-sport practice attendance tracking, match fixtures with individual scoring,
              and objective readiness analytics for qualified talent scouts.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-barlow-condensed font-bold text-lg text-[#11262C] tracking-wide uppercase">
              2. Account Eligibility &amp; Security Responsibilities
            </h3>
            <p className="text-sm leading-relaxed">
              Accounts are provisioned solely by academy management. Users are responsible for maintaining the confidentiality
              of their sign-in credentials. Sharing accounts between players, coaches, or external scouts is strictly prohibited.
              Users must immediately notify academy administration if unauthorized access is suspected.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-barlow-condensed font-bold text-lg text-[#11262C] tracking-wide uppercase">
              3. Attendance, Match Scores &amp; Record Integrity
            </h3>
            <p className="text-sm leading-relaxed">
              One Academy enforces rigorous record immutability rules:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1.5 leading-relaxed">
              <li>
                <strong>Finalized Fixtures:</strong> Once a match fixture is finalized by the coach, all participating player scores are permanently locked and cannot be edited.
              </li>
              <li>
                <strong>Closed Practice Sessions:</strong> A practice session cannot be closed until every applicable rostered player has an explicit Present or Absent mark. Once closed, the session is immutable.
              </li>
              <li>
                <strong>Historical Eligibility:</strong> Athletes registered after a practice session has finalized do not retroactively appear on that session&apos;s roster or receive unearned absences.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="font-barlow-condensed font-bold text-lg text-[#11262C] tracking-wide uppercase">
              4. Role Responsibilities &amp; Code of Conduct
            </h3>
            <ul className="list-disc pl-5 text-sm space-y-1.5 leading-relaxed">
              <li>
                <strong>Coaches:</strong> Must ensure accurate representation of player ages, sports assignments, session dates, and match performance scores. Private developmental remarks must remain professional and constructive.
              </li>
              <li>
                <strong>Players:</strong> Are expected to review their personal attendance and fixture scores responsibly and consult the coach regarding discrepancies.
              </li>
              <li>
                <strong>Talent Scouts:</strong> May view ready athlete profiles strictly for legitimate athletic evaluation and scouting opportunities. Contacting athletes must proceed through authorized academy channels.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="font-barlow-condensed font-bold text-lg text-[#11262C] tracking-wide uppercase">
              5. Intellectual Property &amp; Platform Content
            </h3>
            <p className="text-sm leading-relaxed">
              All visual trademarks, mascot artwork, collegiate design elements, software source code, and platform logos
              are the proprietary property of One Academy. Unauthorized reproduction, scraping, reverse engineering,
              or redistribution of platform software or data is prohibited.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-barlow-condensed font-bold text-lg text-[#11262C] tracking-wide uppercase">
              6. Account Suspension &amp; Termination
            </h3>
            <p className="text-sm leading-relaxed">
              Academy administration reserves the right to deactivate or archive any account that violates these Terms of Use,
              attempts unauthorized role escalation, engages in credential-stuffing, or misrepresents official athletic fixture results.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-barlow-condensed font-bold text-lg text-[#11262C] tracking-wide uppercase">
              7. Service Availability &amp; Reasonable Limitations
            </h3>
            <p className="text-sm leading-relaxed">
              One Academy strives for reliable operational availability. However, service may occasionally be interrupted for
              system maintenance, software upgrades, or unforeseen network disruptions. The platform is provided on an &ldquo;as is&rdquo;
              basis without warranties beyond reasonable developmental standards.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8DEC9] pt-4">
            <h3 className="font-barlow-condensed font-bold text-lg text-[#11262C] tracking-wide uppercase">
              8. Contact &amp; Questions
            </h3>
            <p className="text-sm leading-relaxed">
              For questions concerning these Terms of Use, academy operational policies, or athlete registration guidelines, please consult:
            </p>
            <div className="p-4 bg-[#EFE4CF]/80 rounded-xl text-xs space-y-3 font-medium text-[#22383E]">
              <div>
                <span className="text-[#718E94] block text-[11px] font-semibold uppercase tracking-wider mb-1">
                  Official Email Addresses
                </span>
                <div className="flex flex-col gap-1">
                  {OFFICIAL_EMAILS.map((email) => (
                    <a
                      key={email}
                      href={`mailto:${email}`}
                      className="font-mono text-xs font-bold text-[#D95B24] hover:underline underline-offset-2 break-all inline-flex items-center gap-1.5"
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
                  {OFFICIAL_PHONES.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/\s+/g, "")}`}
                      className="font-mono text-xs font-bold text-[#11262C] hover:text-[#D95B24] hover:underline underline-offset-2 inline-flex items-center gap-1.5"
                    >
                      <span>&bull;</span>
                      <span>{phone}</span>
                    </a>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2D7C3]/80 space-y-1 text-[#516B70]">
                <div>
                  <span className="font-semibold text-[#11262C]">Academy Operating Hours: </span>
                  <span className="text-[#11262C] font-mono">{OPERATING_HOURS.academy.schedule}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#11262C]">Contact &amp; Support Availability: </span>
                  <span className="text-[#11262C] font-mono">{OPERATING_HOURS.support.schedule}</span>
                </div>
                <div className="text-[11px] text-[#8B1E1E]">
                  {OPERATING_HOURS.support.sundayNote}
                </div>
              </div>
            </div>
          </section>
        </article>
      )}
    </div>
  );
}

export default function LegalPage() {
  return (
    <PublicShell activeNav="legal">
      <Suspense fallback={<div className="p-8 text-center text-xs text-[#718E94]">Loading legal disclosures…</div>}>
        <LegalContent />
      </Suspense>
    </PublicShell>
  );
}
