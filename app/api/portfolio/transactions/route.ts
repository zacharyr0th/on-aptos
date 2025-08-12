import { NextRequest, NextResponse } from "next/server";

import { getEnvVar } from "@/lib/config/validate-env";
import { apiLogger } from "@/lib/utils/core/logger";

const APTOS_INDEXER_URL = "https://api.mainnet.aptoslabs.com/v1/graphql";

async function fetchFromGraphQL(
  address: string,
  requestedLimit: number,
  startOffset: number = 0,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const apiKey = getEnvVar("APTOS_BUILD_SECRET");
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  apiLogger.info(
    `Fetching ${requestedLimit} transactions starting at offset ${startOffset} for address ${address}`,
  );

  // Single query for just the requested page with total count
  const query = `
    query GetAccountTransactions($address: String!, $limit: Int!, $offset: Int!) {
      account_transactions(
        where: { account_address: { _eq: $address } }
        order_by: { transaction_version: desc }
        limit: $limit
        offset: $offset
      ) {
        transaction_version
        account_address
      }
      account_transactions_aggregate(
        where: { account_address: { _eq: $address } }
      ) {
        aggregate {
          count
        }
      }
    }
  `;

  const response = await fetch(APTOS_INDEXER_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      variables: { address, limit: requestedLimit, offset: startOffset },
    }),
  });

  const result = await response.json();

  if (result.errors) {
    apiLogger.error(`GraphQL error: ${JSON.stringify(result.errors)}`);
    throw new Error(
      `GraphQL error: ${result.errors[0]?.message || "Unknown error"}`,
    );
  }

  const accountTxns = result.data?.account_transactions || [];
  const totalCount =
    result.data?.account_transactions_aggregate?.aggregate?.count || 0;

  apiLogger.info(
    `Fetched ${accountTxns.length} transaction versions out of ${totalCount} total`,
  );

  if (accountTxns.length === 0) {
    return { transactions: [], totalCount };
  }

  // Get transaction details for the fetched versions
  const txVersions = accountTxns.map((tx: any) => tx.transaction_version);

  apiLogger.info(`Fetching details for ${txVersions.length} transactions`);

  if (txVersions.length === 0) {
    return { transactions: [], totalCount };
  }

  // Since we're only fetching one page, we can get all details in one or two queries
  const detailsBatchSize = 100;
  let allTransactions: any[] = [];
  let allEvents: any[] = [];
  let allSignatures: any[] = [];
  let allBlockMetadata: any[] = [];

  for (let i = 0; i < txVersions.length; i += detailsBatchSize) {
    const batchVersions = txVersions.slice(i, i + detailsBatchSize);

    const detailsQuery = `
      query GetTransactionDetails($versions: [bigint!]) {
        user_transactions(
          where: { version: { _in: $versions } }
          order_by: { version: desc }
        ) {
          version
          block_height
          timestamp
          sender
          sequence_number
          max_gas_amount
          gas_unit_price
          expiration_timestamp_secs
          entry_function_id_str
          epoch
        }
        block_metadata_transactions(
          where: { version: { _in: $versions } }
          order_by: { version: desc }
        ) {
          version
          block_height
          timestamp
          proposer
          epoch
          failed_proposer_indices
          previous_block_votes_bitvec
        }
        events(
          where: { transaction_version: { _in: $versions } }
          order_by: { transaction_version: desc, event_index: asc }
        ) {
          transaction_version
          transaction_block_height
          event_index
          type
          data
          indexed_type
          account_address
          creation_number
          sequence_number
        }
        signatures(
          where: { transaction_version: { _in: $versions } }
          order_by: { transaction_version: desc }
        ) {
          transaction_version
          multi_agent_index
          multi_sig_index
          transaction_block_height
          signer
          is_sender_primary
          type
          public_key
          signature
          threshold
          public_key_indices
        }
      }
    `;

    const detailsResponse = await fetch(APTOS_INDEXER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: detailsQuery,
        variables: { versions: batchVersions },
      }),
    });

    const detailsResult = await detailsResponse.json();

    if (detailsResult.errors) {
      apiLogger.error(
        `GraphQL error for batch: ${JSON.stringify(detailsResult.errors)}`,
      );
      // Continue with other batches instead of throwing
      continue;
    }

    // Accumulate results from this batch
    allTransactions = allTransactions.concat(
      detailsResult.data?.user_transactions || [],
    );
    allEvents = allEvents.concat(detailsResult.data?.events || []);
    allSignatures = allSignatures.concat(detailsResult.data?.signatures || []);
    allBlockMetadata = allBlockMetadata.concat(
      detailsResult.data?.block_metadata_transactions || [],
    );

    // Log progress for batches
    if (i > 0) {
      apiLogger.info(
        `Fetched details for ${i + batchVersions.length}/${txVersions.length} transactions`,
      );
    }
  }

  const transactions = allTransactions;
  const events = allEvents;
  const signatures = allSignatures;
  const blockMetadata = allBlockMetadata;

  // Group events and signatures by transaction version
  const eventsByVersion = events.reduce((acc: any, event: any) => {
    if (!acc[event.transaction_version]) acc[event.transaction_version] = [];
    acc[event.transaction_version].push(event);
    return acc;
  }, {});

  const signaturesByVersion = signatures.reduce((acc: any, sig: any) => {
    if (!acc[sig.transaction_version]) acc[sig.transaction_version] = [];
    acc[sig.transaction_version].push(sig);
    return acc;
  }, {});

  const processedTransactions = transactions.map((tx: any) => {
    // Try to extract amount from events (coin transfers, withdrawals, deposits)
    let amount = "0";
    let assetType = "APT";
    const txEvents = eventsByVersion[tx.version] || [];

    // Look for coin transfer, withdrawal, or deposit events
    for (const event of txEvents) {
      if (event.type && event.data) {
        try {
          const eventData =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;

          // Check for coin transfer/withdraw/deposit events
          if (
            event.type.includes("CoinWithdrawEvent") ||
            event.type.includes("CoinDepositEvent") ||
            event.type.includes("WithdrawEvent") ||
            event.type.includes("DepositEvent")
          ) {
            amount = eventData.amount || "0";

            // Extract asset type from the event type (e.g., 0x1::coin::WithdrawEvent<0x1::aptos_coin::AptosCoin>)
            const typeMatch = event.type.match(/<([^>]+)>/);
            if (typeMatch) {
              assetType = typeMatch[1].includes("aptos_coin")
                ? "APT"
                : typeMatch[1];
            }
            break; // Use the first matching event
          }
        } catch {
          // Failed to parse event data, continue
        }
      }
    }

    return {
      // Basic transaction info
      transaction_version: tx.version,
      transaction_timestamp: tx.timestamp,
      type: tx.entry_function_id_str || "Transaction",
      amount: amount,
      asset_type: assetType,
      asset_name: assetType === "APT" ? "Aptos" : assetType,
      success: true,
      function: tx.entry_function_id_str,

      // Gas and fees (gas_unit_price is already in octas)
      gas_fee: tx.gas_unit_price ? tx.gas_unit_price : "0",
      gas_unit_price: tx.gas_unit_price,
      max_gas_amount: tx.max_gas_amount,

      // Sender and sequence
      sender: tx.sender,
      sequence_number: tx.sequence_number,

      // Block info
      block_height: tx.block_height,
      epoch: tx.epoch,
      expiration_timestamp_secs: tx.expiration_timestamp_secs,

      // Related data
      events: txEvents,
      signatures: signaturesByVersion[tx.version] || [],

      // Raw data for debugging
      raw_data: {
        user_transaction: tx,
        events: txEvents,
        signatures: signaturesByVersion[tx.version],
        block_metadata: blockMetadata,
      },
    };
  });

  return { transactions: processedTransactions, totalCount };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const limit = parseInt(searchParams.get("limit") || "100", 10); // Default to 100 per page
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    if (!address) {
      apiLogger.warn("Transaction API: Missing address parameter");
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 },
      );
    }

    apiLogger.info("Using GraphQL API for server-side pagination");

    const result = await fetchFromGraphQL(address, limit, offset);
    const { transactions, totalCount } = result;

    apiLogger.info(
      `Transaction fetch completed: ${transactions.length} transactions, ${totalCount} total`,
    );

    return NextResponse.json(
      {
        success: true,
        data: transactions,
        count: transactions.length,
        totalCount: totalCount,
        hasMore: offset + transactions.length < totalCount,
        nextOffset: offset + transactions.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    apiLogger.error("Transaction API error", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch transactions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
