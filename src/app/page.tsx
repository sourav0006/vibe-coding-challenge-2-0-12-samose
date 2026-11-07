"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { GlassButton } from "@/components/ui/glass-button";
import { PlayIcon } from "./landing-icons";

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hasVideoEnded, setHasVideoEnded] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Video completion callback - preserves final frame naturally
  const handleVideoEnded = useCallback(() => {
    setHasVideoEnded(true);
  }, []);

  // Time update fallback: guarantees completion state when video reaches the end
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || hasVideoEnded) return;

    if (video.duration && video.currentTime >= video.duration - 0.08) {
      setHasVideoEnded(true);
    }
  }, [hasVideoEnded]);

  // Attempt muted autoplay on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-black text-white flex flex-col justify-between select-none"
    >
      {/* 1. Cinematic Video Background: 100% natural brightness, clarity, no dark overlays */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          src="/videos/stadium-intro.mp4"
          autoPlay
          muted
          playsInline
          preload="metadata"
          onEnded={handleVideoEnded}
          onTimeUpdate={handleTimeUpdate}
          onError={handleVideoEnded}
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* 2. Persistent One Academy Brand Header (Top-left, always visible from first frame) */}
      <header className="relative z-20 w-full px-6 py-6 sm:px-10 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0">
            <Image
              src="/images/logo-white.png"
              alt="One Academy Logo"
              width={36}
              height={36}
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              priority
            />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-[0.24em] text-white/95 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
            ONE ACADEMY
          </span>
        </div>

        {/* Playback affordance if browser autoplay was blocked */}
        {autoplayBlocked && !hasVideoEnded && (
          <button
            type="button"
            onClick={handleManualPlay}
            aria-label="Play stadium introduction video"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <PlayIcon className="w-3.5 h-3.5 text-white" />
            <span>Play Video</span>
          </button>
        )}
      </header>

      {/* 3. Desktop Video-Synchronized Interactive Overlay (md:block) */}
      {/* Container dimensions strictly track the 16:9 covered video frame, visible immediately from frame 1 */}
      <div className="hidden md:block absolute inset-0 z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: "max(100vw, calc(100vh * 16 / 9))",
            height: "max(100vh, calc(100vw * 9 / 16))",
          }}
        >
          {/* Welcome Heading: Centered in dusk sky negative space above players - bold collegiate slab display font matching Dashboard & Login */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[3.6%] pointer-events-auto text-center px-4">
            <h1
              className="font-alfa text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] xl:text-[42px] text-white select-none leading-tight tracking-tight whitespace-nowrap"
              style={{
                fontFamily: 'var(--font-alfa), "Alfa Slab One", serif',
                textShadow:
                  "0 2px 4px rgba(0, 0, 0, 0.75), 0 4px 12px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.35)",
              }}
            >
              Welcome to One Academy
            </h1>
          </div>

          {/* Three Role Buttons: Positioned directly under each person on the grass turf - visible from frame 1 */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Coach Button (Left: 29.2%, Bottom: 7.9% / Top: 92.1%) */}
            <div
              className="role-button absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              style={{ left: "29.2%", top: "92.1%" }}
            >
              <GlassButton
                href="/login?role=coach"
                size="lg"
                className="w-[180px] h-[52px] justify-center font-barlow-condensed font-semibold text-lg sm:text-[19px] tracking-[0.06em]"
                aria-label="Enter as Coach"
              >
                Coach
              </GlassButton>
            </div>

            {/* Player Button (Left: 50.0%, Bottom: 7.9% / Top: 92.1%) */}
            <div
              className="role-button absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              style={{ left: "50.0%", top: "92.1%" }}
            >
              <GlassButton
                href="/login?role=player"
                size="lg"
                className="w-[180px] h-[52px] justify-center font-barlow-condensed font-semibold text-lg sm:text-[19px] tracking-[0.06em]"
                aria-label="Enter as Player"
              >
                Player
              </GlassButton>
            </div>

            {/* Scout Button (Left: 69.3%, Bottom: 7.9% / Top: 92.1%) */}
            <div
              className="role-button absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              style={{ left: "69.3%", top: "92.1%" }}
            >
              <GlassButton
                href="/login?role=scout"
                size="lg"
                className="w-[180px] h-[52px] justify-center font-barlow-condensed font-semibold text-lg sm:text-[19px] tracking-[0.06em]"
                aria-label="Enter as Scout"
              >
                Scout
              </GlassButton>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Mobile Safe Responsive Overlay (md:hidden) - visible immediately from frame 1 */}
      <div className="md:hidden relative z-10 w-full min-h-[calc(100vh-140px)] flex flex-col justify-between items-center px-6 py-4 pointer-events-none">
        {/* Mobile Heading */}
        <div className="pointer-events-auto text-center mt-1 px-2">
          <h1
            className="font-alfa text-xl sm:text-2xl font-normal text-white leading-tight tracking-tight text-center"
            style={{
              fontFamily: 'var(--font-alfa), "Alfa Slab One", serif',
              textShadow:
                "0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.55)",
            }}
          >
            Welcome to One Academy
          </h1>
        </div>

        {/* Mobile Role Buttons (Vertically stacked on the lower turf safe area) */}
        <div className="pointer-events-auto flex flex-col items-center gap-3.5 w-full max-w-xs mb-4">
          <div className="role-button w-full flex justify-center">
            <GlassButton
              href="/login?role=coach"
              size="lg"
              className="w-full max-w-[200px] h-[48px] justify-center font-barlow-condensed font-semibold text-base sm:text-lg tracking-[0.06em]"
              aria-label="Enter as Coach"
            >
              Coach
            </GlassButton>
          </div>
          <div className="role-button w-full flex justify-center">
            <GlassButton
              href="/login?role=player"
              size="lg"
              className="w-full max-w-[200px] h-[48px] justify-center font-barlow-condensed font-semibold text-base sm:text-lg tracking-[0.06em]"
              aria-label="Enter as Player"
            >
              Player
            </GlassButton>
          </div>
          <div className="role-button w-full flex justify-center">
            <GlassButton
              href="/login?role=scout"
              size="lg"
              className="w-full max-w-[200px] h-[48px] justify-center font-barlow-condensed font-semibold text-base sm:text-lg tracking-[0.06em]"
              aria-label="Enter as Scout"
            >
              Scout
            </GlassButton>
          </div>
        </div>
      </div>

      {/* 5. Refined Discreet Footer - visible immediately from frame 1 */}
      <footer className="relative z-20 w-full px-6 py-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/65 pointer-events-auto">
        <div className="flex items-center gap-3">
          <p className="tracking-widest uppercase text-[11px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            &copy; 2026 ONE ACADEMY
          </p>
          <span className="text-white/40">&bull;</span>
          <Link
            href="/support"
            className="text-[12px] font-medium tracking-wide text-white/80 hover:text-white transition-colors duration-200 underline-offset-4 hover:underline drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          >
            Contact &amp; Support
          </Link>
        </div>

        <div className="flex items-center gap-5 sm:gap-6">
          <Link
            href="/legal"
            className="text-[12px] font-medium tracking-wide text-white/80 hover:text-white transition-colors duration-200 underline-offset-4 hover:underline drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          >
            Privacy &amp; Terms
          </Link>
          <Link
            href="/activate"
            className="text-[12px] font-medium tracking-wide text-white/80 hover:text-white transition-colors duration-200 underline-offset-4 hover:underline drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          >
            Activate Account
          </Link>
        </div>
      </footer>
    </div>
  );
}
