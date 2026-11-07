"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { GlassButton } from "@/components/ui/glass-button";
import { PlayIcon } from "./landing-icons";

interface StageState {
  isReady: boolean;
  stageW: number;
  stageH: number;
  cropTop: number;
  cropLeft: number;
  buttonStageY: number;
  buttonWidth: number;
  buttonHeight: number;
  headingTop: number;
}

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hasVideoEnded, setHasVideoEnded] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Responsive Media-Stage coordinate state
  const [stage, setStage] = useState<StageState>({
    isReady: false,
    stageW: 0,
    stageH: 0,
    cropTop: 0,
    cropLeft: 0,
    buttonStageY: 0,
    buttonWidth: 180,
    buttonHeight: 52,
    headingTop: 42,
  });

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

  // Shared responsive media-stage calculation
  // Intrinsic video aspect ratio is exactly 16:9 (1280x720)
  const updateStage = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    if (!w || !h) return;

    const A = 16 / 9;
    const R = w / h;
    let stageW: number;
    let stageH: number;
    let cropTop = 0;
    let cropLeft = 0;

    if (R >= A) {
      // Width-constrained: video covers full width W, vertical overflow cropped equally
      stageW = w;
      stageH = w / A;
      cropTop = (stageH - h) / 2;
    } else {
      // Height-constrained: video covers full height H, horizontal overflow cropped equally
      stageH = h;
      stageW = h * A;
      cropLeft = (stageW - w) / 2;
    }

    const stageTop = -cropTop;

    // Responsive button dimensions tailored to viewport height
    let btnW = 180;
    let btnH = 52;
    if (h <= 750) {
      btnW = 160;
      btnH = 44;
    } else if (h <= 850) {
      btnW = 170;
      btnH = 48;
    }

    // Dynamic vertical button positioning:
    // Characters' feet land at ~87.5% - 88.5% of stage height.
    // Ideal turf placement: 91.0% of stage height on the grass turf below feet.
    const idealTurfY = stageTop + 0.910 * stageH;

    // Safety boundary: button bottom must never overlap the footer.
    // Footer height with compact py-3/3.5 padding is ~42px, plus 12px safe clearance.
    const footerH = 42;
    const maxCenterY = h - footerH - (btnH / 2) - 12;

    // Final viewport Y coordinate of button center
    const finalButtonY = Math.min(idealTurfY, maxCenterY);

    // Convert viewport Y back into stage coordinates so button tracks the 16:9 stage
    const buttonStageY = finalButtonY + cropTop;

    // Heading Y positioning:
    // Centered in dusk sky negative space above players (38% of stage).
    // Bounded between 24px and 56px to guarantee it is never clipped by vertical cropping
    const idealHeadingY = stageTop + 0.040 * stageH;
    const headingTop = Math.min(56, Math.max(24, idealHeadingY));

    setStage({
      isReady: true,
      stageW: Math.round(stageW),
      stageH: Math.round(stageH),
      cropTop,
      cropLeft,
      buttonStageY: Math.round(buttonStageY * 10) / 10,
      buttonWidth: btnW,
      buttonHeight: btnH,
      headingTop: Math.round(headingTop),
    });
  }, []);

  useEffect(() => {
    updateStage();

    window.addEventListener("resize", updateStage);
    const observer = new ResizeObserver(updateStage);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateStage);
      observer.disconnect();
    };
  }, [updateStage]);

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
      className="relative h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-black text-white flex flex-col justify-between select-none"
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
      <header className="relative z-20 w-full px-6 py-4 sm:px-10 sm:py-5 flex items-center justify-between pointer-events-auto shrink-0">
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
      <div className="hidden md:block absolute inset-0 z-10 overflow-hidden pointer-events-none">
        {/* Welcome Heading: Centered horizontally in dusk sky negative space, with bounded top offset */}
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-auto text-center px-4 z-20"
          style={{
            top: stage.isReady ? `${stage.headingTop}px` : "clamp(24px, 4.5dvh, 56px)",
          }}
        >
          <h1
            className="font-alfa text-white select-none leading-tight tracking-tight whitespace-nowrap"
            style={{
              fontFamily: 'var(--font-alfa), "Alfa Slab One", serif',
              fontSize: "clamp(26px, 2.5vw, 42px)",
              textShadow:
                "0 2px 4px rgba(0, 0, 0, 0.75), 0 4px 12px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.35)",
            }}
          >
            Welcome to One Academy
          </h1>
        </div>

        {/* 16:9 Media Stage: Exactly tracks object-fit: cover and object-position: center */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: stage.isReady ? `${stage.stageW}px` : "max(100%, calc(100dvh * 16 / 9))",
            height: stage.isReady ? `${stage.stageH}px` : "max(100dvh, calc(100% * 9 / 16))",
          }}
        >
          {/* Three Role Buttons: Horizontally locked to characters (29.2%, 50.0%, 69.3%) on the grass turf */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Coach Button (Left: 29.2% of video frame) */}
            <div
              className="role-button absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-transform"
              style={{
                left: "29.2%",
                top: stage.isReady ? `${stage.buttonStageY}px` : "91.0%",
              }}
            >
              <GlassButton
                href="/login?role=coach"
                size="lg"
                className="justify-center font-barlow-condensed font-semibold tracking-[0.06em] whitespace-nowrap"
                style={{
                  width: `${stage.buttonWidth}px`,
                  height: `${stage.buttonHeight}px`,
                  fontSize: stage.buttonHeight <= 46 ? "17px" : "19px",
                }}
                aria-label="Enter as Coach"
              >
                Coach
              </GlassButton>
            </div>

            {/* Player Button (Left: 50.0% of video frame) */}
            <div
              className="role-button absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-transform"
              style={{
                left: "50.0%",
                top: stage.isReady ? `${stage.buttonStageY}px` : "91.0%",
              }}
            >
              <GlassButton
                href="/login?role=player"
                size="lg"
                className="justify-center font-barlow-condensed font-semibold tracking-[0.06em] whitespace-nowrap"
                style={{
                  width: `${stage.buttonWidth}px`,
                  height: `${stage.buttonHeight}px`,
                  fontSize: stage.buttonHeight <= 46 ? "17px" : "19px",
                }}
                aria-label="Enter as Player"
              >
                Player
              </GlassButton>
            </div>

            {/* Scout Button (Left: 69.3% of video frame) */}
            <div
              className="role-button absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-transform"
              style={{
                left: "69.3%",
                top: stage.isReady ? `${stage.buttonStageY}px` : "91.0%",
              }}
            >
              <GlassButton
                href="/login?role=scout"
                size="lg"
                className="justify-center font-barlow-condensed font-semibold tracking-[0.06em] whitespace-nowrap"
                style={{
                  width: `${stage.buttonWidth}px`,
                  height: `${stage.buttonHeight}px`,
                  fontSize: stage.buttonHeight <= 46 ? "17px" : "19px",
                }}
                aria-label="Enter as Scout"
              >
                Scout
              </GlassButton>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Mobile Safe Responsive Overlay (md:hidden) */}
      <div className="md:hidden relative z-10 w-full min-h-[calc(100dvh-130px)] flex flex-col justify-between items-center px-6 py-4 pointer-events-none">
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
      <footer className="relative z-20 w-full px-6 py-3.5 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-white/65 pointer-events-auto shrink-0">
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
