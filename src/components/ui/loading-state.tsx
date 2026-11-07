import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { SpinnerIcon } from "./icons";

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  message?: string;
  size?: "sm" | "md" | "lg";
  card?: boolean;
}

const sizeMap = {
  sm: { icon: "w-5 h-5", text: "text-xs" },
  md: { icon: "w-8 h-8", text: "text-sm" },
  lg: { icon: "w-10 h-10", text: "text-base" },
};

export const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  (
    {
      className,
      message = "Loading...",
      size = "md",
      card = false,
      ...props
    },
    ref
  ) => {
    const { icon, text } = sizeMap[size];

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(
          "flex flex-col items-center justify-center py-12 px-6 gap-3 text-center",
          card &&
            "bg-white rounded-lg border border-[var(--color-border)] shadow-sm",
          className
        )}
        {...props}
      >
        <SpinnerIcon className={cn("text-[var(--color-primary)]", icon)} />
        {message && (
          <p className={cn("text-[var(--color-text-secondary)] font-medium", text)}>
            {message}
          </p>
        )}
        <span className="sr-only">{message}</span>
      </div>
    );
  }
);

LoadingState.displayName = "LoadingState";
