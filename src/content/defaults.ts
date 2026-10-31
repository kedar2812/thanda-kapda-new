/**
 * Every editable word and image on the website, as shipped. The dashboard
 * publishes changes on top of this; anything it has never touched falls back
 * to these values, so adding a field here is always safe.
 *
 * Text marked "rich" in the schema may use *emphasis* and line breaks.
 */
import type { CmsImage } from "./types";

/** A built-in photo from public/products, with its responsive WebP sizes. */
function photo(name: string, width: number, height: number, alt: string, crop?: { focus?: string; zoom?: number }): CmsImage {
  const widths = [...new Set([640, 1080, width].filter((w) => w <= width))];
  return { src: `/products/${name}-${width}.webp#w=${widths.join(",")}`, alt, width, height, focus: crop?.focus ?? "50% 50%", zoom: crop?.zoom ?? 1 };
}

export const photos = {
  msBox: (alt = "Open box of one hundred Morning Spring sachets") => photo("morning-spring-box", 1280, 853, alt),
  msHotel: (alt = "Morning Spring sachet on a hotel tray with a rolled towel", crop?: { focus?: string; zoom?: number }) => photo("morning-spring-hotel", 1254, 1254, alt, crop),
  msLifestyle1: (alt = "A woman cooling her face with a wipe in the afternoon sun", crop?: { focus?: string; zoom?: number }) => photo("morning-spring-lifestyle-1", 960, 1280, alt, crop),
  msLifestyle2: (alt = "Morning Spring sachet in everyday use") => photo("morning-spring-lifestyle-2", 1254, 1254, alt),
  msPlate: (alt = "Two Morning Spring sachets resting on a speckled ceramic plate in warm afternoon light", crop?: { focus?: string; zoom?: number }) => photo("morning-spring-plate", 1374, 1030, alt, crop),
  msTable: (alt = "Morning Spring sachet laid on a wedding table beside cutlery and candles", crop?: { focus?: string; zoom?: number }) => photo("morning-spring-table", 1500, 1000, alt, crop),
  nCafe: (alt = "Namasté sachet on a café table") => photo("namaste-cafe", 1500, 1000, alt),
  nClassroom: (alt = "Namasté sachet on a school desk") => photo("namaste-classroom", 1500, 1000, alt),
  nGym: (alt = "Namasté sachet on a gym bench next to a towel") => photo("namaste-gym", 1500, 1000, alt),
  nMarble: (alt = "Namasté sachet standing on a marble counter beside a rolled towel") => photo("namaste-marble", 1500, 1000, alt),
  nPlate: (alt = "Three Namasté sachets fanned on a ceramic plate on a café table") => photo("namaste-plate", 1024, 1280, alt),
  nPoster: (alt = "Namasté sachet artwork") => photo("namaste-poster", 1500, 1500, alt),
};

const product = (p: {
  slug: string;
  name: string;
  tagline: string;
  scent: string;
  short: string;
  story: string[];
  price: number;
  mrp: number;
  count: number;
  sizes: string[];
  wipeSize: string;
  keyIngredients: { name: string; latin: string; note: string }[];
  inci: string;
  claims: string[];
  bestFor: string[];
  amazonUrl: string;
  rating: { value: number; count: number };
  hero: CmsImage;
  gallery: CmsImage[];
  collection: { subtitle: string; note: string; image: CmsImage; scene: CmsImage };
  pairing: string;
  closing: { image: CmsImage; caption: string };
}) => p;

export const defaultContent = {
  site: {
    name: "Thanda Kapda Co.",
    tagline: "Essence of pure indulgence",
    description:
      "Premium, eco-friendly wet wipes infused with natural aloe vera. Alcohol-free, paraben-free, pH neutral and cruelty-free, inspired by the Indian custom of offering a cool cloth to a guest.",
    phoneDisplay: "+91 91755 40053",
    phone: "+919175540053",
    whatsapp: "919175540053",
    email: "thandakapda@gmail.com",
    instagram: "https://www.instagram.com/thandakapda.co",
    instagramHandle: "@thandakapda.co",
    amazonStore: "https://www.amazon.in/s?k=thanda+kapda",
    googleReviews: {
      url: "https://www.google.com/search?q=Thanda+Kapda+Co.+reviews",
      /** 0 hides the score and shows "See what guests say" instead. */
      rating: 0,
      count: 0,
    },
    established: "2025",
    origin: "Made in India",
    claims: ["Aloe vera enriched", "Alcohol-free", "Paraben-free", "pH neutral", "Cruelty-free", "Individually sealed", "Made in India"],
    nav: { home: "Home", products: "The wipes", story: "Our story", bulk: "Bulk & custom", contact: "Contact", shop: "Shop" },
  },

  seo: {
    title: "Thanda Kapda Co. · Aloe wet wipes, alcohol-free and paraben-free",
    shareTitle: "Thanda Kapda Co. · A cool cloth for a warm country",
    shareImage: photos.msTable("Morning Spring sachet on a table"),
    products: {
      title: "The wipes",
      description: "Morning Spring and Namasté: aloe wet wipes in single sachets, alcohol-free and paraben-free. Buy on Amazon India or order in bulk.",
    },
    story: {
      title: "Our story",
      description:
        "Thanda Kapda Co. began with the Indian custom of handing a guest a cool, damp cloth. This is how that gesture became an aloe wipe in a sachet.",
    },
    bulk: {
      title: "Bulk & custom orders",
      description:
        "Order Morning Spring and Namasté wet wipes by the case, or have single sachets printed with your branding for restaurants, hotels, airlines, weddings and offices.",
    },
    contact: {
      title: "Contact",
      description: "Talk to Thanda Kapda Co. on WhatsApp, by phone or by email. Orders, bulk enquiries and questions welcome.",
    },
  },

  home: {
    hero: {
      eyebrow: "Essence of pure indulgence",
      title: "A cool cloth for a *warm country.*",
      lede: "The oldest welcome in India is a cold, damp cloth pressed into your hands. We folded it into a sachet: soaked in aloe, free of alcohol, and ready wherever the day gets hot.",
      primaryCta: "Shop the wipes",
      secondaryCta: "Bulk & custom orders",
      reviewsEyebrow: "Google Reviews",
      reviewsFallback: "See what guests say",
      ratingNote: "on Amazon India",
      claimsLine: "Alcohol-free · Paraben-free · pH neutral",
      edge: "Est. 2025 · Born in India · Refreshing the world",
      tag: { place: "India · Est. 2025", title: "Where it all began.", text: "A cool cloth for a guest is the oldest welcome we know." },
      note: "“Thanda kapda” — literally, *cold cloth*. The oldest welcome in India.",
      firstPhoto: photos.msPlate(),
      secondPhoto: photos.nPlate(),
    },

    journey: {
      eyebrow: "Thanda Kapda Co. · Our journey",
      title: "From India to the world",
      brush: "Our roots bring us India.\nOur vision takes us global.",
      steps: [
        { icon: "bulb", title: "Conceptualise", text: "Inspired by an old Indian gesture, designed for hospitality." },
        { icon: "flask", title: "Formulate", text: "Skin-friendly ingredients on an aloe base, tested for gentleness." },
        { icon: "mortar", title: "Manufacture", text: "Made in India, in a modern facility, to international standards." },
        { icon: "box", title: "Package", text: "Sealed one at a time for safety, freshness and convenience." },
        { icon: "globePlane", title: "Distribute", text: "Freshness delivered wherever hospitality is celebrated." },
        { icon: "handsHeart", title: "Lasting impact", text: "A better experience in every hand we touch, every day." },
      ],
      mapNote: "To the world,\nfrom India.",
      legendHome: "Home market",
      legendPath: "Future path",
      seal: "ESTD 2025 · REFRESHING TRADITION · ",
      panelEyebrow: "Estd. 2025",
      panelTitle: "Where we’re headed",
      panelSub: "A fresh tradition. Soon, everywhere.",
      regions: [
        { icon: "mosque", name: "Middle East", places: "Dubai · KSA · Oman · Qatar" },
        { icon: "pyramids", name: "North Africa", places: "Morocco · Egypt · Tunisia" },
        { icon: "acacia", name: "Africa", places: "Nigeria · Kenya · South Africa" },
        { icon: "cathedral", name: "Europe", places: "UK · France · Germany · Italy · Spain" },
        { icon: "pagoda", name: "Southeast Asia", places: "Singapore · Malaysia · Indonesia" },
        { icon: "skyline", name: "Beyond", places: "Australia · USA · Canada" },
      ],
      panelClosing: "More countries, coming soon!",
      cta: "Distribute with us",
      stats: [
        { icon: "globe", title: "Made in India", text: "Proudly Indian at heart, built to global standards." },
        { icon: "pin", title: "Sealed one at a time", text: "One hundred single sachets to every case." },
        { icon: "handshake", title: "Built on trust", text: "Driven by quality. Delivered with care." },
      ],
      closing: "From India, to every corner of the world.",
    },

    statement: {
      eyebrow: "Thanda Kapda Co.",
      title: "We don’t make wet wipes. We create last impressions.",
      subtitle: "Thoughtfully crafted for the finest hospitality experiences.",
      photo: photos.msTable("A Morning Spring sachet at a place setting on a wedding table", { focus: "70% 50%" }),
      seal: "CRAFTED EXCELLENCE · CRAFTED EXCELLENCE · ",
      beliefLead: "We exist to",
      beliefMiddle: "turn overlooked details into",
      beliefAccent: "exceptional experiences.",
      paragraphs: [
        "At Thanda Kapda Co., we believe true hospitality lives in the details.",
        "What most people overlook as a simple wet wipe is, to us, the last thing a guest touches at the end of a meal. It is a small chance to get comfort, hygiene and care exactly right.",
        "So every part of it is intentional: the softness of the sheet, the aloe it is soaked in, the seal that keeps it fresh and the wrapper your guest holds before they open it.",
      ],
      signature: "Built for care.\nMade to impress.",
      pillars: [
        { icon: "seedling", title: "Thoughtful by nature", text: "Every element is chosen with purpose and care." },
        { icon: "shield", title: "Quality you can trust", text: "Alcohol-free, paraben-free, pH neutral and cruelty-free." },
        { icon: "gift", title: "Crafted for hospitality", text: "Made to lift the guest experience in every setting." },
        { icon: "globe", title: "From India to the world", text: "Proudly Indian at heart, built to global standards." },
      ],
      footnote: "The finest hospitality brands understand that\nexceptional experiences are defined by the smallest details.",
    },

    ritual: {
      eyebrow: "Our origins",
      title: "How it all began",
      kicker: "Some brands are built in boardrooms.",
      kickerAccent: "Ours began with a damp cloth.",
      paragraphs: [
        "A damp cloth on a feverish forehead. A cold towel handed over the moment you step in from the heat. A quick wipe passed around the table when the meal is done. Nobody taught us this. It was simply how care looked.",
        "Thanda Kapda Co. began with that gesture. We wanted the same cool relief without the bowl of water, folded small enough for a pocket and clean enough to hand to a stranger: soaked in aloe, sealed one at a time, and free of the alcohol that leaves skin tight.",
      ],
      stamp: "BORN IN INDIA · MADE FOR THE WORLD · ",
      script: "From India to the world,\nour story continues…",
      snaps: [
        { label: "No. 01", image: photos.msTable("Morning Spring sachet set at a wedding place setting") },
        { label: "No. 02", image: photos.nPlate("Namasté sachets fanned on a ceramic plate") },
        { label: "Est. 2025", image: photos.msBox("An open case of one hundred Morning Spring sachets") },
        { label: "Cafés", image: photos.nCafe() },
      ],
      noteOne: "Thoughtful hygiene.\nHandcrafted care.",
      noteTwo: "Built on care.\nDriven by purpose.",
      tag: { place: "India", title: "Where it all began.", text: "A country that greets its guests with a cool cloth." },
      moments: [
        { icon: "handsHeart", when: "The gesture", text: "A cold, damp cloth for a guest. The oldest welcome in India." },
        { icon: "bulb", when: "The idea", text: "Fold that gesture into a clean, sealed sachet." },
        { icon: "seedling", when: "2025", text: "Thanda Kapda Co. is born. Morning Spring reaches homes across India." },
      ],
    },

    collection: {
      eyebrow: "Thanda Kapda Co. · The collections",
      title: "Our collections",
      intro:
        "Every wipe is designed to create an experience, not just a moment of freshness. Same aloe base, same one-sachet-at-a-time discipline. Choose by the moment, or have us make one that is yours.",
      chips: ["Alcohol free", "pH neutral", "Paraben free"],
      buyLabel: "Buy on Amazon",
      detailsLabel: "Details",
      customEyebrow: "The custom collection",
      customTitle: "Your name *on the sachet.*",
      customKicker: "Crafted with purpose",
      customText:
        "Restaurants, hotels, airlines, wedding planners and offices. Printed sachets in your branding, in the quantities you actually need, plus both wipes by the case.",
      customPoints: ["Custom-printed single sachets", "Morning Spring & Namasté by the case", "Pricing by quantity, lead times up front"],
      customCta: "Start a bulk order",
      customSeal: "CRAFTED WITH PURPOSE · REMEMBERED · ",
      customQuote: "“Crafted with purpose. Remembered with every touch.”",
      stamp: "CRAFTED WITH PURPOSE · REMEMBERED WITH EVERY TOUCH · ",
    },

    inside: {
      eyebrow: "What’s inside",
      title: "Soaked in things you would recognise.",
      intro: "Short ingredient lists, printed in full on every product page. This is what does the work.",
      hint: "Scroll to move across →",
      items: [
        { icon: "aloe", name: "Aloe vera", latin: "Aloe barbadensis leaf extract", note: "The base of every wipe. Cools on contact and leaves nothing behind but skin that feels like itself.", found: "In both wipes" },
        { icon: "centella", name: "Centella asiatica", latin: "Gotu kola", note: "A staple of Indian herbal care for generations. Calms skin that has spent the afternoon in the sun.", found: "In Namasté" },
        { icon: "vitaminE", name: "Vitamin E", latin: "Tocopherol", note: "Keeps the sheet properly moist until the seal is broken and leaves skin soft, never squeaky.", found: "In Morning Spring" },
        { icon: "lemongrass", name: "Lemongrass", latin: "Cymbopogon", note: "The clean, citrus scent of a Namasté wipe. Bright enough to notice, quiet enough for the dinner table.", found: "In Namasté" },
        { icon: "menthol", name: "Menthol", latin: "From peppermint", note: "A small amount, for the thanda in Thanda Kapda. A drop in temperature you feel in the first second.", found: "In Namasté" },
      ],
      notEyebrow: "And what is not",
      notItems: [
        { word: "Alcohol", why: "It evaporates fast and takes your skin's moisture with it. That tight, stinging finish is the alcohol, not the clean." },
        { word: "Parabens", why: "We preserve with gentler compounds so the sheet stays fresh without them." },
      ],
      notFootnote: "pH neutral · Cruelty-free · Non-woven, skin-safe sheet",
    },

    planet: {
      title: "Good for hospitality.",
      titleAccent: "Kind to the planet.",
      text: "At Thanda Kapda Co., hospitality and responsibility go hand in hand. Our wipes are made with care, for your guests and for the planet we all share.",
      background: photos.nGym(""),
      facts: [
        { icon: "dropCircle", title: "Alcohol & paraben free", text: "Gentle formulas on an aloe base." },
        { icon: "recycleCircle", title: "Recyclable packaging", text: "Designed with less waste in mind." },
        { icon: "leafCircle", title: "Cruelty-free", text: "Never tested on animals." },
        { icon: "shield", title: "pH neutral", text: "Kind to every skin type." },
      ],
      script: "Small choices today,\nmemorable impact\ntomorrow.",
      brush: "Fresh today, responsible tomorrow.",
      better: [
        { icon: "handsHeart", title: "Better for guests", text: "Safe, gentle and refreshing." },
        { icon: "globe", title: "Better for nature", text: "Thoughtful choices, today." },
        { icon: "shield", title: "Better standards", text: "Careful sourcing, rigorous quality." },
        { icon: "users", title: "Better future", text: "Together, for a healthier planet." },
      ],
    },

    occasions: {
      eyebrow: "Where it belongs",
      title: "From the wedding table to the gym bag.",
      script: "Five places a cool cloth\nmakes all the difference.",
      cardFooter: "Thanda Kapda Co.",
      scenes: [
        {
          title: "Weddings & events",
          line: "One at every place setting, before the first guest sits down.",
          detail: "Planners tuck Morning Spring into welcome kits and set it at each cover. Printed with the couple's names if you like.",
          wipe: "Morning Spring",
          image: photos.msTable("Morning Spring sachet at a wedding table"),
        },
        {
          title: "Restaurants & cafés",
          line: "Brought out with the bill. The last thing your guest touches.",
          detail: "Namasté was designed for the end of a meal: lemongrass, a generous sheet, and a wrapper that says something kind.",
          wipe: "Namasté",
          image: photos.nCafe(),
        },
        {
          title: "Hotels & resorts",
          line: "On the tray with the welcome drink, or folded on the pillow.",
          detail: "A small thing guests remember and mention in reviews. Cases of a hundred keep housekeeping stocked.",
          wipe: "Morning Spring",
          image: photos.msHotel(undefined, { focus: "80% 75%", zoom: 1.55 }),
        },
        {
          title: "The heat",
          line: "Three o'clock in May. A cold sheet on the back of the neck.",
          detail: "Postcard-sized and flat, it disappears into a pocket, a clutch or a glove box until the day gets hot.",
          wipe: "Morning Spring",
          image: photos.msLifestyle1("A woman cooling her face with a wipe in the sun", { focus: "0% 12%", zoom: 1.85 }),
        },
        {
          title: "Gyms & everyday",
          line: "Between sets, after school, before you get back in the car.",
          detail: "Lunchboxes, lockers and the bag you always carry. Alcohol-free, so it can be used again and again.",
          wipe: "Namasté",
          image: photos.nGym("Namasté sachet on a gym bench"),
        },
      ],
    },

    industries: {
      title: "Perfect for every *industry*",
      note: "Wherever there is an experience, there is true class in the details.",
      photo: photos.msTable("A candle-lit banquet table set with a Morning Spring sachet"),
    },

    proof: {
      eyebrow: "What people say",
      ratingNote: "on Amazon India",
      ratingSummary: "{count} ratings, every one five stars",
      title: "Reviewers keep saying the same three things.",
      mentions: [
        { quote: "They stay properly moist.", detail: "Sealed one at a time, so the last sachet in the box is as wet as the first." },
        { quote: "Incredibly soft on the skin.", detail: "A non-woven sheet on an aloe base, with no alcohol to tighten or sting." },
        { quote: "Mild fragrance, easy to carry.", detail: "Postcard-sized and flat. It disappears into a pocket or a clutch." },
      ],
      footnote: "Phrases summarised from verified Amazon India reviews",
    },

    bulk: {
      eyebrow: "Custom & bulk orders",
      title: "Your brand on every table.",
      text: "We supply Morning Spring and Namasté by the case and print custom sachets for hospitality, travel and events. Tell us the quantity and the occasion; we come back with pricing and lead times, not a brochure.",
      segments: ["Restaurants", "Hotels", "Airlines", "Weddings", "Caterers", "Offices", "Gyms", "Retail"],
      stamp: "CUSTOM PRINTED · MADE IN INDIA · ",
      phonePrompt: "Prefer to talk?",
    },

    seal: {
      background: photos.msTable(""),
      seal: "REFRESHING TRADITION · CRAFTED WITH CARE · ",
      title: "Thanda Kapda Co.",
      tagline: "Essence of pure indulgence",
      website: "www.thandakapda.co",
      primaryCta: "Shop the wipes",
      secondaryCta: "Bulk & custom",
      strip: "Let’s create unforgettable moments, together.",
    },
  },

  products: [
    product({
      slug: "morning-spring",
      name: "Morning Spring",
      tagline: "Pure freshness from nature",
      scent: "Fresh, mild",
      short: "A fresh, mild scent on a pH-neutral aloe base. The wipe for heat, travel and long days out.",
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
        { name: "Aloe vera", latin: "Aloe barbadensis leaf extract", note: "The base of every wipe. Cools on contact and leaves nothing behind." },
        { name: "Vitamin E", latin: "Tocopherol", note: "Keeps the sheet moist and skin soft, not squeaky." },
        { name: "Glycerin", latin: "", note: "Draws water to the skin so the cool feeling lingers." },
      ],
      inci: "Purified aqua, glycerin, phenoxyethanol, ethylhexylglycerin, aloe barbadensis leaf extract, PEG-40 hydrogenated castor oil, vitamin E oil.",
      claims: ["Alcohol-free", "Paraben-free", "pH neutral", "Aloe vera enriched", "Eco-friendly"],
      bestFor: ["Heat and travel", "Weddings and events", "Hotels", "Families"],
      amazonUrl: "https://www.amazon.in/dp/B0G1KN6Y55",
      rating: { value: 5, count: 27 },
      hero: photos.msPlate(),
      gallery: [
        photos.msBox(),
        photos.msTable(),
        photos.msHotel(),
        photos.msLifestyle1(),
      ],
      collection: {
        subtitle: "Pure freshness from nature",
        note: "For heat, travel and the long day out.",
        image: photos.msPlate("Morning Spring sachets on a ceramic plate"),
        scene: photos.msTable(),
      },
      pairing: "Namasté for the end of the meal; Morning Spring for the heat of the day.",
      closing: {
        image: photos.msPlate("Morning Spring sachets on a ceramic plate beside an olive sprig", { focus: "50% 62%" }),
        caption: "Beat the heat. Stay fresh.",
      },
    }),
    product({
      slug: "namaste",
      name: "Namasté",
      tagline: "A refreshing finish to a memorable meal",
      scent: "Lemongrass",
      short: "Lemongrass, aloe and centella in an individually sealed sheet made for the end of a meal.",
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
        { name: "Aloe vera", latin: "Aloe vera extract", note: "The base of every wipe. Cools on contact and leaves nothing behind." },
        { name: "Centella asiatica", latin: "Gotu kola", note: "A staple of Indian herbal care. Calms skin that has been in the sun." },
        { name: "Lemongrass", latin: "Cymbopogon", note: "The clean, citrus scent that lifts the end of a meal." },
        { name: "Menthol", latin: "", note: "A small amount, for the thanda in Thanda Kapda." },
      ],
      inci: "Aqua, glycerin, propanediol, allantoin, phenoxyethanol and ethylhexylglycerin, xylitol, aloe vera extract, centella asiatica extract, sodium lauroyl oat amino acids, menthol, lactic acid, sodium hydroxide, fragrance.",
      claims: ["Alcohol-free", "Paraben-free", "Lemongrass fragrance", "Aloe and centella", "Individually packed"],
      bestFor: ["Restaurants and cafés", "Catering and events", "Offices", "Travel"],
      amazonUrl: "https://www.amazon.in/dp/B0HGYP6TYC",
      rating: { value: 5, count: 3 },
      hero: photos.nPlate(),
      gallery: [
        photos.nCafe(),
        photos.nMarble("Namasté sachet on a marble counter beside a rolled towel"),
        photos.nGym(),
        photos.nClassroom(),
      ],
      collection: {
        subtitle: "Calm, graceful & welcoming",
        note: "For the end of a memorable meal.",
        image: photos.nMarble("Namasté sachet on a marble counter"),
        scene: photos.nPlate(),
      },
      pairing: "Morning Spring for the heat of the day; Namasté for the end of the meal.",
      closing: { image: photos.nClassroom(), caption: "Cleanse. Refresh. Indulge." },
    }),
  ],

  productsPage: {
    eyebrow: "The collection",
    title: "Two wipes. One idea.",
    intro: "Both start with aloe vera and a single, sealed sachet. Morning Spring is the everyday cool-down; Namasté is the one you hand over when the meal is done.",
    compareEyebrow: "Side by side",
    compareTitle: "Which one is yours?",
    rows: { scent: "Scent", madeFor: "Made for", botanicals: "Key botanicals", sheet: "Sheet", pack: "Pack", price: "Price" },
    nudgeEyebrow: "Need more than a box?",
    nudgeTitle: "By the case, or printed with your name.",
    nudgeText: "Restaurants, hotels, airlines and planners order in the hundreds and thousands. We print custom sachets too.",
    nudgeCta: "Start a bulk order",
  },

  productPage: {
    breadcrumb: "The wipes",
    offLabel: "off",
    perWipe: "a wipe · inclusive of all taxes",
    buyLabel: "Buy on Amazon",
    bulkLabel: "Order in bulk",
    ratingLine: "on Amazon India · {count} ratings · Free delivery",
    keyBotanicals: "Key botanicals",
    sheetLabel: "Sheet",
    sheetText: "non-woven, individually sealed",
    packSizes: "Pack sizes",
    bestFor: "Best for",
    ingredients: "Full ingredients",
    otherEyebrow: "The other one",
    otherTitle: "Most tables keep both.",
    otherStamp: "ALOE VERA · ALCOHOL-FREE · PARABEN-FREE · ",
  },

  story: {
    eyebrow: "Our story",
    title: "The oldest welcome in India.",
    intro: "Before anyone offered you tea, someone handed you a cold cloth. Thanda Kapda Co. is that gesture, folded into a sachet.",
    narrative: [
      "In most Indian homes the cold cloth arrives without being asked for. On a forehead when a fever climbs. Across the back of the neck after a long bus ride in May. Passed around a table when the last roti is gone and everyone’s hands smell of ghee and lime.",
      "It is such a small thing that nobody thinks of it as hospitality. But it is the first thing a guest feels, and the last thing they remember about a meal.",
      "We started Thanda Kapda Co. to carry that gesture out of the house. Restaurants wanted it. So did wedding planners, hotels, airlines and the people who sit in traffic for a living. What they needed was the same cool relief without a bowl of water and a wrung-out towel: something sealed, clean, and small enough for a pocket.",
      "So we built the wipe the way the cloth would be built today. Soaked in aloe rather than tap water. Free of the alcohol that leaves skin tight and stinging. Sealed one at a time. Printed with a mountain valley, or with the meaning of the word namasté, so that even the wrapper says something kind.",
    ],
    photoOne: photos.msBox("An open case of one hundred Morning Spring sachets"),
    photoOneCaption: "Sealed one at a time. Boxed in hundreds.",
    photoTwo: photos.nCafe("Namasté sachet standing on a café table"),
    photoTwoCaption: "namasté (nah-mah-stay)",
    vision: {
      title: "Vision & mission",
      stamp: "THANDA KAPDA CO. · ESTD 2025 · ",
      kicker: "Why we started",
      text: "India’s oldest welcome, a cold cloth for a guest, deserved a modern form. We built one from a simple belief: every great experience deserves a perfect finish, every single time.",
      quote: "We don’t just make wipes.\nWe make moments.",
      items: [
        { icon: "leafCircle", title: "Our vision", text: "To become the most loved premium refreshing wipe from India, at home and abroad." },
        { icon: "target", title: "Our mission", text: "To refresh lives with convenience, quality and care in every wipe." },
        { icon: "seedling", title: "Our promise", text: "Honest ingredients, premium quality and a refreshing experience, every single time." },
        { icon: "globe", title: "Our purpose", text: "To turn everyday moments into lasting impressions." },
      ],
    },
    timelineEyebrow: "Estd. 2025",
    timelineTitle: "Journey",
    timelineScript: "A fresh tradition. Now, everywhere.",
    timelineText: "From a single sachet on Amazon India to printed wipes on restaurant tables. The next chapter is distributors abroad.",
    timelineClosing: "More countries, coming soon.",
    milestones: [
      { icon: "bulb", when: "The idea", title: "Blueprint", text: "India's cold-cloth welcome, folded into a sealed sachet." },
      { icon: "flask", when: "2025", title: "Morning Spring", text: "The first sachet, aloe and vitamin E, goes on sale across India." },
      { icon: "cloche", when: "Then", title: "Namasté", text: "The after-meal wipe: lemongrass, aloe and centella, for the end of a meal." },
      { icon: "gift", when: "Now", title: "Custom printing", text: "Hospitality partners put their own names on the sachet." },
      { icon: "globePlane", when: "Next", title: "Beyond borders", text: "Distributors in the Middle East, Africa, Europe and Southeast Asia." },
    ],
    processEyebrow: "How a wipe is made",
    processTitle: "Four steps, none of them rushed.",
    process: [
      { title: "Formulate", text: "An aloe base, pH neutral, with no alcohol and no parabens. Vitamin E for Morning Spring; centella, lemongrass and a little menthol for Namasté." },
      { title: "Soak", text: "A soft non-woven sheet, cut to fifteen by twenty centimetres, is saturated so it is properly wet without dripping." },
      { title: "Seal", text: "Every sheet is folded and sealed on its own. That is why the last sachet in the box is as fresh as the first." },
      { title: "Box", text: "Packed in hundreds for homes, tables and trays. Printed to order for the brands that ask." },
    ],
    valuesEyebrow: "What we hold to",
    valuesTitle: "Rooted in nature. Refined for you.",
    valuesStamp: "BORN IN INDIA · MADE FOR THE WORLD · ",
    valuesPhoto: photos.msPlate("", { focus: "58% 60%" }),
    values: [
      { title: "Pure and natural", text: "Crafted with nature's finest ingredients. Zero parabens, zero alcohol. Just clean, honest care." },
      { title: "The cool ritual", text: "Inspired by generations of Indian wellness traditions. A refreshing experience your skin deserves." },
      { title: "Eco conscious", text: "Recyclable packaging. Cruelty-free. Built for a planet we all share." },
    ],
    closingTitle: "Enough reading. Try one.",
    closingPrimary: "Shop the wipes",
    closingSecondary: "Bulk & custom",
  },

  bulk: {
    eyebrow: "Bulk & custom orders",
    title: "Your brand on every table.",
    intro: "Both wipes by the case, or single sachets printed with your name. Tell us the quantity and the occasion and we will come back with pricing and lead times.",
    who: [
      { title: "Restaurants & cafés", text: "Served with the bill or set at each cover. Namasté was designed for exactly this moment.", image: photos.nCafe() },
      { title: "Hotels & resorts", text: "On the welcome tray, in the room, by the pool. A small thing guests mention in reviews.", image: photos.msHotel("Morning Spring sachet on a hotel tray", { focus: "50% 100%" }) },
      { title: "Weddings & events", text: "One at every place setting, or tucked into welcome kits. Printed with the couple's names if you like.", image: photos.msTable("Morning Spring sachet on a wedding table") },
      { title: "Offices, gyms & travel", text: "Pantries, lockers, glove boxes and long-haul seats. Anywhere people arrive hot and want to feel put together.", image: photos.nGym("Namasté sachet on a gym bench") },
    ],
    howEyebrow: "How it works",
    howTitle: "Three steps. No brochure.",
    how: [
      { title: "Tell us the occasion", text: "Quantity, the wipe you prefer, and whether you want your own artwork on the sachet." },
      { title: "We come back with numbers", text: "Pricing by quantity and a realistic lead time, not a brochure." },
      { title: "Print, pack, deliver", text: "Sealed one at a time, boxed in hundreds, delivered where you need them." },
    ],
    stamp: "CUSTOM PRINTED · MADE IN INDIA · ",
    talkPrompt: "Rather talk it through?",
    whatsappLabel: "WhatsApp us",
    formEyebrow: "Bulk order enquiry",
    formTitle: "Tell us what you need.",
    industriesTitle: "Perfect for every industry",
    industries: [
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
    ],
    distributorEyebrow: "Distributor programme",
    distributorTitle: "Grow with us.",
    distributorScript: "From our reach, to the world.",
    distributorText:
      "We are building a network of distributors for the Middle East, Africa, Europe and Southeast Asia. If you know your market, we will bring the product, the collateral and the support.",
    distributorCta: "Apply to distribute",
    benefits: [
      { icon: "pin", title: "Territories", text: "Defined, protected territories so partners can build a market properly." },
      { icon: "megaphone", title: "Marketing support", text: "Brand collateral, campaign assets and promotional support." },
      { icon: "monitor", title: "Digital catalogue", text: "Always-current product range, pricing and updates." },
      { icon: "factory", title: "Custom manufacturing", text: "Private-label and custom-printed sachets for your own brand." },
      { icon: "truck", title: "Fast dispatch", text: "Quick processing and dependable delivery windows." },
      { icon: "headset", title: "Export support", text: "Documentation and end-to-end help for shipments abroad." },
      { icon: "cap", title: "Product training", text: "Sessions on the range for your sales and service teams." },
      { icon: "handshake", title: "Stronger together", text: "A partner, not a supplier. We grow when you do." },
    ],
    faqEyebrow: "Before you ask",
  },

  bulkForm: {
    customOption: "Custom-printed sachets",
    otherNeeds: ["Morning Spring by the case", "Namasté by the case", "A mix, let's talk"],
    caseQuantities: ["500 – 1,000 sachets", "1,000 – 5,000 sachets", "5,000 – 20,000 sachets", "20,000+ sachets", "Not sure yet"],
    customQuantities: ["2,00,000 – 5,00,000 sachets", "5,00,000 – 10,00,000 sachets", "10,00,000+ sachets"],
    customNote: "Custom printing starts at 2,00,000 sachets.",
    messagePlaceholder: "The occasion, a date you're working towards, colours or copy you'd like printed…",
    submit: "Send on WhatsApp",
  },

  contact: {
    eyebrow: "Contact",
    title: "Keep it cool. Say hello.",
    intro: "Orders, bulk enquiries, stockist questions, or just a note about how the wipes worked for you. We read everything.",
    whatsappNote: "Fastest for orders and quotes",
    phoneNote: "Monday to Saturday",
    emailNote: "For anything with attachments",
    instagramNote: "New batches, behind the scenes",
    stamp: "THANDA KAPDA CO. · ESSENCE OF PURE INDULGENCE · ",
    seller: "Sold by Thanda Kapda Co., Made in India. Retail orders ship through Amazon India.",
    formEyebrow: "Write to us",
    formTitle: "We’d love to hear from you.",
    topics: ["An order I placed", "Stocking Thanda Kapda", "A bulk or custom order", "Something else"],
  },

  faq: {
    eyebrow: "Questions",
    title: "The things people ask before they order.",
    prompt: "Anything else? Write to {email} or message us on WhatsApp.",
    items: [
      { q: "Are your wipes safe for sensitive skin?", a: "Yes. Every wipe is hypoallergenic, alcohol-free and paraben-free, with a pH-neutral formula that is gentle on all skin types, including children's.", bulk: false },
      { q: "What is actually in them?", a: "Aloe vera is at the heart of every wipe. Morning Spring adds vitamin E; Namasté adds centella asiatica, lemongrass and a touch of menthol. The full ingredient list is printed on each product page.", bulk: false },
      { q: "How big is each wipe?", a: "Every sheet opens to 15 by 20 centimetres and comes individually sealed, so it stays moist until the moment you tear it open.", bulk: true },
      { q: "How do I place a bulk or custom order?", a: "Use the bulk order form or message us on WhatsApp with the quantity and occasion. We supply both wipes by the case and print custom sachets for restaurants, hotels, airlines, weddings and offices.", bulk: true },
      { q: "Do you ship internationally?", a: "Within India, orders ship through Amazon. We are expanding abroad; get in touch if you would like to stock Thanda Kapda in your market.", bulk: true },
      { q: "Can I return a pack?", a: "Because of the nature of the product, opened packs are not returnable. If a pack arrives damaged, wrong or expired, request a refund or replacement within five days of delivery through your Amazon order.", bulk: true },
    ],
  },

  footer: {
    eyebrow: "Thanda Kapda Co.",
    title: "Keep it cool\n*and fresh.*",
    text: "Eco-friendly wet wipes inspired by the Indian custom of handing a guest a cool cloth. Aloe-soaked, alcohol-free, and sealed one at a time.",
    explore: "Explore",
    findUs: "Find us",
    amazonLabel: "Amazon India store",
    stamp: "BORN IN INDIA · MADE FOR THE WORLD · ",
  },

  notFound: {
    title: "This page drifted off like morning frost.",
    text: "The link may be old, or the page may have moved. The wipes are still where they were.",
    primary: "Back home",
    secondary: "See the wipes",
  },
};

export type SiteContent = typeof defaultContent;
export type ProductContent = SiteContent["products"][number];
