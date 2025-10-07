/**
 * Multi-Wallet Provider Support for Aptos
 * Supports Petra, Pontem, Martian, Fewcha, and other Aptos wallets
 */

export enum AptosWalletType {
  PETRA = "Petra",
  PONTEM = "Pontem",
  MARTIAN = "Martian",
  FEWCHA = "Fewcha",
  RISE = "Rise",
  MSafe = "MSafe",
  NIGHTLY = "Nightly",
  BLOCTO = "Blocto",
}

export interface WalletInfo {
  name: string;
  type: AptosWalletType;
  icon?: string;
  downloadUrl: string;
  deepLinkSupported: boolean;
  deepLinkScheme?: string;
}

export const APTOS_WALLETS: Record<AptosWalletType, WalletInfo> = {
  [AptosWalletType.PETRA]: {
    name: "Petra Wallet",
    type: AptosWalletType.PETRA,
    downloadUrl: "https://petra.app",
    deepLinkSupported: true,
    deepLinkScheme: "petra://",
  },
  [AptosWalletType.PONTEM]: {
    name: "Pontem Wallet",
    type: AptosWalletType.PONTEM,
    downloadUrl: "https://pontem.network/pontem-wallet",
    deepLinkSupported: false,
  },
  [AptosWalletType.MARTIAN]: {
    name: "Martian Wallet",
    type: AptosWalletType.MARTIAN,
    downloadUrl: "https://martianwallet.xyz",
    deepLinkSupported: false,
  },
  [AptosWalletType.FEWCHA]: {
    name: "Fewcha Wallet",
    type: AptosWalletType.FEWCHA,
    downloadUrl: "https://fewcha.app",
    deepLinkSupported: false,
  },
  [AptosWalletType.RISE]: {
    name: "Rise Wallet",
    type: AptosWalletType.RISE,
    downloadUrl: "https://risewallet.io",
    deepLinkSupported: false,
  },
  [AptosWalletType.MSafe]: {
    name: "MSafe",
    type: AptosWalletType.MSafe,
    downloadUrl: "https://msafe.io",
    deepLinkSupported: false,
  },
  [AptosWalletType.NIGHTLY]: {
    name: "Nightly",
    type: AptosWalletType.NIGHTLY,
    downloadUrl: "https://nightly.app",
    deepLinkSupported: false,
  },
  [AptosWalletType.BLOCTO]: {
    name: "Blocto",
    type: AptosWalletType.BLOCTO,
    downloadUrl: "https://blocto.io",
    deepLinkSupported: false,
  },
};

/**
 * Detect available Aptos wallets
 */
export function detectAvailableWallets(): AptosWalletType[] {
  if (typeof window === "undefined") return [];

  const available: AptosWalletType[] = [];

  // Check for Petra
  if ((window as any).aptos) {
    available.push(AptosWalletType.PETRA);
  }

  // Check for Pontem
  if ((window as any).pontem) {
    available.push(AptosWalletType.PONTEM);
  }

  // Check for Martian
  if ((window as any).martian) {
    available.push(AptosWalletType.MARTIAN);
  }

  // Check for Fewcha
  if ((window as any).fewcha) {
    available.push(AptosWalletType.FEWCHA);
  }

  // Check for Rise
  if ((window as any).rise) {
    available.push(AptosWalletType.RISE);
  }

  // Check for MSafe
  if ((window as any).msafe) {
    available.push(AptosWalletType.MSafe);
  }

  // Check for Nightly
  if ((window as any).nightly?.aptos) {
    available.push(AptosWalletType.NIGHTLY);
  }

  // Check for Blocto
  if ((window as any).blocto?.aptos) {
    available.push(AptosWalletType.BLOCTO);
  }

  return available;
}

/**
 * Get wallet provider object
 */
export function getWalletProvider(walletType: AptosWalletType): any {
  if (typeof window === "undefined") return null;

  switch (walletType) {
    case AptosWalletType.PETRA:
      return (window as any).aptos;
    case AptosWalletType.PONTEM:
      return (window as any).pontem;
    case AptosWalletType.MARTIAN:
      return (window as any).martian;
    case AptosWalletType.FEWCHA:
      return (window as any).fewcha;
    case AptosWalletType.RISE:
      return (window as any).rise;
    case AptosWalletType.MSafe:
      return (window as any).msafe;
    case AptosWalletType.NIGHTLY:
      return (window as any).nightly?.aptos;
    case AptosWalletType.BLOCTO:
      return (window as any).blocto?.aptos;
    default:
      return null;
  }
}

/**
 * Check if a wallet is installed
 */
export function isWalletInstalled(walletType: AptosWalletType): boolean {
  return getWalletProvider(walletType) !== null && getWalletProvider(walletType) !== undefined;
}

/**
 * Get preferred wallet from local storage
 */
export function getPreferredWallet(): AptosWalletType | null {
  if (typeof window === "undefined") return null;

  const preferred = localStorage.getItem("preferred_aptos_wallet");
  return preferred as AptosWalletType | null;
}

/**
 * Set preferred wallet in local storage
 */
export function setPreferredWallet(walletType: AptosWalletType): void {
  if (typeof window === "undefined") return;

  localStorage.setItem("preferred_aptos_wallet", walletType);
}

/**
 * Clear preferred wallet
 */
export function clearPreferredWallet(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem("preferred_aptos_wallet");
}

/**
 * Connect to a specific wallet
 */
export async function connectToWallet(
  walletType: AptosWalletType
): Promise<{ address: string; publicKey: string }> {
  const provider = getWalletProvider(walletType);

  if (!provider) {
    throw new Error(`${walletType} wallet is not installed`);
  }

  try {
    const result = await provider.connect();
    setPreferredWallet(walletType);
    return result;
  } catch (error) {
    throw new Error(
      `Failed to connect to ${walletType}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Disconnect from current wallet
 */
export async function disconnectWallet(walletType?: AptosWalletType): Promise<void> {
  const type = walletType || getPreferredWallet();

  if (!type) {
    throw new Error("No wallet connected");
  }

  const provider = getWalletProvider(type);

  if (!provider) {
    throw new Error(`${type} wallet is not installed`);
  }

  try {
    await provider.disconnect();
    clearPreferredWallet();
  } catch (error) {
    throw new Error(
      `Failed to disconnect from ${type}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get account info from current wallet
 */
export async function getAccount(
  walletType?: AptosWalletType
): Promise<{ address: string; publicKey: string }> {
  const type = walletType || getPreferredWallet();

  if (!type) {
    throw new Error("No wallet connected");
  }

  const provider = getWalletProvider(type);

  if (!provider) {
    throw new Error(`${type} wallet is not installed`);
  }

  try {
    return await provider.account();
  } catch (error) {
    throw new Error(
      `Failed to get account from ${type}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check if wallet is connected
 */
export async function isWalletConnected(walletType?: AptosWalletType): Promise<boolean> {
  const type = walletType || getPreferredWallet();

  if (!type) {
    return false;
  }

  const provider = getWalletProvider(type);

  if (!provider) {
    return false;
  }

  try {
    return await provider.isConnected();
  } catch {
    return false;
  }
}
