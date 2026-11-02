import React, { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { InboxIcon } from "./icons";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  card?: boolean;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      title,
      description,
      icon,
      action,
      card = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center py-12 px-6 text-center max-w-md mx-auto",
          card &&
            "bg-white rounded-lg border border-[var(--color-border)] shadow-sm p-8",
          className
        )}
        {...props}
      >
        <div className="w-12 h-12 rounded-full bg-[var(--color-background-subtle)] text-[var(--color-text-secondary)] flex items-center justify-center mb-4">
          {icon || <InboxIcon className="w-6 h-6" />}
        </div>

        <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
            {description}
          </p>
        )}

        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";
