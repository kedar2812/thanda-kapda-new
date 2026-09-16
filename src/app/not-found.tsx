import { Button } from "@/components/ui/Button";
import { LeafSprig } from "@/components/ui/Ornaments";
import { Reveal } from "@/components/motion/Reveal";

export default function NotFound() {
  return (
    <section className="container-wide relative flex min-h-[80svh] flex-col items-start justify-center overflow-hidden pt-24">
      <LeafSprig className="pointer-events-none absolute -right-10 top-10 h-[28rem] w-auto text-forest/[0.06]" />
      <Reveal immediate>
        <p className="eyebrow text-gold">404</p>
        <h1 className="display-1 mt-6 max-w-3xl text-forest">This page drifted off like morning frost.</h1>
        <p className="lede mt-8 max-w-lg text-ink/75">The link may be old, or the page may have moved. The wipes are still where they were.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/" arrow>
            Back home
          </Button>
          <Button href="/products" variant="outline">
            See the wipes
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
