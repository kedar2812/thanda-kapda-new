"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Flourish } from "@/components/ui/Ornaments";

type Item = {
  name: string;
  latin: string;
  note: string;
  found: string;
  icon: React.ReactNode;
};

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const items: Item[] = [
  {
    name: "Aloe vera",
    latin: "Aloe barbadensis leaf extract",
    note: "The base of every wipe. Cools on contact and leaves nothing behind but skin that feels like itself.",
    found: "In both wipes",
    icon: (
      <svg viewBox="0 0 64 64" {...stroke}>
        <path d="M32 58C30 40 28 24 32 6c4 18 2 34 0 52Z" />
        <path d="M30 56C22 44 12 34 8 18c12 8 20 22 22 38Z" />
        <path d="M34 56c8-12 18-22 22-38-12 8-20 22-22 38Z" />
        <path d="M26 58C18 52 10 46 6 36c10 4 16 12 20 22Z" />
        <path d="M38 58c8-6 16-12 20-22-10 4-16 12-20 22Z" />
      </svg>
    ),
  },
  {
    name: "Centella asiatica",
    latin: "Gotu kola",
    note: "A staple of Indian herbal care for generations. Calms skin that has spent the afternoon in the sun.",
    found: "In Namasté",
    icon: (
      <svg viewBox="0 0 64 64" {...stroke}>
        <path d="M32 60V34" />
        <path d="M32 34c-14 2-24-8-24-20 14-2 24 8 24 20Z" />
        <path d="M32 34c14 2 24-8 24-20-14-2-24 8-24 20Z" />
        <path d="M12 18c8 4 14 8 20 16M52 18c-8 4-14 8-20 16" opacity=".5" />
      </svg>
    ),
  },
  {
    name: "Vitamin E",
    latin: "Tocopherol",
    note: "Keeps the sheet properly moist until the seal is broken and leaves skin soft, never squeaky.",
    found: "In Morning Spring",
    icon: (
      <svg viewBox="0 0 64 64" {...stroke}>
        <path d="M32 6c10 14 18 24 18 34a18 18 0 0 1-36 0c0-10 8-20 18-34Z" />
        <path d="M22 40a10 10 0 0 0 10 10" opacity=".5" />
      </svg>
    ),
  },
  {
    name: "Lemongrass",
    latin: "Cymbopogon",
    note: "The clean, citrus scent of a Namasté wipe. Bright enough to notice, quiet enough for the dinner table.",
    found: "In Namasté",
    icon: (
      <svg viewBox="0 0 64 64" {...stroke}>
        <path d="M32 60c-2-22 0-40 4-54" />
        <path d="M32 60c-8-18-12-32-10-48" />
        <path d="M32 60c6-18 12-30 20-40" />
        <path d="M32 60c-14-10-22-22-24-36" opacity=".5" />
        <path d="M32 60c14-8 20-18 26-30" opacity=".5" />
      </svg>
    ),
  },
  {
    name: "Menthol",
    latin: "From peppermint",
    note: "A small amount, for the thanda in Thanda Kapda. A drop in temperature you feel in the first second.",
    found: "In Namasté",
    icon: (
      <svg viewBox="0 0 64 64" {...stroke}>
        <path d="M32 6v52M8 32h48M15 15l34 34M49 15 15 49" />
        <path d="M32 6l-5 6M32 6l5 6M32 58l-5-6M32 58l5-6M8 32l6-5M8 32l6 5M56 32l-6-5M56 32l-6 5" />
      </svg>
    ),
  },
];

export function Inside() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const pinArea = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const mm = gsap.matchMedia();

      // Desktop: pin the section and pull the panels across as you scroll.
      mm.add("(min-width: 1024px)", () => {
        const t = track.current;
        const area = pinArea.current;
        if (!t || !area) return;
        const distance = () => t.scrollWidth - area.clientWidth;
        const tween = gsap.to(t, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: area,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // Each panel's icon drifts in a touch after the panel itself.
        gsap.utils.toArray<HTMLElement>("[data-inside-panel]", t).forEach((panel) => {
          const icon = panel.querySelector("[data-inside-icon]");
          if (!icon) return;
          gsap.fromTo(
            icon,
            { y: 30, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 1,
              scrollTrigger: { trigger: panel, containerAnimation: tween, start: "left 85%", once: true },
            },
          );
        });
      });

      // Everyone: the "not inside" strike-throughs draw in.
      gsap.utils.toArray<HTMLElement>("[data-strike]", root.current!).forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0 },
          { scaleX: 1, duration: 1.1, ease: "power4.inOut", scrollTrigger: { trigger: el, start: "top 80%", once: true } },
        );
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative" aria-labelledby="inside-title">
      <div className="container-wide pt-24 md:pt-36">
        <Reveal>
          <p className="eyebrow text-gold">What&rsquo;s inside</p>
        </Reveal>
        <SplitReveal as="h2" id="inside-title" className="display-2 mt-6 max-w-4xl text-forest">
          Soaked in things you would recognise.
        </SplitReveal>
        <Reveal delay={0.1} className="mt-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-lg text-ink/70">
            Short ingredient lists, printed in full on every product page. This is what does the work.
          </p>
          <p className="eyebrow hidden text-ink/40 lg:block">Scroll to move across →</p>
        </Reveal>
      </div>

      {/* Horizontal track: pinned and scrubbed on desktop, swipeable on phones. */}
      <div ref={pinArea} className="mt-14 flex flex-col justify-center lg:h-[100svh] lg:overflow-hidden">
        <div
          ref={track}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-[clamp(1.25rem,4vw,4rem)] pb-6 [scrollbar-width:none] lg:snap-none lg:gap-8 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {items.map((it, i) => (
            <article
              key={it.name}
              data-inside-panel
              className="paper-aged relative flex w-[78vw] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-md p-7 shadow-paper sm:w-[52vw] lg:h-[62vh] lg:min-h-[26rem] lg:w-[34vw] lg:min-w-[22rem] lg:p-9"
            >
              <span aria-hidden className="pointer-events-none absolute -right-2 -top-6 font-display text-[9rem] leading-none text-forest/[0.06] lg:text-[12rem]">
                0{i + 1}
              </span>
              <div className="relative flex items-start justify-between">
                <span className="eyebrow text-ink/45">No. 0{i + 1}</span>
                <span className="rounded-full border border-forest/25 bg-cream-50/50 px-3 py-1 text-[0.62rem] uppercase tracking-[0.18em] text-forest">
                  {it.found}
                </span>
              </div>
              <div data-inside-icon className="relative my-10 flex h-32 w-32 items-center justify-center rounded-full border border-gold/50 lg:my-0 lg:h-40 lg:w-40">
                <span aria-hidden className="absolute inset-2 rounded-full border border-dashed border-gold/35" />
                <span className="h-16 w-16 text-forest lg:h-20 lg:w-20">{it.icon}</span>
              </div>
              <div>
                <h3 className="display-3 text-forest">{it.name}</h3>
                <p className="script mt-2 text-[1.1rem] text-gold">{it.latin}</p>
                <p className="mt-4 text-ink/75">{it.note}</p>
              </div>
            </article>
          ))}

          {/* End card: what is not inside */}
          <article
            data-inside-panel
            className="parchment-dark relative flex w-[78vw] shrink-0 snap-start flex-col justify-between rounded-md p-7 text-cream sm:w-[52vw] lg:h-[62vh] lg:min-h-[26rem] lg:w-[34vw] lg:min-w-[22rem] lg:p-9"
          >
            <span className="eyebrow text-gold-light">And what is not</span>
            <div className="my-10 space-y-6 lg:my-0">
              {[
                { word: "Alcohol", why: "It evaporates fast and takes your skin's moisture with it. That tight, stinging finish is the alcohol, not the clean." },
                { word: "Parabens", why: "We preserve with gentler compounds so the sheet stays fresh without them." },
              ].map((x) => (
                <div key={x.word}>
                  <p className="relative inline-block font-display text-[2.6rem] leading-none lg:text-[3.2rem]">
                    {x.word}
                    <span
                      data-strike
                      aria-hidden
                      className="absolute left-0 top-1/2 h-[3px] w-full origin-left -translate-y-1/2 bg-gold-light"
                    />
                  </p>
                  <p className="mt-2 max-w-sm text-[0.95rem] text-cream/70">{x.why}</p>
                </div>
              ))}
            </div>
            <p className="eyebrow text-cream/50">pH neutral · Cruelty-free · Non-woven, skin-safe sheet</p>
          </article>
        </div>
      </div>

      <div className="container-wide pb-6 pt-6 md:pb-12 md:pt-10">
        <Reveal>
          <Flourish className="mx-auto justify-center" />
        </Reveal>
      </div>
    </section>
  );
}
