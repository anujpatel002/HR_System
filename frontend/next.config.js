/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://10.240.27.11:5000/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig