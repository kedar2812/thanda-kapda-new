"use client";

import { discount, ordinal, rupee, safeUrl, type ProductContent } from "@/content";
import { useContent } from "@/content/ContentProvider";
import { ProductCard } from "@/components/ProductCard";
import { PageHeader } from "@/components/PageHeader";
import { ClaimsBand } from "@/components/ClaimsBand";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { LeafSprig } from "@/components/ui/Ornaments";
import { FaqSection } from "@/components/home/FaqSection";
import { Rich } from "@/components/cms/Rich";

export function ProductsView() {
  const c = useContent();
  const k = c.productsPage;
  const rows: { label: string; get: (p: ProductContent) => string }[] = [
    { label: k.rows.scent, get: (p) => p.scent },
    { label: k.rows.madeFor, get: (p) => p.bestFor.slice(0, 2).join(", ") },
    { label: k.rows.botanicals, get: (p) => p.keyIngredients.slice(0, 2).map((x) => x.name).join(" + ") },
    { label: k.rows.sheet, get: (p) => `${p.wipeSize}, individually sealed` },
    { label: k.rows.pack, get: (p) => `${p.count} sachets` },
    { label: k.rows.price, get: (p) => (discount(p) > 0 ? `${rupee.format(p.price)} (MRP ${rupee.format(p.mrp)})` : rupee.format(p.price)) },
  ];

  return (
    <>
      <PageHeader cms="productsPage" eyebrow={k.eyebrow} title={k.title} intro={k.intro} />

      <section className="container-wide pb-24 pt-16 md:pb-32">
        <Reveal stagger={0.12} y={48} className="grid gap-12 sm:grid-cols-2 lg:gap-10">
          {c.products.map((p, i) => (
            <div key={p.slug} data-cms={`products.${i}`}>
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </Reveal>
      </section>

      <ClaimsBand />

      {/* Side by side */}
      <section data-cms="productsPage" className="container-wide py-24 md:py-32" aria-labelledby="compare-title">
        <Reveal>
          <p className="eyebrow text-gold">{k.compareEyebrow}</p>
          <h2 id="compare-title" className="display-3 mt-5 text-forest">
            <Rich text={k.compareTitle} />
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink/15">
                <th className="py-4 pr-6 align-bottom" />
                {c.products.map((p, i) => (
                  <th key={p.slug} className="py-4 pr-6 align-bottom">
                    <span className="eyebrow block text-ink/45">{ordinal(i)}</span>
                    <span className="font-display mt-2 block text-[1.6rem] text-forest">{p.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-ink/10">
                  <th scope="row" className="eyebrow py-5 pr-6 text-ink/55">
                    {r.label}
                  </th>
                  {c.products.map((p) => (
                    <td key={p.slug} className="py-5 pr-6 text-ink/80">
                      {r.get(p)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-6" />
                {c.products.map((p) => (
                  <td key={p.slug} className="py-6 pr-6">
                    <Button href={safeUrl(p.amazonUrl)} external arrow>
                      {c.home.collection.buyLabel}
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </Reveal>
      </section>

      {/* Bulk nudge */}
      <section className="container-wide pb-8">
        <Reveal className="parchment-dark relative overflow-hidden rounded-md px-8 py-14 text-cream md:px-14 md:py-20">
          <LeafSprig className="pointer-events-none absolute -right-8 -top-10 h-80 w-auto text-cream/[0.07]" />
          <div className="relative grid gap-8 md:grid-cols-12 md:items-end">
            <div className="md:col-span-8">
              <p className="eyebrow text-gold-light">{k.nudgeEyebrow}</p>
              <h2 className="display-3 mt-4">
                <Rich text={k.nudgeTitle} />
              </h2>
              <p className="mt-4 max-w-lg text-cream/75">{k.nudgeText}</p>
            </div>
            <div className="md:col-span-4 md:text-right">
              <Button href="/bulk" variant="cream" arrow>
                {k.nudgeCta}
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <FaqSection />
    </>
  );
}
