import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL, absoluteUrl, bakedContent as c, getProduct, rupee, shareImage } from "@/content";
import { ProductView } from "@/components/pages/ProductView";

export function generateStaticParams() {
  return c.products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(c, slug);
  if (!p) return {};
  return {
    title: `${p.name} wet wipes`,
    description: `${p.short} ${rupee.format(p.price)} for ${p.count} individually sealed sachets.`,
    alternates: { canonical: `/products/${p.slug}/` },
    openGraph: { images: [shareImage(p.hero)] },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = getProduct(c, slug);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${c.site.name} ${product.name} Wet Wipes, pack of ${product.count}`,
    description: product.short,
    image: [absoluteUrl(product.hero.src), ...product.gallery.map((g) => absoluteUrl(g.src))],
    brand: { "@type": "Brand", name: c.site.name },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: product.amazonUrl,
    },
    ...(product.rating.count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.value, reviewCount: product.rating.count } }
      : {}),
    url: `${SITE_URL}/products/${product.slug}/`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductView slug={product.slug} />
    </>
  );
}
