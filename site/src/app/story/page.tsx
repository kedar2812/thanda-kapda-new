import type { Metadata } from "next";
import { bakedContent as c } from "@/content";
import { StoryView } from "@/components/pages/StoryView";

export const metadata: Metadata = {
  title: c.seo.story.title,
  description: c.seo.story.description,
  alternates: { canonical: "/story/" },
};

export default function StoryPage() {
  return <StoryView />;
}
