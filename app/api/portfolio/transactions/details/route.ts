import { NextRequest, NextResponse } from "next/server";

import { getEnvVar } from "@/lib/config/validate-env";

const APTOS_INDEXER_URL = "https://api.mainnet.aptoslabs.com/v1/graphql";

interface TransactionEvent {
  type: string;
  data: Record<string, unknown>;
  account_address: string;
  event_index: number;
}

interface TransactionSignature {
  signer: string;
  type: string;
  is_sender_primary: boolean;
}

/**
 * On-demand transaction details API
 * Fetches complete transaction details only when needed
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const version = searchParams.get("version");

    if (!address || !version) {
      return NextResponse.json(
        { error: "Address and version parameters are required" },
        { status: 400 },
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const apiKey = getEnvVar("APTOS_BUILD_SECRET");
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    apiLogger.debug(`Fetching transaction details for version ${version}`);

    // Comprehensive query for transaction details
    const detailsQuery = `
      query GetTransactionDetails($version: bigint!) {
        user_transactions(
          where: { version: { _eq: $version } }
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
          where: { version: { _eq: $version } }
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
          where: { transaction_version: { _eq: $version } }
          order_by: { event_index: asc }
        ) {
          transaction_version
          event_index
          type
          data
          indexed_type
          account_address
          creation_number
          sequence_number
        }
        signatures(
          where: { transaction_version: { _eq: $version } }
        ) {
          transaction_version
          multi_agent_index
          multi_sig_index
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

    const response = await fetch(APTOS_INDEXER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: detailsQuery,
        variables: { version: parseInt(version) },
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      apiLogger.error(`GraphQL error: ${JSON.stringify(result.errors)}`);
      throw new Error("Failed to fetch transaction details");
    }

    const userTx = result.data?.user_transactions?.[0];
    const blockMetaTx = result.data?.block_metadata_transactions?.[0];
    const events = result.data?.events || [];
    const signatures = result.data?.signatures || [];

    // Use whichever transaction type we found
    const tx = userTx || blockMetaTx;

    if (!tx) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Enhanced event analysis for better transaction categorization
    let amount = "0";
    let assetType = "APT";
    let assetSymbol = "APT";
    let direction = "unknown";
    let counterparty = null;
    let protocolInfo = null;

    // Analyze events to extract detailed information
    for (const event of events) {
      if (event.type && event.data) {
        try {
          const eventData =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;

          // Extract amount from transfer events
          if (
            event.type.includes("WithdrawEvent") ||
            event.type.includes("DepositEvent")
          ) {
            amount = eventData.amount || amount;

            // Extract asset type from event type
            const typeMatch = event.type.match(/<([^>]+)>/);
            if (typeMatch) {
              const fullType = typeMatch[1];
              assetType = fullType;

              // Extract symbol from type
              if (fullType.includes("aptos_coin")) {
                assetSymbol = "APT";
              } else {
                // Try to extract symbol from the type path
                const symbolMatch = fullType.match(/::([^:]+)$/);
                assetSymbol = symbolMatch
                  ? symbolMatch[1]
                  : fullType.split("::").pop() || "UNKNOWN";
              }
            }

            // Determine direction
            if (event.type.includes("WithdrawEvent")) {
              direction =
                event.account_address === address ? "outgoing" : "incoming";
            } else if (event.type.includes("DepositEvent")) {
              direction =
                event.account_address === address ? "incoming" : "outgoing";
            }
          }

          // Extract counterparty information
          if (eventData.account || eventData.to || eventData.from) {
            counterparty = eventData.account || eventData.to || eventData.from;
          }
        } catch (error) {
          apiLogger.debug(
            `Failed to parse event data for ${event.type}: ${error}`,
          );
        }
      }
    }

    // Determine protocol from entry function
    if (tx.entry_function_id_str) {
      const functionStr = tx.entry_function_id_str;
      protocolInfo = analyzeProtocol(functionStr);
    }

    // Build comprehensive transaction object
    const transactionDetails = {
      // Basic info
      transaction_version: tx.version,
      transaction_timestamp: tx.timestamp,
      type: tx.entry_function_id_str || "Transaction",
      success: true, // TODO: Determine actual success status

      // Transaction specifics
      function: tx.entry_function_id_str,
      sender: tx.sender || tx.proposer || "system",
      sequence_number: tx.sequence_number,

      // Gas and fees
      gas_fee: tx.gas_unit_price || "0",
      gas_unit_price: tx.gas_unit_price,
      max_gas_amount: tx.max_gas_amount,
      expiration_timestamp_secs: tx.expiration_timestamp_secs,

      // Block info
      block_height: tx.block_height,
      epoch: tx.epoch,

      // Enhanced asset info
      amount,
      asset_type: assetType,
      asset_symbol: assetSymbol,
      asset_name: assetSymbol,
      direction,
      counterparty,

      // Protocol information
      protocol: protocolInfo,

      // Raw data for advanced analysis
      events: events.map((e: TransactionEvent) => ({
        type: e.type,
        data: e.data,
        account_address: e.account_address,
        event_index: e.event_index,
      })),
      signatures: signatures.map((s: TransactionSignature) => ({
        signer: s.signer,
        type: s.type,
        is_sender_primary: s.is_sender_primary,
      })),

      // Metadata
      loaded_at: new Date().toISOString(),
      detailed: true,
    };

    apiLogger.debug(`Successfully loaded details for transaction ${version}`);

    return NextResponse.json(
      {
        success: true,
        data: transactionDetails,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800", // Cache for 15 min
        },
      },
    );
  } catch (error) {
    apiLogger.error(
      `Transaction details API error: ${error instanceof Error ? error.message : String(error)}`,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch transaction details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Analyze protocol from entry function string
 */
function analyzeProtocol(functionStr: string): Record<string, unknown> | null {
  if (!functionStr) return null;

  const protocolPatterns = [
    {
      pattern: /pancake|0x[a-f0-9]+::router/,
      name: "pancakeswap",
      label: "PancakeSwap",
    },
    { pattern: /liquidswap|pontem/, name: "liquidswap", label: "Liquidswap" },
    { pattern: /thala|0x[a-f0-9]+::amm/, name: "thala", label: "Thala" },
    { pattern: /cellana/, name: "cellana", label: "Cellana" },
    {
      pattern: /aries|0x[a-f0-9]+::lending/,
      name: "aries",
      label: "Aries Markets",
    },
    { pattern: /emojicoin/, name: "emojicoin", label: "Emojicoin" },
    {
      pattern: /aptin|aptos_framework::staking/,
      name: "aptin",
      label: "Aptin",
    },
    { pattern: /wormhole/, name: "wormhole", label: "Wormhole" },
    { pattern: /layerzero/, name: "layerzero", label: "LayerZero" },
    { pattern: /celer/, name: "celer", label: "Celer" },
  ];

  for (const { pattern, name, label } of protocolPatterns) {
    if (pattern.test(functionStr.toLowerCase())) {
      return { name, label };
    }
  }

  return null;
}
