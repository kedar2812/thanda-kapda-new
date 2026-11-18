import type { Metadata } from "next";
import { bakedContent as c } from "@/content";
import { ProductsView } from "@/components/pages/ProductsView";

export const metadata: Metadata = {
  title: c.seo.products.title,
  description: c.seo.products.description,
  alternates: { canonical: "/products/" },
};

export default function ProductsPage() {
  return <ProductsView />;
}
