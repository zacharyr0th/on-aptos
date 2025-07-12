import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { env } from '@/lib/config/validate-env';

// Simple cache check - just verifying we can create/read from memory
async function checkCache(): Promise<'healthy' | 'unhealthy'> {
  try {
    const testKey = 'health-check-test';
    const testValue = Date.now().toString();

    // Simple in-memory test
    const cache = new Map();
    cache.set(testKey, testValue);
    const retrieved = cache.get(testKey);

    return retrieved === testValue ? 'healthy' : 'unhealthy';
  } catch (error) {
    logger.error('Health check cache error:', error);
    return 'unhealthy';
  }
}

// Check if external API configurations are present
function checkExternalAPIs(): 'healthy' | 'degraded' | 'unhealthy' {
  try {
    // Check if critical API keys are configured
    const hasCMCKey = !!env.CMC_API_KEY;
    const hasPanoraKey = !!env.PANORA_API_KEY;
    const hasAptosKey = !!env.APTOS_BUILD_SECRET;

    if (hasCMCKey && hasPanoraKey && hasAptosKey) {
      return 'healthy';
    } else if (hasCMCKey || hasPanoraKey || hasAptosKey) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  } catch (error) {
    logger.error('Health check API config error:', error);
    return 'unhealthy';
  }
}

export async function GET() {
  try {
    const startTime = Date.now();

    // Run health checks
    const cacheStatus = await checkCache();
    const apiStatus = checkExternalAPIs();

    // Determine overall status
    const isHealthy = cacheStatus === 'healthy' && apiStatus !== 'unhealthy';
    const status = isHealthy
      ? 'ok'
      : apiStatus === 'degraded'
        ? 'degraded'
        : 'error';

    const healthCheck = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      checks: {
        cache: cacheStatus,
        external_apis: apiStatus,
        environment: process.env.NODE_ENV || 'unknown',
      },
      services: process.env.NODE_ENV === 'production' ? undefined : {
        cmc_api: !!env.CMC_API_KEY ? 'configured' : 'not_configured',
        panora_api: !!env.PANORA_API_KEY ? 'configured' : 'not_configured',
        aptos_api: !!env.APTOS_BUILD_SECRET ? 'configured' : 'not_configured',
      },
    };

    // Log health check access
    logger.info('[Health Check]', {
      status: healthCheck.status,
      responseTime: healthCheck.responseTime,
    });

    return NextResponse.json(healthCheck, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    logger.error('Health check error:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Internal health check failure',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
