import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Analytics } from "@/components/Analytics";
import { ADMIN_URL, LIVE_CONTENT_URL, SITE_URL, bakedContent as c, shareImage } from "@/content";
import { ContentProvider } from "@/content/ContentProvider";
import { headScript } from "@/content/preview";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: c.seo.title,
    template: `%s · ${c.site.name}`,
  },
  description: c.site.description,
  keywords: [
    "Thanda Kapda",
    "wet wipes",
    "aloe vera wipes",
    "alcohol-free wipes",
    "paraben-free wipes",
    "refreshing wipes India",
    "after-meal wipes",
    "custom wet wipes bulk",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: c.site.name,
    title: c.seo.shareTitle,
    description: c.site.description,
    locale: "en_IN",
    images: [shareImage(c.seo.shareImage)],
  },
  twitter: {
    card: "summary_large_image",
    title: c.site.name,
    description: c.site.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#143829",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: c.site.name,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  description: c.site.description,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: c.site.phone,
    contactType: "customer service",
    email: c.site.email,
  },
  sameAs: [c.site.instagram],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: headScript(LIVE_CONTENT_URL) }} />
        <link rel="preconnect" href={ADMIN_URL} crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="parchment min-h-dvh">
        <SmoothScroll>
          <ContentProvider>
            <Nav />
            <main id="main">{children}</main>
            <Footer />
          </ContentProvider>
        </SmoothScroll>
        <Analytics />
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
