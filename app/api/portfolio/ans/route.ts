import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // First, try the official ANS REST API
    try {
      const ansApiUrl = `https://www.aptosnames.com/api/mainnet/v1/primary-name/${address}`;
      logger.info(`[ANS] Fetching primary name from ANS API for ${address}`);

      const ansResponse = await fetch(ansApiUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'On-Aptos/1.0',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000),
      });

      if (ansResponse.ok) {
        const ansData = await ansResponse.json();
        if (ansData?.name) {
          logger.info(`[ANS] Found primary name via ANS API: ${ansData.name}`);
          return NextResponse.json({
            success: true,
            data: {
              name: ansData.name,
              domain: ansData.name.split('.')[0],
              subdomain: null,
              address: address,
              source: 'ans-api',
            },
          });
        }
      }
    } catch (ansError) {
      logger.warn('[ANS] ANS API failed, falling back to GraphQL:', ansError);
    }

    // Fallback to GraphQL if ANS API fails
    const INDEXER = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';

    // Query for ANS name
    const query = `
      query GetPrimaryName($owner_address: String!) {
        current_aptos_names(
          where: {
            owner_address: {_eq: $owner_address}
            is_primary: {_eq: true}
          }
          limit: 1
        ) {
          domain
          subdomain
          registered_address
          expiration_timestamp
        }
      }
    `;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (process.env.APTOS_BUILD_SECRET) {
      headers['Authorization'] = `Bearer ${process.env.APTOS_BUILD_SECRET}`;
    }

    const response = await fetch(INDEXER, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables: {
          owner_address: address.toLowerCase(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      logger.error('[ANS] GraphQL errors:', result.errors);
      throw new Error('GraphQL query failed');
    }

    const primaryName = result.data?.current_aptos_names?.[0];

    if (primaryName) {
      const fullName = primaryName.subdomain
        ? `${primaryName.subdomain}.${primaryName.domain}.apt`
        : `${primaryName.domain}.apt`;

      logger.info(`[ANS] Found primary name via GraphQL: ${fullName}`);
      return NextResponse.json({
        success: true,
        data: {
          name: fullName,
          domain: primaryName.domain,
          subdomain: primaryName.subdomain,
          address: primaryName.registered_address,
          expiration: primaryName.expiration_timestamp,
          source: 'graphql',
        },
      });
    }

    // No primary name found
    logger.info(`[ANS] No primary name found for ${address}`);
    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    logger.error('[ANS] Error fetching ANS name:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch ANS name',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
