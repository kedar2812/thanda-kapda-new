import { faqs } from "@/data/faq";
import { Faq } from "@/components/Faq";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { site } from "@/data/site";

export function FaqSection() {
  return (
    <section className="py-24 md:py-36" aria-labelledby="faq-title">
      <div className="container-wide grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Reveal>
            <p className="eyebrow text-gold">Questions</p>
          </Reveal>
          <SplitReveal as="h2" id="faq-title" className="display-3 mt-6 text-forest">
            The things people ask before they order.
          </SplitReveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xs text-ink/70">
              Anything else? Write to{" "}
              <a href={`mailto:${site.email}`} className="link-line text-forest">
                {site.email}
              </a>{" "}
              or message us on WhatsApp.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="lg:col-span-8">
          <Faq items={faqs} />
        </Reveal>
      </div>
    </section>
  );
}
