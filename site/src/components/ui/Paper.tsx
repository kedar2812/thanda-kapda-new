import clsx from "clsx";
import { useId } from "react";

type BrushTone = "cream" | "sage" | "forest" | "gold";

const brushFill: Record<BrushTone, string> = {
  cream: "text-cream-200",
  sage: "text-sage/70",
  forest: "text-forest",
  gold: "text-[#e3cf9f]",
};

const brushInk: Record<BrushTone, string> = {
  cream: "text-forest",
  sage: "text-forest",
  forest: "text-cream",
  gold: "text-forest",
};

/**
 * A handwritten caption laid over a dry-brush stroke, as on the collateral
 * ("From our reach, to the world."). Text uses the display italic.
 */
export function BrushNote({
  children,
  tone = "cream",
  className,
  textClassName,
}: {
  children: React.ReactNode;
  tone?: BrushTone;
  className?: string;
  textClassName?: string;
}) {
  return (
    <div className={clsx("relative inline-block", className)}>
      <svg viewBox="0 0 400 110" preserveAspectRatio="none" className={clsx("absolute inset-0 h-full w-full", brushFill[tone])} aria-hidden>
        <path
          fill="currentColor"
          d="M10 34C36 18 92 20 150 16s150-8 204-2c18 2 30 6 38 14l-6 14 8 12-6 12 6 14c-10 14-40 18-92 20s-160 6-236 2c-30-2-50-6-58-16l8-12-8-12 6-12-8-8z"
        />
        <path fill="currentColor" opacity=".55" d="M24 22c40-10 110-10 170-12M40 96c80 6 200 4 300-2" stroke="currentColor" strokeWidth="3" />
        <circle cx="388" cy="20" r="3" fill="currentColor" opacity=".6" />
        <circle cx="12" cy="92" r="2.4" fill="currentColor" opacity=".6" />
        <circle cx="396" cy="84" r="1.8" fill="currentColor" opacity=".5" />
      </svg>
      <p className={clsx("script relative px-7 py-4 leading-snug", brushInk[tone], textClassName ?? "text-[1.25rem]")}>{children}</p>
    </div>
  );
}

/** A torn scrap of paper with a shadow; content on top. */
export function PaperScrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={clsx("relative bg-cream-50 px-6 py-5 shadow-paper", className)}
      style={{
        clipPath:
          "polygon(0% 6%, 4% 0%, 12% 4%, 22% 1%, 34% 5%, 47% 0%, 58% 4%, 70% 1%, 82% 5%, 93% 0%, 100% 5%, 98% 30%, 100% 55%, 97% 78%, 100% 96%, 90% 100%, 78% 96%, 64% 100%, 50% 96%, 37% 100%, 24% 96%, 12% 100%, 2% 96%, 0% 75%, 3% 50%, 0% 28%)",
      }}
    >
      {children}
    </div>
  );
}

/** A round post office cancellation mark with wavy lines. */
export function Postmark({ top = "INDIA", bottom = "ESTD", date = "2025", className }: { top?: string; bottom?: string; date?: string; className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 260 130" className={clsx("text-forest/75", className)} aria-hidden fill="none" stroke="currentColor">
      <defs>
        <path id={`${id}-t`} d="M20 65a45 45 0 0 1 90 0" />
        <path id={`${id}-b`} d="M18 65a47 47 0 0 0 94 0" />
      </defs>
      <circle cx="65" cy="65" r="58" strokeWidth="2.4" />
      <circle cx="65" cy="65" r="40" strokeWidth="1.2" />
      <text fill="currentColor" stroke="none" fontSize="15" fontWeight="700" letterSpacing="5" fontFamily="var(--font-hanken), sans-serif" textAnchor="middle">
        <textPath href={`#${id}-t`} startOffset="50%">
          {top}
        </textPath>
      </text>
      <text fill="currentColor" stroke="none" fontSize="13" fontWeight="700" letterSpacing="4" fontFamily="var(--font-hanken), sans-serif" textAnchor="middle" dy="12">
        <textPath href={`#${id}-b`} startOffset="50%">
          {bottom}
        </textPath>
      </text>
      <text x="65" y="72" fill="currentColor" stroke="none" fontSize="20" fontFamily="var(--font-fraunces), serif" textAnchor="middle">
        {date}
      </text>
      {[34, 50, 66, 82, 98].map((y) => (
        <path key={y} d={`M128 ${y}c14-8 28 8 42 0s28 8 42 0 28 8 42 0`} strokeWidth="2" strokeLinecap="round" />
      ))}
    </svg>
  );
}

/** Vintage compass rose. */
export function CompassRose({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={clsx("text-forest", className)} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="60" cy="60" r="34" />
        <circle cx="60" cy="60" r="30" strokeDasharray="1.5 3" />
      </g>
      <g fill="currentColor">
        <path d="M60 8l6 46-6 6-6-6z" />
        <path d="M60 112l-6-46 6-6 6 6z" opacity=".55" />
        <path d="M8 60l46-6 6 6-6 6z" opacity=".55" />
        <path d="M112 60l-46 6-6-6 6-6z" opacity=".55" />
        <path d="M24 24l32 30-2 2zM96 24L66 56l-2-2zM24 96l30-32 2 2zM96 96L64 66l2-2z" opacity=".4" />
      </g>
      <g fill="currentColor" fontFamily="var(--font-fraunces), serif" fontSize="11" textAnchor="middle">
        <text x="60" y="6">N</text>
        <text x="60" y="120">S</text>
        <text x="3" y="64">W</text>
        <text x="117" y="64">E</text>
      </g>
    </svg>
  );
}

/** Perforated postage stamp with the mark, as on the "From India to the world" spread. */
export function PostageStamp({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={clsx("relative bg-cream-50 p-[9px] drop-shadow-[0_6px_10px_rgb(29_26_22/0.22)]", className)}
      style={{
        // Grid of holes, unioned with a solid inner rectangle: holes survive only along the edges.
        WebkitMaskImage: "radial-gradient(circle, transparent 3px, #000 3.5px), linear-gradient(#000, #000)",
        WebkitMaskSize: "12px 12px, calc(100% - 12px) calc(100% - 12px)",
        WebkitMaskPosition: "-6px -6px, 6px 6px",
        WebkitMaskRepeat: "repeat, no-repeat",
        maskImage: "radial-gradient(circle, transparent 3px, #000 3.5px), linear-gradient(#000, #000)",
        maskSize: "12px 12px, calc(100% - 12px) calc(100% - 12px)",
        maskPosition: "-6px -6px, 6px 6px",
        maskRepeat: "repeat, no-repeat",
      }}
      aria-hidden
    >
      <div className="relative h-full w-full overflow-hidden border border-forest/20">{children}</div>
    </div>
  );
}
