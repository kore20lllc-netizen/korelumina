/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals = config.externals || []
    config.externals.push({
      esbuild: "commonjs esbuild"
    })
    return config
  }
}

module.exports = nextConfig
