import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, products, rupee } from "@/data/products";
import { site } from "@/data/site";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { Button } from "@/components/ui/Button";
import { Flourish, LeafSprig, Stamp } from "@/components/ui/Ornaments";
import { LogoMark } from "@/components/ui/Logo";
import { ProductCard } from "@/components/ProductCard";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  return {
    title: `${p.displayName} wet wipes`,
    description: `${p.short} ${rupee.format(p.price)} for ${p.count} individually sealed sachets.`,
    openGraph: { images: [{ url: p.hero.src, width: p.hero.width, height: p.hero.height, alt: p.hero.alt }] },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const other = products.find((p) => p.slug !== product.slug)!;
  const index = products.indexOf(product);
  const off = Math.round((1 - product.price / product.mrp) * 100);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Thanda Kapda Co. ${product.displayName} Wet Wipes, pack of ${product.count}`,
    description: product.short,
    image: [`${site.url}${product.hero.src}`],
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: product.amazonUrl,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating.value,
      reviewCount: product.rating.count,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="container-wide pt-28 md:pt-36">
        <Reveal immediate className="flex items-center gap-3 text-[0.75rem] uppercase tracking-[0.16em] text-ink/50">
          <Link href="/products" className="link-line hover:text-ink">
            The wipes
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ink/80">{product.displayName}</span>
        </Reveal>

        <div className="mt-10 grid gap-14 lg:grid-cols-12 lg:gap-12">
          {/* Gallery */}
          <div className="lg:col-span-7">
            <Reveal immediate delay={0.1} className="polaroid rotate-[-1deg]">
              <span className="tape -top-2 left-1/2 -translate-x-1/2" aria-hidden />
              <ParallaxImage
                src={product.hero.src}
                alt={product.hero.alt}
                className="aspect-[4/3]"
                speed={0.08}
                priority
                quality={85}
                sizes="(min-width: 1024px) 58vw, 100vw"
              />
              <p className="script mt-3 flex items-baseline justify-between text-[1.05rem] text-ink/80">
                <span>{product.tagline}</span>
                <span className="eyebrow text-[0.55rem] text-ink/50">No. 0{index + 1}</span>
              </p>
            </Reveal>

            <Reveal stagger={0.1} y={40} className="mt-10 grid grid-cols-2 gap-5">
              {product.gallery.slice(0, 4).map((img, i) => (
                <div key={img.src} className={i === 0 ? "col-span-2 sm:col-span-1" : ""}>
                  <ParallaxImage
                    src={img.src}
                    alt={img.alt}
                    className={i % 3 === 0 ? "aspect-[4/5]" : "aspect-[4/5]"}
                    speed={0.08 + (i % 2) * 0.04}
                    sizes="(min-width: 1024px) 28vw, 50vw"
                  />
                </div>
              ))}
            </Reveal>
          </div>

          {/* Details */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Reveal immediate delay={0.15}>
                <p className="eyebrow text-gold">{product.scent} · {product.count} sachets</p>
              </Reveal>
              <SplitReveal as="h1" immediate delay={0.25} className="display-2 mt-5 text-forest">
                {product.displayName}
              </SplitReveal>
              <Reveal immediate delay={0.55}>
                <p className="lede mt-6 text-ink/80">{product.short}</p>
              </Reveal>

              <Reveal immediate delay={0.65} className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <span className="font-display text-[2.6rem] leading-none text-forest">{rupee.format(product.price)}</span>
                <span className="text-ink/50 line-through">{rupee.format(product.mrp)}</span>
                <span className="rounded-full bg-forest px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-cream">
                  {off}% off
                </span>
                <span className="w-full text-[0.85rem] text-ink/60">
                  {rupee.format(product.price / product.count)} a wipe · inclusive of all taxes
                </span>
              </Reveal>

              <Reveal immediate delay={0.75} className="mt-8 flex flex-wrap gap-3">
                <Button href={product.amazonUrl} external size="lg" arrow>
                  Buy on Amazon
                </Button>
                <Button href="/bulk" variant="outline" size="lg">
                  Order in bulk
                </Button>
              </Reveal>

              <Reveal immediate delay={0.85} className="mt-6 flex items-center gap-2 text-[0.85rem] text-ink/65">
                <span className="flex gap-0.5 text-gold" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
                      <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
                    </svg>
                  ))}
                </span>
                {product.rating.value.toFixed(1)} on Amazon India · {product.rating.count} ratings · Free delivery
              </Reveal>

              <Reveal delay={0.1} className="mt-10">
                <ul className="flex flex-wrap gap-2">
                  {product.claims.map((c) => (
                    <li key={c} className="rounded-full border border-ink/15 px-3 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-ink/70">
                      {c}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal className="mt-10 space-y-5 text-ink/80">
                {product.story.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </Reveal>

              <Reveal className="mt-10">
                <Flourish />
              </Reveal>

              <Reveal className="mt-10">
                <p className="eyebrow text-ink/55">Key botanicals</p>
                <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                  {product.keyIngredients.map((k) => (
                    <li key={k.name} className="flex gap-4 py-4">
                      <LogoMark className="mt-1.5 h-3 w-3.5 shrink-0 text-gold" />
                      <div>
                        <p className="font-display text-[1.25rem] text-forest">
                          {k.name}
                          {k.latin && <span className="script ml-2 text-[1rem] text-gold">{k.latin}</span>}
                        </p>
                        <p className="mt-1 text-[0.95rem] text-ink/70">{k.note}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal className="mt-10 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="eyebrow text-ink/55">Sheet</p>
                  <p className="mt-2 text-ink/80">{product.wipeSize}, non-woven, individually sealed</p>
                </div>
                <div>
                  <p className="eyebrow text-ink/55">Pack sizes</p>
                  <p className="mt-2 text-ink/80">{product.sizes.join(" · ")}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="eyebrow text-ink/55">Best for</p>
                  <p className="mt-2 text-ink/80">{product.bestFor.join(" · ")}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="eyebrow text-ink/55">Full ingredients</p>
                  <p className="mt-2 text-[0.9rem] leading-relaxed text-ink/65">{product.inci}</p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </article>

      {/* Also consider */}
      <section className="container-wide relative py-24 md:py-32" aria-labelledby="also-title">
        <LeafSprig className="pointer-events-none absolute -left-12 top-0 h-72 w-auto text-forest/[0.06]" />
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="eyebrow text-gold">The other one</p>
              <h2 id="also-title" className="display-3 mt-5 text-forest">
                Most tables keep both.
              </h2>
              <p className="mt-5 max-w-sm text-ink/70">
                {product.slug === "namaste"
                  ? "Morning Spring for the heat of the day; Namasté for the end of the meal."
                  : "Namasté for the end of the meal; Morning Spring for the heat of the day."}
              </p>
              <Stamp text="ALOE VERA · ALCOHOL-FREE · PARABEN-FREE · " className="mt-10 w-28">
                <LogoMark className="h-8 w-9 text-forest" />
              </Stamp>
            </Reveal>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal delay={0.1}>
              <ProductCard product={other} index={products.indexOf(other)} />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="container-wide pb-24">
        <Reveal className="polaroid mx-auto max-w-4xl rotate-[0.6deg]">
          <span className="tape -top-2 left-12 rotate-[-6deg]" aria-hidden />
          <div className="relative aspect-[16/7] overflow-hidden rounded-sm">
            <Image
              src={product.slug === "namaste" ? "/products/namaste-classroom.jpg" : "/products/morning-spring-plate.jpg"}
              alt={product.slug === "namaste" ? "Namasté sachet on a school desk" : "Morning Spring sachets on a ceramic plate beside an olive sprig"}
              fill
              sizes="(min-width: 1024px) 56rem, 100vw"
              className={product.slug === "namaste" ? "object-cover object-center" : "object-cover object-[50%_62%]"}
            />
          </div>
          <p className="script mt-3 text-[1.05rem] text-ink/80">
            {product.slug === "namaste" ? "Cleanse. Refresh. Indulge." : "Beat the heat. Stay fresh."}
          </p>
        </Reveal>
      </section>
    </>
  );
}
