/**
 * Cookieless visit counting for the dashboard's Analytics screen. Nothing is
 * stored on the visitor's device; the server derives a daily anonymous ID
 * from the request and never keeps IP addresses.
 *
 * Messages are sent with sendBeacon as text/plain, which needs no CORS
 * preflight and survives the page closing.
 */
import { ADMIN_URL } from "@/content";
import { isPreview } from "@/content/preview";

const ENDPOINT = `${ADMIN_URL}/api/public/ping`;
const IGNORE_KEY = "tk-ignore";

type View = { id: string; path: string; activeMs: number; visibleSince: number | null; depth: number; sent: { t: number; d: number } };
let view: View | null = null;
let landing = true;
let startedAt = 0;

function newId() {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Visits from the team (or tests) can be excluded with ?tk-ignore=1, and included again with ?tk-ignore=0. */
export function trackingDisabled() {
  if (typeof window === "undefined" || isPreview()) return true;
  try {
    const flag = new URLSearchParams(window.location.search).get(IGNORE_KEY);
    if (flag === "1") localStorage.setItem(IGNORE_KEY, "1");
    if (flag === "0") localStorage.removeItem(IGNORE_KEY);
    return localStorage.getItem(IGNORE_KEY) === "1";
  } catch {
    return false;
  }
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.(ENDPOINT, body)) return;
  } catch {
    /* fall through */
  }
  fetch(ENDPOINT, { method: "POST", body, keepalive: true, mode: "no-cors", credentials: "omit", headers: { "Content-Type": "text/plain" } }).catch(() => {});
}

function activeSeconds(v: View) {
  const live = v.visibleSince === null ? 0 : performance.now() - v.visibleSince;
  return Math.round((v.activeMs + live) / 1000);
}

/** Reports time on page and how far down it was read. Safe to call often; the server keeps the largest values. */
export function flush() {
  if (!view) return;
  const t = activeSeconds(view);
  if (t <= view.sent.t && view.depth <= view.sent.d) return;
  view.sent = { t, d: view.depth };
  send({ k: "eng", id: view.id, t, d: view.depth });
}

export function pageview(path: string) {
  if (trackingDisabled()) return;
  // React runs effects twice in development; one visit is one view.
  if (view && view.path === path && performance.now() - startedAt < 1000) return;
  startedAt = performance.now();
  if (view) flush();
  const params = new URLSearchParams(window.location.search);
  view = { id: newId(), path, activeMs: 0, visibleSince: document.visibilityState === "visible" ? performance.now() : null, depth: 0, sent: { t: 0, d: 0 } };
  let tz = "";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    /* old browser */
  }
  send({
    k: "pv",
    id: view.id,
    p: path,
    // Only the landing page has a real referrer; later pages are in-site moves.
    r: landing ? document.referrer : "",
    us: landing ? (params.get("utm_source") ?? "") : "",
    um: landing ? (params.get("utm_medium") ?? "") : "",
    uc: landing ? (params.get("utm_campaign") ?? "") : "",
    w: window.screen?.width ?? 0,
    tz,
    l: navigator.language ?? "",
  });
  landing = false;
}

/** A goal: a tap that starts a conversation or a sale. */
export function track(name: string, label = "") {
  if (trackingDisabled() || !view) return;
  send({ k: "ev", pv: view.id, n: name, x: label.slice(0, 120), p: view.path });
}

export function onVisibility() {
  if (!view) return;
  if (document.visibilityState === "visible") {
    view.visibleSince = performance.now();
  } else {
    if (view.visibleSince !== null) view.activeMs += performance.now() - view.visibleSince;
    view.visibleSince = null;
    flush();
  }
}

export function onScroll() {
  if (!view) return;
  const h = document.documentElement.scrollHeight;
  const seen = h > 0 ? Math.min(100, Math.round(((window.scrollY + window.innerHeight) / h) * 100)) : 0;
  if (seen > view.depth) view.depth = seen;
}

/** Turns a tapped link into a goal name, or null for ordinary in-site links. */
export function classifyLink(href: string): { name: string; label: string } | null {
  let url: URL;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }
  if (url.protocol === "tel:") return { name: "call", label: url.pathname };
  if (url.protocol === "mailto:") return { name: "email", label: url.pathname };
  if (url.origin === window.location.origin) return null;
  const host = url.hostname.replace(/^www\./, "");
  if (host === "wa.me" || host.endsWith("whatsapp.com")) return { name: "whatsapp", label: "" };
  if (/(^|\.)amazon\./.test(host) || host === "amzn.in" || host === "amzn.to") {
    return { name: "amazon", label: url.pathname.match(/\/dp\/([A-Z0-9]{10})/i)?.[1] ?? "store" };
  }
  if (host.endsWith("instagram.com")) return { name: "instagram", label: "" };
  if (host.startsWith("google.") && /review/i.test(url.search)) return { name: "google_reviews", label: "" };
  return { name: "outbound", label: host };
}
