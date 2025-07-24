'use client';

import { Smartphone, ExternalLink } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileWalletConnectProps {
  className?: string;
}

export function MobileWalletConnect({ className }: MobileWalletConnectProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  useEffect(() => {
    // Detect if user is on mobile device
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

  const connectToPetra = useCallback(() => {
    setIsConnecting('petra');

    // Add slight delay for visual feedback
    setTimeout(() => {
      const currentUrl = window.location.origin;
      const petraDeepLink = `https://petra.app/explore?link=${encodeURIComponent(currentUrl)}`;

      if (isMobile) {
        // On mobile, try to open the deep link directly
        window.location.href = petraDeepLink;
      } else {
        // On desktop, open in new tab
        window.open(petraDeepLink, '_blank');
      }

      // Reset connecting state after delay
      setTimeout(() => setIsConnecting(null), 2000);
    }, 150);
  }, [isMobile]);

  const connectToAptosConnect = useCallback(() => {
    // For Aptos Connect (Google/Apple), we'll redirect to a specific page
    // that prompts users to use wallet adapter or download Petra
    const currentUrl = window.location.origin;
    const connectUrl = `${currentUrl}/connect`;

    if (isMobile) {
      window.location.href = connectUrl;
    } else {
      window.open(connectUrl, '_blank');
    }
  }, [isMobile]);

  if (!isMobile) {
    return null; // Only show on mobile devices
  }

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
          <Smartphone className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-xl">Connect Your Wallet</CardTitle>
        <CardDescription>
          Choose your preferred wallet to connect to On Aptos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={connectToPetra}
          className="w-full flex items-center justify-between"
          variant="outline"
          disabled={isConnecting === 'petra'}
        >
          <div className="flex items-center gap-3">
            {isConnecting === 'petra' ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
            )}
            <div className="text-left">
              <div className="font-medium">
                {isConnecting === 'petra' ? 'Opening Petra...' : 'Petra Wallet'}
              </div>
              <div className="text-sm text-muted-foreground">
                Mobile & Extension
              </div>
            </div>
          </div>
          <ExternalLink className="h-4 w-4" />
        </Button>

        <Button
          onClick={connectToAptosConnect}
          className="w-full flex items-center justify-between"
          variant="outline"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div className="text-left">
              <div className="font-medium">Aptos Connect</div>
              <div className="text-sm text-muted-foreground">
                Google / Apple ID
              </div>
            </div>
          </div>
          <ExternalLink className="h-4 w-4" />
        </Button>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            New to Aptos?{' '}
            <a
              href="https://petra.app/download"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Download Petra Wallet
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
