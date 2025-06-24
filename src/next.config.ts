
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: ['https://6000-firebase-studio-1749805113540.cluster-nzwlpk54dvagsxetkvxzbvslyi.cloudworkstations.dev'],
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  webpack: (config, { isServer, nextRuntime, webpack }) => { // Added webpack to destructuring
    // Ensure config.resolve and config.resolve.alias are initialized
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    // Apply general aliases for perf_hooks and node:perf_hooks to false.
    config.resolve.alias = {
      ...config.resolve.alias,
      'perf_hooks': false,
      'node:perf_hooks': false,
    };

    if (nextRuntime === 'edge') {
      // For the Edge runtime, ensure config.resolve.fallback is initialized
      if (!config.resolve.fallback) {
        config.resolve.fallback = {};
      }
      // Provide fallbacks for Node.js built-ins not available in Edge
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'async_hooks': false,
        'fs': false,
        'net': false,
        'tls': false,
        'perf_hooks': false,
        'node:perf_hooks': false,
      };

      // Ensure config.plugins is initialized
      if (!config.plugins) {
        config.plugins = [];
      }
      // Use webpack.IgnorePlugin to make sure 'node:perf_hooks' is not processed.
      config.plugins.push(new webpack.IgnorePlugin({
        resourceRegExp: /node:perf_hooks/,
      }));
    }
    return config;
  },
};

export default nextConfig;
