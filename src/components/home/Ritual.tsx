"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Flourish, LeafSprig, Stamp } from "@/components/ui/Ornaments";
import { Tag } from "@/components/ui/Tag";
import { Icon, type IconName } from "@/components/ui/Icons";
import { LogoMark } from "@/components/ui/Logo";
import { PaperScrap } from "@/components/ui/Paper";

type Snap = {
  src: string;
  alt: string;
  label: string;
  caption?: string;
  className: string;
  aspect: string;
  rotate: number;
  speed: number;
};

const snaps: Snap[] = [
  {
    src: "/products/morning-spring-table.jpg",
    alt: "Morning Spring sachet set at a wedding place setting",
    label: "No. 01",
    className: "left-0 top-0 w-[58%]",
    aspect: "aspect-[4/3]",
    rotate: -3,
    speed: -6,
  },
  {
    src: "/products/namaste-plate.jpg",
    alt: "Namasté sachets fanned on a ceramic plate",
    label: "No. 02",
    className: "right-0 top-[6%] w-[40%]",
    aspect: "aspect-[4/5]",
    rotate: 4,
    speed: -14,
  },
  {
    src: "/products/morning-spring-box.jpg",
    alt: "An open case of one hundred Morning Spring sachets",
    label: "Est. 2025",
    className: "left-[4%] top-[50%] w-[46%]",
    aspect: "aspect-[4/3]",
    rotate: 2.5,
    speed: -10,
  },
  {
    src: "/products/namaste-cafe.jpg",
    alt: "Namasté sachet on a café table",
    label: "Cafés",
    className: "right-[2%] top-[56%] w-[46%]",
    aspect: "aspect-square",
    rotate: -2,
    speed: -18,
  },
];

const moments: { when: string; text: string; icon: IconName }[] = [
  { when: "The gesture", text: "A cold, damp cloth for a guest. The oldest welcome in India.", icon: "handsHeart" },
  { when: "The idea", text: "Fold that gesture into a clean, sealed sachet.", icon: "bulb" },
  { when: "2025", text: "Thanda Kapda Co. is born. Morning Spring reaches homes across India.", icon: "seedling" },
];

export function Ritual() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      if (prefersReducedMotion()) return;
      const board = q("[data-board]")[0];

      // Photos are dropped onto the desk one by one…
      gsap.fromTo(
        q("[data-snap]"),
        { autoAlpha: 0, y: -60, scale: 1.12, rotate: (i) => (snaps[i].rotate > 0 ? 14 : -14) },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          rotate: (i) => snaps[i].rotate,
          duration: 1.1,
          stagger: 0.16,
          ease: "power3.out",
          scrollTrigger: { trigger: board, start: "top 75%", once: true },
        },
      );
      // …tape is slapped on…
      gsap.fromTo(
        q("[data-snap-tape]"),
        { autoAlpha: 0, scale: 1.6 },
        { autoAlpha: 1, scale: 1, duration: 0.45, stagger: 0.16, ease: "back.out(2)", delay: 0.6, scrollTrigger: { trigger: board, start: "top 75%", once: true } },
      );
      // …then each drifts at its own depth as you scroll.
      q<HTMLElement>("[data-snap-drift]").forEach((el, i) => {
        gsap.to(el, { yPercent: snaps[i].speed, ease: "none", scrollTrigger: { trigger: board, start: "top bottom", end: "bottom top", scrub: 0.6 } });
      });
      gsap.fromTo(
        q("[data-note]"),
        { autoAlpha: 0, scale: 0.8 },
        { autoAlpha: 1, scale: 1, duration: 0.8, stagger: 0.25, ease: "back.out(1.6)", delay: 0.9, scrollTrigger: { trigger: board, start: "top 70%", once: true } },
      );
      gsap.fromTo(
        q("[data-tag]"),
        { autoAlpha: 0, y: -80, rotate: -20 },
        { autoAlpha: 1, y: 0, rotate: -6, duration: 1.6, ease: "elastic.out(1, 0.5)", scrollTrigger: { trigger: board, start: "top 70%", once: true } },
      );

      // Mini timeline: the line draws, the dots pop.
      const line = q("[data-moments]")[0];
      gsap.fromTo(q("[data-moment-line]"), { scaleX: 0 }, { scaleX: 1, ease: "none", transformOrigin: "left", scrollTrigger: { trigger: line, start: "top 85%", end: "top 55%", scrub: 0.5 } });
      gsap.fromTo(q("[data-moment-dot]"), { scale: 0 }, { scale: 1, duration: 0.5, stagger: 0.2, ease: "back.out(3)", scrollTrigger: { trigger: line, start: "top 80%", once: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden py-24 md:py-32" aria-labelledby="ritual-title">
      <LeafSprig className="pointer-events-none absolute -left-16 top-16 h-[30rem] w-auto text-forest/[0.07]" />

      <div className="container-wide">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          {/* Copy page */}
          <div className="relative lg:col-span-5 lg:pr-6">
            <Reveal>
              <p className="eyebrow border-b border-gold/50 pb-2 text-gold [width:fit-content]">Our origins</p>
            </Reveal>
            <SplitReveal as="h2" id="ritual-title" className="display-1 mt-8 uppercase text-forest" stagger={0.1}>
              How it all began
            </SplitReveal>
            <Reveal delay={0.1}>
              <Flourish className="mt-8" />
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-8 font-sans text-[0.82rem] font-bold uppercase leading-relaxed tracking-[0.12em] text-ink/80">
                Some brands are built in boardrooms.
                <br />
                <span className="text-forest">Ours began with a damp cloth.</span>
              </p>
            </Reveal>

            <div className="mt-6 max-w-lg space-y-5 text-[1rem] leading-relaxed text-ink/75">
              <SplitReveal stagger={0.05} duration={1}>
                A damp cloth on a feverish forehead. A cold towel handed over the moment you step in from the heat. A
                quick wipe passed around the table when the meal is done. Nobody taught us this. It was simply how care
                looked.
              </SplitReveal>
              <SplitReveal stagger={0.05} duration={1}>
                Thanda Kapda Co. began with that gesture. We wanted the same cool relief without the bowl of water,
                folded small enough for a pocket and clean enough to hand to a stranger: soaked in aloe, sealed one at a
                time, and free of the alcohol that leaves skin tight.
              </SplitReveal>
            </div>

            <div className="mt-10 flex items-center gap-6">
              <Stamp text="BORN IN INDIA · MADE FOR THE WORLD · " tone="cream" className="w-28 shrink-0 rounded-full bg-forest">
                <LogoMark className="h-8 w-9 text-cream" />
              </Stamp>
              <p className="script -rotate-3 text-[1.5rem] leading-tight text-forest/85">
                From India to the world,
                <br />
                our story continues…
              </p>
            </div>
          </div>

          {/* Scrapbook board */}
          <div className="relative lg:col-span-7">
            <div data-board className="relative mx-auto aspect-[5/6] w-full max-w-[44rem] sm:aspect-[6/5]">
              {snaps.map((s) => (
                <figure key={s.src} data-snap className={`polaroid absolute ${s.className}`} style={{ transform: `rotate(${s.rotate}deg)` }}>
                  <div data-snap-drift>
                    <span data-snap-tape className="absolute -top-4 right-4 z-10 rotate-[4deg] bg-cream-200/95 px-4 py-1 font-display text-[1.05rem] italic text-forest shadow-[0_1px_2px_rgb(29_26_22/0.15)]">
                      {s.label}
                    </span>
                    <div className={`relative overflow-hidden ${s.aspect}`}>
                      <Image src={s.src} alt={s.alt} fill sizes="(min-width: 1024px) 26vw, 50vw" className="object-cover" />
                    </div>
                  </div>
                </figure>
              ))}

              {/* Handwritten notes */}
              <div data-note className="absolute left-[34%] top-[38%] z-20 w-[42%] -rotate-3 sm:left-[30%] sm:top-[40%] sm:w-[36%]">
                <PaperScrap className="!px-5 !py-4">
                  <span aria-hidden className="absolute right-3 top-2 h-3 w-3 rounded-full bg-gradient-to-br from-[#e9c57a] to-[#8f6a24] shadow" />
                  <p className="script text-[1.05rem] leading-tight text-forest sm:text-[1.2rem]">
                    Thoughtful hygiene.
                    <br />
                    Handcrafted care.
                  </p>
                </PaperScrap>
              </div>
              <div data-note className="absolute bottom-[-2%] right-[6%] z-20 w-[38%] rotate-2 sm:w-[32%]">
                <PaperScrap className="!px-5 !py-4">
                  <p className="script text-[1.05rem] leading-tight text-forest sm:text-[1.2rem]">
                    Built on care.
                    <br />
                    Driven by purpose.
                  </p>
                </PaperScrap>
              </div>

              {/* Luggage tag */}
              <div data-tag className="absolute -left-4 top-[30%] z-30 hidden sm:block lg:-left-16" style={{ transformOrigin: "50% -3rem" }}>
                <Tag place="India" title="Where it all began." text="A country that greets its guests with a cool cloth." className="w-36" />
              </div>
            </div>
          </div>
        </div>

        {/* Mini timeline */}
        <div data-moments className="relative mt-16 md:mt-20">
          <span aria-hidden className="absolute left-0 right-0 top-[1.05rem] h-px bg-gold/20" />
          <span data-moment-line aria-hidden className="absolute left-0 right-0 top-[1.05rem] h-px bg-gold" />
          <ol className="relative grid gap-10 sm:grid-cols-3">
            {moments.map((m) => (
              <li key={m.when} className="relative pt-10">
                <span data-moment-dot aria-hidden className="absolute left-0 top-[0.7rem] h-3 w-3 rounded-full border-2 border-cream bg-gold shadow-[0_0_0_1px_var(--color-gold)]" />
                <div className="flex gap-4">
                  <Icon name={m.icon} className="h-10 w-10 shrink-0 text-forest" />
                  <div>
                    <p className="font-display text-[1.5rem] leading-none text-forest">{m.when}</p>
                    <p className="mt-2 max-w-xs text-[0.9rem] text-ink/70">{m.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
