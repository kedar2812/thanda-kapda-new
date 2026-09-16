import clsx from "clsx";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Flourish } from "@/components/ui/Ornaments";

export function PageHeader({
  eyebrow,
  title,
  intro,
  align = "left",
  className,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  align?: "left" | "center";
  className?: string;
  children?: React.ReactNode;
}) {
  const center = align === "center";
  return (
    <header className={clsx("container-wide pt-32 md:pt-44", className)}>
      <div className={clsx("max-w-4xl", center && "mx-auto text-center")}>
        <Reveal immediate>
          <p className="eyebrow text-gold">{eyebrow}</p>
        </Reveal>
        <SplitReveal as="h1" immediate delay={0.15} className="display-1 mt-6 text-forest">
          {title}
        </SplitReveal>
        {intro && (
          <Reveal immediate delay={0.55}>
            <p className={clsx("lede mt-8 max-w-2xl text-ink/75", center && "mx-auto")}>{intro}</p>
          </Reveal>
        )}
        {children && (
          <Reveal immediate delay={0.7} className={clsx("mt-10", center && "flex justify-center")}>
            {children}
          </Reveal>
        )}
        <Reveal immediate delay={0.8}>
          <Flourish className={clsx("mt-10", center && "justify-center")} />
        </Reveal>
      </div>
    </header>
  );
}
