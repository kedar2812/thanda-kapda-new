"use client";

import { useState } from "react";
import { site, whatsappLink } from "@/data/site";
import { Button } from "@/components/ui/Button";

const quantities = ["500 – 1,000 sachets", "1,000 – 5,000 sachets", "5,000 – 20,000 sachets", "20,000+ sachets", "Not sure yet"];
const needs = ["Morning Spring by the case", "Namasté by the case", "Custom-printed sachets", "A mix, let's talk"];

const field =
  "w-full rounded-md border border-ink/15 bg-cream-50/80 px-4 py-3.5 text-[0.95rem] text-ink placeholder:text-ink/40 transition-colors duration-300 focus:border-forest focus:bg-cream-50 focus:outline-none";
const label = "eyebrow mb-2 block text-ink/60";

/**
 * No backend needed: the form composes a message and hands it to WhatsApp
 * (or email as a fallback), which is how the team already takes orders.
 */
export function BulkForm({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState({
    name: "",
    org: "",
    contact: "",
    qty: quantities[0],
    need: needs[2],
    message: "",
  });

  const message = [
    `Hi Thanda Kapda Co., I'd like to talk about a bulk order.`,
    ``,
    `Name: ${state.name || "-"}`,
    `Organisation: ${state.org || "-"}`,
    `Contact: ${state.contact || "-"}`,
    `Quantity: ${state.qty}`,
    `Looking for: ${state.need}`,
    state.message ? `` : null,
    state.message ? `Details: ${state.message}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const update = (k: keyof typeof state) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setState((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
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
        <label htmlFor="bf-qty" className={label}>
          Quantity
        </label>
        <select id="bf-qty" className={field} value={state.qty} onChange={update("qty")}>
          {quantities.map((q) => (
            <option key={q}>{q}</option>
          ))}
        </select>
      </div>
      <div className={compact ? "" : "sm:col-span-2"}>
        <label htmlFor="bf-need" className={label}>
          Looking for
        </label>
        <select id="bf-need" className={field} value={state.need} onChange={update("need")}>
          {needs.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
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
          placeholder="The occasion, a date you're working towards, artwork you'd like printed…"
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
    </form>
  );
}
