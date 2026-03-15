/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: ["@prisma/client"],
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

module.exports = nextConfig;
