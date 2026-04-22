import path from "node:path";

const nextConfig = {
  transpilePackages: ["@huelegood/shared", "@huelegood/ui"],
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  experimental: {
    // Next 15.5 enables the segment explorer by default in dev.
    // In this workspace it corrupts the app router dev manifest for /checkout.
    devtoolSegmentExplorer: false
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.huelegood.com"
      },
      {
        protocol: "https",
        hostname: "images.huelegood.com"
      },
      {
        protocol: "https",
        hostname: "media.huelegood.com"
      }
    ],
    formats: ["image/avif", "image/webp"]
  }
};

export default nextConfig;
