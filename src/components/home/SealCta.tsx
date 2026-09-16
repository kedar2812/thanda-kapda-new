"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Seal } from "@/components/ui/Seal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icons";
import { site } from "@/data/site";

/**
 * C23: a parchment card with a gold wax seal, set over a candle-lit table.
 * The seal is pressed onto the card as it scrolls in.
 */
export function SealCta() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        q("[data-bg]"),
        { scale: 1.25, yPercent: -6 },
        { scale: 1.05, yPercent: 6, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6 } },
      );
      const tl = gsap.timeline({ scrollTrigger: { trigger: q("[data-card]")[0], start: "top 75%", once: true } });
      tl.fromTo(q("[data-card]"), { autoAlpha: 0, y: 70, rotate: -4 }, { autoAlpha: 1, y: 0, rotate: -1, duration: 1.2, ease: "power4.out" })
        .fromTo(q("[data-seal]"), { autoAlpha: 0, scale: 2.4, rotate: -60 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.55, ease: "power4.in" }, "-=0.35")
        .fromTo(q("[data-card]"), { scale: 1 }, { scale: 0.985, duration: 0.08, yoyo: true, repeat: 1 }, ">")
        .fromTo(q("[data-strip]"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1, ease: "power3.inOut" }, "-=0.1")
        .fromTo(q("[data-card-line]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 }, "-=0.8");
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative -mt-[clamp(1.25rem,2.6vw,2.5rem)] overflow-hidden bg-ink" aria-labelledby="seal-title">
      <div data-bg className="absolute inset-0">
        <Image src="/products/morning-spring-table.jpg" alt="" fill sizes="100vw" className="object-cover" />
      </div>
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_50%,rgb(12_36_25/0.45),rgb(12_16_10/0.88))]" />

      <div className="container-wide relative flex min-h-[90svh] items-center justify-center py-28">
        <div data-card className="relative w-full max-w-xl">
          <div data-seal className="absolute left-1/2 top-0 z-10 w-32 -translate-x-1/2 -translate-y-[58%] sm:w-40">
            <Seal text="REFRESHING TRADITION · CRAFTED WITH CARE · " />
          </div>
          <div className="paper-aged relative rounded-sm px-7 pb-12 pt-24 text-center shadow-[0_40px_80px_-20px_rgb(0_0_0/0.6)] sm:px-14 sm:pt-28">
            <h2 id="seal-title" data-card-line className="font-display text-[clamp(2rem,4vw,2.9rem)] uppercase leading-none tracking-[0.02em] text-forest">
              Thanda Kapda Co.
            </h2>
            <p data-card-line className="eyebrow mt-4 text-ink/60">
              Essence of pure indulgence
            </p>
            <span data-card-line aria-hidden className="mx-auto mt-6 block h-px w-32 bg-gold/60" />
            <ul className="mt-6 space-y-3 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-forest">
              <li data-card-line>
                <a href={site.url} className="link-line">www.thandakapda.co</a>
              </li>
              <li data-card-line>
                <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="link-line inline-flex items-center gap-2">
                  <Icon name="globe" className="h-4 w-4" /> {site.instagramHandle}
                </a>
              </li>
              <li data-card-line>
                <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className="link-line inline-flex items-center gap-2">
                  <Icon name="headset" className="h-4 w-4" /> WhatsApp {site.phoneDisplay}
                </a>
              </li>
            </ul>
            <div data-card-line className="mt-10 flex flex-wrap justify-center gap-3">
              <Button href="/products" arrow>
                Shop the wipes
              </Button>
              <Button href="/bulk" variant="outline">
                Bulk &amp; custom
              </Button>
            </div>
          </div>
          <div data-strip className="relative -mt-5 ml-auto mr-[-1rem] w-[88%] rotate-[-2deg] bg-forest px-6 py-4 shadow-lift sm:mr-[-2.5rem]">
            <p className="script text-center text-[1.3rem] text-cream sm:text-[1.5rem]">Let&rsquo;s create unforgettable moments, together.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
