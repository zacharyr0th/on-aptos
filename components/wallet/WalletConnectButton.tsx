'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect, useMemo } from 'react';
import { Wallet, LogOut, Copy, Check, Chrome, Apple, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
interface WalletConnectButtonProps {
  size?: 'sm' | 'default' | 'lg';
}

export function WalletConnectButton({
  size = 'sm',
}: WalletConnectButtonProps = {}) {
  const { connect, account, connected, disconnect, wallets, isLoading } =
    useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [primaryName, setPrimaryName] = useState<string | null>(null);
  const [primaryNameLoading, setPrimaryNameLoading] = useState(false);

  const walletAddress = account?.address?.toString();

  // Fetch primary ANS name for the connected wallet
  useEffect(() => {
    if (!walletAddress || !connected) {
      setPrimaryName(null);
      return;
    }

    const fetchAnsName = async () => {
      setPrimaryNameLoading(true);
      try {
        const response = await fetch(`/api/wallet/ans?address=${encodeURIComponent(walletAddress)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setPrimaryName(data.data.name);
          } else {
            setPrimaryName(null);
          }
        }
      } catch (error) {
        console.error('Error fetching ANS name:', error);
        setPrimaryName(null);
      } finally {
        setPrimaryNameLoading(false);
      }
    };

    fetchAnsName();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnsName, 300000);
    
    return () => clearInterval(interval);
  }, [walletAddress, connected]);

  // Ensure we only render wallet options on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Categorize wallets and check device type
  const {
    extensionWallets,
    aptosConnectAvailable,
    isMobile,
    aptosConnectWallet,
  } = useMemo(() => {
    if (!isClient)
      return {
        extensionWallets: [],
        aptosConnectAvailable: false,
        isMobile: false,
      };

    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768;

    // Filter wallets appropriately
    const extensionWallets =
      wallets?.filter(wallet => {
        // Don't show Aptos Connect in the extension wallets list
        if (wallet.name === 'Aptos Connect') return false;

        // Filter based on actual availability
        return wallet.readyState === 'Installed';
      }) || [];

    // Check if Aptos Connect is available
    const aptosConnectWallet = wallets?.find(w => w.name === 'Aptos Connect');
    const aptosConnectAvailable = !!aptosConnectWallet;

    return {
      extensionWallets,
      aptosConnectAvailable,
      isMobile: isMobileDevice,
      aptosConnectWallet,
    };
  }, [wallets, isClient]);

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getDisplayName = () => {
    if (primaryNameLoading) return 'Loading...';
    if (primaryName) return primaryName;
    return truncateAddress(walletAddress || '');
  };

  const copyAddress = async () => {
    if (!account?.address) return;
    await navigator.clipboard.writeText(account.address.toString());
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Handle Aptos Connect (Google/Apple login)
  const handleAptosConnect = async () => {
    setConnectingWallet('Aptos Connect');
    try {
      // Try to connect with Aptos Connect
      await connect('Aptos Connect' as any);
      setShowWalletModal(false);
    } catch (error) {
      console.warn('Failed to connect with Aptos Connect:', error);
    } finally {
      setTimeout(() => setConnectingWallet(null), 500);
    }
  };

  const handleWalletSelect = async (walletName: string) => {
    // Debounce clicks - prevent spam clicking
    const now = Date.now();
    if (now - lastClickTime < 1000) {
      return;
    }
    setLastClickTime(now);

    // Set loading state immediately for visual feedback
    setConnectingWallet(walletName);

    try {
      await connect(walletName as any);
      setShowWalletModal(false);
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.toString() || 'Unknown connection error';

      // Only log if there's actually an error message to avoid empty error logs
      if (
        errorMessage &&
        errorMessage.trim() &&
        errorMessage !== 'Unknown connection error'
      ) {
        console.warn(`Failed to connect to ${walletName}:`, errorMessage);
      }
    } finally {
      // Clear loading state after a short delay
      setTimeout(() => setConnectingWallet(null), 500);
    }
  };

  if (!connected) {
    return (
      <>
        <Button
          variant="default"
          size={size}
          onClick={() => setShowWalletModal(true)}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-2',
            size === 'lg' && 'text-lg px-8 py-6'
          )}
          aria-label="Connect your wallet to access portfolio features"
        >
          <Wallet className={cn('h-4 w-4', size === 'lg' && 'h-6 w-6')} />
          Connect Wallet
        </Button>

        <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto">
            <DialogTitle>Connect Wallet</DialogTitle>
            <div className="grid gap-3 py-4">
              {/* Extension Wallets */}
              {isClient &&
                extensionWallets.map(wallet => (
                  <Button
                    key={wallet.name}
                    variant="outline"
                    className="justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-3 px-3 sm:px-4"
                    onClick={() => handleWalletSelect(wallet.name)}
                    disabled={connectingWallet === wallet.name || isLoading}
                    aria-label={`Connect with ${wallet.name} wallet`}
                  >
                    {connectingWallet === wallet.name ? (
                      <div className="h-8 w-8 flex items-center justify-center">
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <Image
                        src={wallet.icon}
                        alt={`${wallet.name} icon`}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded"
                        onError={e => {
                          const img = e.target as HTMLImageElement;
                          img.src = '/placeholder.jpg';
                        }}
                      />
                    )}
                    <div className="flex-1 text-left">
                      <span className="font-medium">
                        {connectingWallet === wallet.name
                          ? 'Connecting...'
                          : wallet.name.includes('Continue with Google')
                            ? 'Google'
                            : wallet.name.includes('Continue with Apple')
                              ? 'Apple'
                              : wallet.name}
                      </span>
                    </div>
                  </Button>
                ))}

              {/* Help text for users without wallets */}
              {isClient && extensionWallets.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    No wallet extensions detected. Use Google or Apple sign-in
                    above, or install a wallet extension.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://petra.app', '_blank')}
                    >
                      Install Petra Wallet
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open('https://www.okx.com/web3', '_blank')
                      }
                    >
                      Install OKX Wallet
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className="flex items-center gap-2"
          aria-label="Wallet options and account settings"
        >
          <Wallet className="h-4 w-4" />
          {getDisplayName()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {primaryName && (
          <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-default">
            <span className="font-medium text-primary">{primaryName}</span>
            <span className="text-xs text-muted-foreground">ANS Name</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={copyAddress}
          className="flex items-center justify-between cursor-pointer"
          aria-label="Copy wallet address to clipboard"
        >
          <div className="flex flex-col items-start">
            <span className="font-mono text-sm">
              {truncateAddress(account?.address?.toString() || '')}
            </span>
            <span className="text-xs text-muted-foreground">Copy address</span>
          </div>
          {copiedAddress ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Add link to Aptos Connect for users who connected via Google/Apple */}
        {connected &&
          wallets?.find(w => w.name === 'Aptos Connect')?.readyState ===
            'Installed' && (
            <>
              <DropdownMenuItem
                onClick={() =>
                  window.open('https://aptosconnect.app', '_blank')
                }
                className="flex items-center gap-2 cursor-pointer"
                aria-label="Open Aptos Connect wallet"
              >
                <Wallet className="h-4 w-4" />
                View Wallet
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
        <DropdownMenuItem
          onClick={() => disconnect()}
          className="flex items-center gap-2 cursor-pointer text-destructive"
          aria-label="Disconnect wallet from application"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
