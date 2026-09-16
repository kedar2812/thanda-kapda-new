import clsx from "clsx";
import Link from "next/link";

const maskStyle: React.CSSProperties = {
  WebkitMaskImage: "url(/logo-mark.png)",
  maskImage: "url(/logo-mark.png)",
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
  aspectRatio: "533 / 468",
};

/** The folded-cloth-and-droplet mark, recoloured with currentColor. */
export function LogoMark({ className }: { className?: string }) {
  return <span aria-hidden className={clsx("inline-block bg-current", className)} style={maskStyle} />;
}

/** Mark plus the stacked wordmark, exactly as it appears on the sachets. */
export function Logo({
  className,
  href = "/",
  tone = "ink",
  compact = false,
}: {
  className?: string;
  href?: string;
  tone?: "ink" | "cream";
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label="Thanda Kapda Co. home"
      className={clsx(
        "group inline-flex items-center gap-3",
        tone === "cream" ? "text-cream" : "text-forest",
        className,
      )}
    >
      <LogoMark className="h-8 w-9 transition-transform duration-700 ease-out-expo group-hover:-rotate-6" />
      <span className="flex flex-col leading-none">
        <span className="font-sans text-[0.92rem] font-bold uppercase tracking-[0.14em]">
          Thanda
          <br />
          Kapda Co.
        </span>
        {!compact && (
          <span className="mt-1.5 font-sans text-[0.5rem] font-semibold uppercase tracking-[0.26em] opacity-70">
            Essence of pure indulgence
          </span>
        )}
      </span>
    </Link>
  );
}
