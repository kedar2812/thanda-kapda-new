import type { NextConfig } from "next";

// The site is hosted as plain files on shared hosting (Apache, no Node.js),
// so it is built as a static export. Photos come in several pre-made widths
// (see src/lib/image-loader.ts); the loader picks one per screen, so there is
// no image server involved.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
};

export default nextConfig;
