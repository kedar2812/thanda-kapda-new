"use client";

import { phoneHref, whatsappLink } from "@/content";
import { useContent } from "@/content/ContentProvider";
import { Rich } from "@/components/cms/Rich";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { BulkForm } from "@/components/BulkForm";
import { Faq } from "@/components/Faq";
import { LeafSprig, Stamp } from "@/components/ui/Ornaments";
import { LogoMark } from "@/components/ui/Logo";
import { Industries } from "@/components/Industries";
import { TornPanel } from "@/components/ui/TornPanel";
import { Button } from "@/components/ui/Button";
import { RingIcon } from "@/components/ui/Icons";

export function BulkView() {
  const c = useContent();
  const b = c.bulk;
  const faqs = c.faq.items.filter((f) => f.bulk);
  return (
    <>
      <PageHeader cms="bulk.header" eyebrow={b.eyebrow} title={b.title} intro={b.intro} />

      {/* Who */}
      <section data-cms="bulk.who" className="container-wide py-20 md:py-28">
        <Reveal stagger={0.1} y={44} className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {b.who.map((w, i) => (
            <figure key={i} className="group">
              <ParallaxImage
                image={w.image}
                className="aspect-[4/5]"
                speed={0.1}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                imgClassName="transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.04]"
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
      <section data-cms="bulk.how" className="relative overflow-hidden border-t border-ink/10 py-24 md:py-32" aria-labelledby="how-title">
        <LeafSprig className="pointer-events-none absolute -left-14 bottom-0 h-[26rem] w-auto text-forest/[0.06]" />
        <div className="container-wide grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="eyebrow text-gold">{b.howEyebrow}</p>
            </Reveal>
            <SplitReveal as="h2" id="how-title" className="display-2 mt-6 text-forest">
              <Rich text={b.howTitle} />
            </SplitReveal>
            <Reveal stagger={0.1} className="mt-12 space-y-8">
              {b.how.map((h, i) => (
                <div key={i} className="flex gap-6 border-t border-ink/10 pt-6">
                  <span className="font-display text-[2rem] leading-none text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-display text-[1.4rem] text-forest">{h.title}</h3>
                    <p className="mt-2 text-[0.95rem] text-ink/70">{h.text}</p>
                  </div>
                </div>
              ))}
            </Reveal>
            <Reveal delay={0.1} className="mt-12 flex items-center gap-6">
              <Stamp text={b.stamp} className="w-28 shrink-0">
                <LogoMark className="h-8 w-9 text-forest" />
              </Stamp>
              <p className="text-[0.95rem] text-ink/70">
                {b.talkPrompt}{" "}
                <a href={phoneHref(c)} className="link-line text-forest">
                  {c.site.phoneDisplay}
                </a>
                <br />
                <a href={whatsappLink(c)} target="_blank" rel="noopener noreferrer" className="link-line text-forest">
                  {b.whatsappLabel}
                </a>
              </p>
            </Reveal>
          </div>

          <Reveal id="bulk-form" delay={0.1} y={48} className="scroll-mt-28 rounded-md border border-ink/10 bg-cream-50/70 p-6 shadow-paper sm:p-8 lg:col-span-7 lg:p-10">
            <div data-cms="bulk.form">
              <p className="eyebrow text-ink/55">{b.formEyebrow}</p>
              <h2 className="display-3 mt-3 text-forest">
                <Rich text={b.formTitle} />
              </h2>
              <div className="mt-8">
                <BulkForm />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Industries */}
      <section className="container-wide pb-24 md:pb-32">
        <Industries />
      </section>

      {/* Distributor programme */}
      <section data-cms="bulk.distributor" className="relative" aria-labelledby="distributor-title">
        <TornPanel side="top" seed={51} amplitude={0.5} className="torn-strip w-full" />
        <div className="parchment-dark text-cream">
          <div className="container-wide py-24 md:py-32">
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <Reveal>
                  <p className="eyebrow text-gold-light">{b.distributorEyebrow}</p>
                </Reveal>
                <SplitReveal as="h2" id="distributor-title" className="display-2 mt-6 uppercase text-cream">
                  <Rich text={b.distributorTitle} />
                </SplitReveal>
                <Reveal delay={0.1}>
                  <p className="script mt-8 text-[1.5rem] text-gold-light">{b.distributorScript}</p>
                  <p className="mt-6 max-w-sm text-cream/75">{b.distributorText}</p>
                  <div className="mt-10">
                    <Button href="#bulk-form" variant="cream" arrow>
                      {b.distributorCta}
                    </Button>
                  </div>
                </Reveal>
              </div>
              <Reveal stagger={0.07} className="grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:col-span-8">
                {b.benefits.map((x, i) => (
                  <div key={i} className="flex gap-5">
                    <RingIcon name={x.icon} tone="gold" />
                    <div>
                      <p className="font-display text-[1.3rem] text-cream">{x.title}</p>
                      <p className="mt-1.5 text-[0.92rem] text-cream/70">{x.text}</p>
                    </div>
                  </div>
                ))}
              </Reveal>
            </div>
          </div>
        </div>
        <TornPanel side="bottom" seed={53} amplitude={0.5} className="torn-strip w-full" />
      </section>

      {faqs.length > 0 && (
        <section data-cms="faq" className="container-wide pb-24 pt-8 md:pb-32">
          <Reveal>
            <p className="eyebrow text-gold">{b.faqEyebrow}</p>
          </Reveal>
          <Reveal delay={0.1} className="mt-8">
            <Faq items={faqs} defaultOpen={null} />
          </Reveal>
        </section>
      )}
    </>
  );
}
