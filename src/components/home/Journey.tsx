import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { WorldMap } from "@/components/map/WorldMap";
import { Icon } from "@/components/ui/Icons";
import { LeafSprig } from "@/components/ui/Ornaments";
import { LogoMark } from "@/components/ui/Logo";
import { TornPanel } from "@/components/ui/TornPanel";
import { BrushNote, CompassRose, Postmark, PostageStamp } from "@/components/ui/Paper";
import { Seal } from "@/components/ui/Seal";
import { Button } from "@/components/ui/Button";
import { regions, steps } from "@/data/journey";

const stats = [
  { icon: "globe" as const, big: "Made in India", small: "Proudly Indian at heart, built to global standards." },
  { icon: "pin" as const, big: "Sealed one at a time", small: "One hundred single sachets to every case." },
  { icon: "handshake" as const, big: "Built on trust", small: "Driven by quality. Delivered with care." },
];

/**
 * "From India to the world" — the C08 journey poster and the C09/C10 map
 * spread combined: six steps across the top, an aged-paper map with stamps,
 * and a torn green panel listing the regions we are heading to.
 */
export function Journey() {
  return (
    <section className="relative overflow-hidden pb-24 pt-20 md:pb-32 md:pt-28" aria-labelledby="journey-title">
      <LeafSprig className="pointer-events-none absolute -left-16 top-24 h-[24rem] w-auto text-forest/[0.07]" />

      <div className="container-wide">
        {/* Title + six steps */}
        <div>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Reveal>
                <p className="eyebrow text-gold">Thanda Kapda Co. · Our journey</p>
              </Reveal>
              <SplitReveal as="h2" id="journey-title" className="display-1 mt-5 uppercase text-forest" stagger={0.1}>
                From India to the world
              </SplitReveal>
            </div>
            <Reveal delay={0.2} className="shrink-0 lg:mb-3">
              <BrushNote tone="sage" className="-rotate-2" textClassName="text-[1.2rem] md:text-[1.4rem]">
                Our roots bring us India.
                <br />
                Our vision takes us global.
              </BrushNote>
            </Reveal>
          </div>

          <Reveal stagger={0.08} y={24} className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 border-y border-gold/30 py-10 sm:grid-cols-3 xl:grid-cols-6 xl:gap-x-4">
            {steps.map((s, i) => (
              <div key={s.n} className="relative text-center">
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                  <Icon name={s.icon} className="h-12 w-12 text-forest" />
                  {i < steps.length - 1 && (
                    <svg viewBox="0 0 12 20" className="absolute -right-[calc(50%-1rem)] top-1/2 hidden h-4 w-3 -translate-y-1/2 text-gold xl:block" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                      <path d="M2 2l8 8-8 8" />
                    </svg>
                  )}
                </div>
                <p className="mt-4 font-sans text-[0.68rem] font-bold uppercase tracking-[0.14em] text-forest">
                  {s.n}. {s.title}
                </p>
                <p className="mx-auto mt-2 max-w-[11rem] text-[0.82rem] leading-snug text-ink/65">{s.text}</p>
              </div>
            ))}
          </Reveal>
        </div>

        {/* Spread */}
        <Reveal y={50} className="relative mt-16 overflow-hidden rounded-md shadow-lift md:mt-20">
          <div className="grid lg:grid-cols-12">
            {/* Map page */}
            <div className="paper-aged relative lg:col-span-8">
              <div className="fold pointer-events-none absolute inset-0 hidden lg:block" aria-hidden />
              <div className="relative flex h-full flex-col justify-center px-4 pb-8 pt-20 sm:px-8 sm:pt-24 lg:px-10 lg:pb-10 lg:pt-28">
                {/* Top-left handwriting */}
                <p className="script absolute left-5 top-6 max-w-[14rem] -rotate-3 text-[1.15rem] leading-tight text-forest/80 sm:left-10 sm:top-8 sm:text-[1.35rem]">
                  To the world,
                  <br />
                  from India.
                </p>

                {/* Stamp + postmark */}
                <div className="absolute right-4 top-4 flex items-start sm:right-8 sm:top-6" aria-hidden>
                  <Postmark className="relative z-10 -mr-10 mt-6 hidden w-36 -rotate-6 sm:block" />
                  <PostageStamp className="h-24 w-20 rotate-[5deg] sm:h-28 sm:w-24">
                    <div className="parchment-dark flex h-full w-full flex-col items-center justify-between px-1 py-2 text-cream">
                      <span className="font-sans text-[0.5rem] font-bold uppercase tracking-[0.18em] text-gold-light">भारत India</span>
                      <LogoMark className="h-8 w-9 text-cream" />
                      <span className="font-display text-[1rem] leading-none text-gold-light">25</span>
                    </div>
                  </PostageStamp>
                </div>

                <WorldMap />

                {/* Legend + compass */}
                <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
                  <div className="flex items-end gap-5">
                    <CompassRose className="hidden h-24 w-24 text-forest/80 sm:block" />
                    <ul className="space-y-2 border border-forest/25 bg-cream-50/40 px-4 py-3 font-sans text-[0.64rem] font-bold uppercase tracking-[0.16em] text-forest">
                      <li className="flex items-center gap-3">
                        <span className="inline-block h-3 w-3 rounded-full border-2 border-[#e3c27d] bg-forest" /> Home market
                      </li>
                      <li className="flex items-center gap-3">
                        <svg viewBox="0 0 32 6" className="h-1.5 w-8" aria-hidden>
                          <path d="M0 3h32" stroke="#143829" strokeWidth="1.4" strokeDasharray="3 3" />
                        </svg>
                        Future path
                      </li>
                    </ul>
                  </div>
                  <Seal text="ESTD 2025 · REFRESHING TRADITION · " className="w-24 rotate-[10deg] sm:w-28" />
                </div>
              </div>
            </div>

            {/* Torn green regions page */}
            <div className="relative lg:col-span-4">
              <TornPanel side="left" seed={29} amplitude={0.07} className="absolute inset-0 hidden lg:block" under="bg-[#ecdfc3]" />
              <TornPanel side="top" seed={31} amplitude={0.04} className="absolute inset-0 lg:hidden" under="bg-[#ecdfc3]" />
              <div className="relative px-7 pb-10 pt-12 text-cream sm:px-10 lg:pl-14 lg:pr-9 lg:pt-12">
                <p className="eyebrow text-gold-light">Estd. 2025</p>
                <p className="mt-3 font-display text-[2rem] leading-none">Where we&rsquo;re headed</p>
                <p className="script mt-2 text-[1.1rem] text-cream/70">A fresh tradition. Soon, everywhere.</p>

                <Reveal as="ul" stagger={0.08} y={16} className="mt-8 divide-y divide-gold-light/20 border-y border-gold-light/20">
                  {regions.map((r) => (
                    <li key={r.name} className="flex items-center gap-5 py-4">
                      <Icon name={r.icon} className="h-11 w-11 shrink-0 text-gold-light" />
                      <div>
                        <p className="font-display text-[1.25rem] uppercase leading-none tracking-[0.02em] text-cream">{r.name}</p>
                        <p className="mt-2 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-cream/65">{r.places.join(" · ")}</p>
                      </div>
                    </li>
                  ))}
                </Reveal>

                <p className="script mt-8 -rotate-2 text-[1.6rem] leading-tight text-gold-light">More countries, coming soon!</p>
                <div className="mt-8">
                  <Button href="/bulk" variant="cream" arrow>
                    Distribute with us
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Stats bar */}
        <Reveal stagger={0.1} className="mt-10 grid overflow-hidden rounded-md border border-gold/30 bg-cream-50/60 md:grid-cols-3 md:divide-x md:divide-gold/25">
          {stats.map((s) => (
            <div key={s.big} className="flex items-center gap-5 border-b border-gold/20 px-6 py-6 last:border-b-0 md:border-b-0">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-forest text-cream">
                <Icon name={s.icon} className="h-7 w-7" />
              </span>
              <div>
                <p className="font-sans text-[0.8rem] font-bold uppercase tracking-[0.12em] text-forest">{s.big}</p>
                <p className="mt-1 text-[0.85rem] text-ink/65">{s.small}</p>
              </div>
            </div>
          ))}
        </Reveal>
        <Reveal delay={0.1}>
          <p className="script mt-8 text-center text-[1.6rem] text-forest/80">From India, to every corner of the world.</p>
        </Reveal>
      </div>
    </section>
  );
}

