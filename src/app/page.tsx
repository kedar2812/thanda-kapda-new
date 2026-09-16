import { Hero } from "@/components/home/Hero";
import { Journey } from "@/components/home/Journey";
import { Statement } from "@/components/home/Statement";
import { Ritual } from "@/components/home/Ritual";
import { Collection } from "@/components/home/Collection";
import { Inside } from "@/components/home/Inside";
import { Planet } from "@/components/home/Planet";
import { Occasions } from "@/components/home/Occasions";
import { Proof } from "@/components/home/Proof";
import { BulkCta } from "@/components/home/BulkCta";
import { SealCta } from "@/components/home/SealCta";
import { Marquee } from "@/components/ui/Marquee";
import { claims } from "@/data/site";

export default function Home() {
  return (
    <>
      <Hero />
      <div className="border-y border-ink/10">
        <Marquee items={claims} />
      </div>
      <Journey />
      <Statement />
      <Ritual />
      <Collection />
      <Inside />
      <Planet />
      <Occasions />
      <Proof />
      <BulkCta />
      <SealCta />
    </>
  );
}
