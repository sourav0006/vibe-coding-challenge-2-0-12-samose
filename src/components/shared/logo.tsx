import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  variant?: "dark" | "white";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean; // Kept for backwards compatibility
  showWordmark?: boolean;
}

export function Logo({
  className,
  variant = "dark",
  size = "md",
  showWordmark = true,
}: LogoProps) {
  const isWhite = variant === "white";
  const logoSrc = isWhite ? "/images/logo-white.png" : "/images/logo-dark.png";

  const sizeConfig = {
    sm: { img: 24, text: "text-xs tracking-[0.2em]" },
    md: { img: 28, text: "text-sm tracking-[0.22em]" },
    lg: { img: 36, text: "text-base tracking-[0.24em]" },
  };

  const { img, text } = sizeConfig[size];

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: img, height: img }}
      >
        <Image
          src={logoSrc}
          alt="One Academy"
          width={img}
          height={img}
          className="w-full h-full object-contain"
          priority
        />
      </div>
      {showWordmark && (
        <span
          className={cn(
            "font-bold uppercase whitespace-nowrap leading-none transition-colors",
            text,
            isWhite ? "text-white" : "text-slate-900"
          )}
        >
          ONE ACADEMY
        </span>
      )}
    </div>
  );
}
