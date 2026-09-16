import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { RingIcon, type IconName } from "@/components/ui/Icons";
import { Stamp, LeafSprig } from "@/components/ui/Ornaments";
import { LogoMark } from "@/components/ui/Logo";

const items: { icon: IconName; title: string; text: string }[] = [
  { icon: "leafCircle", title: "Our vision", text: "To become the most loved premium refreshing wipe from India, at home and abroad." },
  { icon: "target", title: "Our mission", text: "To refresh lives with convenience, quality and care in every wipe." },
  { icon: "seedling", title: "Our promise", text: "Honest ingredients, premium quality and a refreshing experience, every single time." },
  { icon: "globe", title: "Our purpose", text: "To turn everyday moments into lasting impressions." },
];

/** Dark green card with a double cream frame, from the "Vision & Mission" spread. */
export function VisionMission() {
  return (
    <Reveal y={48} className="parchment-dark relative overflow-hidden rounded-md p-3 text-cream shadow-lift">
      <div className="relative rounded-[3px] border border-cream/25 p-7 md:p-12">
        <span aria-hidden className="pointer-events-none absolute inset-2 rounded-[2px] border border-cream/10" />
        <LeafSprig className="pointer-events-none absolute -left-12 bottom-0 h-72 w-auto text-cream/[0.06]" />
        <Stamp text="THANDA KAPDA CO. · ESTD 2025 · " tone="gold" className="absolute right-6 top-6 hidden w-24 md:block">
          <LogoMark className="h-7 w-8 text-gold-light" />
        </Stamp>

        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <SplitReveal as="h2" className="display-2 uppercase text-cream" stagger={0.1}>
              Vision &amp; mission
            </SplitReveal>
            <p className="script mt-8 text-[1.6rem] text-gold-light">Why we started</p>
            <p className="mt-4 max-w-md text-cream/75">
              India&rsquo;s oldest welcome, a cold cloth for a guest, deserved a modern form. We built one from a simple
              belief: every great experience deserves a perfect finish, every single time.
            </p>
            <div className="relative mt-10 inline-block">
              <svg viewBox="0 0 420 120" className="absolute inset-0 h-full w-full text-cream/90" preserveAspectRatio="none" aria-hidden>
                <path d="M12 22c60-14 300-18 396-6l-8 40 10 44c-120 14-300 14-398 4l6-40z" fill="currentColor" />
              </svg>
              <p className="script relative px-8 py-5 text-[1.5rem] leading-tight text-forest md:text-[1.8rem]">
                We don&rsquo;t just make wipes.
                <br />
                We make moments.
              </p>
            </div>
          </div>

          <ul className="space-y-7 md:col-span-6 md:border-l md:border-cream/15 md:pl-10">
            {items.map((it) => (
              <li key={it.title} className="flex gap-5">
                <RingIcon name={it.icon} tone="gold" />
                <div>
                  <p className="font-sans text-[0.78rem] font-bold uppercase tracking-[0.16em] text-gold-light">{it.title}</p>
                  <p className="mt-1.5 max-w-sm text-cream/80">{it.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  );
}
