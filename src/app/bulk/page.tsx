import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { BulkForm } from "@/components/BulkForm";
import { Faq } from "@/components/Faq";
import { faqs } from "@/data/faq";
import { site } from "@/data/site";
import { LeafSprig, Stamp } from "@/components/ui/Ornaments";
import { LogoMark } from "@/components/ui/Logo";
import { Industries } from "@/components/Industries";
import { TornPanel } from "@/components/ui/TornPanel";
import { Button } from "@/components/ui/Button";
import { RingIcon } from "@/components/ui/Icons";
import { distributorBenefits } from "@/data/industries";

export const metadata: Metadata = {
  title: "Bulk & custom orders",
  description:
    "Order Morning Spring and Namasté wet wipes by the case, or have single sachets printed with your branding for restaurants, hotels, airlines, weddings and offices.",
};

const who = [
  { title: "Restaurants & cafés", text: "Served with the bill or set at each cover. Namasté was designed for exactly this moment.", img: "/products/namaste-cafe.jpg", alt: "Namasté sachet on a café table" },
  { title: "Hotels & resorts", text: "On the welcome tray, in the room, by the pool. A small thing guests mention in reviews.", img: "/products/morning-spring-hotel.jpg", alt: "Morning Spring sachet on a hotel tray" },
  { title: "Weddings & events", text: "One at every place setting, or tucked into welcome kits. Printed with the couple's names if you like.", img: "/products/morning-spring-table.jpg", alt: "Morning Spring sachet on a wedding table" },
  { title: "Offices, gyms & travel", text: "Pantries, lockers, glove boxes and long-haul seats. Anywhere people arrive hot and want to feel put together.", img: "/products/namaste-gym.jpg", alt: "Namasté sachet on a gym bench" },
];

const how = [
  { n: "01", title: "Tell us the occasion", text: "Quantity, the wipe you prefer, and whether you want your own artwork on the sachet." },
  { n: "02", title: "We come back with numbers", text: "Pricing by quantity and a realistic lead time, not a brochure." },
  { n: "03", title: "Print, pack, deliver", text: "Sealed one at a time, boxed in hundreds, delivered where you need them." },
];

export default function BulkPage() {
  return (
    <>
      <PageHeader
        eyebrow="Bulk & custom orders"
        title="Your brand on every table."
        intro="Both wipes by the case, or single sachets printed with your name. Tell us the quantity and the occasion and we will come back with pricing and lead times."
      />

      {/* Who */}
      <section className="container-wide py-20 md:py-28">
        <Reveal stagger={0.1} y={44} className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {who.map((w) => (
            <figure key={w.title} className="group">
              <ParallaxImage
                src={w.img}
                alt={w.alt}
                className="aspect-[4/5]"
                speed={0.1}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                imgClassName={`transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.04] ${w.img.includes("hotel") ? "object-bottom" : ""}`}
              />
              <figcaption className="mt-5">
                <h2 className="font-display text-[1.5rem] text-forest">{w.title}</h2>
                <p className="mt-2 text-[0.95rem] text-ink/70">{w.text}</p>
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </section>

      {/* How + form */}
      <section className="relative overflow-hidden border-t border-ink/10 py-24 md:py-32" aria-labelledby="how-title">
        <LeafSprig className="pointer-events-none absolute -left-14 bottom-0 h-[26rem] w-auto text-forest/[0.06]" />
        <div className="container-wide grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="eyebrow text-gold">How it works</p>
            </Reveal>
            <SplitReveal as="h2" id="how-title" className="display-2 mt-6 text-forest">
              Three steps. No brochure.
            </SplitReveal>
            <Reveal stagger={0.1} className="mt-12 space-y-8">
              {how.map((h) => (
                <div key={h.n} className="flex gap-6 border-t border-ink/10 pt-6">
                  <span className="font-display text-[2rem] leading-none text-gold">{h.n}</span>
                  <div>
                    <h3 className="font-display text-[1.4rem] text-forest">{h.title}</h3>
                    <p className="mt-2 text-[0.95rem] text-ink/70">{h.text}</p>
                  </div>
                </div>
              ))}
            </Reveal>
            <Reveal delay={0.1} className="mt-12 flex items-center gap-6">
              <Stamp text="CUSTOM PRINTED · MADE IN INDIA · " className="w-28 shrink-0">
                <LogoMark className="h-8 w-9 text-forest" />
              </Stamp>
              <p className="text-[0.95rem] text-ink/70">
                Rather talk it through?{" "}
                <a href={site.phoneHref} className="link-line text-forest">
                  {site.phoneDisplay}
                </a>
                <br />
                <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className="link-line text-forest">
                  WhatsApp us
                </a>
              </p>
            </Reveal>
          </div>

          <Reveal id="bulk-form" delay={0.1} y={48} className="scroll-mt-28 rounded-md border border-ink/10 bg-cream-50/70 p-6 shadow-paper sm:p-8 lg:col-span-7 lg:p-10">
            <p className="eyebrow text-ink/55">Bulk order enquiry</p>
            <h2 className="display-3 mt-3 text-forest">Tell us what you need.</h2>
            <div className="mt-8">
              <BulkForm />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Industries */}
      <section className="container-wide pb-24 md:pb-32">
        <Industries />
      </section>

      {/* Distributor programme */}
      <section className="relative" aria-labelledby="distributor-title">
        <TornPanel side="top" seed={51} amplitude={0.5} className="torn-strip w-full" />
        <div className="parchment-dark text-cream">
          <div className="container-wide py-24 md:py-32">
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <Reveal>
                  <p className="eyebrow text-gold-light">Distributor programme</p>
                </Reveal>
                <SplitReveal as="h2" id="distributor-title" className="display-2 mt-6 uppercase text-cream">
                  Grow with us.
                </SplitReveal>
                <Reveal delay={0.1}>
                  <p className="script mt-8 text-[1.5rem] text-gold-light">From our reach, to the world.</p>
                  <p className="mt-6 max-w-sm text-cream/75">
                    We are building a network of distributors for the Middle East, Africa, Europe and Southeast Asia. If you
                    know your market, we will bring the product, the collateral and the support.
                  </p>
                  <div className="mt-10">
                    <Button href="#bulk-form" variant="cream" arrow>
                      Apply to distribute
                    </Button>
                  </div>
                </Reveal>
              </div>
              <Reveal stagger={0.07} className="grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:col-span-8">
                {distributorBenefits.map((b) => (
                  <div key={b.title} className="flex gap-5">
                    <RingIcon name={b.icon} tone="gold" />
                    <div>
                      <p className="font-display text-[1.3rem] text-cream">{b.title}</p>
                      <p className="mt-1.5 text-[0.92rem] text-cream/70">{b.text}</p>
                    </div>
                  </div>
                ))}
              </Reveal>
            </div>
          </div>
        </div>
        <TornPanel side="bottom" seed={53} amplitude={0.5} className="torn-strip w-full" />
      </section>

      <section className="container-wide pb-24 pt-8 md:pb-32">
        <Reveal>
          <p className="eyebrow text-gold">Before you ask</p>
        </Reveal>
        <Reveal delay={0.1} className="mt-8">
          <Faq items={faqs.filter((f) => /bulk|internationally|return|big/i.test(f.q))} defaultOpen={null} />
        </Reveal>
      </section>
    </>
  );
}
