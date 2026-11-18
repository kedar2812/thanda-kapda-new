import { ADMIN_URL } from "./index";

declare global {
  interface Window {
    /** Set by the inline <head> script when the dashboard shows the site in its preview frame. */
    __tkPreview?: boolean;
  }
}

/** Origins allowed to drive the preview: the dashboard, and its local dev server. */
export const PREVIEW_ORIGINS = [new URL(ADMIN_URL).origin, "http://localhost:5174", "http://127.0.0.1:5174"];

export function isPreview() {
  return typeof window !== "undefined" && window.__tkPreview === true;
}

/**
 * Runs before anything else on the page (inlined into <head>). It starts
 * fetching the latest published content so it is ready by hydration, or, in
 * the dashboard's preview frame, switches the page into preview mode instead.
 */
export function headScript(liveUrl: string) {
  return `(function(){var d=document.documentElement;d.classList.add('js');try{if(/[?&]tk-preview\\b/.test(location.search)&&window.parent!==window){window.__tkPreview=true;d.classList.add('tk-preview');return}window.__tkLive=fetch(${JSON.stringify(liveUrl)},{cache:'no-cache',credentials:'omit'}).then(function(r){return r.ok?r.json():null}).catch(function(){return null})}catch(e){}})()`;
}
