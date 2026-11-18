"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { classifyLink, flush, onScroll, onVisibility, pageview, track, trackingDisabled } from "@/lib/analytics";

/** Counts page views and goal taps for the dashboard. Renders nothing. */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    pageview(pathname);
  }, [pathname]);

  useEffect(() => {
    if (trackingDisabled()) return;
    const onClick = (e: MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      const goal = a ? classifyLink(a.getAttribute("href") ?? "") : null;
      if (goal) track(goal.name, goal.label);
    };
    let ticking = false;
    const scroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    };
    // A heartbeat keeps "on the site now" and time-on-page honest when the
    // closing beacon is lost (common on phones).
    const beat = window.setInterval(() => document.visibilityState === "visible" && flush(), 30000);
    document.addEventListener("click", onClick, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      window.clearInterval(beat);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("scroll", scroll);
    };
  }, []);

  return null;
}
