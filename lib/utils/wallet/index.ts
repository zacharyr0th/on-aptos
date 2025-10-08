/**
 * Petra Wallet Integration Library
 * Complete utilities for integrating Petra wallet in web and mobile apps
 */

// React hook for mobile deep linking
export {
  type PetraMobileWallet,
  usePetraMobileWallet,
} from "@/components/wallet/PetraMobileConnect";
export { useWalletToast } from "@/components/wallet/useWalletToast";
// Error toast UI
export {
  type ToastMessage,
  type ToastType,
  WalletErrorToast,
} from "@/components/wallet/WalletErrorToast";
// Multi-wallet support
export {
  APTOS_WALLETS,
  AptosWalletType,
  clearPreferredWallet,
  connectToWallet,
  detectAvailableWallets,
  disconnectWallet,
  getAccount,
  getPreferredWallet,
  getWalletProvider,
  isWalletConnected,
  isWalletInstalled,
  setPreferredWallet,
  type WalletInfo,
} from "./multi-wallet";
// Deep linking for mobile
export {
  APP_INFO,
  type ConnectionData,
  clearStoredKeys,
  createConnectLink,
  createDisconnectLink,
  createSignMessageLink,
  createSignTransactionLink,
  generateKeyPair,
  handleConnectionApproval,
  isMobileDevice,
  type KeyPair,
  loadKeyPair,
  loadSharedKey,
  openPetraDeepLink,
  type PetraConnectionResponse,
  parseDeepLinkResponse,
  type SignMessageData,
  type SignTransactionData,
  saveKeyPair,
  saveSharedKey,
} from "./petra-deeplink";
// Error handling
export {
  getPetraErrorMessage,
  handlePetraError,
  isPetraError,
  type PetraError,
  PetraErrorCode,
  PetraWalletError,
} from "./petra-errors";
// Event listeners
export {
  Network,
  type PetraEventListeners,
  type PetraWindow,
  type SignMessagePayload,
  type SignMessageResponse,
  setupPetraEventListeners,
  usePetraEventListeners,
} from "./petra-events";
// Message signing
export {
  createSignMessagePayload,
  signMessage,
  verifySignedMessage,
  verifyWalletOwnership,
} from "./petra-signing";
// Transactions
export {
  createCoinTransferTransaction,
  type EntryFunctionPayload,
  type PendingTransaction,
  signAndSubmitTransaction,
  signTransaction,
  waitForTransaction,
} from "./petra-transactions";
// Wallet persistence
export {
  attemptAutoReconnect,
  clearWalletConnection,
  getSavedWalletAddress,
  getSavedWalletType,
  hasSavedConnection,
  loadWalletConnection,
  saveWalletConnection,
  updateLastActive,
  updateWalletNetwork,
  useWalletPersistence,
  type WalletConnectionState,
} from "./wallet-persistence";
