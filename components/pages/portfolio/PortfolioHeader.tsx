'use client';

import { Copy } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils/format';
import { copyToClipboard } from './utils';
import { AptPriceDisplay } from './AptPriceDisplay';

interface PortfolioHeaderProps {
  totalValue: number;
  walletAddress: string | undefined;
  accountNames: string[] | null;
}

export const PortfolioHeader = ({
  totalValue,
  walletAddress,
  accountNames,
}: PortfolioHeaderProps) => {
  return (
    <div className="flex items-center bg-card border rounded-lg py-3 px-4 mb-6">
      <div className="flex-grow">
        <h2 className="text-base sm:text-lg font-medium text-card-foreground">
          Portfolio Value
        </h2>
        <p className="text-xl sm:text-2xl font-bold text-card-foreground font-mono">
          {formatCurrency(totalValue)}
          {walletAddress && (
            <span className="text-base font-normal text-muted-foreground ml-2 font-mono">
              <button
                onClick={() =>
                  copyToClipboard(walletAddress, 'Account address')
                }
                className="hover:text-muted-foreground transition-all duration-200 flex items-center gap-1 group relative overflow-hidden"
              >
                <span className="font-mono transition-all duration-200 group-hover:opacity-0 group-hover:absolute">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
                <span className="font-mono transition-all duration-200 opacity-0 group-hover:opacity-100 absolute group-hover:relative whitespace-nowrap">
                  {walletAddress}
                </span>
                <Copy className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0" />
              </button>
              {accountNames && accountNames.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-xs text-primary ml-1">
                        <span>{accountNames.length} ANS</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs">
                        <p className="font-medium mb-1">
                          ANS Names ({accountNames.length}):
                        </p>
                        <div className="space-y-1">
                          {accountNames.slice(0, 5).map((name, index) => (
                            <p key={index} className="text-xs font-mono">
                              {name}
                            </p>
                          ))}
                          {accountNames.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              ...and {accountNames.length - 5} more
                            </p>
                          )}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </span>
          )}
        </p>
      </div>
      <AptPriceDisplay />
    </div>
  );
};
