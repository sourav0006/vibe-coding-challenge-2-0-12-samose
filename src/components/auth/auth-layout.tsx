"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { AuthHeader } from "./auth-header";

export interface AuthLayoutProps {
  currentPage: "login" | "activate";
  mascotStage: React.ReactNode;
  children: React.ReactNode;
}

export function AuthLayout({
  currentPage,
  mascotStage,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F4EBD8] text-[#11262C] flex flex-col relative overflow-x-hidden selection:bg-[#D95B24] selection:text-white">
      {/* ========================================================= */}
      {/* 1. ILLUSTRATED CAMPUS BACKGROUND LAYER                    */}
      {/* ========================================================= */}
      <div
        className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0"
        aria-hidden="true"
      >
        {/* Background Image positioned to cover top and left/center */}
        <div className="absolute top-0 left-0 w-full lg:w-[72%] h-[650px] sm:h-[720px] lg:h-[820px] overflow-hidden">
          <Image
            src="/images/auth-background.png"
            alt="One Academy Sports Grounds"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 75vw"
            className="object-cover object-left-top sm:object-left"
          />
          {/* Subtle multi-directional gradient mask for seamless natural blending */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#F4EBD8]" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#F4EBD8]" />
          <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-[#F4EBD8] via-[#F4EBD8]/80 to-transparent" />
        </div>

        {/* Global ambient warmth tint on lower area */}
        <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-[#F4EBD8] to-transparent" />
      </div>

      {/* ========================================================= */}
      {/* 2. AUTHENTICATION TOP HEADER                              */}
      {/* ========================================================= */}
      <AuthHeader currentPage={currentPage} />

      {/* ========================================================= */}
      {/* 3. MAIN COMPOSITION: LEFT STAGE (FOX) & RIGHT CARD (FORM) */}
      {/* ========================================================= */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center relative z-10 py-6 sm:py-8 lg:py-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Fox Mascot Stage on Track */}
          <div className="lg:col-span-6 xl:col-span-7 flex items-center justify-center relative">
            <div className="w-full max-w-[560px] relative">
              {mascotStage}
            </div>
          </div>

          {/* Right Column: Double-Gold-Bordered Admission Card */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[480px]">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 4. MINIMAL AUTHENTICATION FOOTER                          */}
      {/* ========================================================= */}
      <footer className="relative z-10 w-full py-4 text-xs text-[#718E94] font-medium border-t border-[#E2D7C3]/60 bg-[#F4EBD8]/80 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>One Academy &bull; Single-Academy Sports Management System</p>
          {currentPage === "activate" ? (
            <div className="flex items-center gap-4">
              <Link
                href="/activate/help"
                className="hover:text-[#11262C] transition-colors underline-offset-4 hover:underline"
              >
                Account Activation Help
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/support"
                className="hover:text-[#11262C] transition-colors underline-offset-4 hover:underline"
              >
                Contact &amp; Support
              </Link>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

