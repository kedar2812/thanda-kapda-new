import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { RingIcon, type IconName } from "@/components/ui/Icons";
import { LeafSprig } from "@/components/ui/Ornaments";
import { BrushNote } from "@/components/ui/Paper";
import { ParallaxImage } from "@/components/motion/ParallaxImage";

const facts: { icon: IconName; title: string; text: string }[] = [
  { icon: "dropCircle", title: "Alcohol & paraben free", text: "Gentle formulas on an aloe base." },
  { icon: "recycleCircle", title: "Recyclable packaging", text: "Designed with less waste in mind." },
  { icon: "leafCircle", title: "Cruelty-free", text: "Never tested on animals." },
  { icon: "shield", title: "pH neutral", text: "Kind to every skin type." },
];

const better: { icon: IconName; title: string; text: string }[] = [
  { icon: "handsHeart", title: "Better for guests", text: "Safe, gentle and refreshing." },
  { icon: "globe", title: "Better for nature", text: "Thoughtful choices, today." },
  { icon: "shield", title: "Better standards", text: "Careful sourcing, rigorous quality." },
  { icon: "users", title: "Better future", text: "Together, for a healthier planet." },
];

/** C17/C19 "Good for hospitality. Kind to the planet." */
export function Planet() {
  return (
    <section className="relative overflow-hidden bg-forest-deep text-cream" aria-labelledby="planet-title">
      <div className="absolute inset-0 opacity-25 blur-[6px]">
        <ParallaxImage src="/products/namaste-gym.jpg" alt="" className="h-full w-full !rounded-none" speed={0.2} sizes="100vw" imgClassName="object-cover grayscale-[40%]" />
      </div>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-forest-deep via-forest-deep/92 to-forest-deep/55" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_85%_20%,rgb(217_176_106/0.18),transparent_70%)]" />
      <LeafSprig flip className="pointer-events-none absolute -right-10 bottom-0 h-[28rem] w-auto text-gold-light/15" />

      <div className="container-wide relative py-24 md:py-32">
        <div className="frame-double rounded-md px-6 py-12 sm:px-12 md:py-16">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <SplitReveal as="h2" id="planet-title" className="display-2 uppercase text-cream" stagger={0.1}>
                Good for hospitality.
              </SplitReveal>
              <SplitReveal as="p" className="font-display display-2 uppercase text-[#b9c27e]" stagger={0.1} delay={0.2}>
                Kind to the planet.
              </SplitReveal>
              <Reveal delay={0.2}>
                <p className="mt-8 max-w-lg text-cream/75">
                  At Thanda Kapda Co., hospitality and responsibility go hand in hand. Our wipes are made with care, for
                  your guests and for the planet we all share.
                </p>
              </Reveal>
              <Reveal stagger={0.08} className="mt-10 grid gap-x-6 gap-y-7 sm:grid-cols-2">
                {facts.map((f) => (
                  <div key={f.title} className="flex items-center gap-4">
                    <RingIcon name={f.icon} tone="gold" />
                    <div>
                      <p className="font-sans text-[0.74rem] font-bold uppercase tracking-[0.14em] text-cream">{f.title}</p>
                      <p className="mt-1 text-[0.85rem] text-cream/60">{f.text}</p>
                    </div>
                  </div>
                ))}
              </Reveal>
            </div>
            <div className="flex items-start lg:col-span-5 lg:justify-end lg:pt-10">
              <Reveal delay={0.3} y={30}>
                <p className="script -rotate-6 text-[2.2rem] leading-tight text-cream md:text-[2.6rem]">
                  Small choices today,
                  <br />
                  memorable impact
                  <br />
                  tomorrow.
                </p>
                <svg viewBox="0 0 200 16" className="ml-16 mt-1 h-4 w-48 -rotate-6 text-gold-light" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                  <path d="M2 12C60 3 140 2 198 6" />
                </svg>
                <BrushNote tone="gold" className="mt-10 rotate-2">
                  Fresh today, responsible tomorrow.
                </BrushNote>
              </Reveal>
            </div>
          </div>

          <Reveal stagger={0.1} className="mt-14 grid border-t border-gold-light/25 pt-10 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-gold-light/20">
            {better.map((b) => (
              <div key={b.title} className="flex items-center gap-4 py-3 lg:px-6 lg:first:pl-0">
                <RingIcon name={b.icon} tone="gold" size="lg" />
                <div>
                  <p className="font-display text-[1.3rem] text-cream">{b.title}</p>
                  <p className="text-[0.85rem] text-cream/60">{b.text}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
