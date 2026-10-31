"use client";

import { Reveal } from "@/components/motion/Reveal";
import { RingIcon } from "@/components/ui/Icons";
import { useContent } from "@/content/ContentProvider";

/** The "perfect for every industry" ring-icon row from the collateral. */
export function Industries() {
  const b = useContent().bulk;
  return (
    <div data-cms="bulk.industries">
      <Reveal className="flex items-center gap-5">
        <span className="rule flex-1" />
        <p className="eyebrow text-center text-forest">{b.industriesTitle}</p>
        <span className="rule flex-1" />
      </Reveal>
      <Reveal stagger={0.04} className="mt-10 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
        {b.industries.map((it, i) => (
          <div key={i} className="flex flex-col items-center gap-3 text-center">
            <RingIcon name={it.icon} tone="gold" size="lg" className="text-forest" />
            <span className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/70">{it.label}</span>
          </div>
        ))}
      </Reveal>
    </div>
  );
}
