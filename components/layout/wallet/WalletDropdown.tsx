"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Copy, LogOut, User, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAnsName } from "@/lib/hooks/useAnsName";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { logger } from "@/lib/utils/core/logger";

interface WalletDropdownProps {
  className?: string;
}

export function WalletDropdown({ className }: WalletDropdownProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { account, disconnect } = useWallet();
  const { ansName, ansData } = useAnsName();
  const { t } = useTranslation("common");

  const walletAddress = account?.address?.toString();
  const normalizedAddress =
    walletAddress && !walletAddress.startsWith("0x")
      ? `0x${walletAddress}`
      : walletAddress;

  const handleCopyAddress = async () => {
    if (!normalizedAddress) {
      logger.warn("No address to copy");
      return;
    }

    const success = await copyToClipboard(normalizedAddress, "Address");
    if (success) {
      logger.debug(`Successfully copied address: ${normalizedAddress}`);
    } else {
      logger.warn("Failed to copy address");
    }
  };

  const handlePortfolioClick = () => {
    if (!normalizedAddress) {
      router.push("/tools/portfolio");
    }
  };

  if (!normalizedAddress) {
    return (
      <button onClick={handlePortfolioClick} className={className}>
        {pathname === "/" ? "Launch App" : "Portfolio Analytics"}
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className}>
        {ansName ||
          `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-3">
            {ansData && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{ansData.name}</p>
                    {ansData.subdomain ? (
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "wallet.subdomain_of",
                          "Subdomain of {{domain}}.apt",
                          { domain: ansData.domain },
                        )}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {t("wallet.primary_domain", "Primary domain")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t("wallet.wallet_address", "Wallet Address")}
                  </p>
                  <button
                    onClick={handleCopyAddress}
                    className="group flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded px-1 py-1 transition-colors"
                    title="Click to copy address"
                  >
                    <p className="text-xs font-mono break-all leading-relaxed flex-1">
                      {normalizedAddress}
                    </p>
                    <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {pathname !== "/tools/portfolio" && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/tools/portfolio" className="cursor-pointer">
                View Portfolio Analytics
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => disconnect()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("wallet.disconnect", "Disconnect")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
