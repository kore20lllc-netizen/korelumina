/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],

  // Only treat these extensions as routable pages/components.
  pageExtensions: ["ts", "tsx", "js", "jsx"],

  webpack(config) {
    // Prevent webpack from traversing imported runtime projects.
    config.watchOptions = {
      ...(config.watchOptions || {}),
      ignored: [
        "**/runtime/workspaces/**",
        "**/preview-v2/**",
        "**/__graveyard/**",
        "**/__graveyard_runtime_v1/**",
      ],
    };

    return config;
  },
};

module.exports = nextConfig;
