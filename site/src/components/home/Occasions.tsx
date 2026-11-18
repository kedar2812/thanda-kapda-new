"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { LogoMark } from "@/components/ui/Logo";
import { IndustryPanel } from "@/components/IndustryPanel";
import { CmsImage } from "@/components/cms/CmsImage";
import { Rich } from "@/components/cms/Rich";
import { useContent } from "@/content/ContentProvider";

/**
 * "Where it belongs" as a stack of paper cards. Each card sticks below the
 * header while the next one slides over it; the card underneath eases back
 * and dims, like sheets being laid on a desk.
 */
export function Occasions() {
  const root = useRef<HTMLElement>(null);
  const o = useContent().home.occasions;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-stack-card]", root.current!);
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        gsap.to(card, {
          scale: 0.94,
          yPercent: -3,
          ease: "none",
          scrollTrigger: { trigger: next, start: "top bottom", end: "top top+=120", scrub: true },
        });
        // Darken the covered card with an overlay instead of fading it, so nothing shows through.
        gsap.fromTo(
          card.querySelector("[data-stack-shade]"),
          { opacity: 0 },
          { opacity: 0.55, ease: "none", scrollTrigger: { trigger: next, start: "top bottom", end: "top top+=120", scrub: true } },
        );
        // Image drifts a touch as the next card covers it.
        gsap.to(card.querySelector("[data-stack-img]"), {
          yPercent: -8,
          ease: "none",
          scrollTrigger: { trigger: next, start: "top bottom", end: "top top+=120", scrub: true },
        });
      });

      // Each card's copy rises as the card arrives.
      cards.forEach((card) => {
        gsap.fromTo(
          card.querySelectorAll("[data-stack-copy]"),
          { y: 26, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 75%", once: true } },
        );
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} data-cms="home.occasions" className="relative pb-8 pt-20 md:pb-10 md:pt-28" aria-labelledby="occasions-title">
      <div className="container-wide">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <Reveal>
              <p className="eyebrow text-gold">{o.eyebrow}</p>
            </Reveal>
            <SplitReveal as="h2" id="occasions-title" className="display-2 mt-6 text-forest">
              <Rich text={o.title} />
            </SplitReveal>
          </div>
          <Reveal delay={0.1}>
            <p className="script text-[1.35rem] text-ink/70 md:text-right">
              <Rich text={o.script} br="hidden md:block" />
            </p>
          </Reveal>
        </div>

        {/* Stack */}
        <div className="relative mt-16 md:mt-20">
          {o.scenes.map((s, i) => (
            <article
              key={i}
              data-stack-card
              className="sticky top-[5.5rem] mb-8 origin-top overflow-hidden rounded-md border border-ink/10 bg-cream-50 shadow-lift will-change-transform md:top-[6rem] md:mb-12"
              style={{ zIndex: i + 1 }}
            >
              <div className="grid md:grid-cols-12 md:min-h-[min(68vh,40rem)]">
                <div className="relative aspect-[4/3] overflow-hidden md:col-span-7 md:aspect-auto">
                  <div data-stack-img className="absolute inset-[-8%_0]">
                    <CmsImage image={s.image} sizes="(min-width: 768px) 58vw, 100vw" />
                  </div>
                  {s.wipe && (
                    <span className="absolute left-5 top-5 rounded-full bg-cream/90 px-3 py-1.5 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-forest backdrop-blur-sm">
                      {s.wipe}
                    </span>
                  )}
                </div>
                <div className="relative flex flex-col justify-between p-7 md:col-span-5 md:p-10 lg:p-12">
                  <div>
                    <p data-stack-copy className="font-display text-[3.2rem] leading-none text-gold/80 md:text-[4rem]">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 data-stack-copy className="display-3 mt-5 text-forest">
                      {s.title}
                    </h3>
                    <p data-stack-copy className="mt-4 font-display text-[1.25rem] leading-snug text-ink/80">
                      {s.line}
                    </p>
                    <p data-stack-copy className="mt-4 max-w-sm text-[0.95rem] text-ink/65">
                      {s.detail}
                    </p>
                  </div>
                  <div data-stack-copy className="mt-8 flex items-center justify-between border-t border-ink/10 pt-5">
                    <span className="eyebrow text-ink/45">{o.cardFooter}</span>
                    <LogoMark className="h-4 w-[1.15rem] text-forest/60" />
                  </div>
                </div>
              </div>
              <span data-stack-shade aria-hidden className="pointer-events-none absolute inset-0 bg-forest-deep opacity-0" />
            </article>
          ))}
        </div>

        {/* Industries */}
        <div className="mt-20 md:mt-28">
          <IndustryPanel />
        </div>
      </div>
    </section>
  );
}
