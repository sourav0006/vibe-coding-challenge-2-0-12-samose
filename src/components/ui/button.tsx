"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SpinnerIcon } from "./icons";
import type { ButtonVariant, ComponentSize } from "@/types";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ComponentSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] shadow-sm border border-transparent",
  secondary:
    "bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary-hover)] active:bg-[var(--color-secondary-active)] shadow-sm border border-transparent",
  outline:
    "bg-white text-[var(--color-text-primary)] border border-[var(--color-border-strong)] hover:bg-[var(--color-background-subtle)] active:bg-[var(--color-border)] shadow-sm",
  ghost:
    "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-background-subtle)] hover:text-[var(--color-text-primary)]",
  destructive:
    "bg-[var(--color-error)] text-white hover:bg-red-700 active:bg-red-800 shadow-sm border border-transparent",
};

const sizeStyles: Record<ComponentSize, string> = {
  sm: "h-8 px-3 text-xs rounded-md gap-1.5",
  md: "h-10 px-4 text-sm rounded-md gap-2",
  lg: "h-12 px-5 text-base rounded-lg gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <SpinnerIcon className="w-4 h-4 text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
