export const site = {
  name: "Thanda Kapda Co.",
  shortName: "Thanda Kapda",
  tagline: "Essence of pure indulgence",
  description:
    "Premium, eco-friendly wet wipes infused with natural aloe vera. Alcohol-free, paraben-free, pH neutral and cruelty-free, inspired by the Indian custom of offering a cool cloth to a guest.",
  url: "https://thandakapda.co",
  phoneDisplay: "+91 91755 40053",
  phoneHref: "tel:+919175540053",
  whatsapp: "919175540053",
  email: "thandakapda@gmail.com",
  instagram: "https://www.instagram.com/thandakapda.co",
  instagramHandle: "@thandakapda.co",
  amazonStore: "https://www.amazon.in/s?k=thanda+kapda",
  /** Fill rating and count from the Google Business Profile; the badge hides the score until both are set. */
  googleReviews: {
    url: "https://www.google.com/search?q=Thanda+Kapda+Co.+reviews",
    rating: null as number | null,
    count: null as number | null,
  },
  established: "2025",
  origin: "Made in India",
};

export const nav = [
  { href: "/products", label: "The wipes" },
  { href: "/story", label: "Our story" },
  { href: "/bulk", label: "Bulk & custom" },
  { href: "/contact", label: "Contact" },
] as const;

export const claims = [
  "Aloe vera enriched",
  "Alcohol-free",
  "Paraben-free",
  "pH neutral",
  "Cruelty-free",
  "Individually sealed",
  "Made in India",
];

/** Builds a WhatsApp deep link with a pre-filled message. */
export function whatsappLink(message: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}
