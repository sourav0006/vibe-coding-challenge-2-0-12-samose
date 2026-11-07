"use client";

import { useEffect, useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CloseIcon } from "./icons";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const maxWidthStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
  className,
}: ModalProps) {
  const titleId = useId();
  const descId = useId();

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className={cn(
          "relative w-full bg-white rounded-xl shadow-xl border border-[var(--color-border)]",
          "overflow-hidden flex flex-col z-10 animate-scale-in",
          maxWidthStyles[maxWidth],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex flex-col gap-1 pr-6">
            <h2
              id={titleId}
              className="text-lg font-semibold text-[var(--color-text-primary)] leading-tight"
            >
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-[var(--color-text-secondary)]">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className={cn(
              "p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
              "hover:bg-[var(--color-background-subtle)] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            )}
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] text-sm text-[var(--color-text-primary)]">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="px-6 py-4 bg-[var(--color-surface-muted)] border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
