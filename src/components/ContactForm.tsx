"use client";

import { useState } from "react";
import { site, whatsappLink } from "@/data/site";
import { Button } from "@/components/ui/Button";

const field =
  "w-full rounded-md border border-ink/15 bg-cream-50/80 px-4 py-3.5 text-[0.95rem] text-ink placeholder:text-ink/40 transition-colors duration-300 focus:border-forest focus:bg-cream-50 focus:outline-none";
const label = "eyebrow mb-2 block text-ink/60";

const topics = ["An order I placed", "Stocking Thanda Kapda", "A bulk or custom order", "Something else"];

export function ContactForm() {
  const [s, set] = useState({ name: "", contact: "", topic: topics[0], message: "" });
  const update = (k: keyof typeof s) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    set((v) => ({ ...v, [k]: e.target.value }));

  const body = [`Hi Thanda Kapda Co.,`, ``, `Topic: ${s.topic}`, `Name: ${s.name || "-"}`, `Contact: ${s.contact || "-"}`, ``, s.message].join("\n");
  const mailto = `mailto:${site.email}?subject=${encodeURIComponent(s.topic)}&body=${encodeURIComponent(body)}`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        window.open(whatsappLink(body), "_blank", "noopener,noreferrer");
      }}
      className="grid gap-5 sm:grid-cols-2"
    >
      <div>
        <label htmlFor="cf-name" className={label}>
          Your name
        </label>
        <input id="cf-name" required className={field} value={s.name} onChange={update("name")} autoComplete="name" />
      </div>
      <div>
        <label htmlFor="cf-contact" className={label}>
          Phone or email
        </label>
        <input id="cf-contact" required className={field} value={s.contact} onChange={update("contact")} autoComplete="tel email" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="cf-topic" className={label}>
          What is it about
        </label>
        <select id="cf-topic" className={field} value={s.topic} onChange={update("topic")}>
          {topics.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="cf-msg" className={label}>
          Message
        </label>
        <textarea id="cf-msg" rows={5} required className={field} value={s.message} onChange={update("message")} />
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Button type="submit" size="lg" arrow>
          Send on WhatsApp
        </Button>
        <a href={mailto} className="link-line eyebrow text-ink/70">
          Or send by email
        </a>
      </div>
    </form>
  );
}
