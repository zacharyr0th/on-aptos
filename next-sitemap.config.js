/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  generateRobotsTxt: false, // Using app/robots.ts instead for better AI bot support
  sitemapSize: 40000, // Split before 50k ceiling
  changefreq: 'daily',
  priority: 0.7,
  exclude: [
    '/admin/*',
    '/api/trpc/*', // Exclude tRPC internals
    '/_next/*',
    '/404',
    '/500',
  ],

  // Transform function to add last-modified dates and custom priorities
  transform: async (config, path) => {
    // Custom priorities for different sections
    const customPriorities = {
      '/': 1.0,
      '/bitcoin': 0.9,
      '/defi': 0.9,
      '/lst': 0.9,
      '/stablecoins': 0.9,
      '/rwas': 0.9,
      '/btc': 0.9, // Alternative bitcoin path
      '/stables': 0.9, // Alternative stablecoins path
    };

    // API endpoints get different treatment
    const apiPriority = path.startsWith('/api/')
      ? 0.8
      : customPriorities[path] || 0.7;

    // Different change frequencies for different content types
    let changefreq = 'weekly';
    if (path === '/') {
      changefreq = 'daily';
    } else if (path.startsWith('/api/')) {
      changefreq = 'hourly'; // API data changes frequently
    }

    return {
      loc: path,
      changefreq,
      priority: apiPriority,
      lastmod: new Date().toISOString(),
    };
  },

  // Robot.txt enhancements (will merge with your custom robots.ts)
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: ['/', '/api/aptos/*', '/rwas', '/llms.txt'],
        disallow: ['/_next/', '/admin/', '/api/trpc/*'],
      },
      // AI bot policies
      {
        userAgent: 'GPTBot',
        allow: ['/', '/api/', '/llms.txt'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/api/', '/llms.txt'],
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/', '/api/', '/llms.txt'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/api/', '/llms.txt'],
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api-sitemap.xml`, // Dynamic API sitemap
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/tokens-sitemap.xml`, // Future token pages
    ],
  },

  // Additional paths for static generation
  additionalPaths: async config => {
    const result = [];

    // Add API endpoints explicitly
    const apiEndpoints = [
      '/api/aptos/btc',
      '/api/aptos/lst',
      '/api/aptos/stables',
      '/api/aptos/rwas',
      '/api/prices',
    ];

    apiEndpoints.forEach(endpoint => {
      result.push({
        loc: endpoint,
        changefreq: 'hourly',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      });
    });

    // Add special documentation
    result.push({
      loc: '/llms.txt',
      changefreq: 'weekly',
      priority: 0.95,
      lastmod: new Date().toISOString(),
    });

    return result;
  },
};
