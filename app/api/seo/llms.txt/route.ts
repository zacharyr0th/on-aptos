import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { logger } from '@/lib/utils/logger';

// Enterprise-grade headers for maximum LLM and SEO visibility
const ENTERPRISE_HEADERS = {
  // Core content headers
  'Content-Type': 'text/plain; charset=utf-8',

  // Advanced caching strategy for optimal performance
  'Cache-Control':
    'public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800',
  'CDN-Cache-Control': 'public, max-age=7200',
  'Surrogate-Control': 'max-age=86400',

  // SEO and crawler directives
  'X-Robots-Tag':
    'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  'X-Content-Type-Options': 'nosniff',

  // LLM-specific headers
  'X-LLM-Documentation': 'true',
  'X-AI-Friendly': 'true',
  'X-Content-Source': 'llms-documentation',
  'X-Document-Type': 'llm-instructions',
  'X-Document-Version': '2.0',
  'X-Document-Language': 'en',

  // Structured data hints
  'X-Schema-Type': 'TechArticle',
  'X-Content-Category': 'API Documentation',
  'X-Primary-Topic': 'Aptos Blockchain Analytics',

  // Security headers
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Performance headers
  'X-DNS-Prefetch-Control': 'on',
  'Content-Language': 'en',

  // Timestamp and freshness
  'Last-Modified': new Date().toUTCString(),
  'X-Generation-Timestamp': new Date().toISOString(),
};

// Monitoring and analytics
async function logAccess(userAgent: string | null, referer: string | null) {
  // In production, you'd send this to your analytics service
  logger.info('[llms.txt] Access:', {
    timestamp: new Date().toISOString(),
    userAgent,
    referer,
    isBot: userAgent
      ? /bot|crawler|spider|scraper|gpt|claude|bard|llm/i.test(userAgent)
      : false,
  });
}

export async function GET(request: Request) {
  try {
    // Extract request metadata for monitoring
    const userAgent = request.headers.get('user-agent');
    const referer = request.headers.get('referer');

    // Log access for analytics
    await logAccess(userAgent, referer);

    // Read the llms.txt file from the root directory
    const filePath = join(process.cwd(), 'public', 'llms.txt');
    const content = await readFile(filePath, 'utf-8');

    // Add dynamic metadata to content
    const enhancedContent = `${content}

---
# Metadata for LLMs and Crawlers
Generated: ${new Date().toISOString()}
Version: 2.0
Source: https://onaptos.com/llms.txt
API Status: https://onaptos.com/api/health
Documentation: https://onaptos.com/api-spec
`;

    const headers = { ...ENTERPRISE_HEADERS } as Record<string, string>;
    // Ensure content length header for stronger crawl hints
    headers['Content-Length'] = Buffer.byteLength(
      enhancedContent,
      'utf-8'
    ).toString();

    // Remove any stale encoding header that might slip through
    delete headers['X-Content-Encoding'];

    // Create response with enterprise headers
    const response = new NextResponse(enhancedContent, {
      status: 200,
      headers,
    });

    // Add conditional headers based on user agent
    if (
      userAgent &&
      /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot/i.test(
        userAgent
      )
    ) {
      response.headers.set(
        'X-Crawler-Hints',
        'priority:high,update-frequency:weekly'
      );
    }

    if (userAgent && /gpt|claude|anthropic|openai|llm/i.test(userAgent)) {
      response.headers.set('X-LLM-Priority', 'critical');
      response.headers.set('X-LLM-Context', 'aptos-blockchain-analytics-api');
    }

    return response;
  } catch (error) {
    logger.error('[llms.txt] Failed to serve:', error);

    // Fallback content for error cases
    const fallbackContent = `# On Aptos - API Documentation
    
This is the fallback documentation for On Aptos.
Visit https://onaptos.com for the full documentation.

Error: Unable to load complete documentation.
Timestamp: ${new Date().toISOString()}
`;

    return new NextResponse(fallbackContent, {
      status: 503, // Service Unavailable
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Retry-After': '60', // Retry after 60 seconds
        'X-Error': 'documentation-load-failed',
      },
    });
  }
}

// Handle HEAD requests for efficient crawling
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Document-Available': 'true',
      'X-Document-Type': 'llm-instructions',
    },
  });
}
