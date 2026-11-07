"use client";

import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "./icons";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      id,
      label,
      helperText,
      error,
      disabled,
      required,
      options,
      placeholder,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-1 select-none"
          >
            {label}
            {required && <span className="text-[var(--color-error)]" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center w-full">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              "w-full h-10 pl-3 pr-10 py-2 text-sm bg-white rounded-md border appearance-none transition-colors",
              "text-[var(--color-text-primary)] cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              error
                ? "border-[var(--color-error)] focus-visible:ring-[var(--color-error)] focus-visible:border-[var(--color-error)]"
                : "border-[var(--color-border-strong)] focus-visible:ring-[var(--color-primary)] focus-visible:border-[var(--color-primary)]",
              "disabled:bg-[var(--color-background-subtle)] disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((option) => (
                  <option
                    key={String(option.value)}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute right-3 pointer-events-none text-[var(--color-text-muted)]">
            <ChevronDownIcon className="w-4 h-4" />
          </div>
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

Select.displayName = "Select";
