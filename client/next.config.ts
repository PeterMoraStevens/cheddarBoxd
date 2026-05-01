import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.openfoodfacts.org',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'static.openfoodfacts.org',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'openfoodfacts-images.s3.eu-west-3.amazonaws.com',
        pathname: '**',
      },
      // Google / Discord avatar CDNs
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '**',
      },
      // Self-hosted S3 avatars are served via /api/s3-image (presigned redirect)
      // so this host does not need to be listed here.
    ],
  },
}

export default nextConfig
