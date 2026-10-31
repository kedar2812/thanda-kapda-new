"use client";

import { Marquee } from "@/components/ui/Marquee";
import { useContent } from "@/content/ContentProvider";

/** The ticker of product claims between sections. */
export function ClaimsBand() {
  const claims = useContent().site.claims;
  if (!claims.length) return null;
  return (
    <div data-cms="site.claims" className="border-y border-ink/10">
      <Marquee items={claims} />
    </div>
  );
}
