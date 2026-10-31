"use client";

import Link from "next/link";
import { Logo, LogoMark } from "@/components/ui/Logo";
import { LeafSprig, Stamp } from "@/components/ui/Ornaments";
import { Reveal } from "@/components/motion/Reveal";
import { Rich } from "@/components/cms/Rich";
import { phoneHref, safeUrl, whatsappLink } from "@/content";
import { useContent } from "@/content/ContentProvider";
import { navItems } from "./Nav";

export function Footer() {
  const c = useContent();
  const f = c.footer;
  return (
    <footer data-cms="footer" className="parchment-dark relative overflow-hidden text-cream">
      <LeafSprig className="pointer-events-none absolute -left-10 bottom-0 h-[26rem] w-auto text-cream/[0.06]" />
      <LeafSprig flip className="pointer-events-none absolute -right-6 top-6 h-64 w-auto text-cream/[0.06]" />

      <div className="container-wide relative py-20 md:py-28">
        <div className="grid gap-14 md:grid-cols-12 md:gap-10">
          <Reveal className="md:col-span-7">
            <p className="eyebrow text-gold-light">{f.eyebrow}</p>
            <h2 className="display-2 mt-6 text-cream">
              <Rich text={f.title} em="text-gold-light" />
            </h2>
            <p className="mt-6 max-w-md text-cream/70">{f.text}</p>
            <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              <a href={phoneHref(c)} className="link-line font-display text-2xl text-cream">
                {c.site.phoneDisplay}
              </a>
              <a href={`mailto:${c.site.email}`} className="link-line font-display text-2xl text-cream">
                {c.site.email}
              </a>
            </div>
          </Reveal>

          <div className="grid gap-10 sm:grid-cols-2 md:col-span-5">
            <Reveal delay={0.1}>
              <p className="eyebrow text-cream/50">{f.explore}</p>
              <ul className="mt-5 space-y-3">
                {[{ href: "/", label: c.site.nav.home }, ...navItems(c)].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="link-line text-cream/85 transition-colors hover:text-cream">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="eyebrow text-cream/50">{f.findUs}</p>
              <ul className="mt-5 space-y-3">
                <li>
                  <a href={safeUrl(c.site.instagram)} target="_blank" rel="noopener noreferrer" className="link-line text-cream/85 hover:text-cream">
                    Instagram {c.site.instagramHandle}
                  </a>
                </li>
                <li>
                  <a href={safeUrl(c.site.amazonStore)} target="_blank" rel="noopener noreferrer" className="link-line text-cream/85 hover:text-cream">
                    {f.amazonLabel}
                  </a>
                </li>
                <li>
                  <a href={whatsappLink(c)} target="_blank" rel="noopener noreferrer" className="link-line text-cream/85 hover:text-cream">
                    WhatsApp
                  </a>
                </li>
              </ul>
              <Stamp text={f.stamp} tone="gold" className="mt-10 w-28">
                <LogoMark className="h-8 w-9 text-gold-light" />
              </Stamp>
            </Reveal>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-6 border-t border-cream/10 pt-8 md:flex-row md:items-end md:justify-between">
          <Logo tone="cream" />
          <p className="text-[0.75rem] uppercase tracking-[0.18em] text-cream/45" suppressHydrationWarning>
            © {new Date().getFullYear()} {c.site.name} · {c.site.origin}
          </p>
        </div>
      </div>
    </footer>
  );
}
