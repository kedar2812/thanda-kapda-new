"use client";

import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { RingIcon } from "@/components/ui/Icons";
import { LeafSprig } from "@/components/ui/Ornaments";
import { BrushNote } from "@/components/ui/Paper";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { Rich } from "@/components/cms/Rich";
import { useContent } from "@/content/ContentProvider";

/** C17/C19 "Good for hospitality. Kind to the planet." */
export function Planet() {
  const p = useContent().home.planet;
  return (
    <section data-cms="home.planet" className="relative overflow-hidden bg-forest-deep text-cream" aria-labelledby="planet-title">
      <div className="absolute inset-0 opacity-25 blur-[6px]">
        <ParallaxImage image={p.background} alt="" className="h-full w-full !rounded-none" speed={0.2} sizes="100vw" imgClassName="grayscale-[40%]" />
      </div>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-forest-deep via-forest-deep/92 to-forest-deep/55" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_85%_20%,rgb(217_176_106/0.18),transparent_70%)]" />
      <LeafSprig flip className="pointer-events-none absolute -right-10 bottom-0 h-[28rem] w-auto text-gold-light/15" />

      <div className="container-wide relative py-24 md:py-32">
        <div className="frame-double rounded-md px-6 py-12 sm:px-12 md:py-16">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <SplitReveal as="h2" id="planet-title" className="display-2 uppercase text-cream" stagger={0.1}>
                <Rich text={p.title} />
              </SplitReveal>
              <SplitReveal as="p" className="font-display display-2 uppercase text-[#b9c27e]" stagger={0.1} delay={0.2}>
                <Rich text={p.titleAccent} />
              </SplitReveal>
              <Reveal delay={0.2}>
                <p className="mt-8 max-w-lg text-cream/75">{p.text}</p>
              </Reveal>
              <Reveal stagger={0.08} className="mt-10 grid gap-x-6 gap-y-7 sm:grid-cols-2">
                {p.facts.map((f, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <RingIcon name={f.icon} tone="gold" />
                    <div>
                      <p className="font-sans text-[0.74rem] font-bold uppercase tracking-[0.14em] text-cream">{f.title}</p>
                      <p className="mt-1 text-[0.85rem] text-cream/60">{f.text}</p>
                    </div>
                  </div>
                ))}
              </Reveal>
            </div>
            <div className="flex items-start lg:col-span-5 lg:justify-end lg:pt-10">
              <Reveal delay={0.3} y={30}>
                <p className="script -rotate-6 text-[2.2rem] leading-tight text-cream md:text-[2.6rem]">
                  <Rich text={p.script} />
                </p>
                <svg viewBox="0 0 200 16" className="ml-16 mt-1 h-4 w-48 -rotate-6 text-gold-light" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                  <path d="M2 12C60 3 140 2 198 6" />
                </svg>
                {p.brush && (
                  <BrushNote tone="gold" className="mt-10 rotate-2">
                    {p.brush}
                  </BrushNote>
                )}
              </Reveal>
            </div>
          </div>

          <Reveal stagger={0.1} className="mt-14 grid border-t border-gold-light/25 pt-10 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-gold-light/20">
            {p.better.map((b, i) => (
              <div key={i} className="flex items-center gap-4 py-3 lg:px-6 lg:first:pl-0">
                <RingIcon name={b.icon} tone="gold" size="lg" />
                <div>
                  <p className="font-display text-[1.3rem] text-cream">{b.title}</p>
                  <p className="text-[0.85rem] text-cream/60">{b.text}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
