"use client";

import clsx from "clsx";
import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { CmsImage } from "@/components/cms/CmsImage";
import type { CmsImage as CmsImageData } from "@/content";

type Props = {
  image: CmsImageData;
  /** Overrides the image's alt text, e.g. "" when decorative. */
  alt?: string;
  className?: string;
  /** 0 = static, 0.2 = pronounced. */
  speed?: number;
  sizes?: string;
  priority?: boolean;
  imgClassName?: string;
};

/**
 * An image inside a fixed frame that drifts slowly as the page scrolls.
 * The inner layer is slightly oversized so the edges never show.
 */
export function ParallaxImage({
  image,
  alt,
  className,
  speed = 0.12,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority,
  imgClassName,
}: Props) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !outer.current || !inner.current) return;
      const travel = speed * 50;
      gsap.fromTo(
        inner.current,
        { yPercent: -travel },
        {
          yPercent: travel,
          ease: "none",
          scrollTrigger: {
            trigger: outer.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.5,
          },
        },
      );
    },
    { scope: outer, dependencies: [speed] },
  );

  const bleed = `${Math.round(speed * 60)}%`;

  return (
    <div ref={outer} className={clsx("frame", className)}>
      <div
        ref={inner}
        className="absolute will-change-transform"
        style={{ inset: `-${bleed} 0` }}
      >
        <CmsImage image={image} alt={alt} sizes={sizes} priority={priority} className={imgClassName} />
      </div>
    </div>
  );
}
