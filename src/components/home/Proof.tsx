import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Flourish } from "@/components/ui/Ornaments";
import { products } from "@/data/products";

const mentions = [
  { quote: "They stay properly moist.", detail: "Sealed one at a time, so the last sachet in the box is as wet as the first." },
  { quote: "Incredibly soft on the skin.", detail: "A non-woven sheet on an aloe base, with no alcohol to tighten or sting." },
  { quote: "Mild fragrance, easy to carry.", detail: "Postcard-sized and flat. It disappears into a pocket or a clutch." },
];

export function Proof() {
  const totalRatings = products.reduce((n, p) => n + p.rating.count, 0);
  return (
    <section className="relative overflow-hidden py-24 md:py-36" aria-labelledby="proof-title">
      <div className="container-wide">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow text-gold">What people say</p>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 flex items-end justify-center gap-4">
            <span className="font-display text-[6rem] leading-[0.85] text-forest md:text-[8.5rem]">5.0</span>
            <span className="mb-2 flex flex-col items-start gap-2">
              <span className="flex gap-1 text-gold" aria-label="Five stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden>
                    <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
                  </svg>
                ))}
              </span>
              <span className="eyebrow text-left text-ink/55">
                on Amazon India
                <br />
                {totalRatings} ratings, every one five stars
              </span>
            </span>
          </Reveal>
          <SplitReveal as="h2" id="proof-title" className="display-3 mt-10 text-forest" stagger={0.07}>
            Reviewers keep saying the same three things.
          </SplitReveal>
          <Reveal delay={0.15}>
            <Flourish className="mx-auto mt-8 justify-center" />
          </Reveal>
        </div>

        <Reveal stagger={0.1} y={40} className="mt-16 grid gap-6 md:grid-cols-3">
          {mentions.map((m, i) => (
            <blockquote
              key={m.quote}
              className="relative rounded-md border border-ink/10 bg-cream-50/70 p-8 shadow-paper"
              style={{ rotate: `${[-1.2, 0.6, -0.8][i]}deg` }}
            >
              <span className="tape -top-2 left-1/2 -translate-x-1/2 rotate-[-2deg]" aria-hidden />
              <p className="font-display text-[1.7rem] leading-tight text-forest">&ldquo;{m.quote}&rdquo;</p>
              <p className="mt-4 text-[0.95rem] text-ink/70">{m.detail}</p>
            </blockquote>
          ))}
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-8 text-center text-[0.75rem] uppercase tracking-[0.16em] text-ink/40">
            Phrases summarised from verified Amazon India reviews
          </p>
        </Reveal>
      </div>
    </section>
  );
}
