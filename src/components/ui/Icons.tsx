/**
 * A small set of hand-drawn-feeling line icons in the brand's stroke style.
 * All take a className and inherit currentColor.
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: P) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const Icons = {
  bulb: (p: P) => (
    <Base {...p}>
      <path d="M18 36h12M20 41h8M24 6c-8 0-13 6-13 13 0 5 3 8 6 11 1 1 2 3 2 6h10c0-3 1-5 2-6 3-3 6-6 6-11 0-7-5-13-13-13Z" />
      <path d="M24 36v-8l-4-4M24 28l4-4" opacity=".6" />
    </Base>
  ),
  flask: (p: P) => (
    <Base {...p}>
      <path d="M19 6h10M21 6v12L9 38a3 3 0 0 0 3 4h24a3 3 0 0 0 3-4L27 18V6" />
      <path d="M15 30h18" opacity=".6" />
      <path d="M22 34a1 1 0 1 0 0 .01M28 36a1 1 0 1 0 0 .01" />
    </Base>
  ),
  mortar: (p: P) => (
    <Base {...p}>
      <path d="M8 22h32c0 8-5 14-12 16v4H20v-4C13 36 8 30 8 22Z" />
      <path d="M26 20 38 8M36 6l4 4" />
      <path d="M14 14c2-4 6-6 10-6" opacity=".6" />
    </Base>
  ),
  box: (p: P) => (
    <Base {...p}>
      <path d="M8 16 24 8l16 8v18L24 42 8 34V16Z" />
      <path d="M8 16l16 8 16-8M24 24v18" />
      <path d="M16 12l16 8" opacity=".6" />
    </Base>
  ),
  globePlane: (p: P) => (
    <Base {...p}>
      <circle cx="22" cy="26" r="14" />
      <path d="M8 26h28M22 12c-5 5-5 23 0 28M22 12c5 5 5 23 0 28" opacity=".6" />
      <path d="M30 10l10-4-4 10-3-3-4 1 1-4z" />
    </Base>
  ),
  handsHeart: (p: P) => (
    <Base {...p}>
      <path d="M24 30s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11Z" />
      <path d="M6 30c4 0 6 2 8 4l6 2c2 0 6-1 8-1 3 0 5 2 5 4l-13 3c-4 1-8-1-11-3H6" />
      <path d="M42 30c-4 0-6 2-8 4" opacity=".6" />
    </Base>
  ),
  leafCircle: (p: P) => (
    <Base {...p}>
      <circle cx="24" cy="24" r="18" />
      <path d="M24 34c-8 0-12-6-12-14 8 0 14 4 12 14ZM24 34c8 0 12-6 12-14-8 0-14 4-12 14Z" />
      <path d="M24 34V16" opacity=".5" />
    </Base>
  ),
  dropCircle: (p: P) => (
    <Base {...p}>
      <circle cx="24" cy="24" r="18" />
      <path d="M24 12c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15Z" />
    </Base>
  ),
  recycleCircle: (p: P) => (
    <Base {...p}>
      <circle cx="24" cy="24" r="18" />
      <path d="M20 16l4-6 4 6M32 22l4 6h-7M16 22l-4 6h7M19 34h10M14 28l3 6M34 28l-3 6" />
    </Base>
  ),
  cloche: (p: P) => (
    <Base {...p}>
      <path d="M6 34h36M9 32c0-9 7-16 15-16s15 7 15 16" />
      <path d="M24 12v4M22 12h4" />
      <path d="M14 26c1-4 4-7 8-8" opacity=".6" />
    </Base>
  ),
  hotel: (p: P) => (
    <Base {...p}>
      <path d="M10 42V12l14-6 14 6v30M6 42h36" />
      <path d="M17 18h4M27 18h4M17 25h4M27 25h4M17 32h4M27 32h4M21 42v-7h6v7" />
    </Base>
  ),
  plane: (p: P) => (
    <Base {...p}>
      <path d="M40 8 8 22l12 4 4 12 5-9 11-21Z" />
      <path d="M20 26 40 8" opacity=".6" />
    </Base>
  ),
  rings: (p: P) => (
    <Base {...p}>
      <circle cx="19" cy="28" r="10" />
      <circle cx="30" cy="28" r="10" />
      <path d="M30 18l-3-6h6l-3 6Z" />
    </Base>
  ),
  briefcase: (p: P) => (
    <Base {...p}>
      <rect x="6" y="16" width="36" height="24" rx="3" />
      <path d="M18 16v-5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5M6 26h36M22 26v4h4v-4" />
    </Base>
  ),
  bag: (p: P) => (
    <Base {...p}>
      <path d="M10 18h28l-2 22H12l-2-22Z" />
      <path d="M17 18v-4a7 7 0 0 1 14 0v4" />
    </Base>
  ),
  stones: (p: P) => (
    <Base {...p}>
      <ellipse cx="24" cy="38" rx="16" ry="5" />
      <ellipse cx="24" cy="28" rx="12" ry="4.5" />
      <ellipse cx="24" cy="19" rx="8" ry="3.5" />
      <path d="M30 12c4-2 6-6 6-8-3 0-6 3-6 8Z" />
    </Base>
  ),
  calendar: (p: P) => (
    <Base {...p}>
      <rect x="8" y="12" width="32" height="28" rx="3" />
      <path d="M8 20h32M16 8v8M32 8v8" />
      <path d="M15 27h3M22 27h3M29 27h3M15 33h3M22 33h3" />
    </Base>
  ),
  dumbbell: (p: P) => (
    <Base {...p}>
      <path d="M6 20v8M10 16v16M38 16v16M42 20v8M10 24h28" />
      <path d="M14 14h4v20h-4zM30 14h4v20h-4z" />
    </Base>
  ),
  glass: (p: P) => (
    <Base {...p}>
      <path d="M12 8h24l-10 16v14h6v3H16v-3h6V24L12 8Z" />
      <path d="M15 13h18" opacity=".6" />
    </Base>
  ),
  ship: (p: P) => (
    <Base {...p}>
      <path d="M6 32c4 0 4 3 8 3s4-3 8-3 4 3 8 3 4-3 8-3M8 28l3-8h26l3 8M14 20v-6h20v6M20 14v-4h8v4" />
    </Base>
  ),
  users: (p: P) => (
    <Base {...p}>
      <circle cx="18" cy="16" r="6" />
      <circle cx="32" cy="18" r="5" />
      <path d="M6 38c0-8 5-12 12-12s12 4 12 12M30 27c6 0 12 3 12 11" />
    </Base>
  ),
  hospital: (p: P) => (
    <Base {...p}>
      <rect x="8" y="10" width="32" height="30" rx="2" />
      <path d="M24 18v10M19 23h10M6 40h36M20 40v-6h8v6" />
    </Base>
  ),
  pin: (p: P) => (
    <Base {...p}>
      <path d="M24 42s-13-11-13-22a13 13 0 0 1 26 0c0 11-13 22-13 22Z" />
      <circle cx="24" cy="20" r="5" />
    </Base>
  ),
  handshake: (p: P) => (
    <Base {...p}>
      <path d="M6 20l8-6 8 4 6-4 8 6 6-2v14l-6 2-8 6-6-2-6 2-8-8-2-2V20Z" />
      <path d="M22 18l-6 6a2 2 0 0 0 3 3l5-4M24 26l-3 3a2 2 0 0 0 3 3l3-3M28 30l-2 2a2 2 0 0 0 3 3l2-2" />
    </Base>
  ),
  megaphone: (p: P) => (
    <Base {...p}>
      <path d="M8 20v8h6l12 8V12L14 20H8ZM32 18c3 2 3 10 0 12M36 14c5 4 5 16 0 20" />
    </Base>
  ),
  monitor: (p: P) => (
    <Base {...p}>
      <rect x="6" y="10" width="36" height="24" rx="2" />
      <path d="M18 40h12M24 34v6M18 26l4-6 4 4 6-8" />
    </Base>
  ),
  factory: (p: P) => (
    <Base {...p}>
      <path d="M6 40V20l10 6v-6l10 6v-6l10 6V8h6v32H6Z" />
      <path d="M12 32h4M22 32h4M32 32h4" />
    </Base>
  ),
  truck: (p: P) => (
    <Base {...p}>
      <path d="M4 12h24v20H4zM28 20h9l7 7v5h-16" />
      <circle cx="12" cy="36" r="4" />
      <circle cx="34" cy="36" r="4" />
    </Base>
  ),
  headset: (p: P) => (
    <Base {...p}>
      <path d="M8 28v-4a16 16 0 0 1 32 0v4" />
      <rect x="6" y="26" width="8" height="12" rx="3" />
      <rect x="34" y="26" width="8" height="12" rx="3" />
      <path d="M38 38c0 3-4 5-10 5" />
    </Base>
  ),
  cap: (p: P) => (
    <Base {...p}>
      <path d="M4 20 24 10l20 10-20 10L4 20Z" />
      <path d="M12 24v9c4 4 20 4 24 0v-9M44 20v10" />
    </Base>
  ),
  shield: (p: P) => (
    <Base {...p}>
      <path d="M24 6 8 12v12c0 10 7 16 16 20 9-4 16-10 16-20V12L24 6Z" />
      <path d="M17 24l5 5 9-10" />
    </Base>
  ),
  gift: (p: P) => (
    <Base {...p}>
      <path d="M8 20h32v6H8zM10 26h28v16H10zM24 20v22" />
      <path d="M24 20c-8 0-10-4-8-8s8 0 8 8ZM24 20c8 0 10-4 8-8s-8 0-8 8Z" />
    </Base>
  ),
  globe: (p: P) => (
    <Base {...p}>
      <circle cx="24" cy="24" r="16" />
      <path d="M8 24h32M24 8c-6 6-6 26 0 32M24 8c6 6 6 26 0 32M11 15c8 4 18 4 26 0M11 33c8-4 18-4 26 0" opacity=".7" />
    </Base>
  ),
  target: (p: P) => (
    <Base {...p}>
      <circle cx="24" cy="24" r="16" />
      <circle cx="24" cy="24" r="9" />
      <circle cx="24" cy="24" r="2" />
      <path d="M24 24 40 8M34 8h6v6" />
    </Base>
  ),
  seedling: (p: P) => (
    <Base {...p}>
      <path d="M24 42V24" />
      <path d="M24 24c-10 0-14-6-14-14 8 0 14 4 14 14ZM24 30c0-8 6-12 14-12 0 8-6 12-14 12Z" />
      <path d="M8 42h32" opacity=".6" />
    </Base>
  ),
  mosque: (p: P) => (
    <Base {...p}>
      <path d="M6 42h36M10 42V24M38 42V24M8 24h4M36 24h4M10 24l2-8 2 8M34 24l2-8 2 8" />
      <path d="M16 42V28h16v14M16 28c0-6 3-10 8-12 5 2 8 6 8 12M24 16v-6M22 12h4" />
      <path d="M21 42v-6a3 3 0 0 1 6 0v6" />
    </Base>
  ),
  pyramids: (p: P) => (
    <Base {...p}>
      <path d="M4 40h40M8 40l12-22 12 22M26 40l9-16 9 16" />
      <path d="M20 18l-3 22M35 24l-2 16" opacity=".5" />
      <circle cx="38" cy="10" r="3" />
    </Base>
  ),
  acacia: (p: P) => (
    <Base {...p}>
      <path d="M24 42V22M24 30l-8-8M24 26l9-6M6 42h36" />
      <path d="M6 18c4-6 12-8 18-8s14 2 18 8c-6 3-12 4-18 4S12 21 6 18Z" />
    </Base>
  ),
  cathedral: (p: P) => (
    <Base {...p}>
      <path d="M6 42h36M10 42V26l6-6 6 6v16M26 42V26l6-6 6 6v16" />
      <path d="M16 20V8M32 20V8M14 10h4M30 10h4M14 30h4M30 30h4M20 42v-6a4 4 0 0 1 8 0v6" />
    </Base>
  ),
  pagoda: (p: P) => (
    <Base {...p}>
      <path d="M6 42h36M12 42V32M36 42V32M20 42v-6h8v6" />
      <path d="M6 32c8-2 14-4 18-8 4 4 10 6 18 8H6ZM10 22c6-2 10-4 14-8 4 4 8 6 14 8H10ZM14 12c4-1 7-3 10-6 3 3 6 5 10 6H14Z" />
    </Base>
  ),
  skyline: (p: P) => (
    <Base {...p}>
      <path d="M4 42h40M8 42V26h6v16M16 42V12h8v30M26 42V20h6v22M34 42V30h6v12M20 12V6" />
      <path d="M19 18h2M19 24h2M19 30h2M28 26h2M28 32h2" opacity=".6" />
    </Base>
  ),
  compass: (p: P) => (
    <Base {...p}>
      <circle cx="24" cy="24" r="17" />
      <path d="M24 4v6M24 38v6M4 24h6M38 24h6" />
      <path d="M24 10l4 14-4 14-4-14z" />
      <path d="M10 24l14-4 14 4-14 4z" opacity=".6" />
    </Base>
  ),
};

export type IconName = keyof typeof Icons;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const C = Icons[name];
  return <C className={className} />;
}

/** Icon inside a hairline ring, as used across the brand collateral. */
export function RingIcon({
  name,
  className,
  tone = "forest",
  size = "md",
}: {
  name: IconName;
  className?: string;
  tone?: "forest" | "cream" | "gold";
  size?: "sm" | "md" | "lg";
}) {
  const ring =
    tone === "cream"
      ? "border-cream/35 text-cream"
      : tone === "gold"
        ? "border-gold/60 text-gold"
        : "border-forest/35 text-forest";
  const dims = size === "sm" ? "h-11 w-11 p-2.5" : size === "lg" ? "h-20 w-20 p-5" : "h-14 w-14 p-3.5";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full border ${ring} ${dims} ${className ?? ""}`}>
      <Icon name={name} className="h-full w-full" />
    </span>
  );
}
