import clsx from "clsx";
import { useId } from "react";
import { LogoMark } from "@/components/ui/Logo";

/** A gold wax seal with the mark in the middle and text around the rim. */
export function Seal({ text = "CRAFTED WITH CARE · REFRESHING TRADITION · ", className }: { text?: string; className?: string }) {
  const id = useId();
  // 14-lobe scalloped edge
  const lobes = 14;
  const pts: string[] = [];
  for (let i = 0; i < lobes * 2; i++) {
    const a = (i / (lobes * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 98 : 88;
    pts.push(`${(100 + Math.cos(a) * r).toFixed(1)},${(100 + Math.sin(a) * r).toFixed(1)}`);
  }
  return (
    <div className={clsx("relative aspect-square text-forest-deep", className)}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full drop-shadow-[0_6px_10px_rgb(29_26_22/0.25)]" aria-hidden>
        <defs>
          <radialGradient id={`${id}-g`} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#e9c57a" />
            <stop offset="55%" stopColor="#c9993f" />
            <stop offset="100%" stopColor="#8f6a24" />
          </radialGradient>
          <path id={`${id}-p`} d="M100,100 m-62,0 a62,62 0 1,1 124,0 a62,62 0 1,1 -124,0" />
        </defs>
        <polygon points={pts.join(" ")} fill={`url(#${id}-g)`} />
        <circle cx="100" cy="100" r="76" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".55" />
        <circle cx="100" cy="100" r="48" fill="none" stroke="currentColor" strokeWidth="1" opacity=".55" />
        <text fill="currentColor" fontSize="11.5" fontWeight="700" letterSpacing="2.6" fontFamily="var(--font-hanken), sans-serif" opacity=".8">
          <textPath href={`#${id}-p`}>{text}</textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <LogoMark className="h-[22%] w-[25%] opacity-80" />
      </div>
    </div>
  );
}
