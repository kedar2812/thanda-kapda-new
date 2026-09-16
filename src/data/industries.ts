import type { IconName } from "@/components/ui/Icons";

export const industries: { icon: IconName; label: string }[] = [
  { icon: "cloche", label: "Restaurants" },
  { icon: "hotel", label: "Hotels" },
  { icon: "plane", label: "Airlines" },
  { icon: "rings", label: "Weddings" },
  { icon: "briefcase", label: "Corporate" },
  { icon: "bag", label: "Retail" },
  { icon: "stones", label: "Spa & salon" },
  { icon: "dumbbell", label: "Gyms" },
  { icon: "glass", label: "Lounges" },
  { icon: "ship", label: "Cruise lines" },
  { icon: "hospital", label: "Hospitals" },
  { icon: "calendar", label: "Events" },
];

export const distributorBenefits: { icon: IconName; title: string; text: string }[] = [
  { icon: "pin", title: "Territories", text: "Defined, protected territories so partners can build a market properly." },
  { icon: "megaphone", title: "Marketing support", text: "Brand collateral, campaign assets and promotional support." },
  { icon: "monitor", title: "Digital catalogue", text: "Always-current product range, pricing and updates." },
  { icon: "factory", title: "Custom manufacturing", text: "Private-label and custom-printed sachets for your own brand." },
  { icon: "truck", title: "Fast dispatch", text: "Quick processing and dependable delivery windows." },
  { icon: "headset", title: "Export support", text: "Documentation and end-to-end help for shipments abroad." },
  { icon: "cap", title: "Product training", text: "Sessions on the range for your sales and service teams." },
  { icon: "handshake", title: "Stronger together", text: "A partner, not a supplier. We grow when you do." },
];
