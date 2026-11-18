import { landSvg } from "@/components/map/geo";

export const dynamic = "force-static";

/** The world map's land shapes, written to /map-land.svg at build time and cached by browsers. */
export function GET() {
  return new Response(landSvg(), { headers: { "Content-Type": "image/svg+xml" } });
}
