"use client";

import clsx from "clsx";
import { useState } from "react";
import type { Faq as FaqItem } from "@/data/faq";

export function Faq({ items, defaultOpen = 0 }: { items: FaqItem[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  return (
    <div className="divide-y divide-ink/10 border-y border-ink/10">
      {items.map((item, i) => {
        const isOpen = open === i;
        const id = `faq-${i}`;
        return (
          <div key={item.q}>
            <button
              type="button"
              className="group flex w-full items-start justify-between gap-6 py-6 text-left"
              aria-expanded={isOpen}
              aria-controls={id}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className="font-display text-[1.35rem] leading-snug text-forest md:text-[1.6rem]">{item.q}</span>
              <span
                className={clsx(
                  "relative mt-2 h-6 w-6 shrink-0 rounded-full border border-ink/20 transition-colors duration-300 group-hover:border-forest",
                  isOpen && "border-forest bg-forest",
                )}
                aria-hidden
              >
                <span className={clsx("absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2", isOpen ? "bg-cream" : "bg-ink")} />
                <span
                  className={clsx(
                    "absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 ease-out-expo",
                    isOpen ? "rotate-0 bg-cream" : "rotate-90 bg-ink",
                  )}
                />
              </span>
            </button>
            <div
              id={id}
              className={clsx(
                "grid transition-[grid-template-rows] duration-500 ease-out-expo",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl pb-7 text-ink/75">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
