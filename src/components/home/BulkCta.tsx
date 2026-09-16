import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { BulkForm } from "@/components/BulkForm";
import { TornPanel } from "@/components/ui/TornPanel";
import { LeafSprig, Stamp } from "@/components/ui/Ornaments";
import { LogoMark } from "@/components/ui/Logo";
import { site } from "@/data/site";

const segments = ["Restaurants", "Hotels", "Airlines", "Weddings", "Caterers", "Offices", "Gyms", "Retail"];

export function BulkCta() {
  return (
    <section id="bulk" className="relative z-10" aria-labelledby="bulk-title">
      <TornPanel side="top" seed={21} amplitude={0.5} className="torn-strip w-full" under="bg-transparent" />

      <div className="parchment-dark relative overflow-hidden text-cream">
        <LeafSprig className="pointer-events-none absolute -right-14 top-10 h-[32rem] w-auto text-cream/[0.06]" />

        <div className="container-wide relative py-24 md:py-32">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="eyebrow text-gold-light">Custom &amp; bulk orders</p>
              </Reveal>
              <SplitReveal as="h2" id="bulk-title" className="display-2 mt-6 text-cream">
                Your brand on every table.
              </SplitReveal>
              <Reveal delay={0.1}>
                <p className="mt-8 max-w-md text-cream/75">
                  We supply Morning Spring and Namasté by the case and print custom sachets for hospitality, travel
                  and events. Tell us the quantity and the occasion; we come back with pricing and lead times, not a
                  brochure.
                </p>
              </Reveal>
              <Reveal delay={0.15} stagger={0.05} className="mt-8 flex flex-wrap gap-2">
                {segments.map((s) => (
                  <span key={s} className="rounded-full border border-cream/20 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.16em] text-cream/80">
                    {s}
                  </span>
                ))}
              </Reveal>
              <Reveal delay={0.2} className="mt-12 flex items-center gap-6">
                <Stamp text="CUSTOM PRINTED · MADE IN INDIA · " tone="gold" className="w-28 shrink-0">
                  <LogoMark className="h-8 w-9 text-gold-light" />
                </Stamp>
                <p className="text-[0.95rem] text-cream/70">
                  Prefer to talk?{" "}
                  <a href={site.phoneHref} className="link-line text-cream">
                    {site.phoneDisplay}
                  </a>
                </p>
              </Reveal>
            </div>

            <Reveal delay={0.1} y={48} className="rounded-md bg-cream p-6 text-ink shadow-lift sm:p-8 lg:col-span-7 lg:p-10">
              <BulkForm />
            </Reveal>
          </div>
        </div>
      </div>

      <TornPanel side="bottom" seed={33} amplitude={0.5} className="torn-strip w-full" under="bg-transparent" />
    </section>
  );
}
