import clsx from "clsx";

/**
 * Endless ticker. The row is repeated four times and the track slides by
 * half its width, so the loop is seamless on any screen up to ~2× the width
 * of two rows.
 */
export function Marquee({
  items,
  className,
  duration = 46,
  tone = "ink",
}: {
  items: string[];
  className?: string;
  duration?: number;
  tone?: "ink" | "cream";
}) {
  const row = [...items, ...items, ...items, ...items];
  return (
    <div
      className={clsx("marquee select-none", tone === "cream" ? "text-cream" : "text-ink", className)}
      style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
      role="marquee"
      aria-label={items.join(", ")}
    >
      <div className="marquee-track items-center" aria-hidden>
        {row.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="eyebrow whitespace-nowrap px-6 py-4 opacity-90 md:px-10">{item}</span>
            <svg viewBox="0 0 12 12" className="h-2 w-2 text-gold" fill="currentColor" aria-hidden>
              <path d="M6 0l1.6 4.4L12 6l-4.4 1.6L6 12 4.4 7.6 0 6l4.4-1.6z" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
