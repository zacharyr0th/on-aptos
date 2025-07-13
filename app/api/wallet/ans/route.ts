import { NextRequest, NextResponse } from 'next/server';

const INDEXER = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';

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
      console.error('GraphQL errors:', result.errors);
      throw new Error('GraphQL query failed');
    }

    const primaryName = result.data?.current_aptos_names?.[0];

    if (primaryName) {
      const fullName = primaryName.subdomain
        ? `${primaryName.subdomain}.${primaryName.domain}.apt`
        : `${primaryName.domain}.apt`;

      return NextResponse.json({
        success: true,
        data: {
          name: fullName,
          domain: primaryName.domain,
          subdomain: primaryName.subdomain,
          address: primaryName.registered_address,
          expiration: primaryName.expiration_timestamp,
        },
      });
    }

    // No primary name found
    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Error fetching ANS name:', error);
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
