/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces a self-contained server bundle (.next/standalone) for a small
  // production Docker image — see Dockerfile.
  output: "standalone",
  experimental: {
    // Attachment uploads go through a Server Action and the proxy. BOTH limits
    // must clear our 30 MB/file cap (plus multipart overhead), otherwise the
    // proxy silently truncates the body (no error) → corrupt uploads.
    serverActions: { bodySizeLimit: "35mb" },
    proxyClientMaxBodySize: "35mb",
  },
};

export default nextConfig;
