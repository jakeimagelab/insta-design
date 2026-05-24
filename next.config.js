/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false, // Fabric.js double-mount 방지
  // fabric은 CDN에서 로드하므로 번들링 불필요
};
