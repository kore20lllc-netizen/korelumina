import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental:{
    serverComponentsExternalPackages:["esbuild"]
  },
  webpack(config){
    config.externals = config.externals || []
    config.externals.push("esbuild")
    return config
  }
}

export default nextConfig
