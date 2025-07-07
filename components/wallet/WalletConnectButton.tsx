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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';
import {
  Wallet,
  LogOut,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { MobileWalletConnect } from './MobileWalletConnect';
import { trpc } from '@/lib/trpc/client';

export function WalletConnectButton() {
  const { connect, account, connected, disconnect, wallets, isLoading } =
    useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const walletAddress = account?.address?.toString();

  // Fetch primary ANS name for the connected wallet
  const { data: primaryName, isLoading: primaryNameLoading } = trpc.domains.blockchain.portfolio.getPrimaryName.useQuery(
    { walletAddress: walletAddress || '' },
    { 
      enabled: !!walletAddress && connected,
      refetchInterval: 300000, // 5 minutes - ANS names don't change often
      staleTime: 180000, // 3 minutes
    }
  );

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const connectToPetraDeepLink = () => {
    const currentUrl = window.location.origin;
    const petraDeepLink = `https://petra.app/explore?link=${encodeURIComponent(currentUrl)}`;
    window.location.href = petraDeepLink;
  };

  const connectToNightlyDeepLink = () => {
    const currentUrl = window.location.origin;
    const nightlyDeepLink = `https://nightly.app/connect?url=${encodeURIComponent(currentUrl)}`;
    window.location.href = nightlyDeepLink;
  };

  const handleWalletSelect = async (walletName: string) => {
    try {
      // For mobile devices and specific wallets, try deep link first
      if (isMobile && walletName.toLowerCase().includes('petra')) {
        connectToPetraDeepLink();
        return;
      }
      
      if (isMobile && walletName.toLowerCase().includes('nightly')) {
        connectToNightlyDeepLink();
        return;
      }

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

      // If regular connection fails on mobile, try deep links
      if (isMobile && walletName.toLowerCase().includes('petra')) {
        connectToPetraDeepLink();
      }
      
      if (isMobile && walletName.toLowerCase().includes('nightly')) {
        connectToNightlyDeepLink();
      }
    }
  };

  if (!connected) {
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowWalletModal(true)}
              disabled={isLoading}
              className="flex items-center gap-2"
              aria-label="Connect your wallet to access portfolio features"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Connect your wallet to access portfolio features</p>
          </TooltipContent>
        </Tooltip>

        <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
          <DialogContent className="sm:max-w-md">
            <DialogTitle>Connect Wallet</DialogTitle>
            <div className="grid gap-3 py-4">

              {/* Mobile Wallet Options */}
              {isMobile && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start gap-3 h-auto py-3 border-primary/50"
                        onClick={connectToPetraDeepLink}
                        aria-label="Open Petra mobile app to connect wallet"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">P</span>
                        </div>
                        <div className="flex-1 text-left">
                          <span className="font-medium">Petra Mobile App</span>
                          <div className="text-xs text-muted-foreground">
                            Open in Petra app
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Opens Petra mobile app for wallet connection</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start gap-3 h-auto py-3 border-primary/50"
                        onClick={connectToNightlyDeepLink}
                        aria-label="Open Nightly mobile app to connect wallet"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">N</span>
                        </div>
                        <div className="flex-1 text-left">
                          <span className="font-medium">Nightly Mobile App</span>
                          <div className="text-xs text-muted-foreground">
                            Open in Nightly app
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Opens Nightly mobile app for wallet connection</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}

              {/* Available Wallets */}
              {wallets?.map(wallet => (
                <Tooltip key={wallet.name}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start gap-3 h-auto py-3"
                      onClick={() => handleWalletSelect(wallet.name)}
                      aria-label={`Connect with ${wallet.name} wallet`}
                    >
                      <Image
                        src={wallet.icon}
                        alt={`${wallet.name} icon`}
                        width={32}
                        height={32}
                        className="h-8 w-8"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = '/placeholder.jpg';
                        }}
                      />
                      <span className="font-medium">{wallet.name}</span>
                      {isMobile && (wallet.name.toLowerCase().includes('petra') || wallet.name.toLowerCase().includes('nightly')) && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          Extension
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Connect with {wallet.name} wallet</p>
                  </TooltipContent>
                </Tooltip>
              ))}

              {/* Add download links for mobile users */}
              {isMobile && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground text-center mb-2">
                    Don't have a wallet yet?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open('https://petra.app/download', '_blank')
                      }
                    >
                      <Smartphone className="h-4 w-4 mr-1" />
                      Petra
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open('https://nightly.app/download', '_blank')
                      }
                    >
                      <Smartphone className="h-4 w-4 mr-1" />
                      Nightly
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
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              aria-label="Wallet options and account settings"
            >
              <Wallet className="h-4 w-4" />
              {getDisplayName()}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Wallet options and account settings</p>
        </TooltipContent>
      </Tooltip>
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
