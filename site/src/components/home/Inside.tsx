"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Flourish } from "@/components/ui/Ornaments";
import { Icon } from "@/components/ui/Icons";
import { Rich } from "@/components/cms/Rich";
import { useContent } from "@/content/ContentProvider";

export function Inside() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const pinArea = useRef<HTMLDivElement>(null);
  const n = useContent().home.inside;

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
    <section ref={root} data-cms="home.inside" className="relative" aria-labelledby="inside-title">
      <div className="container-wide pt-24 md:pt-36">
        <Reveal>
          <p className="eyebrow text-gold">{n.eyebrow}</p>
        </Reveal>
        <SplitReveal as="h2" id="inside-title" className="display-2 mt-6 max-w-4xl text-forest">
          <Rich text={n.title} />
        </SplitReveal>
        <Reveal delay={0.1} className="mt-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-lg text-ink/70">{n.intro}</p>
          <p className="eyebrow hidden text-ink/40 lg:block">{n.hint}</p>
        </Reveal>
      </div>

      {/* Horizontal track: pinned and scrubbed on desktop, swipeable on phones. */}
      <div ref={pinArea} className="mt-14 flex flex-col justify-center lg:h-[100svh] lg:overflow-hidden">
        <div
          ref={track}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-[clamp(1.25rem,4vw,4rem)] pb-6 [scrollbar-width:none] lg:snap-none lg:gap-8 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {n.items.map((it, i) => (
            <article
              key={i}
              data-inside-panel
              className="paper-aged relative flex w-[78vw] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-md p-7 shadow-paper sm:w-[52vw] lg:h-[62vh] lg:min-h-[26rem] lg:w-[34vw] lg:min-w-[22rem] lg:p-9"
            >
              <span aria-hidden className="pointer-events-none absolute -right-2 -top-6 font-display text-[9rem] leading-none text-forest/[0.06] lg:text-[12rem]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="relative flex items-start justify-between">
                <span className="eyebrow text-ink/45">No. {String(i + 1).padStart(2, "0")}</span>
                <span className="rounded-full border border-forest/25 bg-cream-50/50 px-3 py-1 text-[0.62rem] uppercase tracking-[0.18em] text-forest">
                  {it.found}
                </span>
              </div>
              <div data-inside-icon className="relative my-10 flex h-32 w-32 items-center justify-center rounded-full border border-gold/50 lg:my-0 lg:h-40 lg:w-40">
                <span aria-hidden className="absolute inset-2 rounded-full border border-dashed border-gold/35" />
                <Icon name={it.icon} className="h-16 w-16 text-forest lg:h-20 lg:w-20" />
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
            <span className="eyebrow text-gold-light">{n.notEyebrow}</span>
            <div className="my-10 space-y-6 lg:my-0">
              {n.notItems.map((x, i) => (
                <div key={i}>
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
            <p className="eyebrow text-cream/50">{n.notFootnote}</p>
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
