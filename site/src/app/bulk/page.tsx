import type { Metadata } from "next";
import { bakedContent as c } from "@/content";
import { BulkView } from "@/components/pages/BulkView";

export const metadata: Metadata = {
  title: c.seo.bulk.title,
  description: c.seo.bulk.description,
  alternates: { canonical: "/bulk/" },
};

export default function BulkPage() {
  return <BulkView />;
}
