import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { APP_CONFIG } from '@/lib/config/app';

// List of known LLM/AI bot user agents
const AI_BOT_PATTERNS = [
  /gptbot/i,
  /chatgpt/i,
  /claude/i,
  /anthropic/i,
  /bard/i,
  /perplexity/i,
  /you\.com/i,
  /diffbot/i,
  /ccbot/i,
  /google-extended/i,
  /meta-externalagent/i,
  /llm/i,
  /ai-bot/i,
];

// List of traditional search engine bots
const SEARCH_BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegram/i,
];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const userAgent = request.headers.get('user-agent') || '';

  // Detect if request is from an AI bot
  const isAIBot = AI_BOT_PATTERNS.some(pattern => pattern.test(userAgent));
  const isSearchBot = SEARCH_BOT_PATTERNS.some(pattern =>
    pattern.test(userAgent)
  );
  const isBot = isAIBot || isSearchBot;

  // Add security headers
  response.headers.set('X-Robots-Tag', 'index, follow, max-snippet:-1');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Content Security Policy - relaxed for development
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com https://*.vercel-scripts.com`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https:",
    "connect-src 'self' https://api.coinmarketcap.com https://api.panora.exchange https: wss: ws:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

  // HTTPS enforcement
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Add link headers for discovery
  response.headers.set(
    'Link',
    [
      `<${APP_CONFIG.siteUrl}/llms.txt>; rel="alternate"; type="text/plain"; title="LLM Documentation"`,
      `<${APP_CONFIG.siteUrl}/api/llm-metadata>; rel="alternate"; type="application/ld+json"; title="Structured Data"`,
      `<${APP_CONFIG.siteUrl}/humans.txt>; rel="author"; type="text/plain"`,
      `<${APP_CONFIG.siteUrl}/.well-known/ai-plugin.json>; rel="ai-plugin"; type="application/json"`,
    ].join(', ')
  );

  // Special handling for AI bots
  if (isAIBot) {
    response.headers.set('X-AI-Friendly', 'true');
    response.headers.set('X-LLM-Documentation', '/llms.txt');
    response.headers.set('X-API-Documentation', '/api-spec');
    response.headers.set('X-Developer', 'On Aptos Developer');
    response.headers.set('X-Developer-URL', APP_CONFIG.siteUrl);

    // Log AI bot access for analytics (removed sensitive info)
    logger.info('[Middleware] AI Bot Access:', {
      timestamp: new Date().toISOString(),
      path: request.nextUrl.pathname,
      botType: 'AI',
    });
  }

  // Add performance headers
  if (!request.nextUrl.pathname.startsWith('/_next')) {
    response.headers.set('X-DNS-Prefetch-Control', 'on');
  }

  // Secure CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Only allow specific trusted origins in production
    const allowedOrigins = APP_CONFIG.isProduction
      ? APP_CONFIG.corsOrigins
      : ['http://localhost:3000', 'http://localhost:3001'];

    const origin = request.headers.get('origin');
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else if (process.env.NODE_ENV === 'development') {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
    response.headers.set('Access-Control-Max-Age', '86400');
    response.headers.set('Access-Control-Allow-Credentials', 'false');
  }

  // Special caching for static documentation
  if (
    request.nextUrl.pathname === '/llms.txt' ||
    request.nextUrl.pathname === '/humans.txt' ||
    request.nextUrl.pathname === '/.well-known/ai-plugin.json'
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=3600, stale-while-revalidate=86400'
    );
  }

  // Aggressive caching for translation files
  if (request.nextUrl.pathname.startsWith('/locales/')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable' // 1 year cache, immutable
    );
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * But include /locales for caching headers
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/locales/:path*',
  ],
};
