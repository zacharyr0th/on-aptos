"use client";

import Image from "next/image";
import React from "react";
import { convertIPFSToHTTPSync } from "@/lib/services/portfolio/nft-metadata-helper";
import { logger } from "@/lib/utils/core/logger";
import { getTokenLogoUrlWithFallbackSync } from "@/lib/utils/token/token-utils";
import { NFTMedia } from "./MediaRenderer";

interface SmartImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  placeholder?: string;
  // Token-specific props
  assetType?: string;
  metadata?: any;
  isToken?: boolean;
  // NFT-specific props
  isNFT?: boolean;
  // Error handling
  onError?: (error: Event) => void;
  fallbackBehavior?: "placeholder" | "symbol" | "none";
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  sizes,
  priority = false,
  placeholder = "/placeholder.jpg",
  assetType,
  metadata,
  isToken = false,
  isNFT = false,
  onError,
  fallbackBehavior = "placeholder",
}) => {
  const [currentSrc, setCurrentSrc] = React.useState<string>(() => {
    if (!src) return placeholder;

    // Handle NFT images - convert IPFS/Arweave to HTTP
    if (isNFT) {
      return convertIPFSToHTTPSync(src);
    }

    // Handle token images - use token logo utility
    if (isToken && assetType) {
      return getTokenLogoUrlWithFallbackSync(assetType, metadata);
    }

    return src;
  });

  const [hasError, setHasError] = React.useState(false);

  const handleError = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.currentTarget;
      setHasError(true);

      // Call custom error handler if provided
      if (onError) {
        onError(e.nativeEvent);
        return;
      }

      // Default fallback logic
      if (isToken && metadata?.symbol && !img.src.includes(".png")) {
        // Try PNG fallback for tokens
        const pngUrl = `https://raw.githubusercontent.com/PanoraExchange/Aptos-Tokens/main/logos/${metadata.symbol}.png`;
        setCurrentSrc(pngUrl);
      } else if (isNFT && img.src !== placeholder) {
        // NFT fallback to placeholder
        setCurrentSrc(placeholder);
        logger.debug(`NFT image failed to load: ${src}`);
      } else if (fallbackBehavior === "placeholder") {
        // General fallback to placeholder
        setCurrentSrc(placeholder);
      }
      // If fallbackBehavior is "none", don't change the src
    },
    [isToken, isNFT, metadata?.symbol, onError, placeholder, src, fallbackBehavior]
  );

  // Apply special styling for APT token
  const needsInvert =
    isToken && (metadata?.symbol?.toUpperCase() === "APT" || assetType?.includes("aptos_coin"));

  const finalClassName = `
    ${className}
    ${needsInvert ? "dark:invert" : ""}
    ${hasError && fallbackBehavior === "none" ? "opacity-50" : ""}
  `.trim();

  const imageProps = {
    src: currentSrc,
    alt,
    className: finalClassName,
    onError: handleError,
    sizes: sizes || (fill ? undefined : `${width || 48}px`),
    priority,
    ...(fill ? { fill: true } : { width, height }),
  };

  return <Image {...imageProps} unoptimized={isNFT} />;
};

// Specialized components for common use cases
export const TokenImage: React.FC<Omit<SmartImageProps, "isToken">> = (props) => (
  <SmartImage {...props} isToken={true} />
);

// Export NFTMedia as NFTImage for backward compatibility
export const NFTImage = NFTMedia;

// Protocol logo component
interface ProtocolImageProps extends Omit<SmartImageProps, "src" | "isToken" | "isNFT"> {
  protocol: string;
  getProtocolLogo: (protocol: string) => string;
}

export const ProtocolImage: React.FC<ProtocolImageProps> = ({
  protocol,
  getProtocolLogo,
  ...props
}) => <SmartImage {...props} src={getProtocolLogo(protocol)} alt={`${protocol} logo`} />;
