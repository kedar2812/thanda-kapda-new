export type ProductImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Ingredient = {
  name: string;
  latin?: string;
  note: string;
};

export type Product = {
  slug: "morning-spring" | "namaste";
  name: string;
  displayName: string;
  tagline: string;
  scent: string;
  short: string;
  story: string[];
  price: number;
  mrp: number;
  count: number;
  sizes: string[];
  wipeSize: string;
  keyIngredients: Ingredient[];
  inci: string;
  claims: string[];
  bestFor: string[];
  amazonUrl: string;
  rating: { value: number; count: number };
  packshot: ProductImage;
  hero: ProductImage;
  gallery: ProductImage[];
  accent: string;
};

export const products: Product[] = [
  {
    slug: "morning-spring",
    name: "Morning Spring",
    displayName: "Morning Spring",
    tagline: "Pure freshness from nature",
    scent: "Fresh, mild",
    short:
      "A fresh, mild scent on a pH-neutral aloe base. The wipe for heat, travel and long days out.",
    story: [
      "Morning Spring is the wipe most people meet first. A single sachet, the size of a postcard, with a mountain valley printed on the front and a cool aloe sheet folded inside.",
      "The formula is built around aloe barbadensis leaf extract and vitamin E, so it cools on contact without the tight, stinging finish that alcohol leaves behind. It is pH neutral and suitable for every skin type, including children.",
      "Keep a few in the car, a handbag, a wedding welcome kit or a hotel tray. They stay properly moist until the seal is broken.",
    ],
    price: 400,
    mrp: 600,
    count: 100,
    sizes: ["25 sachets", "100 sachets", "500 sachets", "1000 sachets"],
    wipeSize: "15 × 20 cm",
    keyIngredients: [
      {
        name: "Aloe vera",
        latin: "Aloe barbadensis leaf extract",
        note: "The base of every wipe. Cools on contact and leaves nothing behind.",
      },
      {
        name: "Vitamin E",
        latin: "Tocopherol",
        note: "Keeps the sheet moist and skin soft, not squeaky.",
      },
      {
        name: "Glycerin",
        note: "Draws water to the skin so the cool feeling lingers.",
      },
    ],
    inci: "Purified aqua, glycerin, phenoxyethanol, ethylhexylglycerin, aloe barbadensis leaf extract, PEG-40 hydrogenated castor oil, vitamin E oil.",
    claims: ["Alcohol-free", "Paraben-free", "pH neutral", "Aloe vera enriched", "Eco-friendly"],
    bestFor: ["Heat and travel", "Weddings and events", "Hotels", "Families"],
    amazonUrl: "https://www.amazon.in/dp/B0G1KN6Y55",
    rating: { value: 5.0, count: 27 },
    packshot: {
      src: "/products/morning-spring-plate.jpg",
      alt: "Two Morning Spring sachets resting on a speckled ceramic plate in warm afternoon light",
      width: 1374,
      height: 1030,
    },
    hero: {
      src: "/products/morning-spring-plate.jpg",
      alt: "Two Morning Spring sachets resting on a speckled ceramic plate in warm afternoon light",
      width: 1374,
      height: 1030,
    },
    gallery: [
      {
        src: "/products/morning-spring-box.jpg",
        alt: "Open box of one hundred Morning Spring sachets",
        width: 1280,
        height: 853,
      },
      {
        src: "/products/morning-spring-table.jpg",
        alt: "Morning Spring sachet laid on a wedding table beside cutlery and candles",
        width: 1500,
        height: 1000,
      },
      {
        src: "/products/morning-spring-hotel.jpg",
        alt: "Morning Spring sachet on a hotel tray with a rolled towel",
        width: 1254,
        height: 1254,
      },
      {
        src: "/products/morning-spring-lifestyle-1.jpg",
        alt: "A woman cooling her face with a wipe in the afternoon sun",
        width: 960,
        height: 1280,
      },
    ],
    accent: "#c1602e",
  },
  {
    slug: "namaste",
    name: "Namasté",
    displayName: "Namasté",
    tagline: "A refreshing finish to a memorable meal",
    scent: "Lemongrass",
    short:
      "Lemongrass, aloe and centella in an individually sealed sheet made for the end of a meal.",
    story: [
      "Namasté is the wipe you hand to a guest when the plates are cleared. It arrives in a quiet, unprinted sachet with the meaning of the word set on the front, and it smells of lemongrass.",
      "Inside, the sheet is soaked in aloe vera and centella asiatica, with a touch of menthol for the cool in Thanda Kapda. It is alcohol-free and paraben-free, so it cleans hands and face without drying them.",
      "Each wipe opens to fifteen by twenty centimetres, generous enough for a proper refresh. Restaurants, cafés, caterers and event planners use it by the box; so do people who like a good ending to lunch.",
    ],
    price: 499,
    mrp: 1000,
    count: 100,
    sizes: ["100 sachets"],
    wipeSize: "15 × 20 cm",
    keyIngredients: [
      {
        name: "Aloe vera",
        latin: "Aloe vera extract",
        note: "The base of every wipe. Cools on contact and leaves nothing behind.",
      },
      {
        name: "Centella asiatica",
        latin: "Gotu kola",
        note: "A staple of Indian herbal care. Calms skin that has been in the sun.",
      },
      {
        name: "Lemongrass",
        latin: "Cymbopogon",
        note: "The clean, citrus scent that lifts the end of a meal.",
      },
      {
        name: "Menthol",
        note: "A small amount, for the thanda in Thanda Kapda.",
      },
    ],
    inci: "Aqua, glycerin, propanediol, allantoin, phenoxyethanol and ethylhexylglycerin, xylitol, aloe vera extract, centella asiatica extract, sodium lauroyl oat amino acids, menthol, lactic acid, sodium hydroxide, fragrance.",
    claims: ["Alcohol-free", "Paraben-free", "Lemongrass fragrance", "Aloe and centella", "Individually packed"],
    bestFor: ["Restaurants and cafés", "Catering and events", "Offices", "Travel"],
    amazonUrl: "https://www.amazon.in/dp/B0HGYP6TYC",
    rating: { value: 5.0, count: 3 },
    packshot: {
      src: "/products/namaste-marble.jpg",
      alt: "Namasté sachet standing on a marble counter beside a rolled towel",
      width: 1500,
      height: 1000,
    },
    hero: {
      src: "/products/namaste-plate.jpg",
      alt: "Three Namasté sachets fanned on a ceramic plate on a café table",
      width: 1024,
      height: 1280,
    },
    gallery: [
      {
        src: "/products/namaste-cafe.jpg",
        alt: "Namasté sachet on a café table",
        width: 1500,
        height: 1000,
      },
      {
        src: "/products/namaste-marble.jpg",
        alt: "Namasté sachet on a marble counter beside a rolled towel",
        width: 1500,
        height: 1000,
      },
      {
        src: "/products/namaste-gym.jpg",
        alt: "Namasté sachet on a gym bench next to a towel",
        width: 1500,
        height: 1000,
      },
      {
        src: "/products/namaste-classroom.jpg",
        alt: "Namasté sachet on a school desk",
        width: 1500,
        height: 1000,
      },
    ],
    accent: "#8a7a4f",
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
