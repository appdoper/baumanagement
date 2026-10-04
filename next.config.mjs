/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces a self-contained server bundle (.next/standalone) for a small
  // production Docker image — see Dockerfile.
  output: "standalone",
};

export default nextConfig;
