import path from "node:path";

const nextConfig = {
  transpilePackages: ["@huelegood/shared", "@huelegood/ui"],
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  experimental: {
    // Next 15.5 enables the segment explorer by default in dev.
    // In this workspace it corrupts the app router dev manifest for admin routes.
    devtoolSegmentExplorer: false
  }
};

export default nextConfig;
