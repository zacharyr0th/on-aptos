import Image from "next/image";
import { useState, useEffect } from "react";

import { cn } from "@/lib/utils";
import {
  resolveIPFSUrl,
  extractIPFSHash,
  IPFS_GATEWAYS,
} from "@/lib/utils/ipfs-gateway-fallback";
import { logger } from "@/lib/utils/logger";

interface OptimizedNFTImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedNFTImage({
  src,
  alt,
  className,
  width = 256,
  height = 256,
  priority = false,
  onLoad,
  onError,
}: OptimizedNFTImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [gatewayIndex, setGatewayIndex] = useState(0);

  useEffect(() => {
    // Reset state when src changes
    setIsLoading(true);
    setHasError(false);
    setGatewayIndex(0);

    // If it's an IPFS URL, resolve it
    const ipfsHash = extractIPFSHash(src);
    if (ipfsHash) {
      const resolvedUrl = resolveIPFSUrl(src);
      setCurrentSrc(resolvedUrl);
    } else {
      setCurrentSrc(src);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    const ipfsHash = extractIPFSHash(src);

    // If it's an IPFS URL and we haven't tried all gateways
    if (ipfsHash && gatewayIndex < IPFS_GATEWAYS.length - 1) {
      const nextGateway = IPFS_GATEWAYS[gatewayIndex + 1];
      const nextUrl = `${nextGateway}${ipfsHash}`;
      logger.debug(`Trying next IPFS gateway: ${nextGateway}`);
      setGatewayIndex(gatewayIndex + 1);
      setCurrentSrc(nextUrl);
    } else {
      setIsLoading(false);
      setHasError(true);
      onError?.();
    }
  };

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-neutral-100 dark:bg-neutral-900",
          className,
        )}
        style={{ width, height }}
      >
        <span className="text-neutral-500 text-sm">Failed to load</span>
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ width, height }}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
      )}
      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
        )}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        quality={85}
        sizes={`(max-width: 768px) ${width}px, ${width}px`}
        unoptimized={
          currentSrc.includes("ipfs") || currentSrc.includes("arweave")
        }
      />
    </div>
  );
}
