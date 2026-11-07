"use client";

import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";

function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

const glassButtonStyles = `
@property --angle-1 {
  syntax: "<angle>";
  inherits: false;
  initial-value: -75deg;
}

@property --angle-2 {
  syntax: "<angle>";
  inherits: false;
  initial-value: -45deg;
}

.glass-button-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  isolation: isolate;
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.glass-button-wrap:hover {
  transform: translateY(-1px);
}

.glass-button-wrap:active {
  transform: translateY(1px);
}

.glass-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  cursor: pointer;
  outline: none;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.02) 100%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  backdrop-filter: blur(14px) saturate(140%);
  box-shadow: 
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.42),
    inset 0 -1px 1px 0 rgba(255, 255, 255, 0.06),
    0 8px 28px 0 rgba(0, 0, 0, 0.35);
  transition: 
    background 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  -webkit-tap-highlight-color: transparent;
  text-decoration: none;
  overflow: hidden;
}

.glass-button:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-color: rgba(255, 255, 255, 0.40);
  box-shadow: 
    inset 0 1px 2px 0 rgba(255, 255, 255, 0.60),
    inset 0 -1px 1px 0 rgba(255, 255, 255, 0.10),
    0 12px 36px 0 rgba(0, 0, 0, 0.45);
}

.glass-button:active {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.28);
  box-shadow: 
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.25),
    0 4px 16px 0 rgba(0, 0, 0, 0.30);
  transform: scale(0.98);
}

/* Delicate rotating specular sheen on border */
.glass-button::after {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: 9999px;
  padding: 1px;
  background: conic-gradient(
    from var(--angle-1) at 50% 50%,
    rgba(255, 255, 255, 0.50) 0%,
    transparent 8% 42%,
    rgba(255, 255, 255, 0.35) 50%,
    transparent 58% 92%,
    rgba(255, 255, 255, 0.50) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.7;
  transition: opacity 0.3s ease, --angle-1 0.6s ease;
}

.glass-button:hover::after {
  --angle-1: -125deg;
  opacity: 1;
}

.glass-button:active::after {
  --angle-1: -75deg;
}

/* Soft ambient shadow below the glass button */
.glass-button-shadow {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  pointer-events: none;
  box-shadow: 0 14px 28px -8px rgba(0, 0, 0, 0.45);
  opacity: 0.6;
  transition: opacity 0.3s ease, transform 0.3s ease;
  z-index: -1;
}

.glass-button-wrap:hover .glass-button-shadow {
  opacity: 0.85;
  transform: translateY(2px);
}

.glass-button-wrap:active .glass-button-shadow {
  opacity: 0.4;
  transform: translateY(0);
}

.glass-button-text {
  position: relative;
  z-index: 2;
  color: #ffffff;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
  transition: color 0.3s ease, text-shadow 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.glass-button:hover .glass-button-text {
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.7), 0 0 10px rgba(255, 255, 255, 0.25);
}
`;

const glassButtonVariants = cva(
  "relative isolate select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80 font-barlow-condensed font-semibold",
  {
    variants: {
      size: {
        default: "h-11 px-7 text-sm font-semibold tracking-[0.06em]",
        sm: "h-9 px-5 text-xs font-semibold tracking-[0.06em]",
        lg: "h-[52px] min-w-[170px] sm:min-w-[180px] px-8 text-lg sm:text-[19px] font-semibold tracking-[0.06em]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const glassButtonTextVariants = cva(
  "glass-button-text font-barlow-condensed font-semibold tracking-[0.06em]",
  {
    variants: {
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-lg sm:text-[19px]",
        icon: "flex h-10 w-10 items-center justify-center",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  contentClassName?: string;
  wrapperClassName?: string;
  href?: string;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size, contentClassName, wrapperClassName, href, ...props }, ref) => {
    const content = (
      <span
        className={cn(
          glassButtonTextVariants({ size }),
          contentClassName,
        )}
      >
        {children}
      </span>
    );

    return (
      <>
        <style>{glassButtonStyles}</style>
        <div
          className={cn(
            "glass-button-wrap",
            wrapperClassName,
          )}
        >
          {href ? (
            <Link
              href={href}
              className={cn("glass-button", glassButtonVariants({ size }), className)}
              onClick={props.onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
              onMouseEnter={props.onMouseEnter as unknown as React.MouseEventHandler<HTMLAnchorElement>}
              onMouseLeave={props.onMouseLeave as unknown as React.MouseEventHandler<HTMLAnchorElement>}
              aria-label={props["aria-label"]}
            >
              {content}
            </Link>
          ) : (
            <button
              className={cn("glass-button", glassButtonVariants({ size }), className)}
              ref={ref}
              {...props}
            >
              {content}
            </button>
          )}
          <div className="glass-button-shadow" />
        </div>
      </>
    );
  },
);
GlassButton.displayName = "GlassButton";

export { GlassButton, glassButtonVariants };

export default GlassButton;
