import path from 'node:path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['page.tsx', 'page.ts', 'api.ts', 'api.tsx'],
  experimental: {
    typedRoutes: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/products/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '4000',
        pathname: '/products/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '4000',
        pathname: '/products/**',
      },
      {
        protocol: 'https',
        hostname: '127.0.0.1',
        port: '4000',
        pathname: '/products/**',
      },
    ],
  },
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'src')],
    importer: [
      (url) => {
        if (url.startsWith('@styles/')) {
          const resolvedPath = path.join(process.cwd(), 'src/styles', url.replace('@styles/', ''))
          return { file: resolvedPath }
        }
        return null
      },
    ],
  },
}

export default nextConfig
