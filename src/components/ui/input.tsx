"use client";

import React, { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      id,
      label,
      helperText,
      error,
      disabled,
      required,
      leftAddon,
      rightAddon,
      type = "text",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = error
      ? errorId
      : helperText
      ? helperId
      : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-1 select-none"
          >
            {label}
            {required && <span className="text-[var(--color-error)]" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftAddon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[var(--color-text-muted)]">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              "w-full h-10 px-3 py-2 text-sm bg-white rounded-md border transition-colors",
              "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              error
                ? "border-[var(--color-error)] focus-visible:ring-[var(--color-error)] focus-visible:border-[var(--color-error)]"
                : "border-[var(--color-border-strong)] focus-visible:ring-[var(--color-primary)] focus-visible:border-[var(--color-primary)]",
              "disabled:bg-[var(--color-background-subtle)] disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed",
              leftAddon ? "pl-9" : "",
              rightAddon ? "pr-9" : "",
              className
            )}
            {...props}
          />

          {rightAddon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-[var(--color-text-muted)]">
              {rightAddon}
            </div>
          )}
        </div>

        {error ? (
          <p id={errorId} className="text-xs text-[var(--color-error)] font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-[var(--color-text-secondary)]">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
