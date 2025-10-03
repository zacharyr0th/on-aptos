/**
 * Petra Wallet Event Listeners
 * Handles account changes, network changes, and disconnection events
 */

export enum Network {
  Testnet = 'Testnet',
  Mainnet = 'Mainnet',
  Devnet = 'Devnet',
}

export interface PetraWindow extends Window {
  aptos?: {
    connect: () => Promise<{ address: string; publicKey: string }>;
    disconnect: () => Promise<void>;
    account: () => Promise<{ address: string; publicKey: string }>;
    network: () => Promise<Network>;
    isConnected: () => Promise<boolean>;
    signAndSubmitTransaction: (transaction: any) => Promise<any>;
    signTransaction: (transaction: any) => Promise<any>;
    signMessage: (payload: SignMessagePayload) => Promise<SignMessageResponse>;
    onAccountChange: (callback: (newAccount: { address: string; publicKey: string } | null) => void) => void;
    onNetworkChange: (callback: (newNetwork: Network) => void) => void;
    onDisconnect: (callback: () => void) => void;
  };
}

export interface SignMessagePayload {
  address?: boolean;
  application?: boolean;
  chainId?: boolean;
  message: string;
  nonce: string;
}

export interface SignMessageResponse {
  address: string;
  application: string;
  chainId: number;
  fullMessage: string;
  message: string;
  nonce: string;
  prefix: string;
  signature: string;
}

export interface PetraEventListeners {
  onAccountChange: (callback: (newAccount: { address: string; publicKey: string } | null) => void) => void;
  onNetworkChange: (callback: (newNetwork: Network) => void) => void;
  onDisconnect: (callback: () => void) => void;
  getCurrentNetwork: () => Promise<Network>;
  getCurrentAccount: () => Promise<{ address: string; publicKey: string } | null>;
  isConnected: () => Promise<boolean>;
}

/**
 * Setup event listeners for Petra wallet
 */
export function setupPetraEventListeners(): PetraEventListeners | null {
  if (typeof window === 'undefined') return null;

  const petraWindow = window as PetraWindow;

  if (!petraWindow.aptos) {
    console.warn('Petra wallet not detected');
    return null;
  }

  return {
    onAccountChange: (callback) => {
      petraWindow.aptos?.onAccountChange(callback);
    },
    onNetworkChange: (callback) => {
      petraWindow.aptos?.onNetworkChange(callback);
    },
    onDisconnect: (callback) => {
      petraWindow.aptos?.onDisconnect(callback);
    },
    getCurrentNetwork: async () => {
      if (!petraWindow.aptos) throw new Error('Petra wallet not detected');
      return await petraWindow.aptos.network();
    },
    getCurrentAccount: async () => {
      if (!petraWindow.aptos) return null;
      try {
        return await petraWindow.aptos.account();
      } catch {
        return null;
      }
    },
    isConnected: async () => {
      if (!petraWindow.aptos) return false;
      return await petraWindow.aptos.isConnected();
    },
  };
}

/**
 * React hook for Petra event listeners
 */
export function usePetraEventListeners(
  onAccountChange?: (newAccount: { address: string; publicKey: string } | null) => void,
  onNetworkChange?: (newNetwork: Network) => void,
  onDisconnect?: () => void
) {
  if (typeof window === 'undefined') return;

  const petraWindow = window as PetraWindow;

  if (!petraWindow.aptos) return;

  if (onAccountChange) {
    petraWindow.aptos.onAccountChange(onAccountChange);
  }

  if (onNetworkChange) {
    petraWindow.aptos.onNetworkChange(onNetworkChange);
  }

  if (onDisconnect) {
    petraWindow.aptos.onDisconnect(onDisconnect);
  }
}
