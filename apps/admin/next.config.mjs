import path from "node:path";

const nextConfig = {
  transpilePackages: ["@huelegood/shared", "@huelegood/ui"],
  outputFileTracingRoot: path.resolve(process.cwd(), "../..")
};

export default nextConfig;
