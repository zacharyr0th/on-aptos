"use client";

import { Copy, ChevronDown } from "lucide-react";
import Image from "next/image";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils/format";

import { copyToClipboard } from "./utils";

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
    <div className="flex items-start py-4 px-4 mb-6">
      <div className="flex items-start gap-4 sm:gap-6 flex-wrap sm:flex-nowrap">
        <p className="text-xl sm:text-2xl font-bold text-card-foreground font-mono">
          {formatCurrency(totalValue)}
        </p>
        {walletAddress && (
          <button
            onClick={() => copyToClipboard(walletAddress, "Account address")}
            className="text-sm sm:text-base font-medium text-muted-foreground font-mono hover:text-muted-foreground/80 transition-all duration-200 inline-flex items-start gap-1 group relative overflow-hidden max-w-[200px] sm:max-w-none"
          >
            <span className="font-mono transition-all duration-200 group-hover:opacity-0 group-hover:absolute">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
            <span className="font-mono text-xs sm:text-sm transition-all duration-200 opacity-0 group-hover:opacity-100 absolute group-hover:relative break-all leading-tight max-w-[180px] sm:max-w-[300px] md:max-w-none">
              {walletAddress}
            </span>
            <Copy className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0 mt-0.5" />
          </button>
        )}
        {accountNames && accountNames.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded text-xs text-primary transition-colors">
                <span>{accountNames.length} ANS</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="p-2">
                <p className="font-medium mb-2 text-sm">
                  ANS Names ({accountNames.length})
                </p>
                {accountNames.map((name, index) => (
                  <DropdownMenuItem
                    key={index}
                    className="text-xs font-mono cursor-pointer"
                    onClick={() => copyToClipboard(name, "ANS name")}
                  >
                    {name}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Image
          src="/icons/apt.png"
          alt="APT token"
          width={16}
          height={16}
          className="w-5 h-5 opacity-50 flex-shrink-0 rounded-full dark:invert"
          priority={false}
          quality={90}
          unoptimized={false}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = "/placeholder.jpg";
          }}
        />
      </div>
    </div>
  );
};
