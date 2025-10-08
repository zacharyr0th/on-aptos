"use client";

import { useCallback, useEffect, useState } from "react";
import { errorLogger } from "@/lib/utils/core/logger";
import {
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
  parseDeepLinkResponse,
  saveKeyPair,
  saveSharedKey,
} from "@/lib/utils/wallet/petra-deeplink";

export interface PetraMobileWallet {
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  signAndSubmitTransaction: (payload: any) => Promise<void>;
  signMessage: (message: string) => Promise<void>;
  address: string | null;
  publicKey: string | null;
  onTransactionResult?: (callback: (result: any) => void) => void;
}

/**
 * Hook for Petra mobile wallet deep link connection
 */
export function usePetraMobileWallet(): PetraMobileWallet {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [sharedKey, setSharedKey] = useState<Uint8Array | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [transactionCallback, setTransactionCallback] = useState<((result: any) => void) | null>(
    null
  );

  // Load stored keys on mount
  useEffect(() => {
    const storedKeyPair = loadKeyPair();
    const storedSharedKey = loadSharedKey();

    if (storedKeyPair) {
      setKeyPair(storedKeyPair);
    }

    if (storedSharedKey) {
      setSharedKey(storedSharedKey);
      setIsConnected(true);

      // Try to load stored address and public key
      const storedAddress = localStorage.getItem("petra_wallet_address");
      const storedPublicKey = localStorage.getItem("petra_wallet_public_key");

      if (storedAddress) setAddress(storedAddress);
      if (storedPublicKey) setPublicKey(storedPublicKey);
    }
  }, []);

  // Handle deep link responses via URL parameters
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleDeepLinkParams = () => {
      const params = new URLSearchParams(window.location.search);
      const action = params.get("petra_action");
      const response = params.get("petra_response");
      const data = params.get("petra_data");

      if (!action) return;

      switch (action) {
        case "connect": {
          if (response === "approved" && data && keyPair) {
            try {
              const responseData = JSON.parse(atob(data));
              const sharedEncryptionKey = handleConnectionApproval(data, keyPair.secretKey);

              saveSharedKey(sharedEncryptionKey);
              setSharedKey(sharedEncryptionKey);
              setIsConnected(true);
              setIsConnecting(false);

              // Extract and save wallet address and public key from response
              if (responseData.address) {
                setAddress(responseData.address);
                localStorage.setItem("petra_wallet_address", responseData.address);
              }

              if (responseData.publicKey) {
                setPublicKey(responseData.publicKey);
                localStorage.setItem("petra_wallet_public_key", responseData.publicKey);
              }

              // Clean up URL params
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete("petra_action");
              newUrl.searchParams.delete("petra_response");
              newUrl.searchParams.delete("petra_data");
              window.history.replaceState({}, "", newUrl);
            } catch (error) {
              errorLogger.error("Failed to handle connection approval:", error);
              setIsConnecting(false);
            }
          } else if (response === "rejected") {
            clearStoredKeys();
            setKeyPair(null);
            setSharedKey(null);
            setIsConnected(false);
            setIsConnecting(false);
            setAddress(null);
            setPublicKey(null);
            localStorage.removeItem("petra_wallet_address");
            localStorage.removeItem("petra_wallet_public_key");

            // Clean up URL params
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete("petra_action");
            newUrl.searchParams.delete("petra_response");
            window.history.replaceState({}, "", newUrl);
          }
          break;
        }

        case "disconnect": {
          clearStoredKeys();
          setKeyPair(null);
          setSharedKey(null);
          setIsConnected(false);
          setAddress(null);
          setPublicKey(null);
          localStorage.removeItem("petra_wallet_address");
          localStorage.removeItem("petra_wallet_public_key");

          // Clean up URL params
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("petra_action");
          window.history.replaceState({}, "", newUrl);
          break;
        }

        case "response": {
          // Handle transaction/message signing responses
          const result = {
            approved: response === "approved",
            data: data ? JSON.parse(atob(data)) : null,
          };

          // Call transaction callback if registered
          if (transactionCallback) {
            transactionCallback(result);
          }

          // Clean up URL params
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("petra_action");
          newUrl.searchParams.delete("petra_response");
          newUrl.searchParams.delete("petra_data");
          window.history.replaceState({}, "", newUrl);
          break;
        }
      }
    };

    // Check on mount
    handleDeepLinkParams();

    // Listen for URL changes
    const handlePopState = () => {
      handleDeepLinkParams();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [keyPair]);

  const connect = useCallback(() => {
    if (!isMobileDevice()) {
      errorLogger.error("Deep link connection is only available on mobile devices");
      return;
    }

    setIsConnecting(true);

    // Generate new key pair
    const newKeyPair = generateKeyPair();
    saveKeyPair(newKeyPair);
    setKeyPair(newKeyPair);

    // Create and open connect link
    const connectLink = createConnectLink(newKeyPair.publicKey);
    openPetraDeepLink(connectLink);
  }, []);

  const disconnect = useCallback(() => {
    if (!keyPair) return;

    // Create and open disconnect link
    const disconnectLink = createDisconnectLink(keyPair.publicKey);
    openPetraDeepLink(disconnectLink);

    // Clear local state
    clearStoredKeys();
    setKeyPair(null);
    setSharedKey(null);
    setIsConnected(false);
    setAddress(null);
  }, [keyPair]);

  const signAndSubmitTransaction = useCallback(
    async (payload: any) => {
      if (!keyPair || !sharedKey) {
        throw new Error("Not connected to Petra wallet");
      }

      if (!isMobileDevice()) {
        throw new Error("Deep link transactions are only available on mobile devices");
      }

      // Create and open transaction signing link
      const signLink = createSignTransactionLink(payload, keyPair.publicKey, sharedKey);
      openPetraDeepLink(signLink);
    },
    [keyPair, sharedKey]
  );

  const signMessage = useCallback(
    async (message: string) => {
      if (!keyPair || !sharedKey) {
        throw new Error("Not connected to Petra wallet");
      }

      if (!isMobileDevice()) {
        throw new Error("Deep link message signing is only available on mobile devices");
      }

      // Create and open message signing link
      const signLink = createSignMessageLink(message, keyPair.publicKey, sharedKey);
      openPetraDeepLink(signLink);
    },
    [keyPair, sharedKey]
  );

  const onTransactionResult = useCallback((callback: (result: any) => void) => {
    setTransactionCallback(() => callback);
  }, []);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    signAndSubmitTransaction,
    signMessage,
    address,
    publicKey,
    onTransactionResult,
  };
}
