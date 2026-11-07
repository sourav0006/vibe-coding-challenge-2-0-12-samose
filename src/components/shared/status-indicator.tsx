import { cn } from "@/lib/utils";

export interface StatusIndicatorProps {
  status: "online" | "offline" | "busy" | "idle";
  label?: string;
  className?: string;
}

const statusColors = {
  online: "bg-[var(--color-success)]",
  offline: "bg-[var(--color-text-muted)]",
  busy: "bg-[var(--color-error)]",
  idle: "bg-[var(--color-warning)]",
};

export function StatusIndicator({ status, label, className }: StatusIndicatorProps) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]", className)}>
      <span className={cn("w-2 h-2 rounded-full", statusColors[status])} aria-hidden="true" />
      {label && <span>{label}</span>}
    </div>
  );
}
