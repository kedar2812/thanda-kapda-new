import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { rupee, type Product } from "@/data/products";
import { Button } from "@/components/ui/Button";

export function ProductCard({ product, index, className }: { product: Product; index: number; className?: string }) {
  const off = Math.round((1 - product.price / product.mrp) * 100);
  return (
    <article className={clsx("group flex flex-col", className)}>
      <Link href={`/products/${product.slug}`} className="frame block aspect-[4/5] bg-cream-200" aria-label={`${product.name} details`}>
        <Image
          src={product.hero.src}
          alt={product.hero.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.06]"
        />
        <span className="absolute left-4 top-4 rounded-full bg-cream/90 px-3 py-1.5 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-forest backdrop-blur-sm">
          No. 0{index + 1}
        </span>
        <span className="absolute bottom-4 right-4 rounded-full bg-forest px-3 py-1.5 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-cream">
          {off}% off MRP
        </span>
      </Link>

      <div className="mt-6 flex flex-1 flex-col">
        <p className="eyebrow text-gold">{product.scent}</p>
        <h3 className="display-3 mt-3 text-forest">
          <Link href={`/products/${product.slug}`} className="link-line">
            {product.displayName}
          </Link>
        </h3>
        <p className="mt-3 max-w-md text-ink/75">{product.short}</p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {product.claims.slice(0, 3).map((c) => (
            <li key={c} className="rounded-full border border-ink/15 px-3 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-ink/70">
              {c}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-baseline gap-3">
          <span className="font-display text-3xl text-forest">{rupee.format(product.price)}</span>
          <span className="text-sm text-ink/50 line-through">{rupee.format(product.mrp)}</span>
          <span className="text-sm text-ink/60">· {product.count} wipes</span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button href={product.amazonUrl} external arrow>
            Buy on Amazon
          </Button>
          <Button href={`/products/${product.slug}`} variant="ghost" className="link-line">
            Details
          </Button>
        </div>
      </div>
    </article>
  );
}
