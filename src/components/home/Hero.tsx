"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { products } from "@/data/products";
import { site } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { TornPanel } from "@/components/ui/TornPanel";
import { LeafSprig } from "@/components/ui/Ornaments";
import { LogoMark } from "@/components/ui/Logo";
import { Seal } from "@/components/ui/Seal";
import { Tag } from "@/components/ui/Tag";
import { Icon } from "@/components/ui/Icons";
import { SplitReveal } from "@/components/motion/SplitReveal";

const spring = products[0];
const namaste = products[1];

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

function GoogleReviewsBadge() {
  const { url, rating, count } = site.googleReviews;
  const rated = rating !== null && count !== null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-3.5 rounded-md border border-ink/10 bg-cream-50/90 py-2.5 pl-3 pr-4 shadow-paper transition-[border-color,box-shadow,transform] duration-500 ease-out-expo hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-lift"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
        <GoogleG className="h-5 w-5" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="eyebrow text-[0.58rem] text-ink/50">Google Reviews</span>
        {rated ? (
          <span className="mt-1 flex items-center gap-2 text-[0.85rem] text-ink/70">
            <strong className="font-display text-[1.15rem] font-normal leading-none text-forest">{rating!.toFixed(1)}</strong>
            <Stars />
            <span>({count})</span>
          </span>
        ) : (
          <span className="mt-1 font-display text-[1.05rem] leading-none text-forest">See what guests say</span>
        )}
      </span>
      <svg viewBox="0 0 16 16" className="ml-1 h-3.5 w-3.5 text-ink/40 transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:text-forest" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M3 8h10M9 4l4 4-4 4" />
      </svg>
      <span className="sr-only">(opens Google in a new tab)</span>
    </a>
  );
}

function Stars() {
  return (
    <span className="flex gap-0.5 text-gold" aria-label="Five stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
        </svg>
      ))}
    </span>
  );
}

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const reduced = prefersReducedMotion();
      const cards = q<HTMLElement>("[data-hero-card]");
      const layers = q<HTMLElement>("[data-depth]");
      const route = q<SVGPathElement>("[data-hero-route]");

      if (reduced) {
        gsap.set(q("[data-hero-eyebrow], [data-hero-copy], [data-hero-card], [data-hero-seal], [data-hero-note], [data-hero-tag], [data-hero-edge], [data-hero-cue]"), {
          autoAlpha: 1,
        });
        gsap.set(cards, { rotate: (i) => [-4, 5][i] ?? 0 });
        gsap.set(q("[data-hero-panel]"), { clipPath: "inset(0 0 0 0%)" });
        gsap.set(route, { strokeDashoffset: 0 });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(q("[data-hero-panel]"), { clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0%)", duration: 1.5, ease: "power4.inOut" }, 0)
        .fromTo(q("[data-hero-eyebrow]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.35)
        .fromTo(q("[data-hero-copy]"), { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.12 }, 1.05)
        .fromTo(
          cards,
          { autoAlpha: 0, y: 90, rotate: (i) => [-14, 16][i] ?? 0 },
          { autoAlpha: 1, y: 0, rotate: (i) => [-4, 5][i] ?? 0, duration: 1.5, stagger: 0.16, ease: "power4.out" },
          0.75,
        )
        .fromTo(route, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut" }, 0.9)
        .fromTo(q("[data-hero-tag]"), { autoAlpha: 0, y: -40, rotate: -14 }, { autoAlpha: 1, y: 0, rotate: 5, duration: 1.4, ease: "elastic.out(1, 0.55)" }, 1.15)
        .fromTo(q("[data-hero-seal]"), { autoAlpha: 0, scale: 0.4, rotate: -30 }, { autoAlpha: 1, scale: 1, rotate: 8, duration: 1, ease: "back.out(1.8)" }, 1.4)
        .fromTo(q("[data-hero-note]"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 1.55)
        .fromTo(q("[data-hero-edge], [data-hero-cue]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 1.7);

      // Scroll parallax: the paper pieces drift at different speeds; the copy
      // eases away as the visitor moves on.
      gsap.to(cards, {
        yPercent: (i) => [-10, -18][i] ?? 0,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.6 },
      });
      gsap.to(q("[data-hero-tag]"), {
        yPercent: 22,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.6 },
      });
      gsap.to(q("[data-hero-text]"), {
        yPercent: 14,
        autoAlpha: 0.15,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "35% top", end: "bottom top", scrub: 0.8 },
      });
      gsap.to(q("[data-hero-cue] span:last-child"), { scaleY: 0, transformOrigin: "bottom", repeat: -1, yoyo: true, duration: 1.2, ease: "power2.inOut" });

      // Pointer parallax for mice and trackpads only.
      if (!window.matchMedia("(pointer: fine)").matches) return;
      const movers = layers.map((el) => ({
        depth: Number(el.dataset.depth) || 0,
        x: gsap.quickTo(el, "x", { duration: 1.4, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 1.4, ease: "power3.out" }),
      }));
      const onMove = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        for (const m of movers) {
          m.x(nx * m.depth * 2);
          m.y(ny * m.depth * 2);
        }
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => window.removeEventListener("pointermove", onMove);
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden" aria-labelledby="hero-title">
      <LeafSprig className="pointer-events-none absolute -left-14 bottom-[-4rem] hidden h-[34rem] w-auto text-forest/[0.06] lg:block" />

      <div className="container-wide relative grid min-h-[100svh] grid-cols-1 items-center gap-10 pb-16 pt-28 lg:grid-cols-12 lg:gap-6 lg:pb-0 lg:pt-20">
        {/* Copy */}
        <div data-hero-text className="relative z-10 lg:col-span-6 lg:pr-8">
          <p data-hero-eyebrow className="eyebrow flex items-center gap-3 text-gold opacity-0">
            <LogoMark className="h-4 w-[1.15rem] shrink-0" />
            <span>
              Thanda Kapda Co.
              <span className="hidden sm:inline"> · Essence of pure indulgence</span>
            </span>
          </p>

          <SplitReveal as="h1" id="hero-title" immediate delay={0.55} stagger={0.11} className="display-1 mt-8 text-forest">
            A cool cloth for a <em className="text-gold">warm country.</em>
          </SplitReveal>

          <p data-hero-copy className="lede mt-8 max-w-xl text-ink/80 opacity-0">
            The oldest welcome in India is a cold, damp cloth pressed into your hands. We folded it into a sachet:
            soaked in aloe, free of alcohol, and ready wherever the day gets hot.
          </p>

          <div data-hero-copy className="mt-10 flex flex-wrap items-center gap-4 opacity-0">
            <Button href="/products" size="lg" arrow>
              Shop the wipes
            </Button>
            <Button href="/bulk" variant="outline" size="lg">
              Bulk &amp; custom orders
            </Button>
          </div>

          <div data-hero-copy className="mt-6 opacity-0">
            <GoogleReviewsBadge />
          </div>

          <div data-hero-copy className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.8rem] text-ink/70 opacity-0">
            <span className="flex items-center gap-2">
              <Stars />
              <span>
                <strong className="font-semibold text-ink">5.0</strong> on Amazon India
              </span>
            </span>
            <span className="hidden h-4 w-px bg-ink/20 sm:block" />
            <span>Alcohol-free · Paraben-free · pH neutral</span>
          </div>

          <div data-hero-cue className="mt-16 hidden items-center gap-3 opacity-0 lg:flex">
            <span className="eyebrow text-ink/45">Scroll</span>
            <span className="block h-12 w-px bg-gold/70" />
          </div>
        </div>

        {/* Visual */}
        <div className="relative lg:col-span-6 lg:h-[100svh]">
          <div
            data-hero-panel
            className="relative h-[124vw] max-h-[36rem] w-full xs:h-[96vw] sm:h-[72vw] lg:absolute lg:inset-y-0 lg:-right-[clamp(1.25rem,4vw,4rem)] lg:h-full lg:max-h-none lg:w-[calc(100%+clamp(1.25rem,4vw,4rem))]"
            style={{ clipPath: "inset(0 0 0 100%)" }}
          >
            <TornPanel side="top" seed={5} className="absolute inset-0 lg:hidden" />
            <TornPanel side="left" seed={9} className="absolute inset-0 hidden lg:block" />

            <LeafSprig className="pointer-events-none absolute -bottom-6 -left-2 h-[55%] w-auto text-cream/10 lg:left-8" />
            <Icon name="compass" className="pointer-events-none absolute right-[6%] top-[44%] h-24 w-24 text-cream/10 lg:right-[8%] lg:top-[40%] lg:h-32 lg:w-32" />

            {/* Dashed journey line drawn across the panel */}
            <svg viewBox="0 0 600 900" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
              <path
                data-hero-route
                d="M40 820 C 160 700, 120 520, 260 470 S 470 380, 480 250 S 380 120, 560 60"
                pathLength={1}
                fill="none"
                className="stroke-gold-light/50"
                strokeWidth="1.4"
                strokeDasharray="0.012 0.014"
                strokeDashoffset="1"
                strokeLinecap="round"
              />
            </svg>

            {/* Vertical edge text */}
            <p
              data-hero-edge
              className="absolute right-3 top-1/2 hidden -translate-y-1/2 rotate-180 whitespace-nowrap font-sans text-[0.6rem] font-semibold uppercase tracking-[0.34em] text-cream/45 opacity-0 lg:block"
              style={{ writingMode: "vertical-rl" }}
            >
              Est. 2025 · Born in India · Refreshing the world
            </p>

            {/* Hanging tag from the top edge */}
            <div data-hero-tag data-depth="12" className="absolute right-[10%] top-2 hidden opacity-0 sm:block lg:right-[12%] lg:top-4" style={{ transformOrigin: "50% -3rem" }}>
              <Tag place="India · Est. 2025" title="Where it all began." text="A cool cloth for a guest is the oldest welcome we know." className="w-32 lg:w-36" />
            </div>

            {/* Morning Spring */}
            <figure
              data-hero-card
              data-depth="10"
              className="polaroid absolute left-[5%] top-[9%] w-[62%] opacity-0 sm:left-[7%] lg:left-[12%] lg:top-[15%] lg:w-[56%] xl:w-[52%]"
            >
              <span className="tape -left-5 -top-2 rotate-[-28deg]" aria-hidden />
              <div className="frame aspect-[3/2] bg-[#fbf8f1]">
                <Image src={spring.packshot.src} alt={spring.packshot.alt} fill priority sizes="(min-width: 1024px) 28vw, 62vw" className="object-cover" />
              </div>
              <figcaption className="script mt-3 flex items-baseline justify-between text-[1rem] text-ink/80">
                <span>Morning Spring</span>
                <span className="eyebrow text-[0.55rem] text-ink/50">No. 01</span>
              </figcaption>
            </figure>

            {/* Wax seal, pressed onto the page between the two photos */}
            <div data-hero-seal data-depth="14" className="absolute left-[7%] top-[54%] w-[22%] max-w-[7.5rem] opacity-0 lg:left-[9%] lg:top-[56%] lg:w-[20%]">
              <Seal />
            </div>

            {/* Namasté */}
            <figure
              data-hero-card
              data-depth="18"
              className="polaroid absolute bottom-[7%] right-[5%] w-[46%] opacity-0 sm:right-[7%] lg:bottom-[9%] lg:right-[10%] lg:w-[40%] xl:w-[37%]"
            >
              <span className="tape -right-6 -top-2 rotate-[22deg]" aria-hidden />
              <div className="frame aspect-[4/5] bg-[#fbf8f1]">
                <Image src={namaste.hero.src} alt={namaste.hero.alt} fill priority sizes="(min-width: 1024px) 20vw, 46vw" className="object-cover" />
              </div>
              <figcaption className="script mt-3 flex items-baseline justify-between text-[1rem] text-ink/80">
                <span>Namasté</span>
                <span className="eyebrow text-[0.55rem] text-ink/50">No. 02</span>
              </figcaption>
            </figure>

            {/* Note */}
            <div
              data-hero-note
              data-depth="6"
              className="absolute bottom-[6%] left-[6%] max-w-[13rem] rotate-[-3deg] bg-cream-50 px-4 py-3 opacity-0 shadow-paper lg:bottom-[8%] lg:left-[10%] lg:max-w-[14rem]"
            >
              <span className="tape -top-2 right-3 rotate-[6deg]" aria-hidden />
              <p className="script text-[1.05rem] leading-tight text-forest">
                &ldquo;Thanda kapda&rdquo; &mdash; literally, <em>cold cloth</em>. The oldest welcome in India.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
