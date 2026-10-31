"use client";

/**
 * next/image loader for a static site. A src like
 *   /products/namaste-cafe-1500.webp#w=640,1080,1500
 * names the largest file and the other widths that exist beside it
 * (namaste-cafe-640.webp, …), so each screen gets the smallest sharp file.
 * Anything without the hint is served as is.
 */
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  const [base, hint] = src.split("#");
  const list = hint?.match(/^w=([\d,]+)$/)?.[1];
  if (!list) return base;
  const widths = list
    .split(",")
    .map(Number)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  const max = widths[widths.length - 1];
  const pick = widths.find((w) => w >= width) ?? max;
  return pick === max ? base : base.replace(new RegExp(`-${max}(\.[a-z]+)$`), `-${pick}$1`);
}
