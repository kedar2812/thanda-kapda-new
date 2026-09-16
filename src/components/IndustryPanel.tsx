"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Icon } from "@/components/ui/Icons";
import { PaperScrap } from "@/components/ui/Paper";
import { TornPanel } from "@/components/ui/TornPanel";
import { industries } from "@/data/industries";

/** C05 "Perfect for every industry": a framed green panel, gold icon grid and a torn photo edge. */
export function IndustryPanel() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      if (prefersReducedMotion()) return;
      const st = { trigger: root.current, start: "top 70%", once: true };
      gsap.fromTo(q("[data-ind]"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: { each: 0.05, grid: "auto", from: "start" }, ease: "power3.out", scrollTrigger: st });
      gsap.fromTo(q("[data-ind-rule]"), { scaleX: 0 }, { scaleX: 1, duration: 1.2, stagger: 0.15, ease: "power3.inOut", transformOrigin: "left", scrollTrigger: st });
      gsap.fromTo(q("[data-ind-note]"), { autoAlpha: 0, rotate: -12, scale: 0.8 }, { autoAlpha: 1, rotate: -3, scale: 1, duration: 1, ease: "back.out(1.7)", delay: 0.3, scrollTrigger: st });
      gsap.fromTo(q("[data-ind-photo]"), { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6 } });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="frame-double parchment-dark relative overflow-hidden rounded-md text-cream shadow-lift">
      <div className="grid lg:grid-cols-12">
        <div className="relative z-10 px-8 pb-12 pt-14 sm:px-12 lg:col-span-8 lg:py-16 lg:pl-16">
          <SplitReveal as="h3" className="display-2 uppercase text-cream" stagger={0.1}>
            Perfect for every <span className="text-gold-light">industry</span>
          </SplitReveal>
          <span data-ind-rule aria-hidden className="mt-6 block h-px w-40 bg-gold-light/60" />

          <div data-ind-note className="mt-8 w-full max-w-sm">
            <PaperScrap>
              <p className="script text-[1.35rem] leading-snug text-forest">
                Wherever there is an experience, there is true class in the details.
              </p>
            </PaperScrap>
          </div>

          <ul className="mt-12 grid grid-cols-3 sm:grid-cols-4">
            {industries.map((it, i) => (
              <li
                key={it.label}
                data-ind
                className={`flex flex-col items-center gap-3 border-gold-light/20 px-2 py-5 text-center ${(i + 1) % 4 !== 0 ? "sm:border-r" : ""} ${(i + 1) % 3 !== 0 ? "max-sm:border-r" : ""} ${i < industries.length - 4 ? "sm:border-b" : ""} ${i < industries.length - 3 ? "max-sm:border-b" : ""}`}
              >
                <Icon name={it.icon} className="h-10 w-10 text-gold-light" />
                <span className="font-display text-[0.95rem] text-cream/90">{it.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative min-h-[18rem] lg:col-span-4">
          <div data-ind-photo className="absolute inset-0">
            <Image src="/products/morning-spring-table.jpg" alt="A candle-lit banquet table set with a Morning Spring sachet" fill sizes="(min-width: 1024px) 34vw, 100vw" className="object-cover" />
          </div>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-forest/40 to-transparent" />
          {/* Torn edge where the green panel meets the photograph */}
          <TornPanel side="right" seed={61} amplitude={0.18} color="bg-forest" under="bg-transparent" className="absolute inset-y-0 -left-px hidden w-16 lg:block" />
          <TornPanel side="bottom" seed={63} amplitude={0.25} color="bg-forest" under="bg-transparent" className="absolute inset-x-0 -top-px h-8 lg:hidden" />
        </div>
      </div>
    </div>
  );
}
