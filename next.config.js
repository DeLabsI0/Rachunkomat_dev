/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
  },
  // Disable caching in development
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 0,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 0,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = ['@aws-sdk/client-textract', ...config.externals];
    }
    return config;
  },
}

module.exports = nextConfig