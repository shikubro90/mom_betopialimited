/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: ["@prisma/client"],
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
