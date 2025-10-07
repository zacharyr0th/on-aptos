/**
 * Petra Wallet Integration Library
 * Complete utilities for integrating Petra wallet in web and mobile apps
 */

// Deep linking for mobile
export {
  generateKeyPair,
  saveKeyPair,
  loadKeyPair,
  saveSharedKey,
  loadSharedKey,
  clearStoredKeys,
  createConnectLink,
  createDisconnectLink,
  createSignTransactionLink,
  createSignMessageLink,
  handleConnectionApproval,
  parseDeepLinkResponse,
  isMobileDevice,
  openPetraDeepLink,
  APP_INFO,
  type KeyPair,
  type ConnectionData,
  type SignTransactionData,
  type SignMessageData,
  type PetraConnectionResponse,
} from "./petra-deeplink";

// Event listeners
export {
  setupPetraEventListeners,
  usePetraEventListeners,
  Network,
  type PetraWindow,
  type SignMessagePayload,
  type SignMessageResponse,
  type PetraEventListeners,
} from "./petra-events";

// Error handling
export {
  PetraErrorCode,
  isPetraError,
  getPetraErrorMessage,
  handlePetraError,
  PetraWalletError,
  type PetraError,
} from "./petra-errors";

// Transactions
export {
  signAndSubmitTransaction,
  signTransaction,
  createCoinTransferTransaction,
  waitForTransaction,
  type EntryFunctionPayload,
  type PendingTransaction,
} from "./petra-transactions";

// Message signing
export {
  signMessage,
  verifySignedMessage,
  createSignMessagePayload,
  verifyWalletOwnership,
} from "./petra-signing";

// React hook for mobile deep linking
export {
  usePetraMobileWallet,
  type PetraMobileWallet,
} from "@/components/wallet/PetraMobileConnect";

// Multi-wallet support
export {
  AptosWalletType,
  APTOS_WALLETS,
  detectAvailableWallets,
  getWalletProvider,
  isWalletInstalled,
  getPreferredWallet,
  setPreferredWallet,
  clearPreferredWallet,
  connectToWallet,
  disconnectWallet,
  getAccount,
  isWalletConnected,
  type WalletInfo,
} from "./multi-wallet";

// Wallet persistence
export {
  saveWalletConnection,
  loadWalletConnection,
  updateLastActive,
  clearWalletConnection,
  hasSavedConnection,
  getSavedWalletType,
  getSavedWalletAddress,
  updateWalletNetwork,
  useWalletPersistence,
  attemptAutoReconnect,
  type WalletConnectionState,
} from "./wallet-persistence";

// Error toast UI
export {
  WalletErrorToast,
  type ToastMessage,
  type ToastType,
} from "@/components/wallet/WalletErrorToast";
export { useWalletToast } from "@/components/wallet/useWalletToast";
