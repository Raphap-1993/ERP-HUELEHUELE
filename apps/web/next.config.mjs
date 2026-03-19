import path from "node:path";

const nextConfig = {
  transpilePackages: ["@huelegood/shared", "@huelegood/ui"],
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.huelegood.com"
      },
      {
        protocol: "https",
        hostname: "images.huelegood.com"
      }
    ],
    formats: ["image/avif", "image/webp"]
  }
};

export default nextConfig;
