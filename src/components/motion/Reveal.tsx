"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Seconds to wait once in view. */
  delay?: number;
  /** Distance travelled in px. */
  y?: number;
  /** Animate the direct children one after another instead of the wrapper. */
  stagger?: number;
  /** ScrollTrigger start. */
  start?: string;
  as?: React.ElementType;
  /** Start scaled down slightly. */
  scale?: number;
  /** Play as soon as mounted, ignoring scroll position. */
  immediate?: boolean;
  id?: string;
  style?: React.CSSProperties;
};

/** Fade-and-rise on scroll. Wrap anything. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 34,
  stagger,
  start = "top 88%",
  as: Tag = "div",
  scale,
  immediate = false,
  id,
  style,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const targets: Element | Element[] = stagger ? Array.from(el.children) : el;
      el.setAttribute("data-reveal-ready", "");
      if (prefersReducedMotion()) return;

      gsap.fromTo(
        targets,
        { autoAlpha: 0, y, scale: scale ?? 1 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          delay,
          stagger: stagger ?? 0,
          clearProps: "transform",
          scrollTrigger: immediate ? undefined : { trigger: el, start, once: true },
        },
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} id={id} data-reveal="" className={className} style={style}>
      {children}
    </Tag>
  );
}
