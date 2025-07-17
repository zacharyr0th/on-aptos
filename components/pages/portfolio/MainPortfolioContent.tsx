'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PortfolioHeader } from './PortfolioHeader';
import { PortfolioTabs } from './PortfolioTabs';
import { ProtocolDetailsDialog } from './Dialogs';
import { getProtocolLogo } from './utils';

interface MainPortfolioContentProps {
  portfolioMetrics: any;
  normalizedAddress: string;
  accountNames: any;
  terminalMode: boolean;
  setTerminalMode: (mode: boolean) => void;
  children: React.ReactNode;
  selectedDeFiPosition: any;
  protocolDetailsOpen: boolean;
  setProtocolDetailsOpen: (open: boolean) => void;
}

export function MainPortfolioContent({
  portfolioMetrics,
  normalizedAddress,
  accountNames,
  terminalMode,
  setTerminalMode,
  children,
  selectedDeFiPosition,
  protocolDetailsOpen,
  setProtocolDetailsOpen,
}: MainPortfolioContentProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none z-0" />
      
      <div className="container-layout pt-6 relative">
        <Header />
      </div>
      
      <main className="container-layout py-6 flex-1 relative">
        <PortfolioHeader
          totalValue={portfolioMetrics?.totalPortfolioValue || 0}
          walletAddress={normalizedAddress}
          accountNames={accountNames || null}
          terminalMode={terminalMode}
          onTerminalToggle={() => setTerminalMode(!terminalMode)}
        />
        
        {children}
      </main>

      {/* Dialogs */}
      {selectedDeFiPosition && (
        <ProtocolDetailsDialog
          isOpen={protocolDetailsOpen}
          onClose={() => setProtocolDetailsOpen(false)}
          protocolName={selectedDeFiPosition.protocol}
          protocolLogo={getProtocolLogo(selectedDeFiPosition.protocol)}
          defiPosition={selectedDeFiPosition}
        />
      )}

      <Footer className="relative z-10" />
    </div>
  );
}