"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

/**
 * Sits inside the map SVG and animates its siblings. The routes are tied to
 * scroll: as the map moves up the screen the dashed arcs draw out of India
 * and each pin drops in when its route arrives. Scrolling back rewinds it.
 */
export function MapAnimation() {
  const anchor = useRef<SVGGElement>(null);

  useGSAP(() => {
    const svg = anchor.current?.ownerSVGElement;
    if (!svg) return;
    const masks = svg.querySelectorAll<SVGPathElement>("[data-arc-mask]");
    const pins = svg.querySelectorAll<SVGGElement>("[data-pin]");
    const ring = svg.querySelector("[data-origin-ring]");
    const glow = svg.querySelector("[data-origin-glow]");
    const india = svg.querySelector("[data-india]");
    const labels = svg.querySelectorAll("[data-map-label]");

    if (prefersReducedMotion()) {
      gsap.set(masks, { strokeDashoffset: 0 });
      return;
    }

    gsap.set(pins, { scale: 0, transformOrigin: "50% 100%" });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: svg, start: "top 82%", end: "bottom 55%", scrub: 0.8 },
    });

    tl.fromTo(india, { fill: "#6f7c5e" }, { fill: "#143829", duration: 0.25 }, 0)
      .fromTo(glow, { scale: 0.2, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.2, transformOrigin: "50% 50%" }, 0.05)
      .fromTo(ring, { scale: 0.2 }, { scale: 1, duration: 0.15, transformOrigin: "50% 50%" }, 0.1)
      .fromTo(labels, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, stagger: 0.02 }, 0.05);

    masks.forEach((m, i) => {
      const at = 0.2 + (i / masks.length) * 0.6;
      tl.to(m, { strokeDashoffset: 0, duration: 0.28, ease: "power1.inOut" }, at);
      tl.to(pins[i], { scale: 1, duration: 0.06, ease: "back.out(3)" }, at + 0.26);
    });

    // Slow heartbeat on the origin ring, independent of scroll.
    const beat = svg.querySelector("[data-origin-beat]");
    gsap.fromTo(beat, { scale: 1, autoAlpha: 0.9 }, { scale: 3, autoAlpha: 0, duration: 2.4, repeat: -1, ease: "power1.out", transformOrigin: "50% 50%" });
  }, []);

  return <g ref={anchor} data-map-anchor />;
}
