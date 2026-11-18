import clsx from "clsx";
import { Icon } from "@/components/ui/Icons";

/**
 * A hanging luggage tag in forest green, tied with a cream cord, as on the
 * "How it all began" spread. Content is free; a place line is the default.
 */
export function Tag({
  place = "India",
  title = "Where it all began.",
  text = "A cool cloth for a guest is the oldest welcome we know.",
  className,
}: {
  place?: string;
  title?: string;
  text?: string;
  className?: string;
}) {
  return (
    <div className={clsx("relative w-40", className)}>
      {/* cord + tape */}
      <svg viewBox="0 0 160 60" className="absolute -top-12 left-0 h-14 w-full text-cream-200" aria-hidden fill="none">
        <path d="M80 58c-10-16-14-30-6-44 6-10 18-10 20 0" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-[-4deg]" aria-hidden />
      <div className="parchment-dark relative rounded-md px-5 pb-6 pt-8 text-cream shadow-lift">
        <span className="absolute left-1/2 top-3 h-3 w-3 -translate-x-1/2 rounded-full border border-gold-light/70 bg-cream" aria-hidden />
        <p className="eyebrow flex items-center gap-2 text-cream">
          <Icon name="pin" className="h-4 w-4 text-gold-light" />
          {place}
        </p>
        <span className="rule-gold my-4 block" />
        <svg viewBox="0 0 120 70" className="h-16 w-full text-gold-light" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
          <path d="M10 66h100M20 66V40h80v26M20 40l40-24 40 24M45 66V50h30v16M60 16v-8M56 10h8" />
          <path d="M30 40v-8M40 40v-8M80 40v-8M90 40v-8" opacity=".6" />
        </svg>
        <p className="mt-4 text-[0.9rem] leading-snug text-cream/80">{text}</p>
        <p className="mt-4 font-sans text-[0.78rem] font-bold uppercase tracking-[0.16em] text-gold-light">{title}</p>
      </div>
    </div>
  );
}
