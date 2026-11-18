"use client";

import { Button } from "@/components/ui/Button";
import { LeafSprig } from "@/components/ui/Ornaments";
import { Reveal } from "@/components/motion/Reveal";
import { Rich } from "@/components/cms/Rich";
import { useContent } from "@/content/ContentProvider";

export default function NotFound() {
  const n = useContent().notFound;
  return (
    <section data-cms="notFound" className="container-wide relative flex min-h-[80svh] flex-col items-start justify-center overflow-hidden pt-24">
      <LeafSprig className="pointer-events-none absolute -right-10 top-10 h-[28rem] w-auto text-forest/[0.06]" />
      <Reveal immediate>
        <p className="eyebrow text-gold">404</p>
        <h1 className="display-1 mt-6 max-w-3xl text-forest">
          <Rich text={n.title} />
        </h1>
        <p className="lede mt-8 max-w-lg text-ink/75">{n.text}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/" arrow>
            {n.primary}
          </Button>
          <Button href="/products" variant="outline">
            {n.secondary}
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
