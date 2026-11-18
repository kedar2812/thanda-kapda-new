"use client";

import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Flourish } from "@/components/ui/Ornaments";
import { Rich } from "@/components/cms/Rich";
import { fill } from "@/content";
import { useContent } from "@/content/ContentProvider";
import { amazonRating } from "./Hero";

export function Proof() {
  const c = useContent();
  const p = c.home.proof;
  const totalRatings = c.products.reduce((n, x) => n + x.rating.count, 0);
  const rating = amazonRating(c);
  return (
    <section data-cms="home.proof" className="relative overflow-hidden py-24 md:py-36" aria-labelledby="proof-title">
      <div className="container-wide">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow text-gold">{p.eyebrow}</p>
          </Reveal>
          {rating > 0 && (
            <Reveal delay={0.1} className="mt-8 flex items-end justify-center gap-4">
              <span className="font-display text-[6rem] leading-[0.85] text-forest md:text-[8.5rem]">{rating.toFixed(1)}</span>
              <span className="mb-2 flex flex-col items-start gap-2">
                <span className="flex gap-1 text-gold" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden>
                      <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
                    </svg>
                  ))}
                </span>
                <span className="eyebrow text-left text-ink/55">
                  {p.ratingNote}
                  <br />
                  {fill(p.ratingSummary, { count: totalRatings })}
                </span>
              </span>
            </Reveal>
          )}
          <SplitReveal as="h2" id="proof-title" className="display-3 mt-10 text-forest" stagger={0.07}>
            <Rich text={p.title} />
          </SplitReveal>
          <Reveal delay={0.15}>
            <Flourish className="mx-auto mt-8 justify-center" />
          </Reveal>
        </div>

        <Reveal stagger={0.1} y={40} className="mt-16 grid gap-6 md:grid-cols-3">
          {p.mentions.map((m, i) => (
            <blockquote
              key={i}
              className="relative rounded-md border border-ink/10 bg-cream-50/70 p-8 shadow-paper"
              style={{ rotate: `${[-1.2, 0.6, -0.8][i % 3]}deg` }}
            >
              <span className="tape -top-2 left-1/2 -translate-x-1/2 rotate-[-2deg]" aria-hidden />
              <p className="font-display text-[1.7rem] leading-tight text-forest">&ldquo;{m.quote}&rdquo;</p>
              <p className="mt-4 text-[0.95rem] text-ink/70">{m.detail}</p>
            </blockquote>
          ))}
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-8 text-center text-[0.75rem] uppercase tracking-[0.16em] text-ink/40">{p.footnote}</p>
        </Reveal>
      </div>
    </section>
  );
}
