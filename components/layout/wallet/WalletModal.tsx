"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { logger } from "@/lib/utils/core/logger";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const router = useRouter();
  const { connect, wallets } = useWallet();
  const { t } = useTranslation("common");

  const handleWalletSelect = async (walletName: string) => {
    try {
      await connect(walletName as any);
      onOpenChange(false);
      router.push("/tools/portfolio");
    } catch (error: any) {
      logger.warn(
        `Failed to connect to ${walletName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const extensionWallets =
    wallets?.filter((wallet) => {
      if (wallet.name === "Aptos Connect") return false;
      return wallet.readyState === "Installed";
    }) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto fixed top-[50vh] left-[50%] translate-x-[-50%] translate-y-[-50%]">
        <DialogTitle>{t("wallet.connect", "Connect Wallet")}</DialogTitle>
        <div className="grid gap-3 py-4">
          {extensionWallets.map((wallet) => (
            <Button
              key={wallet.name}
              variant="outline"
              className="justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-3 px-3 sm:px-4"
              onClick={() => handleWalletSelect(wallet.name)}
            >
              <Image
                src={wallet.icon}
                alt={`${wallet.name} icon`}
                width={32}
                height={32}
                className="h-8 w-8 rounded"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = "/placeholder.jpg";
                }}
              />
              <div className="flex-1 text-left">
                <span className="font-medium">{wallet.name}</span>
              </div>
            </Button>
          ))}

          {extensionWallets.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                No wallet extensions detected. Please install a wallet
                extension.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://petra.app", "_blank")}
                >
                  Install Petra Wallet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open("https://www.okx.com/web3", "_blank")
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
  );
}
