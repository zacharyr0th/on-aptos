"use client";

import Image, { type StaticImageData } from "next/image";
import type React from "react";
import { memo, useCallback } from "react";

import { logger } from "@/lib/utils/core/logger";

export interface TokenIconProps {
  src: string | StaticImageData;
  alt: string;
  size?: number | "sm" | "md" | "lg" | "xl";
  fallbackSrc?: string;
  className?: string;
  priority?: boolean;
}

/**
 * Optimized token icon component with error handling and size variants
 */
export const TokenIcon = memo<TokenIconProps>(
  ({
    src,
    alt,
    size = "md",
    fallbackSrc = "/icons/aptos.png",
    className = "",
    priority = false,
  }) => {
    const handleError = useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) => {
        logger.error("Failed to load token image:", src);
        e.currentTarget.src = fallbackSrc;
      },
      [src, fallbackSrc]
    );

    // Convert size prop to pixel dimensions
    const getSize = (): number => {
      if (typeof size === "number") return size;

      switch (size) {
        case "sm":
          return 24;
        case "md":
          return 32;
        case "lg":
          return 48;
        case "xl":
          return 64;
        default:
          return 32;
      }
    };

    const pixelSize = getSize();
    const sizeClass = `w-${pixelSize / 4} h-${pixelSize / 4}`;

    return (
      <div className={`relative ${sizeClass} ${className}`}>
        <Image
          src={src}
          alt={alt}
          width={pixelSize}
          height={pixelSize}
          priority={priority}
          className="rounded-full object-contain w-full h-full"
          onError={handleError}
          sizes={`${pixelSize}px`}
        />
      </div>
    );
  }
);

TokenIcon.displayName = "TokenIcon";
