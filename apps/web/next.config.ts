import type { NextConfig } from 'next';

const apiInternalBaseUrl =
  process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

const nextConfig: NextConfig = {
  transpilePackages: ['@intervue/shared'],
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${apiInternalBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
