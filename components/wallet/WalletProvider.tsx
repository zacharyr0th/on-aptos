"use client";

import { Network } from "@aptos-labs/ts-sdk";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { ReactNode } from "react";

import { logger } from "@/lib/utils/core/logger";

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      dappConfig={{
        network: Network.MAINNET,
        aptosConnect: {
          dappName: "What's on Aptos?", // defaults to document's title
          dappImageURI: "/icons/icon-192x192.png", // defaults to dapp's favicon
          dappId: "on-aptos", // Optional: for external wallet pairing
        },
      }}
      onError={(error) => {
        // Silently handle wallet connection errors in development
        if (process.env.NODE_ENV === "development") {
          // Only log significant errors, not connection attempts
          if (!error.message?.includes("Could not establish connection")) {
            logger.warn(
              `Wallet error: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
