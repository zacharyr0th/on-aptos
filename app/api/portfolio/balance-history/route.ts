import { NextRequest, NextResponse } from 'next/server';
import { graphQLRequest } from '@/lib/utils/fetch-utils';
import {
  generateDailyTimestamps,
  withRetry,
  validateWalletAddress,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/utils/portfolio-utils';

const INDEXER = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
const APTOS_API_KEY = process.env.APTOS_BUILD_SECRET;

// Query to get current balance - only get legitimate APT
const CURRENT_BALANCE_QUERY = `
  query GetCurrentBalance($owner_address: String!) {
    apt_balance: current_fungible_asset_balances(
      where: {
        owner_address: {_eq: $owner_address}
        asset_type: {_eq: "0x1::aptos_coin::AptosCoin"}
      }
    ) {
      amount
      asset_type
    }
  }
`;

// Query to get historical transactions - only legitimate APT
const HISTORICAL_TRANSACTIONS_QUERY = `
  query GetHistoricalTransactions($owner_address: String!, $start_time: timestamp!) {
    apt_activities: fungible_asset_activities(
      where: {
        owner_address: {_eq: $owner_address}
        asset_type: {_eq: "0x1::aptos_coin::AptosCoin"}
        transaction_timestamp: {_gte: $start_time}
        is_transaction_success: {_eq: true}
      }
      order_by: {transaction_timestamp: desc}
    ) {
      transaction_timestamp
      type
      amount
    }
  }
`;

// No cache needed - TanStack Query handles caching on the client

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('address');

    // Validate wallet address
    const validation = validateWalletAddress(walletAddress);
    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse(validation.error!), {
        status: 400,
      });
    }

    // No server-side caching - TanStack Query handles it on the client

    // Get current APT balance with retry logic
    let currentBalanceResponse;
    try {
      currentBalanceResponse = await withRetry(
        () =>
          graphQLRequest<{
            apt_balance: Array<{ amount: string; asset_type: string }>;
          }>(
            INDEXER,
            {
              query: CURRENT_BALANCE_QUERY,
              variables: { owner_address: walletAddress },
            },
            APTOS_API_KEY
              ? { headers: { Authorization: `Bearer ${APTOS_API_KEY}` } }
              : {}
          ),
        {
          maxAttempts: 3,
          backoffStrategy: 'linear',
          baseDelay: 1000,
          onRetry: (attempt, error) => {
            console.log(`[Balance History] Retry attempt ${attempt}/3`);
          },
        }
      );
    } catch (error) {
      return NextResponse.json(
        createErrorResponse(
          'Failed to fetch balance from Aptos indexer',
          503,
          error instanceof Error ? error.message : String(error)
        ),
        { status: 503 }
      );
    }

    // Debug log the response
    console.log(
      '[Balance History] Current balance response:',
      currentBalanceResponse
    );

    // Get current balance
    let currentBalance = BigInt(0);
    if (currentBalanceResponse.apt_balance.length > 0) {
      currentBalance = BigInt(currentBalanceResponse.apt_balance[0].amount);
    }

    console.log(
      '[Balance History] Current APT balance:',
      Number(currentBalance) / 1e8
    );

    // Generate last 7 days at noon UTC
    const dailyTimestamps = generateDailyTimestamps(7);
    const dailySnapshots = dailyTimestamps.map(timestamp => ({
      date: timestamp.split('T')[0],
      timestamp,
    }));

    // Get transactions from last 10 days (7 days + buffer for accuracy)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 10);

    const transactionsResponse = await graphQLRequest<{
      apt_activities: Array<{
        transaction_timestamp: string;
        type: string;
        amount: string;
      }>;
    }>(
      INDEXER,
      {
        query: HISTORICAL_TRANSACTIONS_QUERY,
        variables: {
          owner_address: walletAddress,
          start_time: startDate.toISOString(),
        },
      },
      APTOS_API_KEY
        ? { headers: { Authorization: `Bearer ${APTOS_API_KEY}` } }
        : {}
    );

    // Process all activities
    const allActivities = transactionsResponse.apt_activities
      .map(a => ({
        timestamp: a.transaction_timestamp,
        type: a.type,
        amount: BigInt(a.amount),
      }))
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    console.log(
      `[Balance History] Found ${allActivities.length} APT transactions`
    );

    // Calculate balance for each day by working backwards from current balance
    const balanceHistory = [];
    let runningBalance = currentBalance;

    // Work backwards through days
    for (let i = dailySnapshots.length - 1; i >= 0; i--) {
      const snapshot = dailySnapshots[i];
      const snapshotDate = new Date(snapshot.timestamp);

      // Find all transactions that happened after this snapshot
      for (const activity of allActivities) {
        const activityDate = new Date(activity.timestamp);

        // If this activity happened after the snapshot, reverse it
        if (activityDate > snapshotDate && i < dailySnapshots.length - 1) {
          // Reverse the transaction to get balance at snapshot time
          // In fungible_asset_activities, type can be like "0x1::coin::WithdrawEvent" or "0x1::coin::DepositEvent"
          const typeStr = activity.type.toLowerCase();
          if (typeStr.includes('deposit') || typeStr.includes('receive')) {
            runningBalance = runningBalance - activity.amount;
          } else if (typeStr.includes('withdraw') || typeStr.includes('send')) {
            runningBalance = runningBalance + activity.amount;
          }
        }
      }

      // Store balance for this day
      balanceHistory.unshift({
        date: snapshot.date,
        timestamp: snapshot.timestamp,
        balances: {
          '0x1::aptos_coin::AptosCoin': Number(runningBalance) / 1e8,
        },
      });
    }

    const responseData = createSuccessResponse(balanceHistory, {
      walletAddress,
      currentBalance: Number(currentBalance) / 1e8,
      transactionsProcessed: allActivities.length,
      lastUpdated: new Date().toISOString(),
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[Balance History] Error:', error);
    return NextResponse.json(
      createErrorResponse(
        'Failed to fetch balance history',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      ),
      { status: 500 }
    );
  }
}
