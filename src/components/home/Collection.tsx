"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { products, rupee } from "@/data/products";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Button } from "@/components/ui/Button";
import { Flourish, LeafSprig, Stamp } from "@/components/ui/Ornaments";
import { LogoMark } from "@/components/ui/Logo";
import { Seal } from "@/components/ui/Seal";

const looks = {
  "morning-spring": {
    panel: "bg-[linear-gradient(160deg,#e6ead8_0%,#dfe4cd_45%,#eee6d2_100%)]",
    subtitle: "Pure freshness from nature",
    note: "For heat, travel and the long day out.",
    image: "/products/morning-spring-sachet.jpg",
    alt: "Morning Spring sachet, front",
    aspect: "aspect-[3/2]",
  },
  namaste: {
    panel: "bg-[linear-gradient(160deg,#f1e6d0_0%,#ead9ba_50%,#f3ead8_100%)]",
    subtitle: "Calm, graceful & welcoming",
    note: "For the end of a memorable meal.",
    image: "/products/namaste-marble.jpg",
    alt: "Namasté sachet on a marble counter",
    aspect: "aspect-[3/2]",
  },
} as const;

/** C13 "Our fragrance collections": textured collection panels with the sachet as the hero. */
export function Collection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      if (prefersReducedMotion()) return;
      q<HTMLElement>("[data-coll]").forEach((panel, i) => {
        const pack = panel.querySelector("[data-pack]");
        const leaf = panel.querySelector("[data-leaf]");
        gsap.fromTo(
          pack,
          { rotate: i % 2 ? 9 : -9, yPercent: 18 },
          { rotate: i % 2 ? 2 : -2, yPercent: -6, ease: "none", scrollTrigger: { trigger: panel, start: "top bottom", end: "bottom 40%", scrub: 0.7 } },
        );
        gsap.fromTo(leaf, { rotate: -20, autoAlpha: 0 }, { rotate: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: panel, start: "top 90%", end: "center center", scrub: 0.7 } });
      });
      gsap.fromTo(
        q("[data-custom-seal]"),
        { scale: 2, autoAlpha: 0, rotate: -45 },
        { scale: 1, autoAlpha: 1, rotate: -8, duration: 0.8, ease: "back.out(1.5)", scrollTrigger: { trigger: q("[data-custom]")[0], start: "top 70%", once: true } },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} id="collection" className="relative py-24 md:py-32" aria-labelledby="collection-title">
      <div className="container-wide">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Reveal className="flex items-center gap-3 text-gold">
              <LogoMark className="h-5 w-6" />
              <p className="eyebrow">Thanda Kapda Co. · The collections</p>
            </Reveal>
            <SplitReveal as="h2" id="collection-title" className="display-1 mt-6 uppercase text-forest" stagger={0.1}>
              Our collections
            </SplitReveal>
          </div>
          <Reveal delay={0.1} className="lg:col-span-5">
            <Flourish />
            <p className="mt-5 max-w-md text-ink/75">
              Every wipe is designed to create an experience, not just a moment of freshness. Same aloe base, same
              one-sachet-at-a-time discipline. Choose by the moment, or have us make one that is yours.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {products.map((p, i) => {
            const look = looks[p.slug];
            const off = Math.round((1 - p.price / p.mrp) * 100);
            return (
              <article key={p.slug} data-coll className={`group relative overflow-hidden rounded-md ${look.panel} shadow-paper`}>
                <div data-leaf className="pointer-events-none absolute -right-6 -top-6 text-forest/25">
                  <LeafSprig flip className="h-48 w-auto" />
                </div>
                <div className="relative grid h-full gap-8 p-7 sm:p-10 md:grid-cols-[1fr_1.05fr] md:items-center">
                  <div>
                    <p className="eyebrow text-ink/45">No. 0{i + 1}</p>
                    <h3 className="font-display mt-3 text-[clamp(2.2rem,3.4vw,3.2rem)] leading-none text-forest">
                      <Link href={`/products/${p.slug}`} className="link-line">
                        {p.displayName}
                      </Link>
                    </h3>
                    <p className="mt-3 font-sans text-[0.68rem] font-bold uppercase tracking-[0.22em] text-gold">{look.subtitle}</p>
                    <Flourish className="mt-5 [&_span]:!w-10" />
                    <p className="mt-5 max-w-xs text-[0.95rem] text-ink/75">{p.short}</p>
                    <p className="script mt-3 text-[1.15rem] text-forest/80">{look.note}</p>

                    <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-1 font-sans text-[0.6rem] font-bold uppercase tracking-[0.16em] text-forest/70">
                      {["Alcohol free", "pH neutral", "Paraben free"].map((c, k) => (
                        <li key={c} className="flex items-center gap-3">
                          {c}
                          {k < 2 && <span aria-hidden className="h-3 w-px bg-forest/30" />}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-7 flex items-baseline gap-3">
                      <span className="font-display text-[2.1rem] leading-none text-forest">{rupee.format(p.price)}</span>
                      <span className="text-sm text-ink/45 line-through">{rupee.format(p.mrp)}</span>
                      <span className="rounded-full bg-forest px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-cream">{off}% off</span>
                    </div>
                    <p className="mt-1 text-[0.8rem] text-ink/55">{p.count} individually sealed wipes</p>

                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      <Button href={p.amazonUrl} external arrow>
                        Buy on Amazon
                      </Button>
                      <Button href={`/products/${p.slug}`} variant="ghost" className="link-line">
                        Details
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <div data-pack className="polaroid relative transition-shadow duration-700 group-hover:shadow-lift">
                      <span className="tape -top-2 left-1/2 -translate-x-1/2 rotate-[-3deg]" aria-hidden />
                      <div className={`relative overflow-hidden ${look.aspect}`}>
                        <Image
                          src={look.image}
                          alt={look.alt}
                          fill
                          sizes="(min-width: 1024px) 24vw, (min-width: 768px) 45vw, 90vw"
                          className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.06]"
                        />
                      </div>
                      <p className="script mt-3 text-[1rem] text-ink/75">{p.tagline}.</p>
                    </div>
                    <div className="relative mt-4 hidden overflow-hidden rounded-sm md:block">
                      <div className="relative aspect-[16/10]">
                        <Image src={p.hero.src} alt={p.hero.alt} fill sizes="(min-width: 1024px) 24vw, 45vw" className="object-cover" />
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Custom collection */}
        <Reveal y={40} className="mt-6">
          <article data-custom className="frame-double parchment-dark relative overflow-hidden rounded-md text-cream">
            <LeafSprig className="pointer-events-none absolute -left-8 bottom-0 h-72 w-auto text-cream/[0.06]" />
            <div className="relative grid gap-10 px-8 py-12 sm:px-12 md:py-14 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5">
                <p className="eyebrow text-gold-light">The custom collection</p>
                <h3 className="font-display mt-4 text-[clamp(2.2rem,3.6vw,3.4rem)] leading-none">
                  Your name <em className="text-gold-light">on the sachet.</em>
                </h3>
                <p className="mt-3 font-sans text-[0.68rem] font-bold uppercase tracking-[0.22em] text-cream/60">Crafted with purpose</p>
              </div>
              <div className="lg:col-span-4">
                <p className="text-cream/75">
                  Restaurants, hotels, airlines, wedding planners and offices. Printed sachets in your branding, in the
                  quantities you actually need, plus both wipes by the case.
                </p>
                <ul className="mt-5 grid gap-2 text-[0.9rem] text-cream/80">
                  {["Custom-printed single sachets", "Morning Spring & Namasté by the case", "Pricing by quantity, lead times up front"].map((t) => (
                    <li key={t} className="flex gap-3">
                      <LogoMark className="mt-1.5 h-3 w-3.5 shrink-0 text-gold-light" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between gap-6 lg:col-span-3 lg:flex-col lg:items-end">
                <div data-custom-seal className="w-28">
                  <Seal text="CRAFTED WITH PURPOSE · REMEMBERED · " />
                </div>
                <Button href="/bulk" variant="cream" arrow>
                  Start a bulk order
                </Button>
              </div>
            </div>
            <p className="script relative border-t border-gold-light/20 px-8 py-5 text-center text-[1.3rem] text-gold-light">
              &ldquo;Crafted with purpose. Remembered with every touch.&rdquo;
            </p>
          </article>
        </Reveal>

        <Reveal className="mt-10 flex justify-center">
          <Stamp text="CRAFTED WITH PURPOSE · REMEMBERED WITH EVERY TOUCH · " className="w-32">
            <LogoMark className="h-9 w-10 text-forest" />
          </Stamp>
        </Reveal>
      </div>
    </section>
  );
}
