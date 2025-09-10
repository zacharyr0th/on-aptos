"use client";

import { Copy, ExternalLink } from "lucide-react";
import React, { memo, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { createCopyHandler, getExplorerUrl, truncateAddress } from "./utils";

export interface AddressDisplayProps {
  addresses: string | string[];
  labels?: string[];
  onCopy?: (address: string, label?: string) => void;
  showExplorerLinks?: boolean;
  truncate?: boolean;
  showCopyButton?: boolean;
  className?: string;
  network?: string;
}

/**
 * Reusable address display component with copy and explorer functionality
 */
export const AddressDisplay = memo<AddressDisplayProps>(
  ({
    addresses,
    labels = [],
    onCopy,
    showExplorerLinks = true,
    truncate = false,
    showCopyButton = true,
    className = "",
    network = "mainnet",
  }) => {
    const addressArray = Array.isArray(addresses) ? addresses : [addresses];
    const defaultCopyHandler = createCopyHandler();
    const copyHandler = onCopy || defaultCopyHandler;

    const handleCopyClick = useCallback(
      (address: string, label?: string) => {
        copyHandler(address, label || "address");
      },
      [copyHandler]
    );

    const handleExplorerClick = useCallback(
      (address: string) => {
        const url = getExplorerUrl(address, network);
        window.open(url, "_blank", "noopener noreferrer");
      },
      [network]
    );

    return (
      <div className={`space-y-2 ${className}`}>
        {addressArray.map((address, index) => {
          const label = labels[index] || `Address ${index + 1}`;
          const displayAddress = truncate ? truncateAddress(address) : address;

          return (
            <div key={`addr-${index}`} className="flex items-center gap-2">
              <div className="flex-grow min-w-0">
                {labels.length > 0 && (
                  <div className="text-sm text-muted-foreground mb-1">{label}:</div>
                )}
                <code className="bg-muted px-2 py-1 rounded text-xs font-mono break-all block">
                  {displayAddress}
                </code>
              </div>

              <div className="flex gap-1 flex-shrink-0">
                {showCopyButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopyClick(address, label)}
                    title={`Copy ${label} to clipboard`}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}

                {showExplorerLinks && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleExplorerClick(address)}
                    title="View on Aptos Explorer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

AddressDisplay.displayName = "AddressDisplay";
