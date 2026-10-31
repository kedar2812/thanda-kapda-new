"use client";

import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { RingIcon } from "@/components/ui/Icons";
import { Stamp, LeafSprig } from "@/components/ui/Ornaments";
import { LogoMark } from "@/components/ui/Logo";
import { Rich } from "@/components/cms/Rich";
import { useContent } from "@/content/ContentProvider";

/** Dark green card with a double cream frame, from the "Vision & Mission" spread. */
export function VisionMission() {
  const v = useContent().story.vision;
  return (
    <Reveal y={48} className="parchment-dark relative overflow-hidden rounded-md p-3 text-cream shadow-lift">
      <div className="relative rounded-[3px] border border-cream/25 p-7 md:p-12">
        <span aria-hidden className="pointer-events-none absolute inset-2 rounded-[2px] border border-cream/10" />
        <LeafSprig className="pointer-events-none absolute -left-12 bottom-0 h-72 w-auto text-cream/[0.06]" />
        <Stamp text={v.stamp} tone="gold" className="absolute right-6 top-6 hidden w-24 md:block">
          <LogoMark className="h-7 w-8 text-gold-light" />
        </Stamp>

        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <SplitReveal as="h2" className="display-2 uppercase text-cream" stagger={0.1}>
              <Rich text={v.title} />
            </SplitReveal>
            <p className="script mt-8 text-[1.6rem] text-gold-light">{v.kicker}</p>
            <p className="mt-4 max-w-md text-cream/75">{v.text}</p>
            <div className="relative mt-10 inline-block">
              <svg viewBox="0 0 420 120" className="absolute inset-0 h-full w-full text-cream/90" preserveAspectRatio="none" aria-hidden>
                <path d="M12 22c60-14 300-18 396-6l-8 40 10 44c-120 14-300 14-398 4l6-40z" fill="currentColor" />
              </svg>
              <p className="script relative px-8 py-5 text-[1.5rem] leading-tight text-forest md:text-[1.8rem]">
                <Rich text={v.quote} />
              </p>
            </div>
          </div>

          <ul className="space-y-7 md:col-span-6 md:border-l md:border-cream/15 md:pl-10">
            {v.items.map((it, i) => (
              <li key={i} className="flex gap-5">
                <RingIcon name={it.icon} tone="gold" />
                <div>
                  <p className="font-sans text-[0.78rem] font-bold uppercase tracking-[0.16em] text-gold-light">{it.title}</p>
                  <p className="mt-1.5 max-w-sm text-cream/80">{it.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  );
}
