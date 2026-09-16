import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { site } from "@/data/site";

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
  metadataBase: new URL(site.url),
  title: {
    default: "Thanda Kapda Co. · Aloe wet wipes, alcohol-free and paraben-free",
    template: "%s · Thanda Kapda Co.",
  },
  description: site.description,
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
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "Thanda Kapda Co. · A cool cloth for a warm country",
    description: site.description,
    locale: "en_IN",
    images: [{ url: "/products/morning-spring-table.jpg", width: 1500, height: 1000, alt: "Morning Spring sachet on a table" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thanda Kapda Co.",
    description: site.description,
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
  name: site.name,
  url: site.url,
  description: site.description,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-91755-40053",
    contactType: "customer service",
    email: site.email,
  },
  sameAs: [site.instagram],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="parchment min-h-dvh">
        <SmoothScroll>
          <Nav />
          <main id="main">{children}</main>
          <Footer />
        </SmoothScroll>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
