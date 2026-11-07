import React from "react";

export function MascotIcon({
  name,
  className = "w-4.5 h-4.5",
}: {
  name: "user" | "lock" | "eye" | "eyeOff" | "arrow" | "check" | "key";
  className?: string;
}) {
  const paths: Record<string, React.ReactNode> = {
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="9" r="4" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eyeOff: (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a17.8 17.8 0 0 1-3.1 3.9" />
        <path d="M6.2 6.2C3.4 8.2 2 12 2 12s3.5 6 10 6a10 10 0 0 0 3.5-.6" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    key: (
      <>
        <path d="m21 2-2 2m-1.5 1.5L14 9l-2 2" />
        <circle cx="7.5" cy="16.5" r="4.5" />
        <path d="m15.5 7.5 3 3" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

