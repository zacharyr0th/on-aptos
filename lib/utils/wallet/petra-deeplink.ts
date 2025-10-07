/**
 * Petra Wallet Deep Link Utility
 *
 * Handles mobile-to-mobile communication with Petra wallet using deep links
 * Based on: https://petra.app/docs/deep-linking-to-mobile-app
 */

import nacl from "tweetnacl";

// Constants
const PETRA_LINK_BASE = "petra://api/v1";
const DAPP_LINK_BASE = "onaptos://api/v1"; // Your dApp's deep link scheme

export const APP_INFO = {
  domain: typeof window !== "undefined" ? window.location.origin : "https://onaptos.com",
  name: "What's on Aptos?",
};

// Types
export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface ConnectionData {
  appInfo: typeof APP_INFO;
  redirectLink: string;
  dappEncryptionPublicKey: string;
}

export interface SignTransactionData {
  appInfo: typeof APP_INFO;
  payload: string;
  redirectLink: string;
  dappEncryptionPublicKey: string;
  nonce: string;
}

export interface SignMessageData {
  appInfo: typeof APP_INFO;
  payload: string;
  redirectLink: string;
  dappEncryptionPublicKey: string;
  nonce: string;
}

export interface PetraConnectionResponse {
  response: "approved" | "rejected";
  data?: string;
}

// Storage keys
const STORAGE_KEYS = {
  SECRET_KEY: "petra_secret_key",
  PUBLIC_KEY: "petra_public_key",
  SHARED_KEY: "petra_shared_key",
};

/**
 * Generate a new key pair for encryption
 */
export function generateKeyPair(): KeyPair {
  return nacl.box.keyPair();
}

/**
 * Save key pair to local storage
 */
export function saveKeyPair(keyPair: KeyPair): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEYS.SECRET_KEY, Buffer.from(keyPair.secretKey).toString("hex"));
  localStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, Buffer.from(keyPair.publicKey).toString("hex"));
}

/**
 * Load key pair from local storage
 */
export function loadKeyPair(): KeyPair | null {
  if (typeof window === "undefined") return null;

  const secretKeyHex = localStorage.getItem(STORAGE_KEYS.SECRET_KEY);
  const publicKeyHex = localStorage.getItem(STORAGE_KEYS.PUBLIC_KEY);

  if (!secretKeyHex || !publicKeyHex) return null;

  return {
    secretKey: Uint8Array.from(Buffer.from(secretKeyHex, "hex")),
    publicKey: Uint8Array.from(Buffer.from(publicKeyHex, "hex")),
  };
}

/**
 * Save shared encryption key
 */
export function saveSharedKey(sharedKey: Uint8Array): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEYS.SHARED_KEY, Buffer.from(sharedKey).toString("hex"));
}

/**
 * Load shared encryption key
 */
export function loadSharedKey(): Uint8Array | null {
  if (typeof window === "undefined") return null;

  const sharedKeyHex = localStorage.getItem(STORAGE_KEYS.SHARED_KEY);
  if (!sharedKeyHex) return null;

  return Uint8Array.from(Buffer.from(sharedKeyHex, "hex"));
}

/**
 * Clear all stored keys
 */
export function clearStoredKeys(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEYS.SECRET_KEY);
  localStorage.removeItem(STORAGE_KEYS.PUBLIC_KEY);
  localStorage.removeItem(STORAGE_KEYS.SHARED_KEY);
}

/**
 * Create a deep link to connect to Petra wallet
 */
export function createConnectLink(publicKey: Uint8Array): string {
  const data: ConnectionData = {
    appInfo: APP_INFO,
    redirectLink: `${DAPP_LINK_BASE}/connect`,
    dappEncryptionPublicKey: Buffer.from(publicKey).toString("hex"),
  };

  const encodedData = btoa(JSON.stringify(data));
  return `${PETRA_LINK_BASE}/connect?data=${encodedData}`;
}

/**
 * Create a deep link to disconnect from Petra wallet
 */
export function createDisconnectLink(publicKey: Uint8Array): string {
  const data: ConnectionData = {
    appInfo: APP_INFO,
    redirectLink: `${DAPP_LINK_BASE}/disconnect`,
    dappEncryptionPublicKey: Buffer.from(publicKey).toString("hex"),
  };

  const encodedData = btoa(JSON.stringify(data));
  return `${PETRA_LINK_BASE}/disconnect?data=${encodedData}`;
}

/**
 * Create a deep link to sign and submit a transaction
 */
export function createSignTransactionLink(
  payload: any,
  publicKey: Uint8Array,
  sharedKey: Uint8Array
): string {
  // Encode payload
  const payloadString = btoa(JSON.stringify(payload));

  // Generate nonce
  const nonce = nacl.randomBytes(24);

  // Encrypt payload
  const encryptedPayload = nacl.box.after(Buffer.from(payloadString), nonce, sharedKey);

  const data: SignTransactionData = {
    appInfo: APP_INFO,
    payload: Buffer.from(encryptedPayload).toString("hex"),
    redirectLink: `${DAPP_LINK_BASE}/response`,
    dappEncryptionPublicKey: Buffer.from(publicKey).toString("hex"),
    nonce: Buffer.from(nonce).toString("hex"),
  };

  const encodedData = btoa(JSON.stringify(data));
  return `${PETRA_LINK_BASE}/signAndSubmit?data=${encodedData}`;
}

/**
 * Create a deep link to sign a message
 */
export function createSignMessageLink(
  message: string,
  publicKey: Uint8Array,
  sharedKey: Uint8Array
): string {
  // Generate nonce
  const nonce = nacl.randomBytes(24);

  // Encrypt message
  const encryptedPayload = nacl.box.after(Buffer.from(message), nonce, sharedKey);

  const data: SignMessageData = {
    appInfo: APP_INFO,
    payload: Buffer.from(encryptedPayload).toString("hex"),
    redirectLink: `${DAPP_LINK_BASE}/response`,
    dappEncryptionPublicKey: Buffer.from(publicKey).toString("hex"),
    nonce: Buffer.from(nonce).toString("hex"),
  };

  const encodedData = btoa(JSON.stringify(data));
  return `${PETRA_LINK_BASE}/signMessage?data=${encodedData}`;
}

/**
 * Handle connection approval response from Petra
 */
export function handleConnectionApproval(data: string, secretKey: Uint8Array): Uint8Array {
  const { petraPublicEncryptedKey } = JSON.parse(atob(data));

  // Decrypt to get shared key
  const sharedEncryptionSecretKey = nacl.box.before(
    Buffer.from(petraPublicEncryptedKey.slice(2), "hex"),
    secretKey
  );

  return sharedEncryptionSecretKey;
}

/**
 * Parse Petra response from URL parameters
 */
export function parseDeepLinkResponse(url: string): {
  endpoint: string;
  response?: "approved" | "rejected";
  data?: string;
} | null {
  try {
    const urlObject = new URL(url);
    const params = new URLSearchParams(urlObject.search);

    return {
      endpoint: urlObject.pathname,
      response: params.get("response") as "approved" | "rejected" | undefined,
      data: params.get("data") || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Check if the device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Open Petra deep link with fallback
 */
export function openPetraDeepLink(deepLink: string): void {
  if (typeof window === "undefined") return;

  if (isMobileDevice()) {
    // On mobile, open deep link directly
    window.location.href = deepLink;
  } else {
    // On desktop, show error or redirect to download page
    window.open("https://petra.app/download", "_blank");
  }
}
