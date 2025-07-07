'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { ReactNode } from 'react';

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      dappConfig={{
        network: Network.MAINNET,
        aptosConnectDappId: 'your-dapp-id',
      }}
      optInWallets={['Petra', 'Nightly', 'Pontem Wallet', 'Martian Wallet', 'Rise Wallet', 'Fewcha', 'Spika', 'Bitkeep', 'TokenPocket', 'Blocto', 'SafePal', 'FoxWallet', 'Coin98', 'OKX Wallet', 'Bitget Wallet', 'Razor Wallet', 'Trustwallet', 'MSafe']}
      onError={error => {
        // Silently handle wallet connection errors in development
        if (process.env.NODE_ENV === 'development') {
          // Only log significant errors, not connection attempts
          if (!error.message?.includes('Could not establish connection')) {
            console.warn('Wallet error:', error);
          }
        }
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
