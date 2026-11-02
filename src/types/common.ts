/**
 * Common application and UI component types
 */

import type { ReactNode } from "react";

export type ComponentSize = "sm" | "md" | "lg";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

export type CardVariant = "default" | "bordered" | "elevated" | "flat";

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}
