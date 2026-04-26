/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ["@sadoo/types"],
  env: {
    CUSTOM_KEY: "value",
  },
};

module.exports = nextConfig;
