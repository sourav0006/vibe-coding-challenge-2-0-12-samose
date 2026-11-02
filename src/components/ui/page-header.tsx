import React, { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, badge, actions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-4 pb-6 border-b border-[var(--color-border)] md:flex-row md:items-center md:justify-between",
          className
        )}
        {...props}
      >
        <div className="flex flex-col gap-1.5 max-w-2xl">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
              {title}
            </h1>
            {badge && <div className="inline-flex shrink-0">{badge}</div>}
          </div>
          {description && (
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed sm:text-base">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    );
  }
);

PageHeader.displayName = "PageHeader";
