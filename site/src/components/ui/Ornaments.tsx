import clsx from "clsx";
import { useId } from "react";

/** A hand-drawn sprig of leaves on a curving stem. */
export function LeafSprig({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx(className, flip && "-scale-x-100")}
    >
      <path d="M60 196C58 150 50 96 66 42 72 24 84 12 100 4" />
      <path d="M62 150c-20-4-38-18-44-42 20-2 38 10 44 42Z" />
      <path d="M64 118c18-10 28-30 24-54-18 6-30 26-24 54Z" />
      <path d="M60 92C42 86 30 70 30 48c16 4 28 20 30 44Z" />
      <path d="M68 66c14-14 18-34 10-54-14 10-20 32-10 54Z" />
      <path d="M58 150c-4-10-12-18-24-24M64 118c10-6 16-16 18-28M60 92c-6-6-12-16-14-26M68 66c4-8 8-18 8-28" opacity="0.55" />
    </svg>
  );
}

/** A small eight-petal flower with hairlines, used as a section divider. */
export function Flourish({ className }: { className?: string }) {
  return (
    <div aria-hidden className={clsx("flex items-center gap-4 text-gold", className)}>
      <span className="rule-gold h-px w-16" />
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle cx="12" cy="12" r="2" />
        <path d="M12 2c2 3 2 6 0 8-2-2-2-5 0-8ZM12 22c-2-3-2-6 0-8 2 2 2 5 0 8ZM2 12c3-2 6-2 8 0-2 2-5 2-8 0ZM22 12c-3 2-6 2-8 0 2-2 5-2 8 0ZM5 5c3.5.7 5.7 2.9 6.4 6.4C7.9 10.7 5.7 8.5 5 5ZM19 5c-.7 3.5-2.9 5.7-6.4 6.4.7-3.5 2.9-5.7 6.4-6.4ZM5 19c.7-3.5 2.9-5.7 6.4-6.4-.7 3.5-2.9 5.7-6.4 6.4ZM19 19c-3.5-.7-5.7-2.9-6.4-6.4 3.5.7 5.7 2.9 6.4 6.4Z" />
      </svg>
      <span className="rule-gold h-px w-16" />
    </div>
  );
}

/**
 * A round rubber stamp with text running around the rim. Pass children for
 * the centre (a mark, a year). Rotation is handled by the parent.
 */
export function Stamp({
  text,
  className,
  children,
  tone = "forest",
}: {
  text: string;
  className?: string;
  children?: React.ReactNode;
  tone?: "forest" | "cream" | "gold";
}) {
  const id = useId();
  const color = tone === "cream" ? "text-cream" : tone === "gold" ? "text-gold" : "text-forest";
  const positioned = /\b(absolute|fixed|sticky)\b/.test(className ?? "");
  return (
    <div className={clsx(!positioned && "relative", "aspect-square", color, className)}>
      <svg viewBox="0 0 200 200" className="spin-slow absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <path id={id} d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
        </defs>
        <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1.5 3" />
        <text
          fill="currentColor"
          fontSize="13.5"
          fontWeight="600"
          letterSpacing="3.4"
          fontFamily="var(--font-hanken), sans-serif"
        >
          <textPath href={`#${id}`} startOffset="0">
            {text}
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/** A postage-stamp frame: perforated outer edge, paper inner mat. */
export function Postage({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={clsx("relative bg-cream-50 p-[7px] shadow-paper", className)}
      style={{
        backgroundImage:
          "radial-gradient(circle, var(--color-cream) 3.2px, transparent 3.6px)",
        backgroundSize: "14px 14px",
        backgroundPosition: "-7px -7px",
      }}
    >
      <div className="relative bg-cream-50 p-1.5">{children}</div>
    </div>
  );
}

/** A small hand-drawn "sun" used as a bullet or accent. */
export function Sun({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="12" cy="12" r="5" />
    </svg>
  );
}
