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

    // Validate address format
    if (!/^0x[a-fA-F0-9]{1,64}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Aptos address format' },
        { status: 400 }
      );
    }

    const APTOS_GRAPHQL_URL = 'https://api.mainnet.aptoslabs.com/v1/graphql';

    const query = `
      query GetAccountNames($owner_address: String!) {
        current_aptos_names(
          where: {
            owner_address: { _eq: $owner_address }
          }
          order_by: {
            is_primary: desc
            last_transaction_version: desc
          }
        ) {
          domain
          subdomain
          is_primary
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
        variables: { owner_address: address },
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const names = result.data?.current_aptos_names || [];

    // Format the names as the ANS service does
    const nameList = names
      .filter((name: any) => name.domain && !name.subdomain)
      .map((name: any) => `${name.domain}.apt`)
      .concat(
        names
          .filter((name: any) => name.subdomain && name.domain)
          .map((name: any) => `${name.subdomain}.${name.domain}.apt`)
      );

    logger.info(`ANS: Found ${nameList.length} names for address ${address}`);

    return NextResponse.json({
      success: true,
      data: nameList,
    });
  } catch (error) {
    logger.error('Error fetching account names:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account names' },
      { status: 500 }
    );
  }
}
