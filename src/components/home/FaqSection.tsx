"use client";

import { Faq } from "@/components/Faq";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Rich } from "@/components/cms/Rich";
import { useContent } from "@/content/ContentProvider";

export function FaqSection() {
  const c = useContent();
  const f = c.faq;
  // "{email}" in the prompt becomes a mail link.
  const [before, after = ""] = f.prompt.split("{email}");
  return (
    <section data-cms="faq" className="py-24 md:py-36" aria-labelledby="faq-title">
      <div className="container-wide grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Reveal>
            <p className="eyebrow text-gold">{f.eyebrow}</p>
          </Reveal>
          <SplitReveal as="h2" id="faq-title" className="display-3 mt-6 text-forest">
            <Rich text={f.title} />
          </SplitReveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xs text-ink/70">
              {before}
              {f.prompt.includes("{email}") && (
                <a href={`mailto:${c.site.email}`} className="link-line text-forest">
                  {c.site.email}
                </a>
              )}
              {after}
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="lg:col-span-8">
          <Faq items={f.items} />
        </Reveal>
      </div>
    </section>
  );
}
