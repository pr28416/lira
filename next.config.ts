import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // experimental: {
  //   serverComponentsExternalPackages: ["pdfjs-dist"],
  // },
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
