"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRightIcon, PlayIcon } from "./landing-icons";

interface RoleOption {
  role: "coach" | "player" | "scout";
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  href: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: "coach",
    title: "COACH",
    description: "Manage your academy.",
    badge: "Administration",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    href: "/login?role=coach",
  },
  {
    role: "player",
    title: "PLAYER",
    description: "Access your training journey.",
    badge: "Athlete",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    href: "/login?role=player",
  },
  {
    role: "scout",
    title: "SCOUT",
    description: "Discover academy talent.",
    badge: "Evaluation",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    href: "/login?role=scout",
  },
];

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Attempt muted autoplay on mount
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setAutoplayBlocked(false);
        })
        .catch(() => {
          // Autoplay policy prevented playback
          setAutoplayBlocked(true);
        });
    }
  }, []);

  const handleManualPlay = () => {
    const video = videoRef.current;
    if (!video) return;

    video
      .play()
      .then(() => {
        setAutoplayBlocked(false);
      })
      .catch((err) => {
        console.error("Manual video playback failed:", err);
      });
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white flex flex-col justify-between select-none">
      {/* 1. Cinematic Video Background (Plays exactly once, retains final frame naturally) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          src="/videos/stadium-intro.mp4"
          autoPlay
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover object-center"
        />

        {/* 2. Refined Dark Gradient Overlay for Maximum Legibility & Atmosphere */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-radial-[circle_at_center,_var(--tw-gradient-stops)] from-transparent via-black/30 to-black/75"
          aria-hidden="true"
        />
      </div>

      {/* 3. Minimalist Header */}
      <header className="relative z-10 w-full px-6 py-8 sm:px-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Subtle crest icon */}
          <div className="w-8 h-8 rounded-lg bg-emerald-600/90 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-emerald-950/50 border border-emerald-400/30 backdrop-blur-xs">
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-[0.25em] text-white/95 uppercase">
            ONE ACADEMY
          </span>
        </div>

        {/* Subtle manual play button if browser blocked autoplay */}
        {autoplayBlocked && (
          <button
            type="button"
            onClick={handleManualPlay}
            aria-label="Play stadium introduction video"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-white/90 border border-white/20 backdrop-blur-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <PlayIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Play Video</span>
          </button>
        )}
      </header>

      {/* 4. Central Hero Statement & Role Selection Area */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 sm:px-8 flex flex-col items-center justify-center text-center my-auto">
        {/* Subtle Brand Tagline */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-white/10 text-emerald-300 border border-emerald-500/30 backdrop-blur-md mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Single-Academy Management Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-3xl leading-tight sm:leading-none mb-4 drop-shadow-md">
          Precision Sports Intelligence.
        </h1>

        <p className="text-sm sm:text-base text-white/75 max-w-lg mb-12 sm:mb-16 font-normal leading-relaxed drop-shadow-sm">
          Select your portal to enter the One Academy management system.
        </p>

        {/* 5. Role Selection Options (Desktop horizontal grid, mobile stacked) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl">
          {ROLE_OPTIONS.map((opt) => (
            <Link
              key={opt.role}
              href={opt.href}
              className="group relative flex flex-col items-start text-left p-6 sm:p-7 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.15] hover:border-emerald-500/60 backdrop-blur-md transition-all duration-200 shadow-lg shadow-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              {/* Top Row: Badge & Arrow Indicator */}
              <div className="w-full flex items-center justify-between mb-5">
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${opt.badgeColor}`}
                >
                  {opt.badge}
                </span>

                <div className="w-7 h-7 rounded-full bg-white/10 text-white/60 group-hover:text-white group-hover:bg-emerald-600 flex items-center justify-center transition-all duration-200">
                  <ArrowRightIcon className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Role Title */}
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1.5 group-hover:text-emerald-300 transition-colors">
                {opt.title}
              </h2>

              {/* Role Description */}
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-normal">
                {opt.description}
              </p>

              {/* Bottom Subtle Affordance Line */}
              <div className="mt-5 text-[11px] font-semibold text-emerald-400/90 flex items-center gap-1 group-hover:text-emerald-300">
                <span>Enter Portal</span>
                <span aria-hidden="true">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* 6. Elegant Bottom Footer */}
      <footer className="relative z-10 w-full px-6 py-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50 border-t border-white/[0.08] bg-black/40 backdrop-blur-xs">
        <p className="tracking-wide">
          &copy; 2026 ONE ACADEMY • All Rights Reserved
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/activate"
            className="text-white/70 hover:text-white underline underline-offset-4 transition-colors"
          >
            Activate Player or Scout Account
          </Link>
          <span aria-hidden="true" className="text-white/20">&bull;</span>
          <Link
            href="/login"
            className="text-white/70 hover:text-white transition-colors"
          >
            Direct Sign In
          </Link>
        </div>
      </footer>
    </div>
  );
}
