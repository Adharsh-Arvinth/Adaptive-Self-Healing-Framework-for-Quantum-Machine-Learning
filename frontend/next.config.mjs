/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone build for containerized & cloud deployments
  output: "standalone",
  eslint: {
    // Avoid blocking production builds on unused import warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep strict TypeScript checking enforced
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
