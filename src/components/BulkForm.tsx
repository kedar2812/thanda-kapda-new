"use client";

import { useEffect, useRef, useState } from "react";
import { site, whatsappLink } from "@/data/site";
import { Button } from "@/components/ui/Button";

const CUSTOM = "Custom-printed sachets";
const needs = ["Morning Spring by the case", "Namasté by the case", CUSTOM, "A mix, let's talk"];
const caseQuantities = ["500 – 1,000 sachets", "1,000 – 5,000 sachets", "5,000 – 20,000 sachets", "20,000+ sachets", "Not sure yet"];
/** Custom printing has a 2,00,000-sachet minimum run. */
const customQuantities = ["2,00,000 – 5,00,000 sachets", "5,00,000 – 10,00,000 sachets", "10,00,000+ sachets"];
const quantitiesFor = (need: string) => (need === CUSTOM ? customQuantities : caseQuantities);

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "application/pdf"];
const LOGO_MAX_MB = 10;

const field =
  "w-full rounded-md border border-ink/15 bg-cream-50/80 px-4 py-3.5 text-[0.95rem] text-ink placeholder:text-ink/40 transition-colors duration-300 focus:border-forest focus:bg-cream-50 focus:outline-none";
const label = "eyebrow mb-2 block text-ink/60";

const kb = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

/** Renders any image the browser can decode to a PNG blob, so it can go on the clipboard. */
function toPng(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 1200;
      canvas.height = img.naturalHeight || 1200;
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("png"))), "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  });
}

/**
 * No backend needed: the form composes a message and hands it to WhatsApp
 * (or email as a fallback), which is how the team already takes orders.
 * A chat link cannot carry a file, so the logo is copied to the clipboard
 * where the browser allows it, ready to paste into the chat.
 */
export function BulkForm({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState({
    name: "",
    org: "",
    contact: "",
    qty: customQuantities[0],
    need: CUSTOM,
    message: "",
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [sent, setSent] = useState<null | "pasted" | "attach">(null);
  const input = useRef<HTMLInputElement>(null);

  const showLogo = (file: File | null) => {
    setPreview(file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    setLogo(file);
  };

  // Release each preview URL once it is replaced or the form unmounts.
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const isCustom = state.need === CUSTOM;

  const message = [
    `Hi Thanda Kapda Co., I'd like to talk about a bulk order.`,
    ``,
    `Name: ${state.name || "-"}`,
    `Organisation: ${state.org || "-"}`,
    `Contact: ${state.contact || "-"}`,
    `Looking for: ${state.need}`,
    `Quantity: ${state.qty}`,
    logo ? `Brand logo: ${logo.name} (attaching in this chat)` : null,
    state.message ? `` : null,
    state.message ? `Details: ${state.message}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const update = (k: keyof typeof state) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setState((s) => ({ ...s, [k]: e.target.value }));

  const updateNeed = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const need = e.target.value;
    setState((s) => {
      const options = quantitiesFor(need);
      return { ...s, need, qty: options.includes(s.qty) ? s.qty : options[0] };
    });
  };

  const pickLogo = (file: File | undefined) => {
    setSent(null);
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) {
      setLogoError("Please use a PNG, JPG, WebP, SVG or PDF file.");
      return;
    }
    if (file.size > LOGO_MAX_MB * 1024 * 1024) {
      setLogoError(`That file is ${kb(file.size)}. Please keep it under ${LOGO_MAX_MB} MB.`);
      return;
    }
    setLogoError(null);
    showLogo(file);
  };

  const clearLogo = () => {
    showLogo(null);
    setLogoError(null);
    setSent(null);
    if (input.current) input.current.value = "";
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    let pasted = false;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (logo && !touch && logo.type.startsWith("image/") && typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      try {
        // Handing ClipboardItem a promise keeps the write inside the click gesture.
        navigator.clipboard.write([new ClipboardItem({ "image/png": toPng(logo) })]).catch(() => setSent("attach"));
        pasted = true;
      } catch {
        pasted = false;
      }
    }
    window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
    if (logo) setSent(pasted ? "pasted" : "attach");
  };

  const mailto = `mailto:${site.email}?subject=${encodeURIComponent("Bulk order enquiry")}&body=${encodeURIComponent(message)}`;

  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="bf-name" className={label}>
          Your name
        </label>
        <input id="bf-name" required className={field} value={state.name} onChange={update("name")} autoComplete="name" />
      </div>
      <div>
        <label htmlFor="bf-org" className={label}>
          Organisation
        </label>
        <input id="bf-org" className={field} value={state.org} onChange={update("org")} autoComplete="organization" placeholder="Restaurant, hotel, planner…" />
      </div>
      <div className={compact ? "sm:col-span-2" : ""}>
        <label htmlFor="bf-contact" className={label}>
          Phone or email
        </label>
        <input id="bf-contact" required className={field} value={state.contact} onChange={update("contact")} autoComplete="tel email" />
      </div>
      <div>
        <label htmlFor="bf-need" className={label}>
          Looking for
        </label>
        <select id="bf-need" className={field} value={state.need} onChange={updateNeed}>
          {needs.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </div>
      <div className={compact ? "" : "sm:col-span-2"}>
        <label htmlFor="bf-qty" className={label}>
          Quantity
        </label>
        <select id="bf-qty" className={field} value={state.qty} onChange={update("qty")} aria-describedby={isCustom ? "bf-qty-note" : undefined}>
          {quantitiesFor(state.need).map((q) => (
            <option key={q}>{q}</option>
          ))}
        </select>
        {isCustom && (
          <p id="bf-qty-note" className="mt-2 flex items-center gap-2 text-[0.8rem] text-ink/60">
            <span aria-hidden className="h-1 w-1 rounded-full bg-gold" />
            Custom printing starts at 2,00,000 sachets.
          </p>
        )}
      </div>

      <div className="sm:col-span-2">
        <p id="bf-logo-label" className={label}>
          Brand logo <span className="normal-case tracking-normal text-ink/40">(optional)</span>
        </p>
        <input
          ref={input}
          id="bf-logo"
          type="file"
          accept={LOGO_TYPES.join(",")}
          className="sr-only"
          aria-labelledby="bf-logo-label"
          onChange={(e) => pickLogo(e.target.files?.[0])}
        />
        {logo ? (
          <div className="flex items-center gap-4 rounded-md border border-ink/15 bg-cream-50/80 p-3 pr-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-sm border border-ink/10 bg-white">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not optimisable
                <img src={preview} alt="Your logo" className="h-full w-full object-contain p-1.5" />
              ) : (
                <span className="eyebrow text-[0.6rem] text-forest">PDF</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.95rem] text-ink">{logo.name}</p>
              <p className="text-[0.8rem] text-ink/50">{kb(logo.size)}</p>
            </div>
            <label htmlFor="bf-logo" className="link-line eyebrow cursor-pointer text-ink/60 hover:text-forest">
              Replace
            </label>
            <button type="button" onClick={clearLogo} className="link-line eyebrow text-ink/60 hover:text-forest">
              Remove
            </button>
          </div>
        ) : (
          <label
            htmlFor="bf-logo"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickLogo(e.dataTransfer.files?.[0]);
            }}
            className={`group flex cursor-pointer items-center gap-4 rounded-md border border-dashed px-4 py-5 transition-colors duration-300 ${
              dragging ? "border-forest bg-cream-50" : "border-ink/25 bg-cream-50/60 hover:border-forest/60 hover:bg-cream-50"
            }`}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ink/15 text-forest transition-transform duration-500 ease-out-expo group-hover:-translate-y-0.5">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M12 16V4m0 0l-4.5 4.5M12 4l4.5 4.5M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="flex flex-col">
              <span className="text-[0.95rem] text-ink">
                <span className="font-semibold text-forest">Upload your logo</span> or drop it here
              </span>
              <span className="text-[0.8rem] text-ink/50">PNG, JPG, SVG or PDF, up to {LOGO_MAX_MB} MB.</span>
            </span>
          </label>
        )}
        {logoError && (
          <p role="alert" className="mt-2 text-[0.8rem] text-[#a3442a]">
            {logoError}
          </p>
        )}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="bf-msg" className={label}>
          Anything else
        </label>
        <textarea
          id="bf-msg"
          rows={4}
          className={field}
          value={state.message}
          onChange={update("message")}
          placeholder="The occasion, a date you're working towards, colours or copy you'd like printed…"
        />
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Button type="submit" size="lg" arrow>
          Send on WhatsApp
        </Button>
        <a href={mailto} className="link-line eyebrow text-ink/70">
          Or email us instead
        </a>
      </div>
      {sent && logo && (
        <p role="status" className="rounded-md border border-gold/40 bg-gold/10 px-4 py-3 text-[0.85rem] text-ink/80 sm:col-span-2">
          {sent === "pasted" ? (
            <>
              WhatsApp is open with your details. Your logo is copied: paste it into the chat (Ctrl/⌘ + V) before you hit send.
            </>
          ) : (
            <>
              WhatsApp is open with your details. Tap the paperclip in the chat to attach <strong className="font-semibold">{logo.name}</strong> before you hit send.
              If you email us instead, add it as an attachment.
            </>
          )}
        </p>
      )}
    </form>
  );
}
