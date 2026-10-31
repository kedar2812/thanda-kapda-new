"use client";

import { useContent } from "@/content/ContentProvider";
import { CmsImage } from "@/components/cms/CmsImage";
import { Rich } from "@/components/cms/Rich";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { Button } from "@/components/ui/Button";
import { Flourish, LeafSprig, Postage, Stamp } from "@/components/ui/Ornaments";
import { LogoMark } from "@/components/ui/Logo";
import { TornPanel } from "@/components/ui/TornPanel";
import { VisionMission } from "@/components/VisionMission";
import { Timeline } from "@/components/Timeline";

export function StoryView() {
  const s = useContent().story;
  return (
    <>
      <PageHeader cms="story.header" eyebrow={s.eyebrow} title={s.title} intro={s.intro} />

      {/* Narrative */}
      <section data-cms="story.narrative" className="container-wide relative py-20 md:py-28">
        <LeafSprig className="pointer-events-none absolute -right-16 top-0 h-[28rem] w-auto text-forest/[0.06]" />
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="max-w-xl space-y-6 text-[1.08rem] leading-relaxed text-ink/80">
              {s.narrative.map((p, i) => (
                <SplitReveal key={i} stagger={0.05} duration={1}>
                  {p}
                </SplitReveal>
              ))}
            </div>
            <Reveal className="mt-10">
              <Flourish />
            </Reveal>
          </div>

          <div className="relative lg:col-span-6">
            <Reveal className="polaroid relative z-10 ml-auto w-[82%] rotate-[2deg]" y={50}>
              <span className="tape -top-2 right-10 rotate-[8deg]" aria-hidden />
              <ParallaxImage image={s.photoOne} className="aspect-[4/3]" speed={0.1} sizes="(min-width: 1024px) 40vw, 82vw" />
              {s.photoOneCaption && <p className="script mt-3 text-[1.05rem] text-ink/80">{s.photoOneCaption}</p>}
            </Reveal>
            <Reveal className="polaroid absolute -bottom-10 left-0 z-20 w-[50%] rotate-[-4deg]" y={60} delay={0.15}>
              <span className="tape -left-5 top-4 rotate-[-30deg]" aria-hidden />
              <ParallaxImage image={s.photoTwo} className="aspect-[3/2]" speed={0.14} sizes="(min-width: 1024px) 24vw, 50vw" />
              {s.photoTwoCaption && <p className="script mt-3 text-[1.05rem] text-ink/80">{s.photoTwoCaption}</p>}
            </Reveal>
          </div>
        </div>
      </section>

      {/* Vision & mission */}
      <section data-cms="story.vision" className="container-wide pb-24 md:pb-32" aria-label="Vision and mission">
        <VisionMission />
      </section>

      {/* Journey timeline */}
      <section data-cms="story.timeline" className="container-wide pb-24 md:pb-32" aria-labelledby="timeline-title">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="eyebrow text-gold">{s.timelineEyebrow}</p>
            </Reveal>
            <SplitReveal as="h2" id="timeline-title" className="display-2 mt-6 uppercase text-forest">
              <Rich text={s.timelineTitle} />
            </SplitReveal>
            <Reveal delay={0.1}>
              <Flourish className="mt-8" />
              <p className="script mt-8 text-[1.5rem] text-forest/80">{s.timelineScript}</p>
              <p className="mt-6 max-w-sm text-ink/70">{s.timelineText}</p>
              <p className="script mt-10 text-[1.6rem] text-gold">{s.timelineClosing}</p>
            </Reveal>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <Timeline />
          </div>
        </div>
      </section>

      {/* Process */}
      <section data-cms="story.process" className="relative" aria-labelledby="process-title">
        <TornPanel side="top" seed={41} amplitude={0.5} className="torn-strip w-full" />
        <div className="parchment-dark text-cream">
          <div className="container-wide py-24 md:py-32">
            <div className="max-w-3xl">
              <Reveal>
                <p className="eyebrow text-gold-light">{s.processEyebrow}</p>
              </Reveal>
              <SplitReveal as="h2" id="process-title" className="display-2 mt-6 text-cream">
                <Rich text={s.processTitle} />
              </SplitReveal>
            </div>
            <Reveal stagger={0.1} y={40} className="mt-16 grid gap-px overflow-hidden rounded-md bg-cream/10 md:grid-cols-4">
              {s.process.map((step, i) => (
                <div key={i} className="bg-forest p-8">
                  <p className="font-display text-[2.4rem] leading-none text-gold-light">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="display-3 mt-6 text-cream">{step.title}</h3>
                  <p className="mt-4 text-[0.95rem] text-cream/70">{step.text}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
        <TornPanel side="bottom" seed={43} amplitude={0.5} className="torn-strip w-full" />
      </section>

      {/* Values */}
      <section data-cms="story.values" className="container-wide py-24 md:py-32" aria-labelledby="values-title">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <p className="eyebrow text-gold">{s.valuesEyebrow}</p>
            </Reveal>
            <SplitReveal as="h2" id="values-title" className="display-3 mt-6 text-forest">
              <Rich text={s.valuesTitle} />
            </SplitReveal>
            <Reveal delay={0.1} className="mt-10 flex items-center gap-6">
              <Stamp text={s.valuesStamp} className="w-32 shrink-0">
                <LogoMark className="h-9 w-10 text-forest" />
              </Stamp>
              <Postage className="w-24 rotate-[6deg]">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <CmsImage image={s.valuesPhoto} alt="" sizes="96px" />
                </div>
              </Postage>
            </Reveal>
          </div>
          <Reveal stagger={0.1} className="grid gap-10 sm:grid-cols-3 lg:col-span-8">
            {s.values.map((v, i) => (
              <div key={i} className="border-t border-ink/15 pt-6">
                <p className="eyebrow text-ink/45">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="font-display mt-4 text-[1.6rem] text-forest">{v.title}</h3>
                <p className="mt-3 text-ink/70">{v.text}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section data-cms="story.closing" className="container-wide pb-24 md:pb-32">
        <Reveal className="flex flex-col items-start gap-6 border-t border-ink/10 pt-12 md:flex-row md:items-center md:justify-between">
          <h2 className="display-3 max-w-xl text-forest">
            <Rich text={s.closingTitle} />
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button href="/products" arrow>
              {s.closingPrimary}
            </Button>
            <Button href="/bulk" variant="outline">
              {s.closingSecondary}
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
