/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable transpilation of ESM packages
  transpilePackages: ['leaflet', 'react-leaflet'],
};

module.exports = nextConfig; 