/**
 * Petra Wallet Message Signing Utilities
 * Based on: https://petra.app/docs/signing-messages
 */

import nacl from 'tweetnacl';
import { PetraWindow, SignMessagePayload, SignMessageResponse } from './petra-events';
import { handlePetraError } from './petra-errors';

/**
 * Sign a message with Petra wallet
 */
export async function signMessage(payload: SignMessagePayload): Promise<SignMessageResponse> {
  if (typeof window === 'undefined') {
    throw new Error('Window is not defined');
  }

  const petraWindow = window as PetraWindow;

  if (!petraWindow.aptos) {
    throw new Error('Petra wallet not detected');
  }

  try {
    const response = await petraWindow.aptos.signMessage(payload);
    return response;
  } catch (error) {
    const errorMessage = handlePetraError(error, 'Failed to sign message');
    throw new Error(errorMessage);
  }
}

/**
 * Verify a signed message
 * This is useful for verifying ownership of a private resource
 */
export async function verifySignedMessage(
  message: string,
  nonce: string
): Promise<{ verified: boolean; response?: SignMessageResponse }> {
  if (typeof window === 'undefined') {
    throw new Error('Window is not defined');
  }

  const petraWindow = window as PetraWindow;

  if (!petraWindow.aptos) {
    throw new Error('Petra wallet not detected');
  }

  try {
    // Sign the message
    const response = await petraWindow.aptos.signMessage({
      message,
      nonce,
    });

    // Get the public key
    const account = await petraWindow.aptos.account();
    const publicKey = account.publicKey;

    // Remove the 0x prefix and get first 64 chars (32 bytes)
    const key = publicKey.slice(2, 66);

    // Verify the signature
    const verified = nacl.sign.detached.verify(
      new TextEncoder().encode(response.fullMessage),
      hexToUint8Array(response.signature),
      hexToUint8Array(key)
    );

    return { verified, response };
  } catch (error) {
    const errorMessage = handlePetraError(error, 'Failed to verify signed message');
    throw new Error(errorMessage);
  }
}

/**
 * Helper function to convert hex string to Uint8Array
 */
function hexToUint8Array(hexString: string): Uint8Array {
  // Remove 0x prefix if present
  const hex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;

  // Convert hex string to Uint8Array
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Create a simple sign message payload
 */
export function createSignMessagePayload(
  message: string,
  nonce?: string,
  options?: {
    includeAddress?: boolean;
    includeApplication?: boolean;
    includeChainId?: boolean;
  }
): SignMessagePayload {
  return {
    message,
    nonce: nonce || Math.random().toString(36).substring(7),
    address: options?.includeAddress,
    application: options?.includeApplication,
    chainId: options?.includeChainId,
  };
}

/**
 * Verify ownership of a wallet address
 * Returns true if the signature is valid and matches the expected address
 */
export async function verifyWalletOwnership(
  expectedAddress: string,
  message: string = 'Verify wallet ownership'
): Promise<boolean> {
  try {
    const nonce = Math.random().toString(36).substring(7);
    const { verified, response } = await verifySignedMessage(message, nonce);

    if (!verified || !response) {
      return false;
    }

    // Check if the address matches
    return response.address.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('Failed to verify wallet ownership:', error);
    return false;
  }
}
