/**
 * Complete Wallet Integration Example
 * Shows how to use all the new features together
 */

import { useEffect, useState } from 'react';
import {
  // Multi-wallet support
  AptosWalletType,
  detectAvailableWallets,
  connectToWallet,
  disconnectWallet,

  // Persistence
  useWalletPersistence,
  attemptAutoReconnect,
  saveWalletConnection,

  // Mobile deep linking
  usePetraMobileWallet,
  isMobileDevice,

  // Transactions
  signAndSubmitTransaction,
  createCoinTransferTransaction,

  // Error handling
  useWalletToast,
  handlePetraError,

  // Event listeners
  setupPetraEventListeners,
} from '@/lib/utils/wallet';

export function CompleteWalletExample() {
  const [walletType, setWalletType] = useState<AptosWalletType | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<AptosWalletType[]>([]);

  // Hooks
  const { showError, showSuccess, showInfo, ToastComponent } = useWalletToast();
  const persistence = useWalletPersistence();
  const petraMobile = usePetraMobileWallet();

  // Detect available wallets on mount
  useEffect(() => {
    if (!isMobileDevice()) {
      const wallets = detectAvailableWallets();
      setAvailableWallets(wallets);
    }
  }, []);

  // Auto-reconnect on mount
  useEffect(() => {
    const autoConnect = async () => {
      if (persistence.hasSaved && persistence.savedWalletType) {
        showInfo('Reconnecting...', 'Attempting to reconnect to your wallet');

        if (persistence.savedWalletType === 'mobile-petra') {
          // Mobile Petra auto-reconnect
          if (petraMobile.isConnected) {
            setWalletType('mobile-petra' as any);
            setAddress(petraMobile.address);
            setIsConnected(true);
            showSuccess('Reconnected!', 'Your wallet has been reconnected');
          }
        } else {
          // Desktop wallet auto-reconnect
          const result = await attemptAutoReconnect(async (type) => {
            return await connectToWallet(type);
          });

          if (result.success && result.walletType) {
            setWalletType(result.walletType as AptosWalletType);
            setAddress(persistence.savedAddress);
            setIsConnected(true);
            showSuccess('Reconnected!', 'Your wallet has been reconnected');
          } else {
            showError(result.error, 'Reconnection Failed');
          }
        }
      }
    };

    autoConnect();
  }, []);

  // Setup event listeners for desktop wallets
  useEffect(() => {
    if (!isMobileDevice() && isConnected && walletType) {
      const listeners = setupPetraEventListeners();

      if (listeners) {
        listeners.onAccountChange((account) => {
          if (account) {
            setAddress(account.address);
            showInfo('Account Changed', `Switched to ${account.address.slice(0, 10)}...`);
          }
        });

        listeners.onNetworkChange((network) => {
          showInfo('Network Changed', `Switched to ${network}`);
        });

        listeners.onDisconnect(() => {
          handleDisconnect();
          showInfo('Disconnected', 'Your wallet has been disconnected');
        });
      }
    }
  }, [isConnected, walletType]);

  // Setup mobile wallet callbacks
  useEffect(() => {
    if (petraMobile.onTransactionResult) {
      petraMobile.onTransactionResult((result) => {
        if (result.approved) {
          showSuccess('Transaction Approved!', 'Your transaction was signed successfully');
        } else {
          showError('Transaction Rejected', 'You rejected the transaction');
        }
      });
    }
  }, [petraMobile]);

  const handleConnect = async (selectedWalletType: AptosWalletType) => {
    try {
      const result = await connectToWallet(selectedWalletType);
      setWalletType(selectedWalletType);
      setAddress(result.address);
      setIsConnected(true);

      // Save connection state
      saveWalletConnection({
        walletType: selectedWalletType,
        address: result.address,
        publicKey: result.publicKey,
      });

      showSuccess('Connected!', `Connected to ${selectedWalletType}`);
    } catch (error) {
      showError(error, 'Connection Failed');
    }
  };

  const handleMobileConnect = () => {
    try {
      petraMobile.connect();
      showInfo('Opening Petra...', 'Approve the connection in Petra app');
    } catch (error) {
      showError(error, 'Connection Failed');
    }
  };

  const handleDisconnect = async () => {
    try {
      if (walletType && walletType !== 'mobile-petra' as any) {
        await disconnectWallet(walletType);
      } else {
        petraMobile.disconnect();
      }

      setWalletType(null);
      setAddress(null);
      setIsConnected(false);
      persistence.clearConnection();

      showSuccess('Disconnected', 'Your wallet has been disconnected');
    } catch (error) {
      showError(error, 'Disconnection Failed');
    }
  };

  const handleSendAPT = async () => {
    try {
      const recipient = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const amount = 10000000; // 0.1 APT

      if (isMobileDevice() && petraMobile.isConnected) {
        // Mobile transaction
        const tx = createCoinTransferTransaction(recipient, amount);
        await petraMobile.signAndSubmitTransaction(tx);
        showInfo('Transaction Sent', 'Waiting for approval in Petra app...');
      } else {
        // Desktop transaction
        const tx = createCoinTransferTransaction(recipient, amount);
        const pending = await signAndSubmitTransaction(tx);
        showSuccess('Transaction Submitted!', `Hash: ${pending.hash.slice(0, 10)}...`);
      }
    } catch (error) {
      showError(error, 'Transaction Failed');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Complete Wallet Integration</h2>

      {/* Connection Status */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-2">Connection Status</h3>
        <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
        {walletType && <p>Wallet: {walletType}</p>}
        {address && <p>Address: {address.slice(0, 10)}...{address.slice(-4)}</p>}
      </div>

      {/* Connect Buttons */}
      {!isConnected && (
        <div className="space-y-2">
          <h3 className="font-semibold">Connect Wallet</h3>

          {isMobileDevice() ? (
            <button
              onClick={handleMobileConnect}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Connect Petra Mobile
            </button>
          ) : (
            <div className="space-y-2">
              {availableWallets.map((wallet) => (
                <button
                  key={wallet}
                  onClick={() => handleConnect(wallet)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
                >
                  Connect {wallet}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isConnected && (
        <div className="space-y-2">
          <h3 className="font-semibold">Actions</h3>
          <button
            onClick={handleSendAPT}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
          >
            Send 0.1 APT
          </button>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Toast Component */}
      <ToastComponent />
    </div>
  );
}
