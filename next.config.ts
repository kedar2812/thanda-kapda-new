import type { NextConfig } from "next";

// The site is hosted as plain files on shared hosting (Apache, no Node.js),
// so it is built as a static export. Product photos are already web-sized
// JPEGs, so they are served as-is instead of through the image optimizer.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
