import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tokenDataId = searchParams.get('tokenDataId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!tokenDataId) {
      return NextResponse.json(
        { error: 'tokenDataId parameter is required' },
        { status: 400 }
      );
    }

    const validLimit = Math.min(Math.max(limit, 1), 50);

    const APTOS_GRAPHQL_URL = 'https://api.mainnet.aptoslabs.com/v1/graphql';

    const query = `
      query GetNFTTransferHistory($token_data_id: String!, $limit: Int!) {
        token_activities_v2(
          where: {
            token_data_id: { _eq: $token_data_id }
          }
          order_by: { transaction_timestamp: desc }
          limit: $limit
        ) {
          transaction_version
          transaction_timestamp
          from_address
          to_address
          token_amount
          transfer_type
          token_data_id
        }
      }
    `;

    const response = await fetch(APTOS_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          token_data_id: tokenDataId,
          limit: validLimit,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const transfers = result.data?.token_activities_v2 || [];

    logger.info(`NFT Transfer History: Found ${transfers.length} transfers for token ${tokenDataId}`);

    return NextResponse.json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    logger.error('Error fetching NFT transfer history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFT transfer history' },
      { status: 500 }
    );
  }
}