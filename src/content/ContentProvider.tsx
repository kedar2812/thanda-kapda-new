"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, Fragment, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { bakedContent, bakedVersion, type SiteContent } from "./index";
import { normalize } from "./normalize";
import { PREVIEW_ORIGINS, isPreview } from "./preview";
import { PreviewOverlay } from "./PreviewOverlay";

type Live = { version: number; content: unknown } | null;

declare global {
  interface Window {
    /** Started by the inline script in <head>, so it runs in parallel with the JS bundles. */
    __tkLive?: Promise<Live>;
  }
}

const ContentContext = createContext<SiteContent>(bakedContent);
const noSubscribe = () => () => {};

/** The site's words and photos: baked at build, replaced by newer published content at runtime. */
export function useContent() {
  return useContext(ContentContext);
}

/** Pages whose title and description the dashboard controls. */
function seoFor(c: SiteContent, path: string): { title: string; description: string } | null {
  const p = path.replace(/\/+$/, "") || "/";
  const page = (t: string) => `${t} · ${c.site.name}`;
  if (p === "/") return { title: c.seo.title, description: c.site.description };
  if (p === "/products") return { title: page(c.seo.products.title), description: c.seo.products.description };
  if (p === "/story") return { title: page(c.seo.story.title), description: c.seo.story.description };
  if (p === "/bulk") return { title: page(c.seo.bulk.title), description: c.seo.bulk.description };
  if (p === "/contact") return { title: page(c.seo.contact.title), description: c.seo.contact.description };
  const product = c.products.find((x) => p === `/products/${x.slug}`);
  if (product) return { title: page(`${product.name} wet wipes`), description: product.short };
  return null;
}

/**
 * Holds the content for the whole tree. When newer content arrives (a publish
 * since this build, or a draft from the dashboard preview) the tree under it
 * is remounted with a new key: animated text is split into lines by GSAP, so
 * swapping words in place would fight it; a fresh mount re-runs everything.
 *
 * During hydration the baked content is used, so server HTML always matches.
 * Live content is applied straight after, and only while the visitor hasn't
 * started interacting; otherwise it waits for the next page change.
 */
export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({ content: bakedContent, version: bakedVersion, generation: 0 });
  // False while hydrating (to match the server HTML), then whatever the head script decided.
  const preview = useSyncExternalStore(noSubscribe, isPreview, () => false);
  const pending = useRef<{ content: SiteContent; version: number } | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Published content (not in preview).
  useEffect(() => {
    if (isPreview() || !window.__tkLive) return;
    const started = performance.now();
    let interacted = false;
    const mark = () => {
      interacted = true;
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, mark, { once: true, passive: true }));

    let cancelled = false;
    window.__tkLive.then((live) => {
      if (cancelled || !live || !live.content || typeof live.version !== "number" || live.version === bakedVersion) return;
      const next = { content: normalize(bakedContent, live.content), version: live.version };
      if (!interacted && performance.now() - started < 4000) {
        setState((s) => ({ ...next, generation: s.generation + 1 }));
      } else {
        pending.current = next;
      }
    });
    return () => {
      cancelled = true;
      events.forEach((e) => window.removeEventListener(e, mark));
    };
  }, []);

  // A change of page is a natural moment to apply content that arrived late.
  useEffect(() => {
    const next = pending.current;
    if (!next) return;
    pending.current = null;
    setState((s) => ({ ...next, generation: s.generation + 1 }));
  }, [pathname]);

  // Keep the tab title and description in step with the live content.
  useEffect(() => {
    if (state.version === bakedVersion && !preview) return;
    const seo = seoFor(state.content, pathname);
    if (!seo) return;
    document.title = seo.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", seo.description);
  }, [state, pathname, preview]);

  // Dashboard preview: drafts arrive by postMessage from the editor.
  useEffect(() => {
    if (!isPreview()) return;
    const parent = window.parent;
    const send = (msg: Record<string, unknown>) => {
      for (const origin of PREVIEW_ORIGINS) {
        try {
          parent.postMessage({ source: "tk-site", ...msg }, origin);
        } catch {
          /* origin mismatch: ignored by the browser */
        }
      }
    };
    const onMessage = (e: MessageEvent) => {
      if (!PREVIEW_ORIGINS.includes(e.origin) || e.data?.source !== "tk-admin") return;
      if (e.data.type === "content") {
        // Preview runs without animations (nothing is split into lines), so
        // drafts can update in place: no remount, no lost scroll position.
        setState((s) => ({ ...s, content: normalize(bakedContent, e.data.content), version: -1 }));
      } else if (e.data.type === "navigate" && typeof e.data.path === "string" && e.data.path.startsWith("/")) {
        router.push(e.data.path);
      } else if (e.data.type === "focus" && typeof e.data.section === "string") {
        const el = document.querySelector(`[data-cms="${CSS.escape(e.data.section)}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        el?.animate([{ outline: "3px solid rgb(217 176 106 / 0.9)", outlineOffset: "-3px" }, { outline: "3px solid rgb(217 176 106 / 0)", outlineOffset: "-3px" }], { duration: 1600 });
      }
    };
    window.addEventListener("message", onMessage);
    send({ type: "ready", path: window.location.pathname });
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  // Tell the editor which page the preview is showing.
  useEffect(() => {
    if (!isPreview()) return;
    for (const origin of PREVIEW_ORIGINS) {
      try {
        window.parent.postMessage({ source: "tk-site", type: "path", path: pathname }, origin);
      } catch {
        /* ignored */
      }
    }
  }, [pathname]);

  return (
    <ContentContext.Provider value={state.content}>
      <Fragment key={state.generation}>{children}</Fragment>
      {preview && <PreviewOverlay />}
    </ContentContext.Provider>
  );
}
