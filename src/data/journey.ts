import type { IconName } from "@/components/ui/Icons";

/** Where the sachet is made. Projected as the origin of every arc. */
export const origin = { name: "India", lon: 78.5, lat: 22 };

export type Pin = { name: string; lon: number; lat: number; region: string };

/** Markets the brand is building distribution towards, grouped as in the collateral. */
export const pins: Pin[] = [
  { name: "Dubai", lon: 55.27, lat: 25.2, region: "Middle East" },
  { name: "Riyadh", lon: 46.7, lat: 24.7, region: "Middle East" },
  { name: "Muscat", lon: 58.5, lat: 23.6, region: "Middle East" },
  { name: "Doha", lon: 51.5, lat: 25.3, region: "Middle East" },
  { name: "Casablanca", lon: -7.6, lat: 33.6, region: "North Africa" },
  { name: "Cairo", lon: 31.2, lat: 30.0, region: "North Africa" },
  { name: "Lagos", lon: 3.4, lat: 6.5, region: "Africa" },
  { name: "Nairobi", lon: 36.8, lat: -1.3, region: "Africa" },
  { name: "Johannesburg", lon: 28.0, lat: -26.2, region: "Africa" },
  { name: "London", lon: -0.1, lat: 51.5, region: "Europe" },
  { name: "Paris", lon: 2.3, lat: 48.9, region: "Europe" },
  { name: "Berlin", lon: 13.4, lat: 52.5, region: "Europe" },
  { name: "Rome", lon: 12.5, lat: 41.9, region: "Europe" },
  { name: "Madrid", lon: -3.7, lat: 40.4, region: "Europe" },
  { name: "Singapore", lon: 103.8, lat: 1.35, region: "Southeast Asia" },
  { name: "Kuala Lumpur", lon: 101.7, lat: 3.1, region: "Southeast Asia" },
  { name: "Jakarta", lon: 106.8, lat: -6.2, region: "Southeast Asia" },
  { name: "Sydney", lon: 151.2, lat: -33.9, region: "Asia Pacific" },
  { name: "New York", lon: -74.0, lat: 40.7, region: "North America" },
  { name: "Toronto", lon: -79.4, lat: 43.7, region: "North America" },
];

export const regions: { name: string; places: string[]; icon: IconName }[] = [
  { name: "Middle East", places: ["Dubai", "KSA", "Oman", "Qatar"], icon: "mosque" },
  { name: "North Africa", places: ["Morocco", "Egypt", "Tunisia"], icon: "pyramids" },
  { name: "Africa", places: ["Nigeria", "Kenya", "South Africa"], icon: "acacia" },
  { name: "Europe", places: ["UK", "France", "Germany", "Italy", "Spain"], icon: "cathedral" },
  { name: "Southeast Asia", places: ["Singapore", "Malaysia", "Indonesia"], icon: "pagoda" },
  { name: "Beyond", places: ["Australia", "USA", "Canada"], icon: "skyline" },
];

export const steps: { n: string; icon: IconName; title: string; text: string }[] = [
  { n: "1", icon: "bulb", title: "Conceptualise", text: "Inspired by an old Indian gesture, designed for hospitality." },
  { n: "2", icon: "flask", title: "Formulate", text: "Skin-friendly ingredients on an aloe base, tested for gentleness." },
  { n: "3", icon: "mortar", title: "Manufacture", text: "Made in India, in a modern facility, to international standards." },
  { n: "4", icon: "box", title: "Package", text: "Sealed one at a time for safety, freshness and convenience." },
  { n: "5", icon: "globePlane", title: "Distribute", text: "Freshness delivered wherever hospitality is celebrated." },
  { n: "6", icon: "handsHeart", title: "Lasting impact", text: "A better experience in every hand we touch, every day." },
];

export const pillars: { icon: IconName; title: string; text: string }[] = [
  { icon: "seedling", title: "Thoughtful by nature", text: "Every element is chosen with purpose and care." },
  { icon: "shield", title: "Quality you can trust", text: "Made under strict standards for safety and reliability." },
  { icon: "gift", title: "Crafted for hospitality", text: "Designed to lift the guest experience in every setting." },
  { icon: "globe", title: "From India to the world", text: "Proudly Indian at heart, crafted for global standards." },
];
