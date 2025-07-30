import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    '@fullcalendar/react',
    '@fullcalendar/core',
    '@fullcalendar/daygrid',
    '@fullcalendar/timegrid',
    '@fullcalendar/interaction'
  ],
  
  webpack: (config, { isServer }) => {
    // Replace deprecated punycode module with userland alternative
    config.resolve.alias = {
      ...config.resolve.alias,
      punycode: 'punycode.js'
    };
    
    // Suppress punycode deprecation warnings - with fallback for Docker
    try {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: require.resolve('punycode.js')
      };
    } catch (e) {
      // Fallback for Docker environment where punycode.js might not be found
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: false
      };
    }

    return config;
  },
  
  // Suppress Node.js deprecation warnings during development
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      // Configure on-demand entries to reduce warnings
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    }
  })
};

export default nextConfig;
