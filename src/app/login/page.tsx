"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoadingState } from "@/components/ui";
import {
  PulseLoginMascot,
  type PulseLoginMood,
} from "@/components/mascot/fox-mascot";
import { MascotIcon } from "@/components/mascot/mascot-icons";
import type { UserRole } from "@/models";

interface DemoCredential {
  role: UserRole;
  label: string;
  email: string;
  password: string;
  badgeColor: string;
  dotColor: string;
}

const DEMO_CREDENTIALS: Record<UserRole, DemoCredential> = {
  coach: {
    role: "coach",
    label: "Coach Portal",
    email: "coach@gmail.com",
    password: "Coach@456",
    badgeColor: "bg-[#D95B24] text-white",
    dotColor: "bg-[#D95B24]",
  },
  player: {
    role: "player",
    label: "Player Portal",
    email: "sourav@gmail.com",
    password: "Sourav@123",
    badgeColor: "bg-[#1B3B44] text-[#FFF9EF]",
    dotColor: "bg-[#1B3B44]",
  },
  scout: {
    role: "scout",
    label: "Scout Portal",
    email: "scout01@gmail.com",
    password: "Scout01@123",
    badgeColor: "bg-[#8C6D23] text-white",
    dotColor: "bg-[#8C6D23]",
  },
};

function LoginForm() {
  const searchParams = useSearchParams();

  const roleParam = searchParams.get("role");
  const errorParam = searchParams.get("error");

  const hasRoleParam =
    roleParam === "player" || roleParam === "scout" || roleParam === "coach";

  const initialRole: UserRole | null = hasRoleParam ? (roleParam as UserRole) : null;

  const [role, setRole] = useState<UserRole | null>(initialRole);
  const [viewAllCredentials, setViewAllCredentials] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<"idle" | "email" | "password">("idle");
  const [typing, setTyping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "unauthorized_role"
      ? "You do not have permission for that area. Please sign in with an authorized role."
      : null
  );

  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  const reactToTyping = () => {
    setTyping(true);
    if (error) setError(null);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 750);
  };

  // Derive fox mascot mood from real user interaction state
  const mood: PulseLoginMood = success
    ? "success"
    : submitting
    ? "busy"
    : error && focused === "idle"
    ? "error"
    : focused === "password" || (showPassword && focused === "idle")
    ? "password"
    : focused;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || success) return;

    if (!role) {
      setError("Please select a portal role (Coach, Player, or Scout).");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setError(null);
    setSubmitting(true);
    setFocused("idle");
    setTyping(false);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password, requestedRole: role }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Login failed. Please check your credentials.");
        if (data.roleMismatch && data.expectedRole) {
          setRole(data.expectedRole);
        }
        setSubmitting(false);
        setSuccess(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);

      // Give the mascot a moment to celebrate before navigation
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
      redirectTimer.current = setTimeout(() => {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/dashboard/${data.user.role}`;
      }, 500);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setSubmitting(false);
      setSuccess(false);
    }
  };

  const mascotStage = (
    <div className="ims-stage">
      <PulseLoginMascot
        mood={mood}
        typing={typing}
        peeking={showPassword}
      />
    </div>
  );

  return (
    <AuthLayout currentPage="login" mascotStage={mascotStage}>
      <section className="ims-card" aria-labelledby="ims-login-title">
        {/* Brand Header */}
        <div className="flex items-center gap-2 mb-3 select-none">
          <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
            <Image
              src="/images/logo-dark.png"
              alt="One Academy"
              width={24}
              height={24}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <span className="font-alfa text-[11px] tracking-[0.2em] text-[#11262C] uppercase leading-none">
            ONE ACADEMY
          </span>
        </div>

        <h1 id="ims-login-title">Sign In</h1>

        <form
          className="ims-form"
          onSubmit={handleSubmit}
          autoComplete="off"
          aria-busy={submitting}
          onFocusCapture={(e) => {
            const field = e.target
              .closest("[data-login-field]")
              ?.getAttribute("data-login-field");
            if (field === "email" || field === "password") {
              setFocused(field);
            } else {
              setFocused("idle");
            }
          }}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setFocused("idle");
            }
          }}
        >
          {/* Role Selection Tabs */}
          <div className="ims-field" data-login-field="role">
            <label>Select Portal Role</label>
            <div className="ims-role-selector" role="radiogroup" aria-label="Designated Role">
              {(["coach", "player", "scout"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={role === r}
                  className={`ims-role-btn ${role === r ? "is-active" : ""}`}
                  onClick={() => {
                    setRole(r);
                    if (error) setError(null);
                  }}
                  disabled={submitting || success}
                >
                  {r === "coach" ? "Coach" : r === "player" ? "Player" : "Scout"}
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================= */}
          {/* JUDGE & DEMO CREDENTIALS DISPLAY                          */}
          {/* ========================================================= */}
          <div className="bg-[#FAF4E8] border border-[#DACBB4] rounded-2xl p-3 sm:p-3.5 transition-all text-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-[#EAE0CF]">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-barlow-condensed font-bold tracking-wider uppercase bg-[#11262C] text-[#FFF9EF]">
                  ✦ JUDGE CREDENTIALS
                </span>
                {role && !viewAllCredentials ? (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed font-bold tracking-wider uppercase ${DEMO_CREDENTIALS[role].badgeColor}`}>
                    {DEMO_CREDENTIALS[role].label}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed font-bold tracking-wider uppercase bg-[#E5DBC7] text-[#11262C]">
                    All Roles Available
                  </span>
                )}
              </div>

              {role && (
                <button
                  type="button"
                  onClick={() => setViewAllCredentials((prev) => !prev)}
                  className="text-[11px] font-barlow-condensed font-bold text-[#D95B24] hover:text-[#B84617] underline underline-offset-2 cursor-pointer transition-colors"
                >
                  {viewAllCredentials ? `Show ${DEMO_CREDENTIALS[role].label} Only` : "View All 3 Roles →"}
                </button>
              )}
            </div>

            {/* Prominent Mandatory Instruction */}
            <p className="mt-2 text-[11px] sm:text-xs text-[#5C6E72] leading-snug">
              <strong className="text-[#11262C] font-semibold">Important:</strong> Please enter your credentials manually for the best experience. Avoid copy-pasting.
            </p>

            {/* Single Selected Role Display */}
            {role && !viewAllCredentials ? (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-[#FFF9EF] border border-[#E2D7C3] rounded-xl px-3 py-2 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-wider font-barlow-condensed font-bold text-[#718E94]">
                    {DEMO_CREDENTIALS[role].label} Email
                  </span>
                  <span className="font-mono font-semibold text-[#11262C] text-xs sm:text-[13px] break-all select-text mt-0.5">
                    {DEMO_CREDENTIALS[role].email}
                  </span>
                </div>
                <div className="bg-[#FFF9EF] border border-[#E2D7C3] rounded-xl px-3 py-2 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-wider font-barlow-condensed font-bold text-[#718E94]">
                    {DEMO_CREDENTIALS[role].label} Password
                  </span>
                  <span className="font-mono font-semibold text-[#11262C] text-xs sm:text-[13px] break-all select-text mt-0.5">
                    {DEMO_CREDENTIALS[role].password}
                  </span>
                </div>
              </div>
            ) : (
              /* All Three Roles Display (When no role selected or user toggles View All) */
              <div className="mt-2 space-y-1.5">
                {(["coach", "player", "scout"] as const).map((r) => {
                  const cred = DEMO_CREDENTIALS[r];
                  const isSelected = role === r;
                  return (
                    <div
                      key={r}
                      onClick={() => {
                        setRole(r);
                        if (error) setError(null);
                      }}
                      className={`bg-[#FFF9EF] border rounded-xl p-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#D95B24] ring-1 ring-[#D95B24] shadow-2xs"
                          : "border-[#E2D7C3] hover:border-[#DACBB4]"
                      }`}
                      title={`Click to select ${cred.label}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed font-bold tracking-wider uppercase ${cred.badgeColor}`}>
                          {cred.label}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-barlow-condensed font-bold text-[#D95B24] uppercase">
                            • Selected
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] font-mono text-[#11262C]">
                        <span>Email: <strong className="select-text">{cred.email}</strong></span>
                        <span className="text-[#DACBB4] hidden sm:inline">|</span>
                        <span>PW: <strong className="select-text">{cred.password}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Email Address */}
          <div className="ims-field" data-login-field="email">
            <label htmlFor="ims-email">Email Address</label>
            <div className="ims-input-wrap">
              <MascotIcon name="user" />
              <input
                id="ims-email"
                name="email"
                type="email"
                autoComplete="off"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  reactToTyping();
                }}
                placeholder="name@oneacademy.com"
                autoCapitalize="none"
                spellCheck={false}
                disabled={submitting || success}
              />
            </div>
          </div>

          {/* Password with Show/Hide toggle */}
          <div className="ims-field" data-login-field="password">
            <label htmlFor="ims-password">Password</label>
            <div className="ims-input-wrap">
              <MascotIcon name="lock" />
              <input
                id="ims-password"
                name="password"
                autoComplete="new-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  reactToTyping();
                }}
                placeholder="Enter password"
                disabled={submitting || success}
              />
              <button
                className="ims-reveal"
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                disabled={submitting || success}
              >
                <MascotIcon name={showPassword ? "eyeOff" : "eye"} />
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <p className="ims-error" role="alert">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button className="ims-submit" type="submit" disabled={submitting || success}>
            <span>{submitting ? "Signing In…" : success ? "Redirecting…" : "Sign In →"}</span>
          </button>

          {/* Secondary Account Activation Link */}
          <p className="ims-hint text-center text-xs mt-3">
            Have an activation code?{" "}
            <Link
              href="/activate"
              className="font-bold text-[#D95B24] hover:underline"
            >
              Activate Account
            </Link>
          </p>

          <p className="text-center text-xs text-[#718E94] mt-2">
            Need assistance?{" "}
            <Link
              href="/support"
              className="text-[#718E94] hover:text-[#11262C] font-semibold underline underline-offset-2"
            >
              Contact &amp; Support
            </Link>
          </p>
        </form>
      </section>
    </AuthLayout>
  );
}

function LoginFormWrapper() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") || "default";

  return <LoginForm key={roleParam} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading login portal..." size="sm" />}>
      <LoginFormWrapper />
    </Suspense>
  );
}
