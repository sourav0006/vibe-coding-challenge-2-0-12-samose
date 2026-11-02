import React, { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { BadgeVariant } from "@/types";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  icon?: ReactNode;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  default: {
    container:
      "bg-[var(--color-secondary-soft)] text-[var(--color-text-secondary)] border border-[var(--color-border)]",
    dot: "bg-[var(--color-text-secondary)]",
  },
  success: {
    container:
      "bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success-border)]",
    dot: "bg-[var(--color-success)]",
  },
  warning: {
    container:
      "bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[var(--color-warning-border)]",
    dot: "bg-[var(--color-warning)]",
  },
  error: {
    container:
      "bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[var(--color-error-border)]",
    dot: "bg-[var(--color-error)]",
  },
  info: {
    container:
      "bg-[var(--color-info-bg)] text-[var(--color-info)] border border-[var(--color-info-border)]",
    dot: "bg-[var(--color-info)]",
  },
};

const sizeStyles = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-xs px-2.5 py-1 gap-1.5",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      dot = false,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const styles = variantStyles[variant];

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium rounded-full select-none leading-none tracking-wide",
          styles.container,
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn("w-1.5 h-1.5 rounded-full shrink-0", styles.dot)}
            aria-hidden="true"
          />
        )}
        {icon && <span className="inline-flex shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
