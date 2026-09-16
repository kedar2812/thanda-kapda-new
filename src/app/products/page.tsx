import type { Metadata } from "next";
import { products, rupee } from "@/data/products";
import { claims } from "@/data/site";
import { ProductCard } from "@/components/ProductCard";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { Marquee } from "@/components/ui/Marquee";
import { Button } from "@/components/ui/Button";
import { LeafSprig } from "@/components/ui/Ornaments";
import { FaqSection } from "@/components/home/FaqSection";

export const metadata: Metadata = {
  title: "The wipes",
  description:
    "Morning Spring and Namasté: aloe wet wipes in single sachets, alcohol-free and paraben-free. Buy on Amazon India or order in bulk.",
};

const rows: { label: string; get: (p: (typeof products)[number]) => string }[] = [
  { label: "Scent", get: (p) => p.scent },
  { label: "Made for", get: (p) => p.bestFor.slice(0, 2).join(", ") },
  { label: "Key botanicals", get: (p) => p.keyIngredients.slice(0, 2).map((k) => k.name).join(" + ") },
  { label: "Sheet", get: (p) => `${p.wipeSize}, individually sealed` },
  { label: "Pack", get: (p) => `${p.count} sachets` },
  { label: "Price", get: (p) => `${rupee.format(p.price)} (MRP ${rupee.format(p.mrp)})` },
];

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        eyebrow="The collection"
        title="Two wipes. One idea."
        intro="Both start with aloe vera and a single, sealed sachet. Morning Spring is the everyday cool-down; Namasté is the one you hand over when the meal is done."
      />

      <section className="container-wide pb-24 pt-16 md:pb-32">
        <Reveal stagger={0.12} y={48} className="grid gap-12 sm:grid-cols-2 lg:gap-10">
          {products.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </Reveal>
      </section>

      <div className="border-y border-ink/10">
        <Marquee items={claims} />
      </div>

      {/* Side by side */}
      <section className="container-wide py-24 md:py-32" aria-labelledby="compare-title">
        <Reveal>
          <p className="eyebrow text-gold">Side by side</p>
          <h2 id="compare-title" className="display-3 mt-5 text-forest">
            Which one is yours?
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink/15">
                <th className="py-4 pr-6 align-bottom" />
                {products.map((p) => (
                  <th key={p.slug} className="py-4 pr-6 align-bottom">
                    <span className="eyebrow block text-ink/45">No. 0{products.indexOf(p) + 1}</span>
                    <span className="font-display mt-2 block text-[1.6rem] text-forest">{p.displayName}</span>
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
                  {products.map((p) => (
                    <td key={p.slug} className="py-5 pr-6 text-ink/80">
                      {r.get(p)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-6" />
                {products.map((p) => (
                  <td key={p.slug} className="py-6 pr-6">
                    <Button href={p.amazonUrl} external arrow>
                      Buy on Amazon
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
              <p className="eyebrow text-gold-light">Need more than a box?</p>
              <h2 className="display-3 mt-4">By the case, or printed with your name.</h2>
              <p className="mt-4 max-w-lg text-cream/75">
                Restaurants, hotels, airlines and planners order in the hundreds and thousands. We print custom sachets
                too.
              </p>
            </div>
            <div className="md:col-span-4 md:text-right">
              <Button href="/bulk" variant="cream" arrow>
                Start a bulk order
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <FaqSection />
    </>
  );
}
