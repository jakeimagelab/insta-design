/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // fabric.js SSR 오류 방지
  webpack: (config) => {
    config.externals = config.externals || [];
    return config;
  },
};
