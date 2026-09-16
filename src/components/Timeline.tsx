"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Icon, type IconName } from "@/components/ui/Icons";

const milestones: { when: string; title: string; text: string; icon: IconName }[] = [
  { when: "The idea", title: "Blueprint", text: "India's cold-cloth welcome, folded into a sealed sachet.", icon: "bulb" },
  { when: "2025", title: "Morning Spring", text: "The first sachet, aloe and vitamin E, goes on sale across India.", icon: "flask" },
  { when: "Then", title: "Namasté", text: "The after-meal wipe: lemongrass, aloe and centella, for the end of a meal.", icon: "cloche" },
  { when: "Now", title: "Custom printing", text: "Hospitality partners put their own names on the sachet.", icon: "gift" },
  { when: "Next", title: "Beyond borders", text: "Distributors in the Middle East, Africa, Europe and Southeast Asia.", icon: "globePlane" },
];

/** Vertical journey timeline; the spine draws as you scroll and each dot lights up in turn. */
export function Timeline() {
  const root = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || prefersReducedMotion()) return;
      gsap.fromTo(
        el.querySelector("[data-spine]"),
        { scaleY: 0 },
        { scaleY: 1, ease: "none", transformOrigin: "top", scrollTrigger: { trigger: el, start: "top 75%", end: "bottom 60%", scrub: 0.4 } },
      );
      gsap.utils.toArray<HTMLElement>("[data-milestone]", el).forEach((m) => {
        gsap.fromTo(
          m,
          { autoAlpha: 0, x: -18 },
          { autoAlpha: 1, x: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: m, start: "top 78%", once: true } },
        );
        gsap.fromTo(
          m.querySelector("[data-dot]"),
          { scale: 0 },
          { scale: 1, duration: 0.6, ease: "back.out(2)", scrollTrigger: { trigger: m, start: "top 78%", once: true } },
        );
      });
    },
    { scope: root },
  );

  return (
    <ol ref={root} className="relative pl-10">
      <span aria-hidden className="absolute bottom-3 left-[7px] top-3 w-px bg-ink/15" />
      <span data-spine aria-hidden className="absolute bottom-3 left-[7px] top-3 w-px bg-gold" style={{ transform: "scaleY(0)" }} />
      {milestones.map((m, i) => (
        <li key={m.title} data-milestone className="relative pb-10 last:pb-0">
          <span data-dot aria-hidden className="absolute -left-10 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-cream bg-forest shadow-[0_0_0_1px_var(--color-gold)]" />
          <div className="flex items-start gap-5">
            <div>
              <p className="font-display text-[1.75rem] leading-none text-forest">{m.when}</p>
              <p className="script mt-2 text-[1.2rem] text-gold">{m.title}</p>
              <p className="mt-2 max-w-sm text-[0.95rem] text-ink/70">{m.text}</p>
            </div>
            <Icon name={m.icon} className="ml-auto hidden h-10 w-10 shrink-0 text-forest/50 sm:block" />
          </div>
          {i < milestones.length - 1 && <span aria-hidden className="mt-8 block h-px w-full border-t border-dashed border-ink/10" />}
        </li>
      ))}
    </ol>
  );
}
