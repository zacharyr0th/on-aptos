import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Input validation and security
  const userAgent = request.headers.get('user-agent') || '';
  if (userAgent.length > 300) {
    return new NextResponse('Invalid request', { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://onaptos.com';
  const currentDate = new Date().toISOString();

  // Dynamic API endpoints that update frequently
  const apiEndpoints = [
    {
      url: '/api/aptos/btc',
      lastmod: currentDate,
      changefreq: 'hourly',
      priority: 0.8,
    },
    {
      url: '/api/aptos/lst',
      lastmod: currentDate,
      changefreq: 'hourly',
      priority: 0.8,
    },
    {
      url: '/api/aptos/stables',
      lastmod: currentDate,
      changefreq: 'hourly',
      priority: 0.8,
    },
    {
      url: '/api/aptos/rwas',
      lastmod: currentDate,
      changefreq: 'hourly',
      priority: 0.8,
    },
    {
      url: '/api/prices',
      lastmod: currentDate,
      changefreq: 'hourly',
      priority: 0.7,
    },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${apiEndpoints
  .map(
    endpoint => `  <url>
    <loc>${baseUrl}${endpoint.url}</loc>
    <lastmod>${endpoint.lastmod}</lastmod>
    <changefreq>${endpoint.changefreq}</changefreq>
    <priority>${endpoint.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-Robots-Tag': 'index, follow',
    },
  });
}

// Revalidate every hour to keep data fresh
export const revalidate = 3600;
