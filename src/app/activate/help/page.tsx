"use client";

import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import {
  OFFICIAL_EMAILS,
  OFFICIAL_PHONES,
  OPERATING_HOURS,
} from "@/config/support.config";

export default function ActivationHelpPage() {
  const steps = [
    {
      num: "01",
      title: "Why an Activation Code is Required",
      desc: "One Academy operates as a private, closed sports club. Public self-signup is disabled to protect team roster integrity, verified player ages, and official match records. Only accounts pre-approved and provisioned by the Head Coach receive access.",
    },
    {
      num: "02",
      title: "How the Coach Creates Your Account",
      desc: "The Coach registers your profile in the Coach Portal with your full name, age, registered email address, and assigned academy sport (e.g. Badminton, Football, Basketball). An inactive user profile is initialized awaiting your personal password.",
    },
    {
      num: "03",
      title: "Where You Receive Your Code",
      desc: "Upon creation, the Coach receives your private 8-character activation code (e.g., A1B2C3D4). The Coach delivers this code to you in person, via official academy communication, or via team briefing.",
    },
    {
      num: "04",
      title: "Enter Your Registered Email Address",
      desc: "Navigate to the Account Activation page (/activate). Enter the exact email address the Coach used when creating your roster profile. Email verification is case-insensitive.",
    },
    {
      num: "05",
      title: "Enter the 8-Character Activation Code",
      desc: "Type the 8 hexadecimal characters into the segmented input fields. The code is single-use and valid for exactly 24 hours from the time the Coach generated it.",
    },
    {
      num: "06",
      title: "Create Your Secret Password",
      desc: "Choose a strong password (minimum 8 characters with at least one uppercase letter, one lowercase letter, and one number). Your password is encrypted immediately using salted bcrypt hashing.",
    },
    {
      num: "07",
      title: "What Happens After Successful Activation",
      desc: "Your account is activated atomically. The temporary activation code is permanently consumed and invalidated. You can immediately proceed to the Sign In page, select your portal role (Player or Scout), and log in.",
    },
  ];

  const troubleshooting = [
    {
      issue: "Code is reported as 'Invalid, expired, or previously used'",
      solution:
        "Activation codes expire after 24 hours. If your code expired or was accidentally submitted already, request the Head Coach to issue a fresh activation code from the Player Roster or Scout Management table.",
    },
    {
      issue: "Entering the wrong email address",
      solution:
        "Activation codes are bound cryptographically to your specific user ID. If you enter an email different from the one the coach registered, the system will reject the request with a generic error to protect user privacy. Confirm the exact registered address with your coach.",
    },
    {
      issue: "Too many activation attempts / 2-minute cooldown",
      solution:
        "For security against automated brute-force attempts, the activation portal permits 5 attempts per 2-minute sliding window per account. If rate-limited, wait 120 seconds before retrying.",
    },
    {
      issue: "Selecting the wrong portal role on Sign In",
      solution:
        "After activation, ensure you select your correct role tab on the Sign In page (Player for athletes, Scout for talent scouts). If you select the wrong tab with your valid credentials, the system will politely inform you of your registered role without locking you out.",
    },
  ];

  return (
    <PublicShell activeNav="activation-help">
      <div className="space-y-10">
        {/* Top Header */}
        <div className="border-b border-[#E2D7C3] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-barlow-condensed font-semibold text-xs uppercase tracking-widest text-[#D95B24]">
              Athlete &amp; Scout Onboarding Guide
            </span>
            <h1 className="font-alfa text-2xl sm:text-3xl md:text-4xl text-[#11262C] mt-1 tracking-tight">
              Account Activation Help
            </h1>
            <p className="text-xs sm:text-sm text-[#718E94] mt-1 font-medium max-w-2xl leading-relaxed">
              Step-by-step instructions for redeeming your 8-character activation code and establishing your personal password.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/activate"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-barlow-condensed font-bold text-sm tracking-wider uppercase bg-[#11262C] hover:bg-[#1E3B44] text-[#FFF9EF] shadow-2xs transition-colors"
            >
              <span>Go to Activation Page →</span>
            </Link>
          </div>
        </div>

        {/* Seven Step-by-Step Walkthrough */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-alfa text-xl text-[#11262C]">The 7-Step Activation Flow</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {steps.map((st) => (
              <div
                key={st.num}
                className="bg-[#FAF6EE] p-5 rounded-xl border border-[#E2D7C3] shadow-xs flex gap-4 hover:border-[#C5A572] transition-colors"
              >
                <div className="shrink-0 w-9 h-9 rounded-full bg-[#11262C] text-[#D9C8A9] font-alfa text-sm flex items-center justify-center">
                  {st.num}
                </div>
                <div className="space-y-1">
                  <h2 className="font-barlow-condensed font-bold text-base sm:text-lg text-[#11262C] leading-snug">
                    {st.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#3E565C] leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Troubleshooting Section */}
        <section className="space-y-4 border-t border-[#E2D7C3] pt-8">
          <div>
            <span className="font-barlow-condensed font-bold text-xs uppercase tracking-widest text-[#D95B24]">
              Diagnostics &bull; Common Questions
            </span>
            <h2 className="font-alfa text-xl sm:text-2xl text-[#11262C] mt-0.5">
              Troubleshooting Activation Issues
            </h2>
          </div>

          <div className="space-y-3">
            {troubleshooting.map((t, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-[#FAF6EE] border border-[#E2D7C3] space-y-2"
              >
                <h3 className="font-barlow-condensed font-bold text-base text-[#11262C] flex items-center gap-2">
                  <span className="text-[#8B1E1E] font-black">&bull;</span>
                  <span>{t.issue}</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#3E565C] pl-4 leading-relaxed">
                  {t.solution}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Support Assistance Callout */}
        <section className="p-6 rounded-2xl bg-[#FAF4E6] border border-[#D9C8A9] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-alfa text-lg text-[#11262C]">Still having trouble activating?</h3>
              <p className="text-xs sm:text-sm text-[#523A1E] leading-relaxed">
                Contact your Academy Head Coach or reach our support team directly. We are available during standard support hours to verify roster codes.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/support"
                className="px-5 py-2 rounded-full font-barlow-condensed font-bold text-xs sm:text-sm tracking-wider uppercase bg-[#11262C] hover:bg-[#1E3B44] text-[#FFF9EF] transition-colors"
              >
                Contact Support
              </Link>
              <Link
                href="/activate"
                className="px-5 py-2 rounded-full font-barlow-condensed font-bold text-xs sm:text-sm tracking-wider uppercase bg-[#D95B24] hover:bg-[#C04C1A] text-white transition-colors"
              >
                Back to Activation
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-[#E8DEC9] text-xs">
            <div>
              <span className="text-[#718E94] block text-[11px] font-semibold uppercase tracking-wider mb-1">
                Official Support Emails
              </span>
              <div className="flex flex-col gap-1">
                {OFFICIAL_EMAILS.map((email) => (
                  <a
                    key={email}
                    href={`mailto:${email}`}
                    className="font-mono text-xs font-bold text-[#D95B24] hover:underline underline-offset-2 break-all"
                  >
                    {email}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[#718E94] block text-[11px] font-semibold uppercase tracking-wider mb-1">
                Official Telephone Lines
              </span>
              <div className="flex flex-col gap-1">
                {OFFICIAL_PHONES.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="font-mono text-xs font-bold text-[#11262C] hover:text-[#D95B24] hover:underline underline-offset-2"
                  >
                    {phone}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[#718E94] block text-[11px] font-semibold uppercase tracking-wider mb-1">
                Support Availability
              </span>
              <p className="font-semibold text-[#11262C]">
                {OPERATING_HOURS.support.schedule}
              </p>
              <p className="text-[11px] text-[#8B1E1E] mt-0.5">
                Sunday: Unavailable (Academy open)
              </p>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
