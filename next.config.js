/** @type {import('next').NextConfig} */
const nextConfig = {
images: {
    remotePatterns: [],
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

module.exports = nextConfig;
