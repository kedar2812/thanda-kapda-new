import type { Metadata } from "next";
import Image from "next/image";
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

export const metadata: Metadata = {
  title: "Our story",
  description:
    "Thanda Kapda Co. began with the Indian custom of handing a guest a cool, damp cloth. This is how that gesture became an aloe wipe in a sachet.",
};

const steps = [
  { n: "01", title: "Formulate", text: "An aloe base, pH neutral, with no alcohol and no parabens. Vitamin E for Morning Spring; centella, lemongrass and a little menthol for Namasté." },
  { n: "02", title: "Soak", text: "A soft non-woven sheet, cut to fifteen by twenty centimetres, is saturated so it is properly wet without dripping." },
  { n: "03", title: "Seal", text: "Every sheet is folded and sealed on its own. That is why the last sachet in the box is as fresh as the first." },
  { n: "04", title: "Box", text: "Packed in hundreds for homes, tables and trays. Printed to order for the brands that ask." },
];

const values = [
  { title: "Pure and natural", text: "Crafted with nature's finest ingredients. Zero parabens, zero alcohol. Just clean, honest care." },
  { title: "The cool ritual", text: "Inspired by generations of Indian wellness traditions. A refreshing experience your skin deserves." },
  { title: "Eco conscious", text: "Recyclable packaging. Cruelty-free. Built for a planet we all share." },
];

export default function StoryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our story"
        title="The oldest welcome in India."
        intro="Before anyone offered you tea, someone handed you a cold cloth. Thanda Kapda Co. is that gesture, folded into a sachet."
      />

      {/* Narrative */}
      <section className="container-wide relative py-20 md:py-28">
        <LeafSprig className="pointer-events-none absolute -right-16 top-0 h-[28rem] w-auto text-forest/[0.06]" />
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="max-w-xl space-y-6 text-[1.08rem] leading-relaxed text-ink/80">
              <SplitReveal stagger={0.05} duration={1}>
                In most Indian homes the cold cloth arrives without being asked for. On a forehead when a fever
                climbs. Across the back of the neck after a long bus ride in May. Passed around a table when the
                last roti is gone and everyone&rsquo;s hands smell of ghee and lime.
              </SplitReveal>
              <SplitReveal stagger={0.05} duration={1}>
                It is such a small thing that nobody thinks of it as hospitality. But it is the first thing a guest
                feels, and the last thing they remember about a meal.
              </SplitReveal>
              <SplitReveal stagger={0.05} duration={1}>
                We started Thanda Kapda Co. to carry that gesture out of the house. Restaurants wanted it. So did
                wedding planners, hotels, airlines and the people who sit in traffic for a living. What they needed
                was the same cool relief without a bowl of water and a wrung-out towel: something sealed, clean, and
                small enough for a pocket.
              </SplitReveal>
              <SplitReveal stagger={0.05} duration={1}>
                So we built the wipe the way the cloth would be built today. Soaked in aloe rather than tap water.
                Free of the alcohol that leaves skin tight and stinging. Sealed one at a time. Printed with a mountain
                valley, or with the meaning of the word namasté, so that even the wrapper says something kind.
              </SplitReveal>
            </div>
            <Reveal className="mt-10">
              <Flourish />
            </Reveal>
          </div>

          <div className="relative lg:col-span-6">
            <Reveal className="polaroid relative z-10 ml-auto w-[82%] rotate-[2deg]" y={50}>
              <span className="tape -top-2 right-10 rotate-[8deg]" aria-hidden />
              <ParallaxImage
                src="/products/morning-spring-box.jpg"
                alt="An open case of one hundred Morning Spring sachets"
                className="aspect-[4/3]"
                speed={0.1}
                sizes="(min-width: 1024px) 40vw, 82vw"
              />
              <p className="script mt-3 text-[1.05rem] text-ink/80">Sealed one at a time. Boxed in hundreds.</p>
            </Reveal>
            <Reveal className="polaroid absolute -bottom-10 left-0 z-20 w-[50%] rotate-[-4deg]" y={60} delay={0.15}>
              <span className="tape -left-5 top-4 rotate-[-30deg]" aria-hidden />
              <ParallaxImage
                src="/products/namaste-cafe.jpg"
                alt="Namasté sachet standing on a café table"
                className="aspect-[3/2]"
                speed={0.14}
                sizes="(min-width: 1024px) 24vw, 50vw"
              />
              <p className="script mt-3 text-[1.05rem] text-ink/80">namasté (nah-mah-stay)</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Vision & mission */}
      <section className="container-wide pb-24 md:pb-32" aria-label="Vision and mission">
        <VisionMission />
      </section>

      {/* Journey timeline */}
      <section className="container-wide pb-24 md:pb-32" aria-labelledby="timeline-title">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="eyebrow text-gold">Estd. 2025</p>
            </Reveal>
            <SplitReveal as="h2" id="timeline-title" className="display-2 mt-6 uppercase text-forest">
              Journey
            </SplitReveal>
            <Reveal delay={0.1}>
              <Flourish className="mt-8" />
              <p className="script mt-8 text-[1.5rem] text-forest/80">A fresh tradition. Now, everywhere.</p>
              <p className="mt-6 max-w-sm text-ink/70">
                From a single sachet on Amazon India to printed wipes on restaurant tables. The next chapter is distributors
                abroad.
              </p>
              <p className="script mt-10 text-[1.6rem] text-gold">More countries, coming soon.</p>
            </Reveal>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <Timeline />
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="relative" aria-labelledby="process-title">
        <TornPanel side="top" seed={41} amplitude={0.5} className="torn-strip w-full" />
        <div className="parchment-dark text-cream">
          <div className="container-wide py-24 md:py-32">
            <div className="max-w-3xl">
              <Reveal>
                <p className="eyebrow text-gold-light">How a wipe is made</p>
              </Reveal>
              <SplitReveal as="h2" id="process-title" className="display-2 mt-6 text-cream">
                Four steps, none of them rushed.
              </SplitReveal>
            </div>
            <Reveal stagger={0.1} y={40} className="mt-16 grid gap-px overflow-hidden rounded-md bg-cream/10 md:grid-cols-4">
              {steps.map((s) => (
                <div key={s.n} className="bg-forest p-8">
                  <p className="font-display text-[2.4rem] leading-none text-gold-light">{s.n}</p>
                  <h3 className="display-3 mt-6 text-cream">{s.title}</h3>
                  <p className="mt-4 text-[0.95rem] text-cream/70">{s.text}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
        <TornPanel side="bottom" seed={43} amplitude={0.5} className="torn-strip w-full" />
      </section>

      {/* Values */}
      <section className="container-wide py-24 md:py-32" aria-labelledby="values-title">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <p className="eyebrow text-gold">What we hold to</p>
            </Reveal>
            <SplitReveal as="h2" id="values-title" className="display-3 mt-6 text-forest">
              Rooted in nature. Refined for you.
            </SplitReveal>
            <Reveal delay={0.1} className="mt-10 flex items-center gap-6">
              <Stamp text="BORN IN INDIA · MADE FOR THE WORLD · " className="w-32 shrink-0">
                <LogoMark className="h-9 w-10 text-forest" />
              </Stamp>
              <Postage className="w-24 rotate-[6deg]">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image src="/products/morning-spring-sachet.jpg" alt="" fill sizes="96px" className="object-cover" />
                </div>
              </Postage>
            </Reveal>
          </div>
          <Reveal stagger={0.1} className="grid gap-10 sm:grid-cols-3 lg:col-span-8">
            {values.map((v, i) => (
              <div key={v.title} className="border-t border-ink/15 pt-6">
                <p className="eyebrow text-ink/45">0{i + 1}</p>
                <h3 className="font-display mt-4 text-[1.6rem] text-forest">{v.title}</h3>
                <p className="mt-3 text-ink/70">{v.text}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="container-wide pb-24 md:pb-32">
        <Reveal className="flex flex-col items-start gap-6 border-t border-ink/10 pt-12 md:flex-row md:items-center md:justify-between">
          <h2 className="display-3 max-w-xl text-forest">Enough reading. Try one.</h2>
          <div className="flex flex-wrap gap-3">
            <Button href="/products" arrow>
              Shop the wipes
            </Button>
            <Button href="/bulk" variant="outline">
              Bulk &amp; custom
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
