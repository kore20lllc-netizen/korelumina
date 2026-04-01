/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {

    if (dev) {
      config.watchOptions = {
        ignored: [
          "**/runtime/**",
          "**/workspaces/**",
          "**/projects/**"
        ]
      }
    }

    return config
  }
}

module.exports = nextConfig
