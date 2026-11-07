"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { AuthLayout } from "@/components/auth/auth-layout";
import {
  PulseLoginMascot,
  type PulseLoginMood,
} from "@/components/mascot/fox-mascot";
import { MascotIcon } from "@/components/mascot/mascot-icons";
import { SegmentedActivationCodeInput } from "@/components/mascot/segmented-code-input";

export default function ActivatePage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<"idle" | "email" | "otp" | "password">("idle");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetForm = useCallback(() => {
    setSuccess(false);
    setEmail("");
    setCode("");
    setPassword("");
    setShowPassword(false);
    setFocused("idle");
    setTyping(false);
    setLoading(false);
    setError(null);
  }, []);

  // Listen to browser navigation, back-forward cache, and header link resets
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        resetForm();
      }
    };

    const handlePopState = () => {
      resetForm();
    };

    const handleHeaderReset = () => {
      resetForm();
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("oa:reset-activation", handleHeaderReset);

    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("oa:reset-activation", handleHeaderReset);
      // Clean up when unmounting so re-visiting the page renders a fresh activation form
      resetForm();
    };
  }, [resetForm]);

  const reactToTyping = () => {
    setTyping(true);
    if (error) setError(null);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 750);
  };

  // Derive fox mascot mood from real activation form state
  const mood: PulseLoginMood = success
    ? "success"
    : loading
    ? "busy"
    : error && focused === "idle"
    ? "error"
    : focused === "otp"
    ? "otp"
    : focused === "password" || (showPassword && focused === "idle")
    ? "password"
    : focused;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || success) return;

    setError(null);

    // Validate activation code format (exactly 8 chars)
    if (code.trim().length !== 8) {
      setError("Please enter the complete 8-character activation code.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setFocused("idle");
    setTyping(false);

    try {
      const response = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim().toUpperCase(), password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Activation failed. Please check your activation code.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
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
    <AuthLayout currentPage="activate" mascotStage={mascotStage}>
      <section className="ims-card" aria-labelledby="ims-activate-title">
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

        <h1 id="ims-activate-title">Activate Your Account</h1>

        {success ? (
          <div className="ims-success">
            <div className="ims-success-mark">
              <MascotIcon name="check" />
            </div>
            <h2 className="font-alfa text-xl text-[#11262C] uppercase tracking-tight">
              You’re Ready to Go!
            </h2>
            <p className="text-xs text-[#5D6B6E] leading-relaxed">
              Your One Academy account has been activated successfully. You can now access your
              dedicated athlete or scout dashboard.
            </p>
            <Link href="/login" onClick={() => resetForm()} className="w-full mt-2 block">
              <button className="ims-submit w-full" type="button">
                <span>Proceed to Sign In &rarr;</span>
              </button>
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="w-full mt-2 py-2 text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#5D6B6E] hover:text-[#11262C] transition-colors text-center cursor-pointer"
            >
              Activate Another Account
            </button>
          </div>
        ) : (
          <form
            className="ims-form"
            onSubmit={handleSubmit}
            aria-busy={loading}
            onFocusCapture={(e) => {
              const field = e.target
                .closest("[data-login-field]")
                ?.getAttribute("data-login-field");
              if (field === "email" || field === "otp" || field === "password") {
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
            {/* Registered Email */}
            <div className="ims-field" data-login-field="email">
              <label htmlFor="ims-activate-email">Registered Email Address</label>
              <div className="ims-input-wrap">
                <MascotIcon name="user" />
                <input
                  id="ims-activate-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    reactToTyping();
                  }}
                  placeholder="name@oneacademy.com"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Segmented 8-character Activation Code */}
            <div className="ims-field" data-login-field="otp">
              <label>
                Single-Use Activation Code <span>8 Characters</span>
              </label>
              <SegmentedActivationCodeInput
                value={code}
                onChange={(newCode) => setCode(newCode)}
                onFocus={() => setFocused("otp")}
                onBlur={() => setFocused("idle")}
                onTyping={reactToTyping}
                disabled={loading}
              />
              <p className="ims-hint">
                Enter the 8-character code provided directly by your Coach.
              </p>
            </div>

            {/* Create New Password with reveal toggle */}
            <div className="ims-field" data-login-field="password">
              <label htmlFor="ims-activate-password">Create New Password</label>
              <div className="ims-input-wrap">
                <MascotIcon name="lock" />
                <input
                  id="ims-activate-password"
                  name="password"
                  autoComplete="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    reactToTyping();
                  }}
                  placeholder="At least 8 characters"
                  disabled={loading}
                />
                <button
                  className="ims-reveal"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  disabled={loading}
                >
                  <MascotIcon name={showPassword ? "eyeOff" : "eye"} />
                </button>
              </div>
              <p className="ims-hint">Must contain at least 8 characters.</p>
            </div>

            {/* Error Alert */}
            {error && (
              <p className="ims-error" role="alert">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button className="ims-submit" type="submit" disabled={loading}>
              <span>{loading ? "Activating Account…" : "Activate Account →"}</span>
            </button>

            {/* Secondary Link */}
            <p className="ims-hint text-center text-xs mt-3">
              Already activated?{" "}
              <Link
                href="/login"
                className="font-bold text-[#D95B24] hover:underline"
              >
                Sign In
              </Link>
            </p>

            <p className="text-center text-xs text-[#718E94] mt-2">
              Need help with your code?{" "}
              <Link
                href="/activate/help"
                className="text-[#718E94] hover:text-[#11262C] font-semibold underline underline-offset-2"
              >
                Activation Help
              </Link>
            </p>
          </form>
        )}
      </section>
    </AuthLayout>
  );
}
