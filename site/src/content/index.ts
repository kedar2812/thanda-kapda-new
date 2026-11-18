/**
 * The content the site is built with: the defaults with the last published
 * dashboard content on top (src/content/published.json, refreshed by
 * deploy.sh before every build). Safe to import from server and client code.
 */
import published from "./published.json";
import { defaultContent, type ProductContent, type SiteContent } from "./defaults";
import { normalize } from "./normalize";

export type { SiteContent, ProductContent };
export type { CmsImage } from "./types";

export const bakedVersion: number = typeof published.version === "number" ? published.version : 0;
export const bakedContent: SiteContent = normalize(defaultContent, published.content);

/** Where the dashboard lives: live content, uploaded photos and analytics. */
export const ADMIN_URL = (process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.thandakapda.co").replace(/\/$/, "");
export const SITE_URL = "https://thandakapda.co";
export const LIVE_CONTENT_URL = `${ADMIN_URL}/live/content.json`;

/** Fills "{count}" style placeholders. */
export function fill(text: string, vars: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Only links the site is happy to render: web, mail, phone and on-site paths. */
export function safeUrl(url: string, fallback = "#") {
  const u = url.trim();
  if (/^(https?:|mailto:|tel:)/i.test(u) || (u.startsWith("/") && !u.startsWith("//")) || u.startsWith("#")) return u;
  return fallback;
}

export function whatsappLink(c: SiteContent, message?: string) {
  const n = c.site.whatsapp.replace(/\D/g, "");
  return `https://wa.me/${n}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function phoneHref(c: SiteContent) {
  return `tel:${c.site.phone.replace(/[^\d+]/g, "")}`;
}

export function getProduct(c: SiteContent, slug: string) {
  return c.products.find((p) => p.slug === slug);
}

export const rupee = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function discount(p: ProductContent) {
  return p.mrp > p.price && p.mrp > 0 ? Math.round((1 - p.price / p.mrp) * 100) : 0;
}

/** "No. 01" style label for list position. */
export const ordinal = (i: number) => `No. ${String(i + 1).padStart(2, "0")}`;

/** The image URL without the responsive-widths hint, for meta tags and JSON-LD. */
export function plainSrc(src: string) {
  return src.split("#")[0];
}

export function absoluteUrl(src: string) {
  const s = plainSrc(src);
  return s.startsWith("/") ? `${SITE_URL}${s}` : s;
}

/**
 * Open Graph image for link previews. Built-in photos point at the original
 * JPEG, which every chat app and social network can show.
 */
export function shareImage(image: { src: string; alt: string; width: number; height: number }) {
  const s = plainSrc(image.src);
  const jpeg = s.match(/^\/products\/(.+)-\d+\.webp$/);
  return { url: absoluteUrl(jpeg ? `/products/${jpeg[1]}.jpg` : s), width: image.width, height: image.height, alt: image.alt };
}
