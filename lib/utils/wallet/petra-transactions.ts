/**
 * Petra Wallet Transaction Utilities
 * Based on: https://petra.app/docs/sending-a-transaction
 */

import { handlePetraError } from "./petra-errors";
import type { PetraWindow } from "./petra-events";

export interface EntryFunctionPayload {
  function: string;
  type_arguments: string[];
  arguments: (string | number | boolean)[];
  type: "entry_function_payload";
}

export interface PendingTransaction {
  hash: string;
  sender: string;
  sequence_number: string;
  max_gas_amount: string;
  gas_unit_price: string;
  expiration_timestamp_secs: string;
  payload: EntryFunctionPayload;
  signature: any;
}

/**
 * Sign and submit a transaction to the Aptos blockchain
 * This is the recommended method for most use cases
 */
export async function signAndSubmitTransaction(
  transaction: EntryFunctionPayload
): Promise<PendingTransaction> {
  if (typeof window === "undefined") {
    throw new Error("Window is not defined");
  }

  const petraWindow = window as PetraWindow;

  if (!petraWindow.aptos) {
    throw new Error("Petra wallet not detected");
  }

  try {
    const pendingTransaction = await petraWindow.aptos.signAndSubmitTransaction(transaction);
    return pendingTransaction;
  } catch (error) {
    const errorMessage = handlePetraError(error, "Failed to sign and submit transaction");
    throw new Error(errorMessage);
  }
}

/**
 * Sign a transaction without submitting it to the blockchain
 * WARNING: Not recommended for most use cases. Users will receive an extra warning.
 */
export async function signTransaction(transaction: EntryFunctionPayload): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("Window is not defined");
  }

  const petraWindow = window as PetraWindow;

  if (!petraWindow.aptos) {
    throw new Error("Petra wallet not detected");
  }

  try {
    const signedTransaction = await petraWindow.aptos.signTransaction(transaction);
    return signedTransaction;
  } catch (error) {
    const errorMessage = handlePetraError(error, "Failed to sign transaction");
    throw new Error(errorMessage);
  }
}

/**
 * Helper function to create a coin transfer transaction
 */
export function createCoinTransferTransaction(
  recipientAddress: string,
  amount: number | string,
  coinType: string = "0x1::aptos_coin::AptosCoin"
): EntryFunctionPayload {
  return {
    function: "0x1::coin::transfer",
    type_arguments: [coinType],
    arguments: [recipientAddress, amount],
    type: "entry_function_payload",
  };
}

/**
 * Wait for transaction confirmation using Aptos SDK
 * You need to use this with the Aptos SDK client
 */
export async function waitForTransaction(
  client: any, // AptosClient from @aptos-labs/ts-sdk
  txHash: string,
  options?: { timeoutSecs?: number; checkSuccess?: boolean }
): Promise<any> {
  try {
    const txn = await client.waitForTransactionWithResult(txHash, options);
    return txn;
  } catch (error) {
    throw new Error(
      `Failed to wait for transaction: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
