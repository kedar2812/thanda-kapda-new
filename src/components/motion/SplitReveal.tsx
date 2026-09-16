"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  start?: string;
  /** Play on mount instead of on scroll (hero copy). */
  immediate?: boolean;
  id?: string;
};

/**
 * Line-by-line masked text reveal. Each line rises out of its own clipping
 * box. Waits for fonts so line breaks are final, and re-splits on resize.
 */
export function SplitReveal({
  children,
  as: Tag = "p",
  className,
  delay = 0,
  stagger = 0.09,
  duration = 1.3,
  start = "top 85%",
  immediate = false,
  id,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        el.setAttribute("data-split-ready", "");
        return;
      }

      let split: SplitText | undefined;
      let cancelled = false;

      document.fonts.ready.then(() => {
        if (cancelled) return;
        split = SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit(self) {
            el.setAttribute("data-split-ready", "");
            return gsap.from(self.lines, {
              yPercent: 110,
              duration,
              ease: "power4.out",
              stagger,
              delay,
              scrollTrigger: immediate ? undefined : { trigger: el, start, once: true },
            });
          },
        });
      });

      return () => {
        cancelled = true;
        split?.revert();
      };
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} id={id} data-split="" className={className}>
      {children}
    </Tag>
  );
}
