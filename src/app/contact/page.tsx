import type { Metadata } from "next";
import { bakedContent as c } from "@/content";
import { ContactView } from "@/components/pages/ContactView";

export const metadata: Metadata = {
  title: c.seo.contact.title,
  description: c.seo.contact.description,
  alternates: { canonical: "/contact/" },
};

export default function ContactPage() {
  return <ContactView />;
}
