/**
 * Design system tokens for One Academy
 * Pure light mode theme with restrained athletic green accents and dark neutral typography.
 */

export const DESIGN_TOKENS = {
  colors: {
    primary: {
      default: "#15803d", // Pitch green / emerald 700 - authoritative athletic green
      hover: "#166534", // Emerald 800
      active: "#14532d", // Emerald 900
      soft: "#f0fdf4", // Emerald 50
      light: "#dcfce7", // Emerald 100
      foreground: "#ffffff",
    },
    secondary: {
      default: "#0f172a", // Slate 900
      hover: "#1e293b", // Slate 800
      active: "#334155", // Slate 700
      soft: "#f1f5f9", // Slate 100
      foreground: "#ffffff",
    },
    background: {
      default: "#f8fafc", // Slate 50 - clean canvas background
      subtle: "#f1f5f9", // Slate 100
    },
    surface: {
      default: "#ffffff", // Pure white card & component surface
      elevated: "#ffffff",
      muted: "#f8fafc",
    },
    text: {
      primary: "#0f172a", // Slate 900 - high contrast readability
      secondary: "#475569", // Slate 600 - balanced body and metadata
      muted: "#94a3b8", // Slate 400 - placeholders and disabled states
      inverse: "#ffffff", // On dark surfaces
    },
    border: {
      default: "#e2e8f0", // Slate 200 - crisp, minimal divider
      subtle: "#f1f5f9", // Slate 100
      strong: "#cbd5e1", // Slate 300
    },
    status: {
      success: {
        text: "#15803d",
        background: "#f0fdf4",
        border: "#bbf7d0",
      },
      warning: {
        text: "#b45309",
        background: "#fffbeb",
        border: "#fde68a",
      },
      error: {
        text: "#b91c1c",
        background: "#fef2f2",
        border: "#fecaca",
      },
      info: {
        text: "#1d4ed8",
        background: "#eff6ff",
        border: "#bfdbfe",
      },
    },
  },
  typography: {
    fontFamily: {
      sans: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    scale: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
    },
    weight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
  },
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
  },
  radius: {
    none: "0px",
    sm: "0.25rem", // 4px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    "2xl": "1rem", // 16px
    full: "9999px",
  },
  shadows: {
    none: "none",
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
  },
} as const;
