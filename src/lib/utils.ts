/**
 * Utility functions for One Academy application
 */

export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | { [key: string]: boolean | undefined | null }
  | ClassValue[];

/**
 * Combines CSS class names conditionally, filtering out falsy values.
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  function process(input: ClassValue): void {
    if (!input) return;
    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input).trim());
    } else if (Array.isArray(input)) {
      for (const item of input) {
        process(item);
      }
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) {
          classes.push(key.trim());
        }
      }
    }
  }

  for (const input of inputs) {
    process(input);
  }

  return classes.filter(Boolean).join(" ");
}

/**
 * Formats a Date or ISO string into a locale-friendly date string using UTC to avoid timezone shifts.
 */
export function formatDateOnly(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Returns today's date in YYYY-MM-DD format.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date or ISO string with date and time.
 */
export function formatDateTime(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
