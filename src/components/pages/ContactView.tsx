"use client";

import { phoneHref, safeUrl, whatsappLink } from "@/content";
import { useContent } from "@/content/ContentProvider";
import { Rich } from "@/components/cms/Rich";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { LeafSprig, Stamp } from "@/components/ui/Ornaments";
import { LogoMark } from "@/components/ui/Logo";

export function ContactView() {
  const c = useContent();
  const k = c.contact;
  const ways = [
    { label: "WhatsApp", value: c.site.phoneDisplay, href: whatsappLink(c), note: k.whatsappNote, external: true },
    { label: "Phone", value: c.site.phoneDisplay, href: phoneHref(c), note: k.phoneNote },
    { label: "Email", value: c.site.email, href: `mailto:${c.site.email}`, note: k.emailNote },
    { label: "Instagram", value: c.site.instagramHandle, href: safeUrl(c.site.instagram), note: k.instagramNote, external: true },
  ];

  return (
    <>
      <PageHeader cms="contact.header" eyebrow={k.eyebrow} title={k.title} intro={k.intro} />

      <section data-cms="contact.details" className="container-wide relative py-20 md:py-28">
        <LeafSprig className="pointer-events-none absolute -right-14 -top-10 h-[24rem] w-auto text-forest/[0.06]" />
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <Reveal stagger={0.08} className="divide-y divide-ink/10 border-y border-ink/10">
              {ways.map((w) => (
                <a
                  key={w.label}
                  href={w.href}
                  target={w.external ? "_blank" : undefined}
                  rel={w.external ? "noopener noreferrer" : undefined}
                  className="group flex items-baseline justify-between gap-6 py-6"
                >
                  <div>
                    <p className="eyebrow text-ink/50">{w.label}</p>
                    <p className="link-line mt-2 inline-block font-display text-[1.5rem] text-forest md:text-[1.75rem]">{w.value}</p>
                    {w.note && <p className="mt-1 text-[0.9rem] text-ink/60">{w.note}</p>}
                  </div>
                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className="h-5 w-5 shrink-0 text-ink/40 transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:text-forest"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 10h13M11 5l5 5-5 5" />
                  </svg>
                </a>
              ))}
            </Reveal>
            <Reveal delay={0.2} className="mt-12 flex items-center gap-6">
              <Stamp text={k.stamp} className="w-32 shrink-0">
                <LogoMark className="h-9 w-10 text-forest" />
              </Stamp>
              <p className="max-w-[16rem] text-[0.95rem] text-ink/65">{k.seller}</p>
            </Reveal>
          </div>

          <Reveal delay={0.1} y={48} className="rounded-md border border-ink/10 bg-cream-50/70 p-6 shadow-paper sm:p-8 lg:col-span-7 lg:p-10">
            <p className="eyebrow text-ink/55">{k.formEyebrow}</p>
            <h2 className="display-3 mt-3 text-forest">
              <Rich text={k.formTitle} />
            </h2>
            <div className="mt-8">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
