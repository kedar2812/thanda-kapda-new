"use client";

import { useEffect, useState } from "react";
import { PREVIEW_ORIGINS } from "./preview";

type Box = { top: number; left: number; width: number; height: number; section: string };

/**
 * Dashboard preview only: outlines the section under the pointer with an
 * "Edit" button that opens that section in the editor. Links still work, so
 * the editor can browse the site normally; links to other sites are blocked.
 */
export function PreviewOverlay() {
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    let raf = 0;
    let current: HTMLElement | null = null;
    const measure = () => {
      if (!current) return setBox(null);
      const r = current.getBoundingClientRect();
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height, section: current.dataset.cms ?? "" });
    };
    const onMove = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("[data-preview-ui]")) return;
      const el = target?.closest<HTMLElement>("[data-cms]") ?? null;
      if (el === current) return;
      current = el;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    const onClick = (e: MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest("a") : null;
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (/^(https?:|mailto:|tel:)/i.test(href) && !href.startsWith(window.location.origin)) {
        e.preventDefault();
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    document.addEventListener("click", onClick, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll, { capture: true });
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  if (!box || !box.section) return null;

  const select = () => {
    for (const origin of PREVIEW_ORIGINS) {
      window.parent.postMessage({ source: "tk-site", type: "select", section: box.section }, origin);
    }
  };

  return (
    <div data-preview-ui aria-hidden className="pointer-events-none fixed inset-0 z-[200]">
      <div
        className="absolute rounded-[3px] outline outline-2 outline-offset-[-2px] outline-[#d9b06a]"
        style={{ top: box.top, left: box.left, width: box.width, height: box.height, background: "rgb(217 176 106 / 0.06)" }}
      />
      <button
        type="button"
        onClick={select}
        className="pointer-events-auto absolute flex items-center gap-1.5 rounded-full bg-[#143829] px-3 py-1.5 font-sans text-[0.72rem] font-semibold tracking-wide text-[#f4ecdc] shadow-lg"
        style={{ top: Math.max(8, box.top + 10), left: Math.max(8, box.left + box.width - 96) }}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M11 2.5l2.5 2.5L6 12.5H3.5V10z" strokeLinejoin="round" />
        </svg>
        Edit
      </button>
    </div>
  );
}
