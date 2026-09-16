import Link from "next/link";
import { nav, site } from "@/data/site";
import { Logo, LogoMark } from "@/components/ui/Logo";
import { LeafSprig, Stamp } from "@/components/ui/Ornaments";
import { Reveal } from "@/components/motion/Reveal";

export function Footer() {
  return (
    <footer className="parchment-dark relative overflow-hidden text-cream">
      <LeafSprig className="pointer-events-none absolute -left-10 bottom-0 h-[26rem] w-auto text-cream/[0.06]" />
      <LeafSprig flip className="pointer-events-none absolute -right-6 top-6 h-64 w-auto text-cream/[0.06]" />

      <div className="container-wide relative py-20 md:py-28">
        <div className="grid gap-14 md:grid-cols-12 md:gap-10">
          <Reveal className="md:col-span-7">
            <p className="eyebrow text-gold-light">Thanda Kapda Co.</p>
            <h2 className="display-2 mt-6 text-cream">
              Keep it cool
              <br />
              <em className="text-gold-light">and fresh.</em>
            </h2>
            <p className="mt-6 max-w-md text-cream/70">
              Eco-friendly wet wipes inspired by the Indian custom of handing a guest a cool cloth.
              Aloe-soaked, alcohol-free, and sealed one at a time.
            </p>
            <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              <a href={site.phoneHref} className="link-line font-display text-2xl text-cream">
                {site.phoneDisplay}
              </a>
              <a href={`mailto:${site.email}`} className="link-line font-display text-2xl text-cream">
                {site.email}
              </a>
            </div>
          </Reveal>

          <div className="grid gap-10 sm:grid-cols-2 md:col-span-5">
            <Reveal delay={0.1}>
              <p className="eyebrow text-cream/50">Explore</p>
              <ul className="mt-5 space-y-3">
                {[{ href: "/", label: "Home" }, ...nav].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="link-line text-cream/85 transition-colors hover:text-cream">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="eyebrow text-cream/50">Find us</p>
              <ul className="mt-5 space-y-3">
                <li>
                  <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="link-line text-cream/85 hover:text-cream">
                    Instagram {site.instagramHandle}
                  </a>
                </li>
                <li>
                  <a href={site.amazonStore} target="_blank" rel="noopener noreferrer" className="link-line text-cream/85 hover:text-cream">
                    Amazon India store
                  </a>
                </li>
                <li>
                  <a
                    href={`https://wa.me/${site.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-line text-cream/85 hover:text-cream"
                  >
                    WhatsApp
                  </a>
                </li>
              </ul>
              <Stamp text="BORN IN INDIA · MADE FOR THE WORLD · " tone="gold" className="mt-10 w-28">
                <LogoMark className="h-8 w-9 text-gold-light" />
              </Stamp>
            </Reveal>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-6 border-t border-cream/10 pt-8 md:flex-row md:items-end md:justify-between">
          <Logo tone="cream" />
          <p className="text-[0.75rem] uppercase tracking-[0.18em] text-cream/45">
            © {new Date().getFullYear()} Thanda Kapda Co. · {site.origin}
          </p>
        </div>
      </div>
    </footer>
  );
}
