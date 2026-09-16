"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Icon, type IconName } from "@/components/ui/Icons";
import { Flourish, LeafSprig } from "@/components/ui/Ornaments";
import { Logo } from "@/components/ui/Logo";
import { Seal } from "@/components/ui/Seal";
import { site } from "@/data/site";

const pillars: { icon: IconName; title: string; text: string }[] = [
  { icon: "seedling", title: "Thoughtful by nature", text: "Every element is chosen with purpose and care." },
  { icon: "shield", title: "Quality you can trust", text: "Alcohol-free, paraben-free, pH neutral and cruelty-free." },
  { icon: "gift", title: "Crafted for hospitality", text: "Made to lift the guest experience in every setting." },
  { icon: "globe", title: "From India to the world", text: "Proudly Indian at heart, built to global standards." },
];

/**
 * The C01 brochure spread. On large screens the right-hand page swings open
 * on a spine as the spread scrolls into view, and the photo page settles flat.
 */
export function Statement() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      if (prefersReducedMotion()) return;
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: q("[data-spread]")[0], start: "top 85%", end: "top 18%", scrub: 0.7 },
        });
        tl.fromTo(q("[data-page-right]"), { rotateY: -96, autoAlpha: 0.2 }, { rotateY: 0, autoAlpha: 1 }, 0)
          .fromTo(q("[data-page-left]"), { rotateY: 14, scale: 0.94 }, { rotateY: 0, scale: 1 }, 0)
          .fromTo(q("[data-page-shade]"), { autoAlpha: 0.55 }, { autoAlpha: 0 }, 0);
      });

      // All sizes: the photo drifts, the seal presses in, pillars and lines rise.
      gsap.fromTo(
        q("[data-spread-photo]"),
        { yPercent: -6, scale: 1.12 },
        { yPercent: 6, scale: 1.04, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.5 } },
      );
      gsap.fromTo(
        q("[data-spread-seal]"),
        { scale: 1.8, autoAlpha: 0, rotate: -40 },
        { scale: 1, autoAlpha: 1, rotate: 12, duration: 0.9, ease: "back.out(1.6)", scrollTrigger: { trigger: q("[data-spread]")[0], start: "top 40%", once: true } },
      );
      gsap.fromTo(
        q("[data-pillar]"),
        { autoAlpha: 0, x: 24 },
        { autoAlpha: 1, x: 0, duration: 0.9, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: q("[data-pillars]")[0], start: "top 75%", once: true } },
      );
      gsap.fromTo(
        q("[data-pillar-rule]"),
        { scaleX: 0 },
        { scaleX: 1, duration: 1, stagger: 0.12, ease: "power3.inOut", transformOrigin: "left", scrollTrigger: { trigger: q("[data-pillars]")[0], start: "top 75%", once: true } },
      );
      gsap.fromTo(
        q("[data-signature]"),
        { autoAlpha: 0, x: -30, rotate: -4 },
        { autoAlpha: 1, x: 0, rotate: 0, duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: q("[data-signature]")[0], start: "top 85%", once: true } },
      );
      gsap.fromTo(
        q("[data-fade]"),
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1, scrollTrigger: { trigger: q("[data-spread]")[0], start: "top 55%", once: true } },
      );

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative py-16 md:py-24" aria-labelledby="statement-title">
      <div className="container-wide">
        <div data-spread className="relative grid overflow-visible rounded-md shadow-lift lg:grid-cols-2 [perspective:2400px]">
          {/* Left page: photograph */}
          <div data-page-left className="relative min-h-[34rem] overflow-hidden rounded-t-md bg-forest [transform-origin:right_center] lg:min-h-[46rem] lg:rounded-l-md lg:rounded-tr-none">
            <div data-spread-photo className="absolute inset-0">
              <Image
                src="/products/morning-spring-table.jpg"
                alt="A Morning Spring sachet at a place setting on a wedding table"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                quality={85}
                className="object-cover object-[70%_center]"
              />
            </div>
            <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-cream/95 from-5% via-cream/60 via-35% to-transparent to-60%" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-forest-deep/50 via-transparent to-transparent" />

            <div className="relative flex h-full min-h-[34rem] flex-col px-7 pb-24 pt-9 sm:px-10 lg:min-h-[46rem] lg:px-12 lg:pt-12">
              <p className="eyebrow border-b border-gold/60 pb-3 text-forest/80 [width:fit-content]">Thanda Kapda Co.</p>
              <SplitReveal as="h2" id="statement-title" className="mt-8 max-w-[34rem] text-[clamp(2.3rem,4.4vw,4.2rem)] uppercase leading-[0.98] tracking-[-0.01em] text-forest" stagger={0.1}>
                We don&rsquo;t make wet wipes. We create last impressions.
              </SplitReveal>
              <div data-fade>
                <Flourish className="mt-7" />
              </div>
              <p data-fade className="font-display mt-6 max-w-[16rem] text-[1.2rem] leading-snug text-ink/80">
                Thoughtfully crafted for the finest hospitality experiences.
              </p>
              <div data-fade className="mt-auto hidden sm:block">
                <Logo tone="cream" />
              </div>
            </div>

            {/* Contact bar */}
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-forest px-7 py-4 text-cream sm:px-10 lg:px-12">
              <a href={site.phoneHref} className="flex items-center gap-2 text-[0.85rem] text-cream/90 hover:text-cream">
                <Icon name="headset" className="h-4 w-4 text-gold-light" /> {site.phoneDisplay}
              </a>
              <a href={`mailto:${site.email}`} className="hidden items-center gap-2 text-[0.85rem] text-cream/90 hover:text-cream sm:flex">
                <Icon name="monitor" className="h-4 w-4 text-gold-light" /> {site.email}
              </a>
              <span className="hidden items-center gap-2 text-[0.85rem] text-cream/90 md:flex">
                <Icon name="globe" className="h-4 w-4 text-gold-light" /> thandakapda.co
              </span>
            </div>

            <div data-spread-seal className="absolute right-5 top-5 w-24 sm:right-8 sm:top-8 sm:w-28 lg:w-32">
              <Seal text="CRAFTED EXCELLENCE · CRAFTED EXCELLENCE · " />
            </div>
          </div>

          {/* Right page: the belief */}
          <div
            data-page-right
            className="parchment relative overflow-hidden rounded-b-md [backface-visibility:hidden] [transform-origin:left_center] lg:rounded-r-md lg:rounded-bl-none"
          >
            <div aria-hidden className="fold pointer-events-none absolute inset-y-0 -left-full hidden w-[200%] lg:block" />
            <div data-page-shade aria-hidden className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-ink/40 to-transparent lg:block" />
            <LeafSprig flip className="pointer-events-none absolute -right-6 top-6 h-56 w-auto text-gold/25" />

            <div className="relative grid h-full gap-10 px-7 py-12 sm:px-10 lg:px-12 lg:py-14 xl:grid-cols-[1fr_15rem]">
              <div className="flex flex-col">
                <p className="font-display text-[clamp(1.6rem,2.3vw,2.2rem)] uppercase leading-[1.1] text-forest">
                  We exist to
                  <br />
                  <em className="normal-case">turn overlooked details into</em>
                  <br />
                  <em className="text-gold">exceptional experiences.</em>
                </p>
                <div data-fade>
                  <Flourish className="mt-7" />
                </div>
                <div className="mt-7 max-w-md space-y-4 text-[0.95rem] leading-relaxed text-ink/75">
                  <p data-fade>At Thanda Kapda Co., we believe true hospitality lives in the details.</p>
                  <p data-fade>
                    What most people overlook as a simple wet wipe is, to us, the last thing a guest touches at the end
                    of a meal. It is a small chance to get comfort, hygiene and care exactly right.
                  </p>
                  <p data-fade>
                    So every part of it is intentional: the softness of the sheet, the aloe it is soaked in, the seal
                    that keeps it fresh and the wrapper your guest holds before they open it.
                  </p>
                </div>

                <div data-signature className="mt-10">
                  <p className="script -rotate-3 text-[2rem] leading-tight text-forest">
                    Built for care.
                    <br />
                    <span className="ml-6">Made to impress.</span>
                  </p>
                  <svg viewBox="0 0 220 20" className="-mt-1 ml-4 h-4 w-52 text-gold" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                    <path d="M2 16C60 4 150 2 218 8" />
                  </svg>
                </div>
              </div>

              <ul data-pillars className="border-gold/40 xl:border-l xl:pl-7">
                {pillars.map((p, i) => (
                  <li key={p.title} data-pillar className="py-5 first:pt-0">
                    <Icon name={p.icon} className="h-10 w-10 text-forest" />
                    <p className="mt-3 font-sans text-[0.72rem] font-bold uppercase tracking-[0.14em] text-forest">{p.title}</p>
                    <p className="mt-1.5 text-[0.85rem] leading-snug text-ink/65">{p.text}</p>
                    {i < pillars.length - 1 && <span data-pillar-rule aria-hidden className="mt-5 block h-px w-full bg-gold/40" />}
                  </li>
                ))}
              </ul>

              <div data-fade className="relative rounded-sm bg-cream-200 px-6 py-5 text-center xl:col-span-2">
                <svg viewBox="0 0 24 24" className="absolute left-1/2 top-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-gold" fill="currentColor" aria-hidden>
                  <circle cx="12" cy="12" r="11" className="fill-cream-200" />
                  <path d="M12 5c1.4 2 1.4 4 0 5.5-1.4-1.5-1.4-3.5 0-5.5Zm0 14c-1.4-2-1.4-4 0-5.5 1.4 1.5 1.4 3.5 0 5.5ZM5 12c2-1.4 4-1.4 5.5 0-1.5 1.4-3.5 1.4-5.5 0Zm14 0c-2 1.4-4 1.4-5.5 0 1.5-1.4 3.5-1.4 5.5 0Z" />
                </svg>
                <p className="font-sans text-[0.68rem] font-semibold uppercase leading-relaxed tracking-[0.18em] text-forest/85">
                  The finest hospitality brands understand that
                  <br className="hidden sm:block" /> exceptional experiences are defined by the smallest details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
