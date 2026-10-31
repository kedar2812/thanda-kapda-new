"use client";

import Link from "next/link";
import { discount, fill, ordinal, rupee, safeUrl } from "@/content";
import { useContent } from "@/content/ContentProvider";
import { CmsImage } from "@/components/cms/CmsImage";
import { Rich } from "@/components/cms/Rich";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { Button } from "@/components/ui/Button";
import { Flourish, LeafSprig, Stamp } from "@/components/ui/Ornaments";
import { LogoMark } from "@/components/ui/Logo";
import { ProductCard } from "@/components/ProductCard";

export function ProductView({ slug }: { slug: string }) {
  const c = useContent();
  const k = c.productPage;
  const index = c.products.findIndex((p) => p.slug === slug);
  const product = c.products[index];
  if (!product) return null;
  const others = c.products.filter((p) => p.slug !== slug);
  const off = discount(product);

  return (
    <>
      <article data-cms={`products.${index}`} className="container-wide pt-28 md:pt-36">
        <Reveal immediate className="flex items-center gap-3 text-[0.75rem] uppercase tracking-[0.16em] text-ink/50">
          <Link href="/products" className="link-line hover:text-ink">
            {k.breadcrumb}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ink/80">{product.name}</span>
        </Reveal>

        <div className="mt-10 grid gap-14 lg:grid-cols-12 lg:gap-12">
          {/* Gallery */}
          <div className="lg:col-span-7">
            <Reveal immediate delay={0.1} className="polaroid rotate-[-1deg]">
              <span className="tape -top-2 left-1/2 -translate-x-1/2" aria-hidden />
              <ParallaxImage image={product.hero} className="aspect-[4/3]" speed={0.08} priority sizes="(min-width: 1024px) 58vw, 100vw" />
              <p className="script mt-3 flex items-baseline justify-between text-[1.05rem] text-ink/80">
                <span>{product.tagline}</span>
                <span className="eyebrow text-[0.55rem] text-ink/50">{ordinal(index)}</span>
              </p>
            </Reveal>

            {product.gallery.length > 0 && (
              <Reveal stagger={0.1} y={40} className="mt-10 grid grid-cols-2 gap-5">
                {product.gallery.slice(0, 4).map((img, i) => (
                  <div key={i} className={i === 0 ? "col-span-2 sm:col-span-1" : ""}>
                    <ParallaxImage image={img} className="aspect-[4/5]" speed={0.08 + (i % 2) * 0.04} sizes="(min-width: 1024px) 28vw, 50vw" />
                  </div>
                ))}
              </Reveal>
            )}
          </div>

          {/* Details */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Reveal immediate delay={0.15}>
                <p className="eyebrow text-gold">
                  {product.scent} · {product.count} sachets
                </p>
              </Reveal>
              <SplitReveal as="h1" immediate delay={0.25} className="display-2 mt-5 text-forest">
                {product.name}
              </SplitReveal>
              <Reveal immediate delay={0.55}>
                <p className="lede mt-6 text-ink/80">{product.short}</p>
              </Reveal>

              <Reveal immediate delay={0.65} className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <span className="font-display text-[2.6rem] leading-none text-forest">{rupee.format(product.price)}</span>
                {off > 0 && (
                  <>
                    <span className="text-ink/50 line-through">{rupee.format(product.mrp)}</span>
                    <span className="rounded-full bg-forest px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-cream">
                      {off}% {k.offLabel}
                    </span>
                  </>
                )}
                {product.count > 0 && (
                  <span className="w-full text-[0.85rem] text-ink/60">
                    {rupee.format(product.price / product.count)} {k.perWipe}
                  </span>
                )}
              </Reveal>

              <Reveal immediate delay={0.75} className="mt-8 flex flex-wrap gap-3">
                <Button href={safeUrl(product.amazonUrl)} external size="lg" arrow>
                  {k.buyLabel}
                </Button>
                <Button href="/bulk" variant="outline" size="lg">
                  {k.bulkLabel}
                </Button>
              </Reveal>

              {product.rating.count > 0 && (
                <Reveal immediate delay={0.85} className="mt-6 flex items-center gap-2 text-[0.85rem] text-ink/65">
                  <span className="flex gap-0.5 text-gold" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
                        <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
                      </svg>
                    ))}
                  </span>
                  {product.rating.value.toFixed(1)} {fill(k.ratingLine, { count: product.rating.count })}
                </Reveal>
              )}

              <Reveal delay={0.1} className="mt-10">
                <ul className="flex flex-wrap gap-2">
                  {product.claims.map((claim, i) => (
                    <li key={i} className="rounded-full border border-ink/15 px-3 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-ink/70">
                      {claim}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal className="mt-10 space-y-5 text-ink/80">
                {product.story.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </Reveal>

              <Reveal className="mt-10">
                <Flourish />
              </Reveal>

              <Reveal className="mt-10">
                <p className="eyebrow text-ink/55">{k.keyBotanicals}</p>
                <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                  {product.keyIngredients.map((ing, i) => (
                    <li key={i} className="flex gap-4 py-4">
                      <LogoMark className="mt-1.5 h-3 w-3.5 shrink-0 text-gold" />
                      <div>
                        <p className="font-display text-[1.25rem] text-forest">
                          {ing.name}
                          {ing.latin && <span className="script ml-2 text-[1rem] text-gold">{ing.latin}</span>}
                        </p>
                        <p className="mt-1 text-[0.95rem] text-ink/70">{ing.note}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal className="mt-10 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="eyebrow text-ink/55">{k.sheetLabel}</p>
                  <p className="mt-2 text-ink/80">
                    {product.wipeSize}, {k.sheetText}
                  </p>
                </div>
                <div>
                  <p className="eyebrow text-ink/55">{k.packSizes}</p>
                  <p className="mt-2 text-ink/80">{product.sizes.join(" · ")}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="eyebrow text-ink/55">{k.bestFor}</p>
                  <p className="mt-2 text-ink/80">{product.bestFor.join(" · ")}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="eyebrow text-ink/55">{k.ingredients}</p>
                  <p className="mt-2 text-[0.9rem] leading-relaxed text-ink/65">{product.inci}</p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </article>

      {/* Also consider */}
      {others.length > 0 && (
        <section data-cms="productPage" className="container-wide relative py-24 md:py-32" aria-labelledby="also-title">
          <LeafSprig className="pointer-events-none absolute -left-12 top-0 h-72 w-auto text-forest/[0.06]" />
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="eyebrow text-gold">{k.otherEyebrow}</p>
                <h2 id="also-title" className="display-3 mt-5 text-forest">
                  <Rich text={k.otherTitle} />
                </h2>
                <p className="mt-5 max-w-sm text-ink/70">{product.pairing}</p>
                <Stamp text={k.otherStamp} className="mt-10 w-28">
                  <LogoMark className="h-8 w-9 text-forest" />
                </Stamp>
              </Reveal>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <Reveal delay={0.1}>
                <ProductCard product={others[0]} index={c.products.indexOf(others[0])} />
              </Reveal>
            </div>
          </div>
        </section>
      )}

      <section data-cms={`products.${index}`} className="container-wide pb-24">
        <Reveal className="polaroid mx-auto max-w-4xl rotate-[0.6deg]">
          <span className="tape -top-2 left-12 rotate-[-6deg]" aria-hidden />
          <div className="relative aspect-[16/7] overflow-hidden rounded-sm">
            <CmsImage image={product.closing.image} sizes="(min-width: 1024px) 56rem, 100vw" />
          </div>
          {product.closing.caption && <p className="script mt-3 text-[1.05rem] text-ink/80">{product.closing.caption}</p>}
        </Reveal>
      </section>
    </>
  );
}
