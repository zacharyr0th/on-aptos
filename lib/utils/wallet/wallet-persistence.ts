/**
 * Wallet Connection Status Persistence
 * Maintains wallet connection state across browser sessions
 */

import type { AptosWalletType } from "./multi-wallet";

export interface WalletConnectionState {
  walletType: AptosWalletType | "mobile-petra";
  address: string;
  publicKey: string;
  connectedAt: number;
  lastActiveAt: number;
  network?: string;
}

const STORAGE_KEY = "aptos_wallet_connection_state";
const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Save wallet connection state
 */
export function saveWalletConnection(
  state: Omit<WalletConnectionState, "connectedAt" | "lastActiveAt">
): void {
  if (typeof window === "undefined") return;

  const fullState: WalletConnectionState = {
    ...state,
    connectedAt: Date.now(),
    lastActiveAt: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
  } catch (error) {
    console.error("Failed to save wallet connection state:", error);
  }
}

/**
 * Load wallet connection state
 */
export function loadWalletConnection(): WalletConnectionState | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const state: WalletConnectionState = JSON.parse(stored);

    // Check if session has expired
    const now = Date.now();
    if (now - state.lastActiveAt > SESSION_TIMEOUT) {
      clearWalletConnection();
      return null;
    }

    return state;
  } catch (error) {
    console.error("Failed to load wallet connection state:", error);
    return null;
  }
}

/**
 * Update last active timestamp
 */
export function updateLastActive(): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const state: WalletConnectionState = JSON.parse(stored);
    state.lastActiveAt = Date.now();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to update last active timestamp:", error);
  }
}

/**
 * Clear wallet connection state
 */
export function clearWalletConnection(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear wallet connection state:", error);
  }
}

/**
 * Check if there's a valid saved connection
 */
export function hasSavedConnection(): boolean {
  return loadWalletConnection() !== null;
}

/**
 * Get saved wallet type
 */
export function getSavedWalletType(): AptosWalletType | "mobile-petra" | null {
  const state = loadWalletConnection();
  return state?.walletType || null;
}

/**
 * Get saved wallet address
 */
export function getSavedWalletAddress(): string | null {
  const state = loadWalletConnection();
  return state?.address || null;
}

/**
 * Update wallet network
 */
export function updateWalletNetwork(network: string): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const state: WalletConnectionState = JSON.parse(stored);
    state.network = network;
    state.lastActiveAt = Date.now();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to update wallet network:", error);
  }
}

/**
 * React hook for wallet persistence
 */
export function useWalletPersistence() {
  if (typeof window === "undefined") {
    return {
      saveConnection: () => {},
      loadConnection: () => null,
      clearConnection: () => {},
      updateActivity: () => {},
      hasSaved: false,
      savedWalletType: null,
      savedAddress: null,
    };
  }

  const saveConnection = (state: Omit<WalletConnectionState, "connectedAt" | "lastActiveAt">) => {
    saveWalletConnection(state);
  };

  const loadConnection = () => {
    return loadWalletConnection();
  };

  const clearConnection = () => {
    clearWalletConnection();
  };

  const updateActivity = () => {
    updateLastActive();
  };

  return {
    saveConnection,
    loadConnection,
    clearConnection,
    updateActivity,
    hasSaved: hasSavedConnection(),
    savedWalletType: getSavedWalletType(),
    savedAddress: getSavedWalletAddress(),
  };
}

/**
 * Auto-reconnect helper
 */
export async function attemptAutoReconnect(
  connectFunction: (walletType: any) => Promise<any>
): Promise<{ success: boolean; walletType?: AptosWalletType | "mobile-petra"; error?: string }> {
  const savedState = loadWalletConnection();

  if (!savedState) {
    return { success: false, error: "No saved connection" };
  }

  try {
    await connectFunction(savedState.walletType);
    updateLastActive();
    return { success: true, walletType: savedState.walletType };
  } catch (error) {
    clearWalletConnection();
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reconnect",
    };
  }
}
