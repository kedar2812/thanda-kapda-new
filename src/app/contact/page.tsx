import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/data/site";
import { LeafSprig, Stamp } from "@/components/ui/Ornaments";
import { LogoMark } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Thanda Kapda Co. on WhatsApp, by phone or by email. Orders, bulk enquiries and questions welcome.",
};

const ways = [
  { label: "WhatsApp", value: site.phoneDisplay, href: `https://wa.me/${site.whatsapp}`, note: "Fastest for orders and quotes", external: true },
  { label: "Phone", value: site.phoneDisplay, href: site.phoneHref, note: "Monday to Saturday" },
  { label: "Email", value: site.email, href: `mailto:${site.email}`, note: "For anything with attachments" },
  { label: "Instagram", value: site.instagramHandle, href: site.instagram, note: "New batches, behind the scenes", external: true },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Contact" title="Keep it cool. Say hello." intro="Orders, bulk enquiries, stockist questions, or just a note about how the wipes worked for you. We read everything." />

      <section className="container-wide relative py-20 md:py-28">
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
                    <p className="mt-1 text-[0.9rem] text-ink/60">{w.note}</p>
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
              <Stamp text="THANDA KAPDA CO. · ESSENCE OF PURE INDULGENCE · " className="w-32 shrink-0">
                <LogoMark className="h-9 w-10 text-forest" />
              </Stamp>
              <p className="max-w-[16rem] text-[0.95rem] text-ink/65">
                Sold by Thanda Kapda Co., {site.origin}. Retail orders ship through Amazon India.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.1} y={48} className="rounded-md border border-ink/10 bg-cream-50/70 p-6 shadow-paper sm:p-8 lg:col-span-7 lg:p-10">
            <p className="eyebrow text-ink/55">Write to us</p>
            <h2 className="display-3 mt-3 text-forest">We&rsquo;d love to hear from you.</h2>
            <div className="mt-8">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
