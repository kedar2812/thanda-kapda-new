"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { nav, site } from "@/data/site";
import { Logo, LogoMark } from "@/components/ui/Logo";
import { LeafSprig } from "@/components/ui/Ornaments";

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.6 1.1 2.8.1.2 1.9 2.9 4.6 4 1.7.7 2.3.8 3.1.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.2Z" />
    </svg>
  );
}

/**
 * Always-visible header. Transparent over the hero, then a compact parchment
 * bar with a hairline once the page scrolls. A thin gold line at the very top
 * shows reading progress.
 */
export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 32));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useGSAP(() => {
    if (!progress.current) return;
    gsap.fromTo(
      progress.current,
      { scaleX: 0 },
      { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: () => ScrollTrigger.maxScroll(window), scrub: 0.3 } },
    );
  }, [pathname]);

  // Close the drawer on Escape. Links close it themselves on click.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  useGSAP(
    () => {
      const el = menu.current;
      if (!el) return;
      const links = el.querySelectorAll("[data-menu-link]");
      const meta = el.querySelectorAll("[data-menu-meta]");
      if (open) {
        gsap
          .timeline()
          .set(el, { pointerEvents: "auto" })
          .to(el, { autoAlpha: 1, duration: 0.5, ease: "power2.out" })
          .fromTo(links, { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.07, ease: "power4.out" }, "-=0.25")
          .fromTo(meta, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08 }, "-=0.6");
      } else {
        gsap.to(el, { autoAlpha: 0, duration: 0.35, ease: "power2.in", onComplete: () => gsap.set(el, { pointerEvents: "none" }) });
      }
    },
    { dependencies: [open], scope: menu },
  );

  const solid = scrolled || open;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <span
          ref={progress}
          aria-hidden
          className="absolute left-0 top-0 z-10 h-[2px] w-full origin-left bg-gold"
          style={{ transform: "scaleX(0)" }}
        />
        <div
          className={clsx(
            "transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-out-expo",
            solid ? "bg-cream/90 shadow-[0_1px_0_rgb(29_26_22/0.08)] backdrop-blur-lg" : "bg-transparent",
          )}
        >
          <div
            className={clsx(
              "container-wide grid grid-cols-[1fr_auto] items-center transition-[height] duration-500 ease-out-expo md:grid-cols-[1fr_auto_1fr]",
              solid ? "h-[4.25rem] md:h-[4.5rem]" : "h-[4.75rem] md:h-[5.75rem]",
            )}
          >
            <Logo compact={solid} className="relative z-[60] justify-self-start" />

            <nav aria-label="Primary" className="hidden items-center gap-8 md:flex lg:gap-10">
              {nav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "group/nav relative py-2 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-300",
                      active ? "text-forest" : "text-ink/65 hover:text-forest",
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden
                      className={clsx(
                        "absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold transition-[opacity,transform] duration-500 ease-out-expo",
                        active ? "scale-100 opacity-100" : "scale-0 opacity-0 group-hover/nav:scale-100 group-hover/nav:opacity-60",
                      )}
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="hidden items-center justify-self-end gap-3 md:flex">
              <a
                href={`https://wa.me/${site.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Message us on WhatsApp"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-forest transition-colors duration-300 hover:border-forest hover:bg-forest hover:text-cream"
              >
                <WhatsAppGlyph className="h-[1.1rem] w-[1.1rem]" />
              </a>
              <Link
                href="/products"
                className="group/shop inline-flex h-10 items-center gap-2 rounded-full bg-forest pl-5 pr-4 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-cream transition-colors duration-300 hover:bg-forest-deep"
              >
                Shop
                <LogoMark className="h-3.5 w-4 transition-transform duration-500 ease-out-expo group-hover/shop:-rotate-12" />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="site-menu"
              className="relative z-[60] flex h-11 w-11 items-center justify-center justify-self-end rounded-full border border-ink/15 text-ink md:hidden"
            >
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              <span className={clsx("absolute h-px w-5 bg-current transition-transform duration-500 ease-out-expo", open ? "rotate-45" : "-translate-y-[3.5px]")} />
              <span className={clsx("absolute h-px w-5 bg-current transition-transform duration-500 ease-out-expo", open ? "-rotate-45" : "translate-y-[3.5px]")} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        id="site-menu"
        ref={menu}
        className="parchment invisible fixed inset-0 z-40 flex flex-col justify-between px-6 pb-8 pt-28 opacity-0 md:hidden"
        style={{ pointerEvents: "none" }}
        aria-hidden={!open}
      >
        <LeafSprig className="pointer-events-none absolute -right-8 top-24 h-72 w-auto text-forest/10" />
        <nav aria-label="Mobile" className="flex flex-col">
          {[{ href: "/", label: "Home" }, ...nav].map((item) => (
            <div key={item.href} className="overflow-hidden border-b border-ink/10 py-3">
              <Link data-menu-link href={item.href} className="font-display block text-[2.6rem] leading-none text-forest" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            </div>
          ))}
        </nav>
        <div className="flex flex-col gap-3">
          <a data-menu-meta href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className="eyebrow flex items-center gap-2 text-forest">
            <WhatsAppGlyph className="h-4 w-4" /> WhatsApp {site.phoneDisplay}
          </a>
          <a data-menu-meta href={`mailto:${site.email}`} className="eyebrow text-ink/70">
            {site.email}
          </a>
          <a data-menu-meta href={site.instagram} target="_blank" rel="noopener noreferrer" className="eyebrow text-gold">
            Instagram {site.instagramHandle}
          </a>
        </div>
      </div>
    </>
  );
}
